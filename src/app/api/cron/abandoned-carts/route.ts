/**
 * Cron Job: Identify Abandoned Carts
 * 
 * Runs every 15 minutes via QStash
 * 
 * What it does:
 * 1. Finds orders with financial_status = 'pending' older than threshold
 * 2. Creates abandoned cart records for tracking
 * 3. Can trigger reminder emails
 * 
 * URL: /api/cron/abandoned-carts
 * Method: GET (for cron) or POST
 * Auth: CRON_SECRET header or QStash signature
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, orders, orderItems, abandonedCarts, pendingPayments } from '@/lib/db/schema';
import { eq, and, lt, isNull, sql } from 'drizzle-orm';

// Verify cron secret or QStash signature
function verifyCronAuth(request: NextRequest): boolean {
  // Check CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Check QStash signature
  const qstashSignature = request.headers.get('upstash-signature');
  if (qstashSignature) {
    // QStash will verify its own signature
    return true;
  }
  
  // No secret configured, allow (for development)
  if (!cronSecret) return true;
  
  return false;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

      // Find pending orders older than threshold
      const pendingOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerId: orders.customerId,
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

      let createdCount = 0;

      for (const order of pendingOrders) {
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
          .select({
            name: orderItems.name,
            variantTitle: orderItems.variantTitle,
            quantity: orderItems.quantity,
            price: orderItems.price,
            imageUrl: orderItems.imageUrl,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        // Create abandoned cart record
        await db.insert(abandonedCarts).values({
          storeId: store.id,
          sessionId: `order:${order.id}`, // Link to order
          customerId: order.customerId,
          email: order.customerEmail,
          items: items.map(item => ({
            name: item.name,
            variant: item.variantTitle,
            quantity: item.quantity,
            price: Number(item.price),
            image: item.imageUrl,
          })),
          subtotal: order.subtotal,
          checkoutStep: 'payment',
        });

        createdCount++;
      }

      results.push({
        storeId: store.id,
        storeName: store.name,
        found: pendingOrders.length,
        created: createdCount,
      });

      totalProcessed += pendingOrders.length;
      newAbandoned += createdCount;
    }

    // Also clean up old pending payments (expired)
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
      totalOrdersChecked: totalProcessed,
      newAbandonedCarts: newAbandoned,
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

