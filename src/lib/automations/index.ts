/**
 * Automations System
 * 
 * "If this then that" automation rules for stores.
 * 
 * CORE ACTIONS - available to all stores:
 * - send_email: Send email to customer
 * - send_sms: Send SMS (future)
 * - send_whatsapp: Send WhatsApp via True Story API (requires whatsapp-trustory plugin)
 * - change_order_status: Update order status
 * - add_customer_tag: Add tag to customer
 * - remove_customer_tag: Remove tag from customer
 * - update_marketing_consent: Update marketing consent
 * - webhook_call: Call external webhook
 * 
 * CRM PLUGIN ACTIONS - require CRM plugin:
 * - crm.create_task: Create CRM task
 * - crm.add_note: Add note to customer
 * 
 * WHATSAPP PLUGIN ACTIONS - require whatsapp-trustory plugin:
 * - send_whatsapp: Send WhatsApp message
 * 
 * Architecture:
 * 1. Events are emitted via emitEvent() from events.ts
 * 2. processAutomations() is called for each event
 * 3. Matching automations are found and executed
 * 4. Results are logged to automation_runs
 */

import { db } from '@/lib/db';
import { automations, automationRuns, stores, customers, orders, crmTasks, crmNotes, storePlugins } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendAbandonedCartEmail, sendEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp-trustory/send';
import { getTemplateById, replaceTemplateVariables } from '@/lib/whatsapp-trustory/templates';
import { canSendEmail, incrementEmailUsage, logFailedEmail } from '@/lib/email-packages';

// Map event types to automation trigger types
const EVENT_TO_TRIGGER_MAP: Record<string, string> = {
  'order.created': 'order.created',
  'order.paid': 'order.paid',
  'order.fulfilled': 'order.fulfilled',
  'order.cancelled': 'order.cancelled',
  'customer.created': 'customer.created',
  'customer.updated': 'customer.updated',
  'customer.tag_added': 'customer.tag_added',
  'customer.tag_removed': 'customer.tag_removed',
  'product.low_stock': 'product.low_stock',
  'product.out_of_stock': 'product.out_of_stock',
  // cart.abandoned is triggered by cron job, not by event
};

// Cache for stores with no active automations (avoids unnecessary DB queries)
// Key: storeId, Value: timestamp when we last checked
const noAutomationsCache = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// CRM actions that require the CRM plugin
const CRM_ACTIONS = ['crm.create_task', 'crm.add_note'];

// WhatsApp actions that require the whatsapp-trustory plugin
const WHATSAPP_ACTIONS = ['send_whatsapp'];

/**
 * Check if WhatsApp plugin is installed and active
 */
async function checkWhatsAppPluginInstalled(storeId: string): Promise<boolean> {
  const [plugin] = await db
    .select({ isActive: storePlugins.isActive })
    .from(storePlugins)
    .where(
      and(
        eq(storePlugins.storeId, storeId),
        eq(storePlugins.pluginSlug, 'whatsapp-trustory'),
        eq(storePlugins.isActive, true)
      )
    )
    .limit(1);

  return !!plugin?.isActive;
}

interface EventData {
  storeId: string;
  type: string;
  resourceId?: string;
  resourceType?: string;
  data: Record<string, unknown>;
  eventId?: string;
}

interface AutomationAction {
  type: string;
  config: Record<string, unknown>;
}

/**
 * Process automations for an event (non-blocking)
 * Called from events.ts after an event is emitted
 */
export async function processAutomations(event: EventData): Promise<void> {
  // Fire and forget - don't block the main flow
  processAutomationsInternal(event).catch(err => {
    console.error('[Automations] Error processing automations:', err);
  });
}

