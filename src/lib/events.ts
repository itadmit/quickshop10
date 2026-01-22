/**
 * Store Events System
 * 
 * Lightweight event emission for:
 * - Dashboard notifications
 * - Mobile app push notifications
 * - Webhook automations
 * 
 * Uses fire-and-forget pattern to not block main flow
 */

import { db } from '@/lib/db';
import { storeEvents, notifications, webhooks, webhookDeliveries } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendNewOrderPushNotification, sendLowStockPushNotification } from './push-notifications';
import { processAutomations } from './automations';

// Events that are stored in the database (must match schema enum)
type DatabaseEventType = 
  | 'order.created' 
  | 'order.paid' 
  | 'order.fulfilled' 
  | 'order.cancelled'
  | 'customer.created' 
  | 'customer.updated'
  | 'customer.tag_added'
  | 'product.low_stock' 
  | 'product.out_of_stock'
  | 'discount.used'
  | 'cart.abandoned';

// All event types (including CRM-specific that don't get stored)
type EventType = 
  | DatabaseEventType
  | 'order.custom_status_changed'  // CRM: Custom workflow status changed
  | 'customer.tag_removed'         // CRM: Tag removed from customer
  | 'crm.note_added'               // CRM: Note added to customer
  | 'crm.task_created'             // CRM: Task created
  | 'crm.task_completed';          // CRM: Task completed

// Check if event should be stored in database
function isDatabaseEvent(type: EventType): type is DatabaseEventType {
  return [
    'order.created', 'order.paid', 'order.fulfilled', 'order.cancelled',
    'customer.created', 'customer.updated', 'customer.tag_added',
    'product.low_stock', 'product.out_of_stock', 'discount.used', 'cart.abandoned'
  ].includes(type);
}

