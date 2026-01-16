'use server';

import { getStoreBySlug } from '@/lib/db/queries';
import { duplicateProduct as duplicateProductAction } from '@/lib/actions/products';
import { db } from '@/lib/db';
import { products, productImages, productVariants } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { deleteImage, deleteImages } from '@/lib/media/delete-service';

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

    // Collect image URLs to delete (supports both Cloudinary and Vercel Blob)
    const imageUrlsToDelete: string[] = [];

    // Get all product images for these products
    const images = await db.select({ url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, productIds));
    
    for (const img of images) {
      if (img.url) imageUrlsToDelete.push(img.url);
    }

    // Get all variant images for these products
    const variants = await db.select({ imageUrl: productVariants.imageUrl })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));
    
    for (const variant of variants) {
      if (variant.imageUrl) {
        imageUrlsToDelete.push(variant.imageUrl);
      }
    }

    // Delete images from storage (Cloudinary or Vercel Blob) in batches
    if (imageUrlsToDelete.length > 0) {
      console.log(`[Bulk Product Delete] Deleting ${imageUrlsToDelete.length} images...`);
      const { deleted, failed } = await deleteImages(imageUrlsToDelete);
      console.log(`[Bulk Product Delete] Storage deletion: ${deleted} deleted, ${failed} failed`);
    }

    // Delete products from database (cascades to images, variants, etc.)
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