async function processAutomationsInternal(event: EventData): Promise<void> {
  const triggerType = EVENT_TO_TRIGGER_MAP[event.type];
  if (!triggerType) {
    // No trigger type for this event
    return;
  }

  // Check cache - if we recently found no automations for this store, skip DB query
  const cachedTime = noAutomationsCache.get(event.storeId);
  if (cachedTime && Date.now() - cachedTime < CACHE_TTL) {
    // Skip - we know this store has no active automations
    return;
  }

  try {
    // Find active automations for this trigger
    const matchingAutomations = await db
      .select()
      .from(automations)
      .where(and(
        eq(automations.storeId, event.storeId),
        eq(automations.isActive, true),
        sql`${automations.triggerType} = ${triggerType}::automation_trigger_type`
      ));

    if (matchingAutomations.length === 0) {
      // Cache that this store has no automations (for 5 min)
      noAutomationsCache.set(event.storeId, Date.now());
      return;
    }
    
    // Clear cache since we found automations
    noAutomationsCache.delete(event.storeId);

    // Check if store has CRM plugin enabled (for CRM actions)
    const store = await db
      .select({
        id: stores.id,
        settings: stores.settings,
      })
      .from(stores)
      .where(eq(stores.id, event.storeId))
      .limit(1);

    const storeSettings = store[0]?.settings as Record<string, unknown> || {};
    const storePlugins = Array.isArray(storeSettings.plugins) ? storeSettings.plugins : [];
    const hasCrmPlugin = storePlugins.includes('crm');
    
    // Check if WhatsApp plugin is installed via storePlugins table
    const hasWhatsAppPlugin = await checkWhatsAppPluginInstalled(event.storeId);

    // Execute each automation
    for (const automation of matchingAutomations) {
      try {
        // Check if this is a CRM action and plugin is not enabled
        if (CRM_ACTIONS.includes(automation.actionType) && !hasCrmPlugin) {
          console.log(`[Automations] Skipping CRM action ${automation.actionType} - plugin not enabled`);
          continue;
        }
        
        // Check if this is a WhatsApp action and plugin is not enabled
        if (WHATSAPP_ACTIONS.includes(automation.actionType) && !hasWhatsAppPlugin) {
          console.log(`[Automations] Skipping WhatsApp action ${automation.actionType} - plugin not enabled`);
          continue;
        }

        // Check trigger conditions
        const conditions = automation.triggerConditions as Record<string, unknown>;
        if (!checkConditions(conditions, event.data)) {
          continue;
        }

        // Create automation run record
        const [run] = await db.insert(automationRuns).values({
          automationId: automation.id,
          storeId: event.storeId,
          triggerEventId: event.eventId || null,
          triggerData: event.data,
          resourceId: event.resourceId || null,
          resourceType: event.resourceType || null,
          status: automation.delayMinutes > 0 ? 'scheduled' : 'running',
          scheduledFor: automation.delayMinutes > 0 
            ? new Date(Date.now() + automation.delayMinutes * 60 * 1000)
            : null,
          startedAt: automation.delayMinutes > 0 ? null : new Date(),
        }).returning();

        // If delayed, skip execution (cron will pick it up)
        if (automation.delayMinutes > 0) {
          console.log(`[Automations] Scheduled automation ${automation.name} for ${automation.delayMinutes} minutes later`);
          continue;
        }

        // Execute action immediately
        await executeAutomationAction(automation, event, run.id);

      } catch (error) {
        console.error(`[Automations] Error executing automation ${automation.name}:`, error);
      }
    }
  } catch (error) {
    console.error('[Automations] Error processing automations:', error);
  }
}

/**
 * Check if event data matches trigger conditions
 */
function checkConditions(conditions: Record<string, unknown>, eventData: Record<string, unknown>): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  // Check minOrderTotal
  if (typeof conditions.minOrderTotal === 'number') {
    const orderTotal = Number(eventData.total || eventData.orderTotal || 0);
    if (orderTotal < conditions.minOrderTotal) {
      return false;
    }
  }

  // Check minCartValue
  if (typeof conditions.minCartValue === 'number') {
    const cartValue = Number(eventData.subtotal || eventData.cartValue || 0);
    if (cartValue < conditions.minCartValue) {
      return false;
    }
  }

  // Check specificTag
  if (typeof conditions.specificTag === 'string') {
    const tagId = eventData.tagId as string;
    if (tagId !== conditions.specificTag) {
      return false;
    }
  }

  return true;
}

/**
 * Execute an automation action
 */
