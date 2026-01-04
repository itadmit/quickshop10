'use server';

import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface PageData {
  title: string;
  slug: string;
  content: string;
  template?: string;
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export async function createPage(
  storeId: string,
  storeSlug: string,
  data: PageData
) {
  try {
    // Check if slug exists
    const existing = await db.query.pages.findFirst({
      where: and(eq(pages.storeId, storeId), eq(pages.slug, data.slug)),
    });

    if (existing) {
      return { success: false, error: 'כתובת URL כבר קיימת' };
    }

    const [newPage] = await db.insert(pages).values({
      storeId,
      title: data.title,
      slug: data.slug,
      content: data.content,
      template: data.template || 'default',
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
    }).returning();

    revalidatePath(`/shops/${storeSlug}/admin/pages`);
    return { success: true, pageId: newPage.id };
  } catch (error) {
    console.error('Error creating page:', error);
    return { success: false, error: 'שגיאה ביצירת העמוד' };
  }
}

export async function updatePage(
  pageId: string,
  storeSlug: string,
  data: Partial<PageData>
) {
  try {
    const page = await db.query.pages.findFirst({
      where: eq(pages.id, pageId),
    });

    if (!page) {
      return { success: false, error: 'העמוד לא נמצא' };
    }

    // If slug is changing, check for duplicates
    if (data.slug && data.slug !== page.slug) {
      const existing = await db.query.pages.findFirst({
        where: and(eq(pages.storeId, page.storeId), eq(pages.slug, data.slug)),
      });

      if (existing) {
        return { success: false, error: 'כתובת URL כבר קיימת' };
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.template !== undefined) updateData.template = data.template;
    if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
    if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;
    
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
      if (data.isPublished && !page.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    await db.update(pages).set(updateData).where(eq(pages.id, pageId));

    revalidatePath(`/shops/${storeSlug}/admin/pages`);
    revalidatePath(`/shops/${storeSlug}/admin/pages/${pageId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating page:', error);
    return { success: false, error: 'שגיאה בעדכון העמוד' };
  }
}

export async function deletePage(pageId: string, storeSlug: string) {
  try {
    await db.delete(pages).where(eq(pages.id, pageId));
    revalidatePath(`/shops/${storeSlug}/admin/pages`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting page:', error);
    return { success: false, error: 'שגיאה במחיקת העמוד' };
  }
}

export async function togglePagePublish(pageId: string, storeSlug: string, isPublished: boolean) {
  try {
    await db.update(pages).set({
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(pages.id, pageId));

    revalidatePath(`/shops/${storeSlug}/admin/pages`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling page publish:', error);
    return { success: false, error: 'שגיאה בעדכון סטטוס הפרסום' };
  }
}


