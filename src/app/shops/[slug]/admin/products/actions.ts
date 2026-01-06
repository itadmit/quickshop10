'use server';

import { getStoreBySlug } from '@/lib/db/queries';
import { duplicateProduct as duplicateProductAction } from '@/lib/actions/products';

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

