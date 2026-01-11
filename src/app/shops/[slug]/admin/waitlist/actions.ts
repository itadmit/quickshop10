'use server';

import { db } from '@/lib/db';
import { productWaitlist } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { notifyWaitlistForProduct } from '@/lib/waitlist-notifications';

/**
 * Delete waitlist entry
 */
export async function deleteWaitlistEntry(id: string, storeSlug: string) {
  try {
    await db.delete(productWaitlist).where(eq(productWaitlist.id, id));
    
    revalidatePath(`/shops/${storeSlug}/admin/waitlist`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting waitlist entry:', error);
    return { success: false, error: 'שגיאה במחיקת הרשומה' };
  }
}

/**
 * Mark waitlist entry as notified
 */
export async function markAsNotified(id: string, storeSlug: string) {
  try {
    await db
      .update(productWaitlist)
      .set({
        isNotified: true,
        notifiedAt: new Date(),
      })
      .where(eq(productWaitlist.id, id));
    
    revalidatePath(`/shops/${storeSlug}/admin/waitlist`);
    
    return { success: true };
  } catch (error) {
    console.error('Error marking as notified:', error);
    return { success: false, error: 'שגיאה בעדכון הסטטוס' };
  }
}

/**
 * Send notifications for a product/variant
 */
export async function sendNotificationsForProduct(
  storeId: string,
  productId: string,
  variantId: string | null,
  storeSlug: string
) {
  try {
    const result = await notifyWaitlistForProduct(storeId, productId, variantId);
    
    revalidatePath(`/shops/${storeSlug}/admin/waitlist`);
    
    if (result.success) {
      return {
        success: true,
        message: `נשלחו ${result.count} הודעות בהצלחה`,
        count: result.count,
      };
    } else {
      return {
        success: false,
        error: `נכשלו ${result.errors.length} שליחות: ${result.errors.join(', ')}`,
      };
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error: 'שגיאה בשליחת ההודעות' };
  }
}

