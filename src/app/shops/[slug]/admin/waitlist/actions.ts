'use server';

import { db } from '@/lib/db';
import { productWaitlist } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