async function executeAutomationAction(
  automation: typeof automations.$inferSelect,
  event: EventData,
  runId: string
): Promise<void> {
  const config = automation.actionConfig as Record<string, unknown>;
  let result: Record<string, unknown> = {};
  let error: string | null = null;

  try {
    switch (automation.actionType) {
      case 'send_email':
        result = await executeSendEmail(event, config);
        break;
      
      case 'change_order_status':
        result = await executeChangeOrderStatus(event, config);
        break;
      
      case 'add_customer_tag':
        result = await executeAddCustomerTag(event, config);
        break;
      
      case 'remove_customer_tag':
        result = await executeRemoveCustomerTag(event, config);
        break;
      
      case 'update_marketing_consent':
        result = await executeUpdateMarketingConsent(event, config);
        break;
      
      case 'webhook_call':
        result = await executeWebhookCall(event, config);
        break;
      
      case 'crm.create_task':
        result = await executeCreateCrmTask(event, config);
        break;
      
      case 'crm.add_note':
        result = await executeAddCrmNote(event, config);
        break;
      
      case 'send_whatsapp':
        result = await executeSendWhatsApp(event, config);
        break;
      
      default:
        error = `Unknown action type: ${automation.actionType}`;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  // Update run with result
  await db.update(automationRuns)
    .set({
      status: error ? 'failed' : 'completed',
      completedAt: new Date(),
      result,
      error,
    })
    .where(eq(automationRuns.id, runId));

  // Update automation stats
  await db.update(automations)
    .set({
      totalRuns: sql`${automations.totalRuns} + 1`,
      totalSuccesses: error ? automations.totalSuccesses : sql`${automations.totalSuccesses} + 1`,
      totalFailures: error ? sql`${automations.totalFailures} + 1` : automations.totalFailures,
      lastRunAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(automations.id, automation.id));

  if (error) {
    console.error(`[Automations] Action ${automation.actionType} failed:`, error);
  } else {
    console.log(`[Automations] Action ${automation.actionType} completed successfully`);
  }
}

// ============ ACTION IMPLEMENTATIONS ============

async function executeSendEmail(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const template = config.template as string;
  const subject = config.subject as string;
  const customerEmail = event.data.customerEmail as string;
  const customerName = event.data.customerName as string;
  const automationId = event.data.automationId as string | undefined;

  if (!customerEmail) {
    throw new Error('No customer email in event data');
  }

  // 🔒 Check email quota before sending
  const quotaCheck = await canSendEmail(event.storeId);
  if (!quotaCheck.canSend) {
    // Log the failed attempt
    await logFailedEmail({
      storeId: event.storeId,
      automationId,
      recipientEmail: customerEmail,
      emailType: template || 'custom',
      errorMessage: quotaCheck.reason || 'No email quota',
    });
    throw new Error(quotaCheck.reason || 'אין מכסת מיילים זמינה');
  }

  // Get store info
  const store = await db
    .select({ name: stores.name, slug: stores.slug })
    .from(stores)
    .where(eq(stores.id, event.storeId))
    .limit(1);

  if (store.length === 0) {
    throw new Error('Store not found');
  }

  try {
    // For abandoned cart, use specialized email
    if (template === 'abandoned_cart') {
      const items = event.data.items as Array<{name: string; quantity: number; price: number; image?: string}> || [];
      const subtotal = Number(event.data.subtotal || 0);
      const recoveryUrl = event.data.recoveryUrl as string || `https://my-quickshop.com/shops/${store[0].slug}/checkout`;

      await sendAbandonedCartEmail({
        customerEmail,
        customerName,
        items,
        subtotal,
        recoveryUrl,
        storeName: store[0].name,
        storeSlug: store[0].slug,
      });

      // ✅ Increment usage after successful send
      await incrementEmailUsage({
        storeId: event.storeId,
        automationId,
        recipientEmail: customerEmail,
        emailType: 'abandoned_cart',
        subject: 'שחזור עגלה נטושה',
        metadata: { template, subtotal, itemsCount: items.length },
      });

      return { 
        emailSent: true, 
        template, 
        to: customerEmail,
        quotaRemaining: quotaCheck.quotaStatus.emailsRemaining - 1,
      };
    }

    // Generic email
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; direction: rtl; text-align: right;">
        <h2>${subject || 'הודעה מהחנות'}</h2>
        <p>שלום ${customerName || 'לקוח יקר'},</p>
        <p>${config.body || ''}</p>
        <p>בברכה,<br>${store[0].name}</p>
      </div>
    `;

    await sendEmail({
      to: customerEmail,
      subject: subject || `הודעה מ-${store[0].name}`,
      html,
      senderName: store[0].name,
    });

    // ✅ Increment usage after successful send
    await incrementEmailUsage({
      storeId: event.storeId,
      automationId,
      recipientEmail: customerEmail,
      emailType: 'custom',
      subject: subject || `הודעה מ-${store[0].name}`,
      metadata: { template: 'custom' },
    });

    return { 
      emailSent: true, 
      template: 'custom', 
      to: customerEmail,
      quotaRemaining: quotaCheck.quotaStatus.emailsRemaining - 1,
    };
  } catch (error) {
    // Log failed email
    await logFailedEmail({
      storeId: event.storeId,
      automationId,
      recipientEmail: customerEmail,
      emailType: template || 'custom',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function executeChangeOrderStatus(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const newStatus = config.status as string;
  const orderId = event.resourceId || event.data.orderId as string;

  if (!orderId) {
    throw new Error('No order ID in event data');
  }

  if (!newStatus) {
    throw new Error('No status specified in action config');
  }

  await db.update(orders)
    .set({
      fulfillmentStatus: newStatus as 'unfulfilled' | 'partial' | 'fulfilled',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  return { orderUpdated: true, orderId, newStatus };
}

async function executeAddCustomerTag(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const tagId = config.tagId as string;
  const customerId = event.resourceId || event.data.customerId as string;

  if (!customerId || !tagId) {
    throw new Error('Missing customer ID or tag ID');
  }

  // Get current tags
  const customer = await db
    .select({ tags: customers.tags })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (customer.length === 0) {
    throw new Error('Customer not found');
  }

  const currentTags = (customer[0].tags as string[]) || [];
  if (currentTags.includes(tagId)) {
    return { tagAdded: false, reason: 'Tag already exists' };
  }

  await db.update(customers)
    .set({
      tags: [...currentTags, tagId],
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));

  return { tagAdded: true, customerId, tagId };
}

async function executeRemoveCustomerTag(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const tagId = config.tagId as string;
  const customerId = event.resourceId || event.data.customerId as string;

  if (!customerId || !tagId) {
    throw new Error('Missing customer ID or tag ID');
  }

  // Get current tags
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
    return { tagRemoved: false, reason: 'Tag not found' };
  }

  await db.update(customers)
    .set({
      tags: currentTags.filter(t => t !== tagId),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));

  return { tagRemoved: true, customerId, tagId };
}

async function executeUpdateMarketingConsent(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const consent = config.consent as boolean;
  const customerId = event.resourceId || event.data.customerId as string;

  if (!customerId) {
    throw new Error('Missing customer ID');
  }

  await db.update(customers)
    .set({
      acceptsMarketing: consent,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));

  return { consentUpdated: true, customerId, consent };
}

async function executeWebhookCall(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const url = config.url as string;
  const method = (config.method as string) || 'POST';
  const headers = (config.headers as Record<string, string>) || {};

  if (!url) {
    throw new Error('No webhook URL specified');
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      event: event.type,
      data: event.data,
      timestamp: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(10000), // 10s timeout
  });

  return {
    webhookCalled: true,
    url,
    statusCode: response.status,
    success: response.ok,
  };
}

// ============ WHATSAPP PLUGIN ACTIONS ============

async function executeSendWhatsApp(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const templateId = config.templateId as string;
  const customMessage = config.message as string;
  const customerPhone = event.data.customerPhone as string;
  const customerName = event.data.customerName as string;
  const orderNumber = event.data.orderNumber as string;

  if (!customerPhone) {
    throw new Error('No customer phone in event data');
  }

  // Get store info for template variables
  const store = await db
    .select({ name: stores.name, slug: stores.slug })
    .from(stores)
    .where(eq(stores.id, event.storeId))
    .limit(1);

  if (store.length === 0) {
    throw new Error('Store not found');
  }

  // Build message from template or custom
  let message = customMessage || '';
  
  if (templateId) {
    const template = getTemplateById(templateId);
    if (template && template.content) {
      message = replaceTemplateVariables(template.content, {
        customerName: customerName || 'לקוח יקר',
        storeName: store[0].name,
        orderNumber: orderNumber || '',
        total: String(event.data.total || ''),
        trackingNumber: event.data.trackingNumber as string || '',
        trackingUrl: event.data.trackingUrl as string || '',
        storeUrl: `https://my-quickshop.com/shops/${store[0].slug}`,
        cartUrl: `https://my-quickshop.com/shops/${store[0].slug}/checkout`,
      });
    }
  } else if (customMessage) {
    // Replace variables in custom message
    message = replaceTemplateVariables(customMessage, {
      customerName: customerName || 'לקוח יקר',
      storeName: store[0].name,
      orderNumber: orderNumber || '',
      total: String(event.data.total || ''),
    });
  }

  if (!message) {
    throw new Error('No message content');
  }

  // Send via WhatsApp
  const result = await sendWhatsAppMessage({
    storeId: event.storeId,
    phone: customerPhone,
    message,
    templateId,
    variables: {
      customerName: customerName || 'לקוח יקר',
      storeName: store[0].name,
      orderNumber: orderNumber || '',
      total: String(event.data.total || ''),
    },
  });

  if (!result.success) {
    throw new Error(result.message || 'WhatsApp send failed');
  }

  return { 
    whatsappSent: true, 
    to: customerPhone,
    templateId: templateId || 'custom',
  };
}

