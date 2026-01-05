'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateHeaderLayout(storeSlug: string, layout: string) {
  try {
    // Get store by slug
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    // Update store settings with new header layout
    const currentSettings = (store.settings as Record<string, unknown>) || {};
    const newSettings = {
      ...currentSettings,
      headerLayout: layout,
    };

    await db
      .update(stores)
      .set({
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id));

    revalidatePath(`/shops/${storeSlug}/admin/design`, 'page');
    revalidatePath(`/shops/${storeSlug}`, 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating header layout:', error);
    return { success: false, error: 'שגיאה בעדכון פריסת ההדר' };
  }
}
