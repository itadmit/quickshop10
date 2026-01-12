'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface CustomCodeData {
  customHeadCode?: string;
  customBodyStartCode?: string;
  customBodyEndCode?: string;
  customCss?: string;
}

export async function updateCustomCode(storeId: string, storeSlug: string, data: CustomCodeData) {
  try {
    // Get current settings
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    // Merge new custom code settings
    const newSettings = {
      ...currentSettings,
      customHeadCode: data.customHeadCode ?? currentSettings.customHeadCode,
      customBodyStartCode: data.customBodyStartCode ?? currentSettings.customBodyStartCode,
      customBodyEndCode: data.customBodyEndCode ?? currentSettings.customBodyEndCode,
      customCss: data.customCss ?? currentSettings.customCss,
    };

    await db
      .update(stores)
      .set({ settings: newSettings })
      .where(eq(stores.id, storeId));

    revalidatePath(`/shops/${storeSlug}`);
    revalidatePath(`/shops/${storeSlug}/admin/design/custom-code`);

    return { success: true };
  } catch (error) {
    console.error('Error updating custom code:', error);
    return { error: 'שגיאה בעדכון הקוד המותאם' };
  }
}

export async function getCustomCode(storeId: string) {
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) {
    return null;
  }

  const settings = (store.settings as Record<string, unknown>) || {};

  return {
    headCode: (settings.customHeadCode as string) || '',
    bodyStartCode: (settings.customBodyStartCode as string) || '',
    bodyEndCode: (settings.customBodyEndCode as string) || '',
    customCss: (settings.customCss as string) || '',
  };
}
