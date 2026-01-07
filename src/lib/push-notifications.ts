/**
 * Push Notifications - Expo Push API
 * 
 * Sends push notifications to mobile app users via Expo's push service.
 * Used for: new orders, low stock alerts, etc.
 * 
 * Expo Push API: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import { db } from '@/lib/db';
import { mobileDevices, users, stores } from '@/lib/db/schema';
import { eq, and, isNotNull, inArray } from 'drizzle-orm';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  sound?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

/**
 * Send push notification to specific tokens
 */
async function sendPushNotifications(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('[Push] Failed to send notifications:', error);
    return [];
  }
}

/**
 * Get push tokens for store owners/admins who should receive notifications
 */
async function getStoreAdminTokens(storeId: string, notificationType: 'orders' | 'lowStock' | 'returns'): Promise<string[]> {
  // Get users who own this store
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });

  if (!store?.ownerId) return [];

  // Get mobile devices with push tokens for the store owner
  // Filter by notification preferences
  const devices = await db
    .select({ pushToken: mobileDevices.pushToken })
    .from(mobileDevices)
    .where(and(
      eq(mobileDevices.userId, store.ownerId),
      isNotNull(mobileDevices.pushToken),
      // Filter by notification type preference
      notificationType === 'orders' ? eq(mobileDevices.notifyOrders, true) :
      notificationType === 'lowStock' ? eq(mobileDevices.notifyLowStock, true) :
      eq(mobileDevices.notifyReturns, true)
    ));

  return devices
    .map(d => d.pushToken)
    .filter((token): token is string => !!token);
}

// ============ NEW ORDER NOTIFICATION ============

export interface NewOrderNotificationData {
  storeId: string;
  orderId: string;
  orderNumber: string;
  total: number;
  customerName?: string;
  itemCount: number;
}

/**
 * Send push notification for new order
 */
export async function sendNewOrderPushNotification(data: NewOrderNotificationData): Promise<void> {
  try {
    const tokens = await getStoreAdminTokens(data.storeId, 'orders');
    
    if (tokens.length === 0) {
      console.log('[Push] No tokens found for store:', data.storeId);
      return;
    }

    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default', // Use 'purchase.wav' for custom sound (must be in app bundle)
      title: '🛒 הזמנה חדשה!',
      body: `הזמנה #${data.orderNumber} - ₪${data.total.toFixed(0)}${data.customerName ? ` מאת ${data.customerName}` : ''}`,
      data: {
        type: 'new_order',
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        total: data.total,
        screen: 'OrderDetails', // For navigation in app
      },
      priority: 'high',
      channelId: 'orders', // Android notification channel
    }));

    const tickets = await sendPushNotifications(messages);
    console.log(`[Push] Sent new order notification to ${tickets.length} devices`);
  } catch (error) {
    console.error('[Push] Failed to send new order notification:', error);
  }
}

// ============ LOW STOCK NOTIFICATION ============

export interface LowStockNotificationData {
  storeId: string;
  productId: string;
  productName: string;
  inventory: number;
  isOutOfStock: boolean;
}

/**
 * Send push notification for low stock / out of stock
 */
export async function sendLowStockPushNotification(data: LowStockNotificationData): Promise<void> {
  try {
    const tokens = await getStoreAdminTokens(data.storeId, 'lowStock');
    
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: data.isOutOfStock ? '⚠️ אזל מהמלאי!' : '📦 מלאי נמוך',
      body: data.isOutOfStock 
        ? `${data.productName} אזל מהמלאי`
        : `${data.productName} - נותרו ${data.inventory} יחידות`,
      data: {
        type: data.isOutOfStock ? 'out_of_stock' : 'low_stock',
        productId: data.productId,
        productName: data.productName,
        inventory: data.inventory,
        screen: 'ProductDetails',
      },
      priority: data.isOutOfStock ? 'high' : 'normal',
      channelId: 'inventory',
    }));

    await sendPushNotifications(messages);
    console.log(`[Push] Sent ${data.isOutOfStock ? 'out of stock' : 'low stock'} notification`);
  } catch (error) {
    console.error('[Push] Failed to send low stock notification:', error);
  }
}

// ============ ORDER STATUS NOTIFICATION ============

export interface OrderStatusNotificationData {
  storeId: string;
  orderId: string;
  orderNumber: string;
  status: 'fulfilled' | 'cancelled' | 'refunded';
}

/**
 * Send push notification for order status change (to store owner)
 */
export async function sendOrderStatusPushNotification(data: OrderStatusNotificationData): Promise<void> {
  try {
    const tokens = await getStoreAdminTokens(data.storeId, 'orders');
    
    if (tokens.length === 0) return;

    const statusMessages = {
      fulfilled: { title: '📦 הזמנה נשלחה', body: `הזמנה #${data.orderNumber} סומנה כנשלחה` },
      cancelled: { title: '❌ הזמנה בוטלה', body: `הזמנה #${data.orderNumber} בוטלה` },
      refunded: { title: '💸 הזמנה זוכתה', body: `הזמנה #${data.orderNumber} זוכתה` },
    };

    const msg = statusMessages[data.status];

    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: msg.title,
      body: msg.body,
      data: {
        type: `order_${data.status}`,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        screen: 'OrderDetails',
      },
      channelId: 'orders',
    }));

    await sendPushNotifications(messages);
  } catch (error) {
    console.error('[Push] Failed to send order status notification:', error);
  }
}

// ============ RETURN REQUEST NOTIFICATION ============

export interface ReturnRequestNotificationData {
  storeId: string;
  returnId: string;
  orderNumber: string;
  customerName: string;
  reason: string;
}

/**
 * Send push notification for new return request
 */
export async function sendReturnRequestPushNotification(data: ReturnRequestNotificationData): Promise<void> {
  try {
    const tokens = await getStoreAdminTokens(data.storeId, 'returns');
    
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: '↩️ בקשת החזרה חדשה',
      body: `בקשת החזרה להזמנה #${data.orderNumber} מאת ${data.customerName}`,
      data: {
        type: 'return_request',
        returnId: data.returnId,
        orderNumber: data.orderNumber,
        screen: 'ReturnDetails',
      },
      priority: 'high',
      channelId: 'returns',
    }));

    await sendPushNotifications(messages);
  } catch (error) {
    console.error('[Push] Failed to send return request notification:', error);
  }
}

