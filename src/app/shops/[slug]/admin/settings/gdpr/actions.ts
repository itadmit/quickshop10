'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { GDPRSettings } from './page';

// ============================================
// GDPR Settings Server Actions
// ============================================

export async function updateGDPRSettings(
  storeId: string,
  gdprSettings: GDPRSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current store settings
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { settings: true, slug: true },
    });

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    // Merge GDPR settings
    const newSettings = {
      ...currentSettings,
      gdpr: gdprSettings,
    };

    // Update store
    await db.update(stores)
      .set({ settings: newSettings })
      .where(eq(stores.id, storeId));

    revalidatePath(`/shops/${store.slug}/admin/settings/gdpr`);
    revalidatePath(`/shops/${store.slug}`); // Revalidate storefront too

    return { success: true };
  } catch (error) {
    console.error('Error updating GDPR settings:', error);
    return { success: false, error: 'שגיאה בשמירת ההגדרות' };
  }
}