// ============ CRM PLUGIN ACTIONS ============

async function executeCreateCrmTask(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const title = config.title as string || 'משימה מאוטומציה';
  const description = config.description as string;
  const priority = (config.priority as string) || 'medium';
  const dueInDays = config.dueInDays as number || 1;
  const customerId = event.resourceId || event.data.customerId as string;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);

  const [task] = await db.insert(crmTasks).values({
    storeId: event.storeId,
    customerId: customerId || null,
    title,
    description,
    priority: priority as 'low' | 'medium' | 'high',
    dueDate,
    status: 'pending',
  }).returning();

  return { taskCreated: true, taskId: task.id, title };
}

async function executeAddCrmNote(
  event: EventData,
  config: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const content = config.content as string;
  const customerId = event.resourceId || event.data.customerId as string;

  if (!customerId) {
    throw new Error('Missing customer ID for CRM note');
  }

  if (!content) {
    throw new Error('Missing note content');
  }

  // Replace placeholders in content
  let finalContent = content;
  finalContent = finalContent.replace('{customerName}', event.data.customerName as string || 'לקוח');
  finalContent = finalContent.replace('{orderNumber}', event.data.orderNumber as string || '');
  finalContent = finalContent.replace('{total}', String(event.data.total || ''));

  const [note] = await db.insert(crmNotes).values({
    storeId: event.storeId,
    customerId,
    content: finalContent,
    userId: null, // System note
  }).returning();

  return { noteAdded: true, noteId: note.id };
}

