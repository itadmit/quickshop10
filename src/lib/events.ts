/**
 * Store Events System
 * 
 * Lightweight event emission for:
 * - Dashboard notifications
 * - Mobile app push notifications (future)
 * - Webhook automations
 * 
 * Uses fire-and-forget pattern to not block main flow
 */

import { db } from '@/lib/db';
import { storeEvents, notifications, webhooks, webhookDeliveries } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

type EventType = 
  | 'order.created' 
  | 'order.paid' 
  | 'order.fulfilled' 
  | 'order.cancelled'
  | 'customer.created' 
  | 'customer.updated'
  | 'product.low_stock' 
  | 'product.out_of_stock'
  | 'discount.used';

type EventData = {
  storeId: string;
  type: EventType;
  resourceId?: string;
  resourceType?: 'order' | 'customer' | 'product' | 'discount';
  data: Record<string, unknown>;
};

/**
 * Emit a store event (non-blocking)
 * Creates event record, notification, and triggers webhooks
 */
export async function emitEvent(event: EventData): Promise<void> {
  // Fire and forget - don't await in caller
  processEvent(event).catch(err => {
    console.error('[Events] Error processing event:', err);
  });
}

async function processEvent(event: EventData): Promise<void> {
  try {
    // 1. Create event record
    const [eventRecord] = await db.insert(storeEvents).values({
      storeId: event.storeId,
      eventType: event.type,
      resourceId: event.resourceId,
      resourceType: event.resourceType,
      data: event.data,
    }).returning();

    // 2. Create notification for dashboard
    await createNotification(event);

    // 3. Trigger webhooks (async, non-blocking)
    triggerWebhooks(event.storeId, event.type, eventRecord.id, event.data);

    console.log(`[Events] Emitted: ${event.type} for store ${event.storeId}`);
  } catch (error) {
    console.error('[Events] Failed to process event:', error);
  }
}

async function createNotification(event: EventData): Promise<void> {
  const notificationMap: Record<EventType, { type: 'new_order' | 'low_stock' | 'out_of_stock' | 'new_customer' | 'order_cancelled' | 'system'; title: string; getMessage: (data: Record<string, unknown>) => string }> = {
    'order.created': {
      type: 'new_order',
      title: 'הזמנה חדשה',
      getMessage: (data) => `הזמנה #${data.orderNumber} התקבלה - ₪${data.total}`,
    },
    'order.paid': {
      type: 'new_order',
      title: 'תשלום התקבל',
      getMessage: (data) => `תשלום עבור הזמנה #${data.orderNumber} התקבל`,
    },
    'order.fulfilled': {
      type: 'system',
      title: 'הזמנה נשלחה',
      getMessage: (data) => `הזמנה #${data.orderNumber} סומנה כנשלחה`,
    },
    'order.cancelled': {
      type: 'order_cancelled',
      title: 'הזמנה בוטלה',
      getMessage: (data) => `הזמנה #${data.orderNumber} בוטלה`,
    },
    'customer.created': {
      type: 'new_customer',
      title: 'לקוח חדש',
      getMessage: (data) => `${data.customerName} נרשם לחנות`,
    },
    'customer.updated': {
      type: 'system',
      title: 'לקוח עודכן',
      getMessage: (data) => `פרטי ${data.customerName} עודכנו`,
    },
    'product.low_stock': {
      type: 'low_stock',
      title: 'מלאי נמוך',
      getMessage: (data) => `${data.productName} - נותרו ${data.inventory} יחידות`,
    },
    'product.out_of_stock': {
      type: 'out_of_stock',
      title: 'אזל מהמלאי',
      getMessage: (data) => `${data.productName} אזל מהמלאי`,
    },
    'discount.used': {
      type: 'system',
      title: 'קופון מומש',
      getMessage: (data) => `קופון ${data.code} מומש בהזמנה #${data.orderNumber}`,
    },
  };

  const mapping = notificationMap[event.type];
  if (!mapping) return;

  await db.insert(notifications).values({
    storeId: event.storeId,
    type: mapping.type,
    title: mapping.title,
    message: mapping.getMessage(event.data),
    resourceId: event.resourceId,
    resourceType: event.resourceType,
  });
}

async function triggerWebhooks(
  storeId: string, 
  eventType: EventType, 
  eventId: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Get active webhooks for this event type
    const activeWebhooks = await db
      .select()
      .from(webhooks)
      .where(and(
        eq(webhooks.storeId, storeId),
        eq(webhooks.isActive, true)
      ));

    // Filter webhooks that listen to this event
    const matchingWebhooks = activeWebhooks.filter(webhook => {
      const events = webhook.events as string[];
      return events.includes(eventType) || events.includes('*');
    });

    // Fire webhooks in parallel (non-blocking)
    for (const webhook of matchingWebhooks) {
      fireWebhook(webhook, eventId, eventType, data).catch(err => {
        console.error(`[Webhook] Failed to fire ${webhook.url}:`, err);
      });
    }
  } catch (error) {
    console.error('[Webhooks] Error triggering webhooks:', error);
  }
}

async function fireWebhook(
  webhook: typeof webhooks.$inferSelect,
  eventId: string,
  eventType: EventType,
  data: Record<string, unknown>
): Promise<void> {
  const startTime = Date.now();
  let statusCode: number | undefined;
  let responseBody: string | undefined;
  let error: string | undefined;

  try {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Create signature if secret exists
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(webhook.headers as Record<string, string> || {}),
    };

    if (webhook.secret) {
      // Simple HMAC signature (would use crypto in production)
      headers['X-Webhook-Signature'] = `sha256=${webhook.secret}`;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    statusCode = response.status;
    responseBody = await response.text().catch(() => '');

    // Update last triggered
    await db.update(webhooks)
      .set({ lastTriggeredAt: new Date(), failureCount: 0 })
      .where(eq(webhooks.id, webhook.id));

  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    
    // Increment failure count
    await db.update(webhooks)
      .set({ failureCount: sql`${webhooks.failureCount} + 1` })
      .where(eq(webhooks.id, webhook.id));
  }

  // Log delivery
  await db.insert(webhookDeliveries).values({
    webhookId: webhook.id,
    eventId,
    statusCode,
    responseBody: responseBody?.substring(0, 1000), // Limit response size
    error,
    duration: Date.now() - startTime,
  });
}

/**
 * Helper to emit order.created event
 */
export function emitOrderCreated(
  storeId: string,
  orderId: string,
  orderNumber: string,
  customerEmail: string,
  total: number,
  itemCount: number
): void {
  emitEvent({
    storeId,
    type: 'order.created',
    resourceId: orderId,
    resourceType: 'order',
    data: {
      orderNumber,
      customerEmail,
      total,
      itemCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Helper to emit low stock event
 */
export function emitLowStock(
  storeId: string,
  productId: string,
  productName: string,
  inventory: number,
  threshold: number = 5
): void {
  if (inventory <= threshold && inventory > 0) {
    emitEvent({
      storeId,
      type: 'product.low_stock',
      resourceId: productId,
      resourceType: 'product',
      data: { productName, inventory },
    });
  } else if (inventory <= 0) {
    emitEvent({
      storeId,
      type: 'product.out_of_stock',
      resourceId: productId,
      resourceType: 'product',
      data: { productName, inventory: 0 },
    });
  }
}

