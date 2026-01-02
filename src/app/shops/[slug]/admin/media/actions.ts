'use server';

import { db } from '@/lib/db';
import { media } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
  alt?: string;
  folder?: string;
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
    // In production, also delete from storage service (S3/Cloudinary/etc)
    await db.delete(media).where(eq(media.id, mediaId));
    revalidatePath(`/shops/${slug}/admin/media`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting media:', error);
    return { success: false, error: 'שגיאה במחיקת קובץ' };
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

