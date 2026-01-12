'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface WaitlistSettings {
  autoNotify: boolean; // שליחה אוטומטית ללא אישור
  notifyThreshold: number; // סף מינימלי לשליחה אוטומטית (כדי לא לשלוח ל-1 אדם)
}

/**
 * Get waitlist settings for store
 */
export async function getWaitlistSettings(storeId: string): Promise<WaitlistSettings> {
  try {
    const [store] = await db
      .select({ settings: stores.settings })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { autoNotify: false, notifyThreshold: 1 };
    }

    const settings = (store.settings as Record<string, unknown>) || {};
    const waitlistSettings = (settings.waitlist as Record<string, unknown>) || {};

    return {
      autoNotify: Boolean(waitlistSettings.autoNotify),
      notifyThreshold: typeof waitlistSettings.notifyThreshold === 'number' 
        ? waitlistSettings.notifyThreshold 
        : 1,
    };
  } catch (error) {
    console.error('Error getting waitlist settings:', error);
    return { autoNotify: false, notifyThreshold: 1 };
  }
}

/**
 * Update waitlist settings
 */
export async function updateWaitlistSettings(
  storeId: string,
  storeSlug: string,
  settings: WaitlistSettings
) {
  try {
    // Get current settings
    const [store] = await db
      .select({ settings: stores.settings })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { success: false, error: 'החנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    // Update waitlist settings
    const updatedSettings = {
      ...currentSettings,
      waitlist: settings,
    };

    await db
      .update(stores)
      .set({ settings: updatedSettings })
      .where(eq(stores.id, storeId));

    revalidatePath(`/shops/${storeSlug}/admin/waitlist`);
    revalidatePath(`/shops/${storeSlug}/admin/settings`);

    return { success: true };
  } catch (error) {
    console.error('Error updating waitlist settings:', error);
    return { success: false, error: 'שגיאה בעדכון ההגדרות' };
  }
}


