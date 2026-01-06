'use server';

import { getStoreBySlug } from '@/lib/db/queries';
import { duplicateProduct as duplicateProductAction } from '@/lib/actions/products';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Wrapper for duplicateProduct that fetches storeId from slug
export async function duplicateProduct(productId: string, storeSlug: string) {
  const store = await getStoreBySlug(storeSlug);
  
  if (!store) {
    return { success: false, error: 'החנות לא נמצאה' };
  }
  
  const result = await duplicateProductAction(productId, store.id, storeSlug);
  
  return {
    success: result.success,
    newProductId: result.productId,
    error: result.error,
  };
}

// Bulk activate products
export async function bulkActivateProducts(productIds: string[], storeSlug: string) {
  try {
    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return { success: false, error: 'החנות לא נמצאה' };
    }

    await db
      .update(products)
      .set({ isActive: true, updatedAt: new Date() })
      .where(
        and(
          eq(products.storeId, store.id),
          inArray(products.id, productIds)
        )
      );

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    return { success: true };
  } catch (error) {
    console.error('Error activating products:', error);
    return { success: false, error: 'שגיאה בהפעלת המוצרים' };
  }
}

// Bulk deactivate products
export async function bulkDeactivateProducts(productIds: string[], storeSlug: string) {
  try {
    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return { success: false, error: 'החנות לא נמצאה' };
    }

    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(products.storeId, store.id),
          inArray(products.id, productIds)
        )
      );

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    return { success: true };
  } catch (error) {
    console.error('Error deactivating products:', error);
    return { success: false, error: 'שגיאה בהשבתת המוצרים' };
  }
}

// Bulk delete products
export async function bulkDeleteProducts(productIds: string[], storeSlug: string) {
  try {
    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return { success: false, error: 'החנות לא נמצאה' };
    }

    await db
      .delete(products)
      .where(
        and(
          eq(products.storeId, store.id),
          inArray(products.id, productIds)
        )
      );

    revalidatePath(`/shops/${storeSlug}/admin/products`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting products:', error);
    return { success: false, error: 'שגיאה במחיקת המוצרים' };
  }
}

