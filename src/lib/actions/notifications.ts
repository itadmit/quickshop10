'use server';

import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  resourceId: string | null;
  resourceType: string | null;
  isRead: boolean;
  createdAt: Date;
};

/**
 * Get notifications for a store
 * Optimized: Single query with limit for speed
 */
export async function getNotifications(storeId: string, limit = 10): Promise<NotificationItem[]> {
  const results = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      resourceId: notifications.resourceId,
      resourceType: notifications.resourceType,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.storeId, storeId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return results;
}

/**
 * Get unread notifications count
 * Optimized: Count query only
 */
export async function getUnreadCount(storeId: string): Promise<number> {
  const results = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.storeId, storeId),
        eq(notifications.isRead, false)
      )
    )
    .limit(100); // Cap for performance

  return results.length;
}

/**
 * Mark notification as read
 * Fire-and-forget friendly
 */
export async function markAsRead(notificationId: string) {
  await db
    .update(notifications)
    .set({ 
      isRead: true, 
      readAt: new Date() 
    })
    .where(eq(notifications.id, notificationId));
}

/**
 * Mark all notifications as read for a store
 */
export async function markAllAsRead(storeId: string) {
  await db
    .update(notifications)
    .set({ 
      isRead: true, 
      readAt: new Date() 
    })
    .where(
      and(
        eq(notifications.storeId, storeId),
        eq(notifications.isRead, false)
      )
    );
  
  revalidatePath('/shops/[slug]/admin', 'layout');
}

/**
 * Create a new notification
 */
export async function createNotification(data: {
  storeId: string;
  userId?: string;
  type: 'new_order' | 'low_stock' | 'out_of_stock' | 'new_customer' | 'order_cancelled' | 'system';
  title: string;
  message?: string;
  resourceId?: string;
  resourceType?: string;
}) {
  await db.insert(notifications).values({
    storeId: data.storeId,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message || null,
    resourceId: data.resourceId || null,
    resourceType: data.resourceType || null,
  });
}

