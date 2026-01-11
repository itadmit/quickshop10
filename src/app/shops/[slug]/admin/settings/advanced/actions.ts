'use server';

import { auth } from '@/lib/auth';
import { getStoreBySlug } from '@/lib/db/queries';
import { resetStoreToDefaults } from '@/lib/store-defaults';
import { revalidatePath } from 'next/cache';

export async function resetStore(storeSlug: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: 'יש להתחבר תחילה' };
  }

  const store = await getStoreBySlug(storeSlug);
  
  if (!store) {
    return { success: false, error: 'החנות לא נמצאה' };
  }

  // Only store owner can reset
  if (store.ownerId !== session.user.id) {
    return { success: false, error: 'אין הרשאה לאפס את החנות' };
  }

  try {
    const result = await resetStoreToDefaults(store.id, store.name, session.user.id);

    // Revalidate all store-related paths
    revalidatePath(`/shops/${storeSlug}`);
    revalidatePath(`/shops/${storeSlug}/admin`);
    revalidatePath(`/shops/${storeSlug}/editor`);

    return { 
      success: true, 
      message: `החנות אופסה בהצלחה! נוצרו ${result.pagesCreated} עמודים, ${result.categoriesCreated} קטגוריות ו-${result.productsCreated} מוצרים.`,
    };
  } catch (error) {
    console.error('Error resetting store:', error);
    return { success: false, error: 'שגיאה באיפוס החנות' };
  }
}

