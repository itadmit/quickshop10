'use server';

import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function markNotificationRead(notificationId: string) {
  try {
    await db
      .update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));

    revalidatePath('/shops/[slug]/admin/notifications', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { error: 'אירעה שגיאה' };
  }
}

export async function markAllNotificationsRead(storeId: string) {
  try {
    await db
      .update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date(),
      })
      .where(and(
        eq(notifications.storeId, storeId),
        eq(notifications.isRead, false)
      ));

    revalidatePath('/shops/[slug]/admin/notifications', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { error: 'אירעה שגיאה' };
  }
}



