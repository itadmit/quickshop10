'use server';

import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// Cloudinary API credentials
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// Extract public_id from Cloudinary URL
function extractPublicId(url: string): string | null {
  if (!url.includes('cloudinary.com')) return null;
  
  // Match: /upload/v{version}/{public_id}.{format}
  // or: /upload/{transformations}/{public_id}.{format}
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
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

interface MediaData {
  storeId: string;
  filename: string;
  originalFilename?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  publicId?: string;
  alt?: string;
  folder?: string;
}

// Create media record from Cloudinary upload result
export async function createMediaRecord(data: MediaData) {
  try {
    const [newMedia] = await db.insert(media).values({
      storeId: data.storeId,
      filename: data.filename,
      originalFilename: data.originalFilename || null,
      mimeType: data.mimeType || null,
      size: data.size || null,
      width: data.width || null,
      height: data.height || null,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || null,
      publicId: data.publicId || null, // Store Cloudinary public_id for deletion
      alt: data.alt || null,
      folder: data.folder || null,
    }).returning();

    return { success: true, media: newMedia };
  } catch (error) {
    console.error('Error creating media record:', error);
    throw error;
  }
}

export async function createMedia(slug: string, data: MediaData) {
  try {
    const [newMedia] = await db.insert(media).values({
      storeId: data.storeId,
      filename: data.filename,
      originalFilename: data.originalFilename || null,
      mimeType: data.mimeType || null,
      size: data.size || null,
      width: data.width || null,
      height: data.height || null,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || null,
      alt: data.alt || null,
      folder: data.folder || null,
    }).returning();

    revalidatePath(`/shops/${slug}/admin/media`);
    return { success: true, media: newMedia };
  } catch (error) {
    console.error('Error creating media:', error);
    return { success: false, error: 'שגיאה ביצירת קובץ' };
  }
}

export async function updateMedia(
  mediaId: string,
  slug: string,
  data: { alt?: string; folder?: string }
) {
  try {
    await db.update(media).set(data).where(eq(media.id, mediaId));
    revalidatePath(`/shops/${slug}/admin/media`);
    return { success: true };
  } catch (error) {
    console.error('Error updating media:', error);
    return { success: false, error: 'שגיאה בעדכון קובץ' };
  }
}

export async function deleteMedia(mediaId: string, slug: string) {
  try {
    // Get media record to find Cloudinary public_id
    const [mediaRecord] = await db.select().from(media).where(eq(media.id, mediaId));
    
    if (mediaRecord) {
      // Prefer stored publicId, fallback to extracting from URL
      const publicId = mediaRecord.publicId || extractPublicId(mediaRecord.url);
      if (publicId) {
        const deleted = await deleteFromCloudinary(publicId);
        console.log(`Cloudinary delete ${publicId}: ${deleted ? 'success' : 'failed'}`);
      }
    }

    // Delete from database
    await db.delete(media).where(eq(media.id, mediaId));
    revalidatePath(`/shops/${slug}/admin/media`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting media:', error);
    return { success: false, error: 'שגיאה במחיקת קובץ' };
  }
}

// Bulk delete media - מחיקה מרובה
export async function bulkDeleteMedia(mediaIds: string[], slug: string) {
  try {
    // Get all media records to find Cloudinary public_ids
    const mediaRecords = await db.select().from(media).where(inArray(media.id, mediaIds));
    
    // Delete from Cloudinary in parallel
    const deleteResults = await Promise.all(
      mediaRecords.map(async (record) => {
        // Prefer stored publicId, fallback to extracting from URL
        const publicId = record.publicId || extractPublicId(record.url);
        if (publicId) {
          const deleted = await deleteFromCloudinary(publicId);
          console.log(`Cloudinary delete ${publicId}: ${deleted ? 'success' : 'failed'}`);
          return deleted;
        }
        return false;
      })
    );
    
    console.log(`Bulk delete: ${deleteResults.filter(r => r).length}/${mediaRecords.length} deleted from Cloudinary`);

    // Delete from database
    await db.delete(media).where(inArray(media.id, mediaIds));
    revalidatePath(`/shops/${slug}/admin/media`);
    return { success: true, deletedCount: mediaIds.length };
  } catch (error) {
    console.error('Error bulk deleting media:', error);
    return { success: false, error: 'שגיאה במחיקת קבצים' };
  }
}

export async function moveToFolder(
  mediaIds: string[],
  slug: string,
  folder: string | null
) {
  try {
    await Promise.all(
      mediaIds.map(id =>
        db.update(media).set({ folder }).where(eq(media.id, id))
      )
    );
    revalidatePath(`/shops/${slug}/admin/media`);
    return { success: true };
  } catch (error) {
    console.error('Error moving media:', error);
    return { success: false, error: 'שגיאה בהעברת קבצים' };
  }
}


