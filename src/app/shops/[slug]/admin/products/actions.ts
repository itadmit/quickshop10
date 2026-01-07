'use server';

import { getStoreBySlug } from '@/lib/db/queries';
import { duplicateProduct as duplicateProductAction } from '@/lib/actions/products';
import { db } from '@/lib/db';
import { products, productImages, productVariants } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// Cloudinary API credentials
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// Extract public_id from Cloudinary URL
function extractPublicId(url: string | null): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  const match = url.match(/\/upload\/(?:v\d+\/)?(?:[^/]+\/)*(.+?)(?:\.[a-z]+)?$/i);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

// Delete image from Cloudinary
async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials not configured');
    return false;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();
    return result.result === 'ok' || result.result === 'not found';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

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

    // Collect Cloudinary public IDs to delete
    const publicIdsToDelete: string[] = [];

    // Get all product images for these products
    const images = await db.select({ url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, productIds));
    
    for (const img of images) {
      const publicId = extractPublicId(img.url);
      if (publicId) publicIdsToDelete.push(publicId);
    }

    // Get all variant images for these products
    const variants = await db.select({ imageUrl: productVariants.imageUrl })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));
    
    for (const variant of variants) {
      if (variant.imageUrl) {
        const publicId = extractPublicId(variant.imageUrl);
        if (publicId) publicIdsToDelete.push(publicId);
      }
    }

    // Delete images from Cloudinary in batches
    if (publicIdsToDelete.length > 0) {
      console.log(`[Bulk Product Delete] Deleting ${publicIdsToDelete.length} images from Cloudinary...`);
      
      // Delete in batches of 10 to avoid overwhelming the API
      const batchSize = 10;
      let deletedCount = 0;
      
      for (let i = 0; i < publicIdsToDelete.length; i += batchSize) {
        const batch = publicIdsToDelete.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(deleteFromCloudinary));
        deletedCount += results.filter(r => r).length;
      }
      
      console.log(`[Bulk Product Delete] Cloudinary deletion: ${deletedCount}/${publicIdsToDelete.length} successful`);
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

