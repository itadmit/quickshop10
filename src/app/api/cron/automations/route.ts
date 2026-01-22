/**
 * Cron Job: Process Scheduled Automations & Abandoned Carts
 * 
 * Runs every 5 minutes via QStash
 * 
 * What it does:
 * 1. Executes scheduled automation runs (delayed actions)
 * 2. Triggers abandoned cart automations for eligible carts
 * 
 * URL: /api/cron/automations
 * Method: GET (for cron) or POST
 * Auth: QStash signature verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  automations, 
  automationRuns, 
  stores, 
  abandonedCarts,
  customers,
  orders,
  crmTasks,
  crmNotes,
} from '@/lib/db/schema';
import { eq, and, lt, isNull, sql, desc } from 'drizzle-orm';
import { verifyQStashSignature } from '@/lib/qstash';
import { sendAbandonedCartEmail, sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  // Verify QStash signature (fast, <5ms)
  const authError = await verifyQStashSignature(request);
  if (authError) return authError;

  const results = {
    scheduledRuns: { processed: 0, succeeded: 0, failed: 0 },
    abandonedCarts: { checked: 0, emailsSent: 0 },
    errors: [] as string[],
  };

  try {
    // ========== PART 1: Process Scheduled Automation Runs ==========
    
    const pendingRuns = await db
      .select({
        id: automationRuns.id,
        automationId: automationRuns.automationId,
        storeId: automationRuns.storeId,
        triggerData: automationRuns.triggerData,
        resourceId: automationRuns.resourceId,
        resourceType: automationRuns.resourceType,
      })
      .from(automationRuns)
      .where(and(
        eq(automationRuns.status, 'scheduled'),
        lt(automationRuns.scheduledFor, new Date())
      ))
      .limit(100); // Process up to 100 at a time

    for (const run of pendingRuns) {
      results.scheduledRuns.processed++;
      
      try {
        // Get automation details
        const automation = await db
          .select()
          .from(automations)
          .where(eq(automations.id, run.automationId))
          .limit(1);

        if (automation.length === 0 || !automation[0].isActive) {
          // Mark as cancelled
          await db.update(automationRuns)
            .set({ status: 'cancelled', completedAt: new Date() })
            .where(eq(automationRuns.id, run.id));
          continue;
        }

        // Mark as running
        await db.update(automationRuns)
          .set({ status: 'running', startedAt: new Date() })
          .where(eq(automationRuns.id, run.id));

        // Execute the action
        const actionResult = await executeAction(
          automation[0],
          run.triggerData as Record<string, unknown>,
          run.storeId,
          run.resourceId || undefined,
          run.resourceType || undefined
        );

        // Mark as completed
        await db.update(automationRuns)
          .set({ 
            status: 'completed', 
            completedAt: new Date(),
            result: actionResult,
          })
          .where(eq(automationRuns.id, run.id));

        // Update automation stats
        await db.update(automations)
          .set({
            totalRuns: sql`${automations.totalRuns} + 1`,
            totalSuccesses: sql`${automations.totalSuccesses} + 1`,
            lastRunAt: new Date(),
          })
          .where(eq(automations.id, automation[0].id));

        results.scheduledRuns.succeeded++;

      } catch (error) {
        // Mark as failed
        const errorMessage = error instanceof Error ? error.message : String(error);
        await db.update(automationRuns)
          .set({ 
            status: 'failed', 
            completedAt: new Date(),
            error: errorMessage,
          })
          .where(eq(automationRuns.id, run.id));

        // Update automation stats
        await db.update(automations)
          .set({
            totalRuns: sql`${automations.totalRuns} + 1`,
            totalFailures: sql`${automations.totalFailures} + 1`,
            lastRunAt: new Date(),
          })
          .where(eq(automations.id, run.automationId));

        results.scheduledRuns.failed++;
        results.errors.push(`Run ${run.id}: ${errorMessage}`);
      }
    }

    // ========== PART 2: Process Abandoned Cart Automations ==========
    
    // Get stores with active abandoned cart automation
    const storesWithAutomation = await db
      .select({
        storeId: automations.storeId,
        automationId: automations.id,
        delayMinutes: automations.delayMinutes,
        triggerConditions: automations.triggerConditions,
        actionConfig: automations.actionConfig,
      })
      .from(automations)
      .where(and(
        eq(automations.isActive, true),
        sql`${automations.triggerType} = 'cart.abandoned'::automation_trigger_type`
      ));

    for (const storeAuto of storesWithAutomation) {
      const { storeId, automationId, delayMinutes, triggerConditions, actionConfig } = storeAuto;
      const conditions = triggerConditions as Record<string, unknown> || {};
      const minCartValue = Number(conditions.minCartValue || 0);

      // Calculate threshold time
      const thresholdTime = new Date();
      thresholdTime.setMinutes(thresholdTime.getMinutes() - (delayMinutes || 60));

      // Find abandoned carts that:
      // 1. Have email
      // 2. Were created before threshold
      // 3. Haven't been recovered
      // 4. Haven't had reminder sent yet (or it was sent more than 24h ago)
      const eligibleCarts = await db
        .select({
          id: abandonedCarts.id,
          email: abandonedCarts.email,
          items: abandonedCarts.items,
          subtotal: abandonedCarts.subtotal,
          recoveryToken: abandonedCarts.recoveryToken,
          reminderSentAt: abandonedCarts.reminderSentAt,
          reminderCount: abandonedCarts.reminderCount,
        })
        .from(abandonedCarts)
        .where(and(
          eq(abandonedCarts.storeId, storeId),
          isNull(abandonedCarts.recoveredAt),
          lt(abandonedCarts.createdAt, thresholdTime),
          sql`${abandonedCarts.email} IS NOT NULL`,
          // Only send one reminder per 24 hours
          sql`(${abandonedCarts.reminderSentAt} IS NULL OR ${abandonedCarts.reminderSentAt} < NOW() - INTERVAL '24 hours')`,
          // Max 3 reminders
          sql`COALESCE(${abandonedCarts.reminderCount}, 0) < 3`
        ))
        .limit(50); // Process up to 50 per store per run

      results.abandonedCarts.checked += eligibleCarts.length;

      // Get store info
      const storeInfo = await db
        .select({ name: stores.name, slug: stores.slug })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);

      if (storeInfo.length === 0) continue;

      for (const cart of eligibleCarts) {
        if (!cart.email) continue;

        const subtotal = Number(cart.subtotal);
        if (subtotal < minCartValue) continue;

        try {
          // Build recovery URL
          const recoveryUrl = `https://my-quickshop.com/shops/${storeInfo[0].slug}/checkout${cart.recoveryToken ? `?recover=${cart.recoveryToken}` : ''}`;
          
          const items = cart.items as Array<{name: string; quantity: number; price: number; image?: string}> || [];

          // Send the email
          await sendAbandonedCartEmail({
            customerEmail: cart.email,
            items,
            subtotal,
            recoveryUrl,
            storeName: storeInfo[0].name,
            storeSlug: storeInfo[0].slug,
          });

          // Update cart record
          await db.update(abandonedCarts)
            .set({
              reminderSentAt: new Date(),
              reminderCount: sql`COALESCE(${abandonedCarts.reminderCount}, 0) + 1`,
            })
            .where(eq(abandonedCarts.id, cart.id));

          // Create automation run record
          await db.insert(automationRuns).values({
            automationId,
            storeId,
            triggerData: { cartId: cart.id, email: cart.email, subtotal },
            resourceId: cart.id,
            resourceType: 'cart',
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
            result: { emailSent: true },
          });

          // Update automation stats
          await db.update(automations)
            .set({
              totalRuns: sql`${automations.totalRuns} + 1`,
              totalSuccesses: sql`${automations.totalSuccesses} + 1`,
              lastRunAt: new Date(),
            })
            .where(eq(automations.id, automationId));

          results.abandonedCarts.emailsSent++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.errors.push(`Cart ${cart.id}: ${errorMessage}`);

          // Update automation stats for failure
          await db.update(automations)
            .set({
              totalRuns: sql`${automations.totalRuns} + 1`,
              totalFailures: sql`${automations.totalFailures} + 1`,
              lastRunAt: new Date(),
            })
            .where(eq(automations.id, automationId));
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('[Cron] Automations processing failed:', error);
    return NextResponse.json({ 
      error: 'Failed to process automations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Execute automation action
async function executeAction(
  automation: typeof automations.$inferSelect,
  triggerData: Record<string, unknown>,
  storeId: string,
  resourceId?: string,
  resourceType?: string
): Promise<Record<string, unknown>> {
  const config = automation.actionConfig as Record<string, unknown>;

  switch (automation.actionType) {
    case 'send_email': {
      const customerEmail = triggerData.customerEmail as string || triggerData.email as string;
      const customerName = triggerData.customerName as string;
      const template = config.template as string;
      const subject = config.subject as string;

      if (!customerEmail) {
        throw new Error('No customer email');
      }

      const storeInfo = await db
        .select({ name: stores.name, slug: stores.slug })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);

      if (template === 'abandoned_cart') {
        const items = triggerData.items as Array<{name: string; quantity: number; price: number; image?: string}> || [];
        const subtotal = Number(triggerData.subtotal || 0);
        const recoveryUrl = triggerData.recoveryUrl as string || `https://my-quickshop.com/shops/${storeInfo[0].slug}/checkout`;

        await sendAbandonedCartEmail({
          customerEmail,
          customerName,
          items,
          subtotal,
          recoveryUrl,
          storeName: storeInfo[0].name,
          storeSlug: storeInfo[0].slug,
        });
      } else {
        // Generic email
        await sendEmail({
          to: customerEmail,
          subject: subject || `הודעה מ-${storeInfo[0].name}`,
          html: `<div dir="rtl">${config.body || ''}</div>`,
          senderName: storeInfo[0].name,
        });
      }

      return { emailSent: true, to: customerEmail };
    }

    case 'change_order_status': {
      const orderId = resourceId || triggerData.orderId as string;
      const newStatus = config.status as string;

      if (!orderId || !newStatus) {
        throw new Error('Missing order ID or status');
      }

      await db.update(orders)
        .set({
          fulfillmentStatus: newStatus as 'unfulfilled' | 'partial' | 'fulfilled',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return { orderUpdated: true, orderId, newStatus };
    }

    case 'add_customer_tag': {
      const customerId = resourceId || triggerData.customerId as string;
      const tagId = config.tagId as string;

      if (!customerId || !tagId) {
        throw new Error('Missing customer ID or tag ID');
      }

      const customer = await db
        .select({ tags: customers.tags })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (customer.length === 0) {
        throw new Error('Customer not found');
      }

      const currentTags = (customer[0].tags as string[]) || [];
      if (!currentTags.includes(tagId)) {
        await db.update(customers)
          .set({ tags: [...currentTags, tagId], updatedAt: new Date() })
          .where(eq(customers.id, customerId));
      }

      return { tagAdded: true, customerId, tagId };
    }

    case 'remove_customer_tag': {
      const customerId = resourceId || triggerData.customerId as string;
      const tagId = config.tagId as string;

      if (!customerId || !tagId) {
        throw new Error('Missing customer ID or tag ID');
      }

      const customer = await db
        .select({ tags: customers.tags })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (customer.length === 0) {
        throw new Error('Customer not found');
      }

      const currentTags = (customer[0].tags as string[]) || [];
      await db.update(customers)
        .set({ tags: currentTags.filter(t => t !== tagId), updatedAt: new Date() })
        .where(eq(customers.id, customerId));

      return { tagRemoved: true, customerId, tagId };
    }

    case 'update_marketing_consent': {
      const customerId = resourceId || triggerData.customerId as string;
      const consent = config.consent as boolean;

      if (!customerId) {
        throw new Error('Missing customer ID');
      }

      await db.update(customers)
        .set({ acceptsMarketing: consent, updatedAt: new Date() })
        .where(eq(customers.id, customerId));

      return { consentUpdated: true, customerId, consent };
    }

    case 'webhook_call': {
      const url = config.url as string;
      const method = (config.method as string) || 'POST';

      if (!url) {
        throw new Error('No webhook URL');
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: automation.triggerType, data: triggerData }),
        signal: AbortSignal.timeout(10000),
      });

      return { webhookCalled: true, statusCode: response.status };
    }

    case 'crm.create_task': {
      const title = config.title as string || 'משימה מאוטומציה';
      const description = config.description as string;
      const priority = (config.priority as string) || 'medium';
      const dueInDays = config.dueInDays as number || 1;
      const customerId = resourceId || triggerData.customerId as string;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueInDays);

      const [task] = await db.insert(crmTasks).values({
        storeId,
        customerId: customerId || null,
        title,
        description,
        priority: priority as 'low' | 'medium' | 'high',
        dueDate,
        status: 'pending',
      }).returning();

      return { taskCreated: true, taskId: task.id };
    }

    case 'crm.add_note': {
      const content = config.content as string;
      const customerId = resourceId || triggerData.customerId as string;

      if (!customerId || !content) {
        throw new Error('Missing customer ID or content');
      }

      const [note] = await db.insert(crmNotes).values({
        storeId,
        customerId,
        content,
        userId: null,
      }).returning();

      return { noteAdded: true, noteId: note.id };
    }

    default:
      throw new Error(`Unknown action type: ${automation.actionType}`);
  }
}

// Also support POST for QStash
export const POST = GET;

