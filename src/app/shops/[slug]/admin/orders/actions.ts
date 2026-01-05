'use server';

import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { inArray, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Archive multiple orders
 * Sets archivedAt timestamp to current date
 */
export async function archiveOrders(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) {
    return { success: false, error: 'No orders selected' };
  }

  try {
    await db.update(orders)
      .set({ 
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, orderIds));

    revalidatePath('/shops/[slug]/admin/orders');
    return { success: true, archivedCount: orderIds.length };
  } catch (error) {
    console.error('Failed to archive orders:', error);
    return { success: false, error: 'Failed to archive orders' };
  }
}

/**
 * Permanently delete orders from the database
 * ⚠️ This action is irreversible!
 */
export async function permanentlyDeleteOrders(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) {
    return { success: false, error: 'No orders selected' };
  }

  try {
    // Delete order items first (due to foreign key constraint)
    for (const orderId of orderIds) {
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    }
    
    // Delete the orders
    await db.delete(orders).where(inArray(orders.id, orderIds));

    revalidatePath('/shops/[slug]/admin/orders');
    return { success: true, deletedCount: orderIds.length };
  } catch (error) {
    console.error('Failed to permanently delete orders:', error);
    return { success: false, error: 'Failed to delete orders' };
  }
}

/**
 * Unarchive multiple orders
 * Removes archivedAt timestamp
 */
export async function unarchiveOrders(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) {
    return { success: false, error: 'No orders selected' };
  }

  try {
    await db.update(orders)
      .set({ 
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, orderIds));

    revalidatePath('/shops/[slug]/admin/orders');
    return { success: true, unarchivedCount: orderIds.length };
  } catch (error) {
    console.error('Failed to unarchive orders:', error);
    return { success: false, error: 'Failed to unarchive orders' };
  }
}

/**
 * Mark orders as fulfilled
 */
export async function markOrdersFulfilled(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) {
    return { success: false, error: 'No orders selected' };
  }

  try {
    await db.update(orders)
      .set({ 
        fulfillmentStatus: 'fulfilled',
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, orderIds));

    revalidatePath('/shops/[slug]/admin/orders');
    return { success: true, updatedCount: orderIds.length };
  } catch (error) {
    console.error('Failed to mark orders as fulfilled:', error);
    return { success: false, error: 'Failed to update orders' };
  }
}

