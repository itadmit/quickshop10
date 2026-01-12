'use server';

import { db } from '@/lib/db';
import { webhooks, webhookDeliveries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface WebhookData {
  name: string;
  url: string;
  secret?: string;
  events: string[];
}

export async function createWebhook(
  storeId: string,
  slug: string,
  data: WebhookData
) {
  try {
    // Validate URL
    try {
      new URL(data.url);
    } catch {
      return { success: false, error: 'כתובת URL לא תקינה' };
    }

    // Validate events
    const validEvents = [
      'order.created', 'order.updated', 'order.cancelled', 'order.fulfilled',
      'product.created', 'product.updated', 'product.deleted',
      'inventory.low', 'customer.created', 'refund.created',
    ];
    
    const invalidEvents = data.events.filter(e => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return { success: false, error: 'אירועים לא תקינים: ' + invalidEvents.join(', ') };
    }

    await db.insert(webhooks).values({
      storeId,
      name: data.name,
      url: data.url,
      secret: data.secret || null,
      events: data.events,
      isActive: true,
    });

    revalidatePath(`/shops/${slug}/admin/settings/webhooks`);
    return { success: true };
  } catch (error) {
    console.error('Error creating webhook:', error);
    return { success: false, error: 'שגיאה ביצירת ה-webhook' };
  }
}

export async function toggleWebhook(
  webhookId: string,
  slug: string,
  isActive: boolean
) {
  try {
    await db
      .update(webhooks)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(webhooks.id, webhookId));

    revalidatePath(`/shops/${slug}/admin/settings/webhooks`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling webhook:', error);
    return { success: false, error: 'שגיאה בעדכון ה-webhook' };
  }
}

export async function deleteWebhook(webhookId: string, slug: string) {
  try {
    await db.delete(webhooks).where(eq(webhooks.id, webhookId));
    revalidatePath(`/shops/${slug}/admin/settings/webhooks`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return { success: false, error: 'שגיאה במחיקת ה-webhook' };
  }
}

export async function testWebhook(webhookId: string, slug: string) {
  try {
    const webhook = await db.query.webhooks.findFirst({
      where: eq(webhooks.id, webhookId),
    });

    if (!webhook) {
      return { success: false, message: 'Webhook לא נמצא' };
    }

    if (!webhook.isActive) {
      return { success: false, message: 'Webhook לא פעיל' };
    }

    // Send test payload
    const testPayload = {
      type: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery from QuickShop',
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': 'test',
    };

    // Add HMAC signature if secret is configured
    if (webhook.secret) {
      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
      });

      const duration = Date.now() - startTime;

      // Log delivery
      await db.insert(webhookDeliveries).values({
        webhookId: webhook.id,
        statusCode: response.status,
        duration,
      });

      // Update last triggered
      await db
        .update(webhooks)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(webhooks.id, webhookId));

      revalidatePath(`/shops/${slug}/admin/settings/webhooks`);

      if (response.ok) {
        return { success: true, message: `הצלחה! (${response.status}) - ${duration}ms` };
      } else {
        return { success: false, message: `כשל (${response.status}) - ${duration}ms` };
      }
    } catch (fetchError) {
      const duration = Date.now() - startTime;

      // Log failed delivery
      await db.insert(webhookDeliveries).values({
        webhookId: webhook.id,
        error: String(fetchError),
        duration,
      });

      // Increment failure count
      await db
        .update(webhooks)
        .set({ 
          failureCount: (webhook.failureCount || 0) + 1,
          lastTriggeredAt: new Date(),
        })
        .where(eq(webhooks.id, webhookId));

      revalidatePath(`/shops/${slug}/admin/settings/webhooks`);

      return { success: false, message: 'שגיאת רשת - לא ניתן להתחבר' };
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    return { success: false, message: 'שגיאה בשליחת בדיקה' };
  }
}



