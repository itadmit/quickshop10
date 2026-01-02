'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface ShippingRate {
  id: string;
  name: string;
  price: number;
  freeAbove: number | null;
  estimatedDays: string;
}

interface ShippingSettingsData {
  rates: ShippingRate[];
  freeShippingThreshold: number;
  enableFreeShipping: boolean;
}

export async function updateShippingSettings(storeId: string, data: ShippingSettingsData) {
  try {
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    const newSettings = {
      ...currentSettings,
      shipping: {
        rates: data.rates,
        freeShippingThreshold: data.freeShippingThreshold,
        enableFreeShipping: data.enableFreeShipping,
      },
    };

    await db
      .update(stores)
      .set({
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/shipping', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating shipping settings:', error);
    return { error: 'אירעה שגיאה בשמירת ההגדרות' };
  }
}

