'use server';

import { db } from '@/lib/db';
import { orders, orderItems, storePlugins, products, productImages, productVariants } from '@/lib/db/schema';
import { eq, and, inArray, asc, desc, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================
// Kitchen Display Server Actions
// ============================================

export interface KitchenDisplayConfig {
  // סטטוסים להצגה
  displayOrderStatuses: string[];
  displayFinancialStatuses: string[];
  displayFulfillmentStatuses: string[];
  // פעולות
  successStatus: string;
  successCustomStatus: string | null;
  cancelStatus: string;
  cancelCustomStatus: string | null;
  // צליל
  soundEnabled: boolean;
  soundVolume: number;
  refreshInterval: number;
  // תצוגה
  sortOrder: 'oldest_first' | 'newest_first';
  showCustomerPhone: boolean;
  showCustomerName: boolean;
  showOrderNotes: boolean;
  showProductImages: boolean;
  cardSize: 'small' | 'medium' | 'large';
  darkMode: boolean;
  warningTimeMinutes: number;
  dangerTimeMinutes: number;
}

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string;
  imageUrl: string | null;
  variantTitle: string | null;
  addons: string[];
  notes: string;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  customStatus: string | null;
  total: string;
  note: string | null;
  createdAt: Date;
  items: KitchenOrderItem[];
}

/**
 * Update Kitchen Display plugin configuration
 */
export async function updateKitchenDisplayConfig(
  storeId: string,
  config: KitchenDisplayConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(storePlugins)
      .set({
        config: config as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storePlugins.storeId, storeId),
          eq(storePlugins.pluginSlug, 'kitchen-display')
        )
      );

    return { success: true };
  } catch (error) {
    console.error('[Kitchen Display] Error updating config:', error);
    return { success: false, error: 'שגיאה בעדכון ההגדרות' };
  }
}

/**
 * Get orders for kitchen display
 */
export async function getKitchenOrders(
  storeId: string,
  config: KitchenDisplayConfig
): Promise<KitchenOrder[]> {
  try {
    // רק הזמנות מ-7 הימים האחרונים כדי לא להאט את השרת
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get orders with the configured statuses (order status + financial status + fulfillment status)
    const ordersResult = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        status: orders.status,
        financialStatus: orders.financialStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        customStatus: orders.customStatus,
        total: orders.total,
        note: orders.note,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          // רק הזמנות מ-7 הימים האחרונים
          gte(orders.createdAt, sevenDaysAgo),
          // סטטוס הזמנה
          inArray(orders.status, config.displayOrderStatuses as any[]),
          // סטטוס תשלום
          inArray(orders.financialStatus, config.displayFinancialStatuses as any[]),
          // סטטוס משלוח
          inArray(orders.fulfillmentStatus, config.displayFulfillmentStatuses as any[])
        )
      )
      .orderBy(
        config.sortOrder === 'oldest_first' 
          ? asc(orders.createdAt) 
          : desc(orders.createdAt)
      )
      .limit(50);

    if (ordersResult.length === 0) {
      return [];
    }

    // Get order items for all orders
    const orderIds = ordersResult.map(o => o.id);
    const itemsResult = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        name: orderItems.name,
        quantity: orderItems.quantity,
        price: orderItems.price,
        variantTitle: orderItems.variantTitle,
        productId: orderItems.productId,
        properties: orderItems.properties,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    // Get product images
    const productIds = itemsResult
      .map(item => item.productId)
      .filter((id): id is string => id !== null);
    
    let imageMap = new Map<string, string>();
    if (productIds.length > 0) {
      const imagesResult = await db
        .select({
          productId: productImages.productId,
          url: productImages.url,
        })
        .from(productImages)
        .where(
          and(
            inArray(productImages.productId, productIds),
            eq(productImages.isPrimary, true)
          )
        );
      
      imageMap = new Map(imagesResult.map(img => [img.productId, img.url]));
    }

    // Group items by order
    const itemsByOrder = new Map<string, KitchenOrderItem[]>();
    for (const item of itemsResult) {
      const properties = item.properties as { addons?: string[]; notes?: string } | null;
      const orderItem: KitchenOrderItem = {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.productId ? imageMap.get(item.productId) || null : null,
        variantTitle: item.variantTitle,
        addons: properties?.addons || [],
        notes: properties?.notes || '',
      };

      if (!itemsByOrder.has(item.orderId)) {
        itemsByOrder.set(item.orderId, []);
      }
      itemsByOrder.get(item.orderId)!.push(orderItem);
    }

    // Build final response
    return ordersResult.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      status: order.status,
      customStatus: order.customStatus,
      total: order.total,
      note: order.note,
      createdAt: order.createdAt,
      items: itemsByOrder.get(order.id) || [],
    }));
  } catch (error) {
    console.error('[Kitchen Display] Error fetching orders:', error);
    return [];
  }
}

/**
 * Update order status (approve or cancel)
 */
export async function updateOrderStatus(
  orderId: string,
  storeId: string,
  action: 'approve' | 'cancel',
  config: KitchenDisplayConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const newStatus = action === 'approve' ? config.successStatus : config.cancelStatus;
    const newCustomStatus = action === 'approve' 
      ? config.successCustomStatus 
      : config.cancelCustomStatus;

    await db
      .update(orders)
      .set({
        status: newStatus as any,
        customStatus: newCustomStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.storeId, storeId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('[Kitchen Display] Error updating order status:', error);
    return { success: false, error: 'שגיאה בעדכון סטטוס ההזמנה' };
  }
}

/**
 * Test notification sound (placeholder)
 */
export async function testNotificationSound(): Promise<void> {
  // Sound is played client-side, this is just a placeholder
  return;
}