// ============ CACHE MANAGEMENT ============

/**
 * Clear the "no automations" cache for a store
 * Call this when automations are created/updated/deleted
 */
export function invalidateAutomationsCache(storeId: string): void {
  noAutomationsCache.delete(storeId);
}

// ============ BUILT-IN AUTOMATIONS ============

/**
 * Create default automations for a new store
 */
export async function createDefaultAutomations(storeId: string): Promise<void> {
  try {
    // Check if abandoned cart automation already exists
    const existing = await db
      .select({ id: automations.id })
      .from(automations)
      .where(and(
        eq(automations.storeId, storeId),
        eq(automations.isBuiltIn, true)
      ))
      .limit(1);

    if (existing.length > 0) {
      return;
    }

    // Create abandoned cart automation (disabled by default)
    await db.insert(automations).values({
      storeId,
      name: 'שחזור עגלות נטושות',
      description: 'שליחת אימייל אוטומטית ללקוחות שנטשו את העגלה',
      triggerType: 'cart.abandoned',
      triggerConditions: { minCartValue: 0 },
      actionType: 'send_email',
      actionConfig: {
        template: 'abandoned_cart',
        subject: 'שכחת משהו? הפריטים שלך עדיין בעגלה 🛒',
      },
      delayMinutes: 60, // 1 hour delay
      isActive: false, // User must enable it
      isBuiltIn: true,
    });

    console.log(`[Automations] Created default automations for store ${storeId}`);
  } catch (error) {
    // Table might not exist yet - silently ignore
    console.log('[Automations] Table not ready yet - skipping default automations creation');
  }
}

/**
 * Get all automations for a store
 */
export async function getStoreAutomations(storeId: string) {
  return db
    .select()
    .from(automations)
    .where(eq(automations.storeId, storeId))
    .orderBy(automations.createdAt);
}

/**
 * Get automation runs for analytics
 */
export async function getAutomationRuns(
  storeId: string,
  automationId?: string,
  limit = 50
) {
  const conditions = [eq(automationRuns.storeId, storeId)];
  
  if (automationId) {
    conditions.push(eq(automationRuns.automationId, automationId));
  }

  return db
    .select()
    .from(automationRuns)
    .where(and(...conditions))
    .orderBy(sql`${automationRuns.createdAt} DESC`)
    .limit(limit);
}

