'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface SeoSettingsData {
  siteTitle: string;
  siteDescription: string;
  ogImage: string;
}

export async function updateSeoSettings(storeId: string, data: SeoSettingsData) {
  try {
    // Get current seo settings
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { error: 'חנות לא נמצאה' };
    }

    const currentSeoSettings = (store.seoSettings as Record<string, unknown>) || {};

    // Merge new settings
    const newSeoSettings = {
      ...currentSeoSettings,
      siteTitle: data.siteTitle || undefined,
      siteDescription: data.siteDescription || undefined,
      ogImage: data.ogImage || undefined,
    };

    // Update store
    await db
      .update(stores)
      .set({
        seoSettings: newSeoSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/seo', 'page');
    revalidatePath('/shops/[slug]', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    return { error: 'אירעה שגיאה בשמירת ההגדרות' };
  }
}









