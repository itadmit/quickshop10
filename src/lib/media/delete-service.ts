/**
 * Unified Media Deletion Service
 * 
 * Handles deletion from both Cloudinary and Vercel Blob
 */

import crypto from 'crypto';
import { del } from '@vercel/blob';

// Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

/**
 * Check if URL is from Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return url?.includes('cloudinary.com') || url?.includes('res.cloudinary.com');
}

/**
 * Check if URL is from Vercel Blob
 */
export function isVercelBlobUrl(url: string): boolean {
  return url?.includes('.vercel-storage.com') || url?.includes('.public.blob.vercel-storage.com');
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) {
    return null;
  }
  
  // Match pattern: /upload/v{version}/{public_id}.{format}
  // or: /upload/{transformations}/{public_id}.{format}
  const match = url.match(/\/upload\/(?:v\d+\/)?(?:[^/]+\/)*(.+?)(?:\.[a-z]+)?$/i);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

/**
 * Delete from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('[MediaDelete] Cloudinary credentials not configured');
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
    
    if (result.result === 'ok') {
      console.log(`[MediaDelete] Cloudinary: Deleted ${publicId}`);
      return true;
    } else {
      console.warn(`[MediaDelete] Cloudinary: Failed to delete ${publicId}:`, result);
      return false;
    }
  } catch (error) {
    console.error(`[MediaDelete] Cloudinary error for ${publicId}:`, error);
    return false;
  }
}

/**
 * Delete from Vercel Blob
 */
export async function deleteFromVercelBlob(url: string): Promise<boolean> {
  try {
    await del(url);
    console.log(`[MediaDelete] Vercel Blob: Deleted ${url}`);
    return true;
  } catch (error) {
    console.error(`[MediaDelete] Vercel Blob error for ${url}:`, error);
    return false;
  }
}

/**
 * Delete image from storage (auto-detects Cloudinary or Vercel Blob)
 */
export async function deleteImage(url: string): Promise<boolean> {
  if (!url) {
    return false;
  }

  // Check if Cloudinary
  if (isCloudinaryUrl(url)) {
    const publicId = extractCloudinaryPublicId(url);
    if (publicId) {
      return deleteFromCloudinary(publicId);
    }
    console.warn(`[MediaDelete] Could not extract Cloudinary public ID from: ${url}`);
    return false;
  }

  // Check if Vercel Blob
  if (isVercelBlobUrl(url)) {
    return deleteFromVercelBlob(url);
  }

  // Unknown URL format - log and skip
  console.log(`[MediaDelete] Unknown URL format, skipping: ${url}`);
  return false;
}

/**
 * Delete multiple images in batch
 */
export async function deleteImages(urls: string[]): Promise<{ deleted: number; failed: number }> {
  if (!urls || urls.length === 0) {
    return { deleted: 0, failed: 0 };
  }

  let deleted = 0;
  let failed = 0;

  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(deleteImage));
    
    for (const result of results) {
      if (result) {
        deleted++;
      } else {
        failed++;
      }
    }
  }

  console.log(`[MediaDelete] Batch complete: ${deleted} deleted, ${failed} failed`);
  return { deleted, failed };
}

/**
 * Delete all images for a product (by URLs)
 */
export async function deleteProductImages(imageUrls: string[]): Promise<void> {
  if (imageUrls.length === 0) return;
  
  console.log(`[MediaDelete] Deleting ${imageUrls.length} product images...`);
  const { deleted, failed } = await deleteImages(imageUrls);
  console.log(`[MediaDelete] Product images: ${deleted} deleted, ${failed} failed`);
}