type EventData = {
  storeId: string;
  type: EventType;
  resourceId?: string;
  resourceType?: 'order' | 'customer' | 'product' | 'discount' | 'crm_note' | 'crm_task';
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
    let eventRecordId: string | undefined;

    // 1. Create event record (only for database events)
    if (isDatabaseEvent(event.type)) {
      const [eventRecord] = await db.insert(storeEvents).values({
        storeId: event.storeId,
        eventType: event.type,
        resourceId: event.resourceId,
        resourceType: event.resourceType,
        data: event.data,
      }).returning();
      eventRecordId = eventRecord.id;
    }

    // 2. Create notification for dashboard
    await createNotification(event);

    // 3. Trigger webhooks (async, non-blocking)
    if (eventRecordId) {
      triggerWebhooks(event.storeId, event.type, eventRecordId, event.data);
    }

    // 4. Process automations (async, non-blocking)
    processAutomations({
      storeId: event.storeId,
      type: event.type,
      resourceId: event.resourceId,
      resourceType: event.resourceType,
      data: event.data,
      eventId: eventRecordId,
    });

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
      getMessage: (data) => `הזמנה #${data.orderNumber} התקבלה - ₪${Number(data.total).toFixed(2)}`,
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
    'order.custom_status_changed': {
      type: 'system',
      title: 'סטטוס הזמנה עודכן',
      getMessage: (data) => `הזמנה #${data.orderNumber} שונתה ל"${data.newStatus}"`,
    },
    'customer.tag_added': {
      type: 'system',
      title: 'תגית נוספה',
      getMessage: (data) => `תגית "${data.tagLabel}" נוספה ל${data.customerName}`,
    },
    'customer.tag_removed': {
      type: 'system',
      title: 'תגית הוסרה',
      getMessage: (data) => `תגית "${data.tagLabel}" הוסרה מ${data.customerName}`,
    },
    'crm.note_added': {
      type: 'system',
      title: 'הערה חדשה',
      getMessage: (data) => `הערה נוספה על ${data.customerName}`,
    },
    'crm.task_created': {
      type: 'system',
      title: 'משימה חדשה',
      getMessage: (data) => `משימה "${data.taskTitle}" נוצרה`,
    },
    'crm.task_completed': {
      type: 'system',
      title: 'משימה הושלמה',
      getMessage: (data) => `משימה "${data.taskTitle}" הושלמה`,
    },
    'cart.abandoned': {
      type: 'system',
      title: 'עגלה נטושה',
      getMessage: (data) => `${data.customerName || data.customerEmail || 'לקוח'} נטש עגלה בשווי ₪${Number(data.cartTotal || 0).toFixed(2)}`,
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
  storeName: string,
  orderId: string,
  orderNumber: string,
  customerEmail: string,
  total: number,
  itemCount: number,
  customerName?: string,
  couponCode?: string
): void {
  emitEvent({
    storeId,
    type: 'order.created',
    resourceId: orderId,
    resourceType: 'order',
    data: {
      orderNumber,
      customerEmail,
      customerName,
      total,
      itemCount,
      couponCode,
      timestamp: new Date().toISOString(),
    },
  });
  
  // Send push notification to store owner's mobile app
  sendNewOrderPushNotification({
    storeId,
    storeName,
    orderId,
    orderNumber,
    total,
    customerName,
    itemCount,
    couponCode,
  }).catch(err => console.error('[Push] Failed to send new order notification:', err));
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
  const isOutOfStock = inventory <= 0;
  const isLowStock = inventory <= threshold && inventory > 0;
  
  if (isLowStock) {
    emitEvent({
      storeId,
      type: 'product.low_stock',
      resourceId: productId,
      resourceType: 'product',
      data: { productName, inventory },
    });
    
    // Send push notification
    sendLowStockPushNotification({
      storeId,
      productId,
      productName,
      inventory,
      isOutOfStock: false,
    }).catch(err => console.error('[Push] Failed to send low stock notification:', err));
  } else if (isOutOfStock) {
    emitEvent({
      storeId,
      type: 'product.out_of_stock',
      resourceId: productId,
      resourceType: 'product',
      data: { productName, inventory: 0 },
    });
    
    // Send push notification
    sendLowStockPushNotification({
      storeId,
      productId,
      productName,
      inventory: 0,
      isOutOfStock: true,
    }).catch(err => console.error('[Push] Failed to send out of stock notification:', err));
  }
}

// ============ CRM Events ============

/**
 * Emit when order custom status is changed
 */
export function emitOrderCustomStatusChanged(
  storeId: string,
  orderId: string,
  orderNumber: string,
  oldStatus: string | null,
  newStatus: string | null,
  statusLabel: string | null
): void {
  emitEvent({
    storeId,
    type: 'order.custom_status_changed',
    resourceId: orderId,
    resourceType: 'order',
    data: {
      orderNumber,
      oldStatus,
      newStatus,
      newStatusLabel: statusLabel,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit when tags are added/removed from customer
 */
export function emitCustomerTagChanged(
  storeId: string,
  customerId: string,
  customerName: string,
  customerEmail: string,
  action: 'added' | 'removed',
  tagId: string,
  tagLabel: string
): void {
  emitEvent({
    storeId,
    type: action === 'added' ? 'customer.tag_added' : 'customer.tag_removed',
    resourceId: customerId,
    resourceType: 'customer',
    data: {
      customerName,
      customerEmail,
      tagId,
      tagLabel,
      action,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit when CRM note is added
 */
export function emitCrmNoteAdded(
  storeId: string,
  noteId: string,
  customerId: string,
  customerName: string,
  authorName: string
): void {
  emitEvent({
    storeId,
    type: 'crm.note_added',
    resourceId: noteId,
    resourceType: 'crm_note',
    data: {
      customerId,
      customerName,
      authorName,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Emit when CRM task is created/completed
 */
export function emitCrmTaskEvent(
  storeId: string,
  taskId: string,
  taskTitle: string,
  action: 'created' | 'completed',
  customerId?: string,
  customerName?: string,
  assignedTo?: string
): void {
  emitEvent({
    storeId,
    type: action === 'created' ? 'crm.task_created' : 'crm.task_completed',
    resourceId: taskId,
    resourceType: 'crm_task',
    data: {
      taskTitle,
      customerId,
      customerName,
      assignedTo,
      action,
      timestamp: new Date().toISOString(),
    },
  });
}

