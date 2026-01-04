/**
 * Cron Job: Identify Abandoned Carts
 * 
 * Runs every 15 minutes via QStash
 * 
 * What it does:
 * 1. Finds pendingPayments with status = 'pending' older than threshold
 *    (These are customers who started checkout but didn't complete payment)
 * 2. Creates abandoned cart records for tracking
 * 3. Marks expired pendingPayments
 * 
 * URL: /api/cron/abandoned-carts
 * Method: GET (for cron) or POST
 * Auth: QStash signature verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, abandonedCarts, pendingPayments, orders, orderItems } from '@/lib/db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { verifyQStashSignature } from '@/lib/qstash';

// Parse cart items from pending payment
interface CartItem {
  productId?: string;
  variantId?: string;
  variantTitle?: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  image?: string;
  imageUrl?: string;
}

// Parse order data from pending payment
interface OrderData {
  customer?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: Record<string, unknown>;
  items?: CartItem[];
}

export async function GET(request: NextRequest) {
  // Verify QStash signature (fast, <5ms)
  const authError = await verifyQStashSignature(request);
  if (authError) return authError;

  try {
    // Get all stores with their settings
    const allStores = await db.select({
      id: stores.id,
      name: stores.name,
      settings: stores.settings,
    }).from(stores);

    let totalProcessed = 0;
    let newAbandoned = 0;
    const results: { storeId: string; storeName: string; found: number; created: number }[] = [];

    for (const store of allStores) {
      const settings = store.settings as Record<string, unknown> || {};
      const abandonedMinutes = (settings.abandonedCartMinutes as number) || 60;
      
      // Calculate threshold time
      const thresholdTime = new Date();
      thresholdTime.setMinutes(thresholdTime.getMinutes() - abandonedMinutes);

      // Find pending payments older than threshold
      // These are customers who started checkout but didn't complete payment
      const pendingPaymentsList = await db
        .select({
          id: pendingPayments.id,
          customerEmail: pendingPayments.customerEmail,
          orderData: pendingPayments.orderData,
          cartItems: pendingPayments.cartItems,
          amount: pendingPayments.amount,
          createdAt: pendingPayments.createdAt,
        })
        .from(pendingPayments)
        .where(and(
          eq(pendingPayments.storeId, store.id),
          eq(pendingPayments.status, 'pending'),
          lt(pendingPayments.createdAt, thresholdTime)
        ));

      let createdCount = 0;

      for (const payment of pendingPaymentsList) {
        // Check if abandoned cart already exists for this pending payment
        const existing = await db
          .select({ id: abandonedCarts.id })
          .from(abandonedCarts)
          .where(and(
            eq(abandonedCarts.storeId, store.id),
            eq(abandonedCarts.sessionId, `pending:${payment.id}`)
          ))
          .limit(1);

        if (existing.length > 0) continue;

        // Parse order data
        const orderData = payment.orderData as OrderData || {};
        const cartItems = (payment.cartItems as CartItem[]) || [];
        
        // Get customer name from order data
        const customerName = orderData.customer?.name || 
          (orderData.customer?.firstName && orderData.customer?.lastName 
            ? `${orderData.customer.firstName} ${orderData.customer.lastName}` 
            : null);

        // Calculate subtotal from cart items
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create abandoned cart record
        await db.insert(abandonedCarts).values({
          storeId: store.id,
          sessionId: `pending:${payment.id}`, // Link to pending payment
          email: payment.customerEmail,
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.name,
            variant: item.variantTitle,
            quantity: item.quantity,
            price: item.price,
            image: item.image || item.imageUrl,
          })),
          subtotal: String(subtotal),
          checkoutStep: 'payment', // They got to the payment step
        });

        createdCount++;
      }

      results.push({
        storeId: store.id,
        storeName: store.name,
        found: pendingPaymentsList.length,
        created: createdCount,
      });

      totalProcessed += pendingPaymentsList.length;
      newAbandoned += createdCount;
    }

    // ========== NEW: Check orders with financialStatus = 'pending' ==========
    // These are orders created when customer started checkout but didn't complete payment
    let pendingOrdersProcessed = 0;
    let pendingOrdersAbandoned = 0;
    
    for (const store of allStores) {
      const settings = store.settings as Record<string, unknown> || {};
      const abandonedMinutes = (settings.abandonedCartMinutes as number) || 60;
      
      const thresholdTime = new Date();
      thresholdTime.setMinutes(thresholdTime.getMinutes() - abandonedMinutes);

      // Find orders with pending payment older than threshold
      const pendingOrdersList = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerEmail: orders.customerEmail,
          customerName: orders.customerName,
          subtotal: orders.subtotal,
          total: orders.total,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(and(
          eq(orders.storeId, store.id),
          eq(orders.financialStatus, 'pending'),
          lt(orders.createdAt, thresholdTime)
        ));

      for (const order of pendingOrdersList) {
        // Check if abandoned cart already exists for this order
        const existing = await db
          .select({ id: abandonedCarts.id })
          .from(abandonedCarts)
          .where(and(
            eq(abandonedCarts.storeId, store.id),
            eq(abandonedCarts.sessionId, `order:${order.id}`)
          ))
          .limit(1);

        if (existing.length > 0) continue;

        // Get order items
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        // Create abandoned cart record
        await db.insert(abandonedCarts).values({
          storeId: store.id,
          sessionId: `order:${order.id}`, // Link to order
          email: order.customerEmail,
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            variant: item.variantTitle,
            quantity: item.quantity,
            price: Number(item.price),
            image: item.imageUrl,
          })),
          subtotal: order.subtotal,
          checkoutStep: 'payment', // They got to the payment step
        });

        pendingOrdersAbandoned++;
      }
      
      pendingOrdersProcessed += pendingOrdersList.length;
    }

    // Mark expired pending payments
    const expiredPayments = await db
      .select({ id: pendingPayments.id })
      .from(pendingPayments)
      .where(and(
        eq(pendingPayments.status, 'pending'),
        lt(pendingPayments.expiresAt, new Date())
      ));

    if (expiredPayments.length > 0) {
      await db
        .update(pendingPayments)
        .set({ status: 'expired' })
        .where(and(
          eq(pendingPayments.status, 'pending'),
          lt(pendingPayments.expiresAt, new Date())
        ));
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      storesProcessed: allStores.length,
      totalPendingPaymentsChecked: totalProcessed,
      newAbandonedCartsFromPayments: newAbandoned,
      pendingOrdersChecked: pendingOrdersProcessed,
      newAbandonedCartsFromOrders: pendingOrdersAbandoned,
      expiredPaymentsCleaned: expiredPayments.length,
      details: results.filter(r => r.found > 0 || r.created > 0),
    });
  } catch (error) {
    console.error('[Cron] Abandoned carts failed:', error);
    return NextResponse.json({ 
      error: 'Failed to process abandoned carts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support POST for QStash
export const POST = GET;
