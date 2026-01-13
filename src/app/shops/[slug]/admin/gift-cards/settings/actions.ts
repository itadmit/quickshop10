'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { type GiftCardSettings, defaultGiftCardSettings } from './types';

// ============================================
// Server Actions
// ============================================

export async function getGiftCardSettings(storeId: string): Promise<GiftCardSettings> {
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
    columns: { settings: true },
  });

  if (!store) {
    return defaultGiftCardSettings;
  }

  const settings = store.settings as Record<string, unknown>;
  const giftCard = settings.giftCard as GiftCardSettings | undefined;

  return {
    ...defaultGiftCardSettings,
    ...giftCard,
  };
}

export async function updateGiftCardSettings(
  storeId: string,
  storeSlug: string,
  giftCardSettings: GiftCardSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current store settings
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { settings: true },
    });

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    // Merge gift card settings
    const newSettings = {
      ...currentSettings,
      giftCard: giftCardSettings,
    };

    // Update store
    await db.update(stores)
      .set({ 
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath(`/shops/${storeSlug}/admin/gift-cards`);
    revalidatePath(`/shops/${storeSlug}/gift-card`);

    return { success: true };
  } catch (error) {
    console.error('Error updating gift card settings:', error);
    return { success: false, error: 'שגיאה בשמירת ההגדרות' };
  }
}

