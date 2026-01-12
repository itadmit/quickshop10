'use server';

import { db } from '@/lib/db';
import { pages, pageSections, pageTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getDefaultPageTemplateById } from '@/lib/default-page-templates';

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
    return { success: true, pageId: newPage.id, pageSlug: newPage.slug };
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

/**
 * Create a new page with template sections
 * Supports both system templates (system:templateId) and custom templates (UUID)
 */
export async function createPageWithTemplate(
  storeId: string,
  storeSlug: string,
  data: PageData,
  templateId: string
) {
  try {
    // Check if slug exists
    const existing = await db.query.pages.findFirst({
      where: and(eq(pages.storeId, storeId), eq(pages.slug, data.slug)),
    });

    if (existing) {
      return { success: false, error: 'כתובת URL כבר קיימת' };
    }

    // Determine template type and get sections
    const isSystemTemplate = templateId.startsWith('system:');
    const templateIdClean = isSystemTemplate ? templateId.replace('system:', '') : templateId;
    
    let templateSections: Array<{
      type: string;
      title: string | null;
      subtitle: string | null;
      content: Record<string, unknown>;
      settings: Record<string, unknown>;
    }> = [];

    if (isSystemTemplate) {
      // Get from default system templates
      const systemTemplate = getDefaultPageTemplateById(templateIdClean);
      if (systemTemplate) {
        templateSections = systemTemplate.sections;
      }
    } else {
      // Get from custom template in DB
      const customTemplate = await db.query.pageTemplates.findFirst({
        where: and(
          eq(pageTemplates.id, templateIdClean),
          eq(pageTemplates.storeId, storeId)
        ),
      });
      
      if (customTemplate && Array.isArray(customTemplate.sections)) {
        templateSections = customTemplate.sections as typeof templateSections;
      }
    }

    // Create the page
    const [newPage] = await db.insert(pages).values({
      storeId,
      title: data.title,
      slug: data.slug,
      content: data.content,
      template: 'sections', // Section-based page
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
    }).returning();

    // Create sections from template
    const pageIdentifier = `pages/${data.slug}`;
    
    if (templateSections.length > 0) {
      const sectionsToInsert = templateSections.map((section, index) => ({
        storeId,
        page: pageIdentifier,
        type: section.type as 'hero' | 'banner' | 'split_banner' | 'video_banner' | 'categories' | 'products' | 'newsletter' | 'custom' | 'reviews' | 'image_text' | 'features' | 'banner_small' | 'gallery' | 'text_block' | 'logos' | 'faq' | 'contact' | 'hero_slider' | 'hero_premium' | 'series_grid' | 'quote_banner' | 'featured_items',
        title: section.title,
        subtitle: section.subtitle,
        content: section.content,
        settings: section.settings,
        sortOrder: index,
        isActive: true,
      }));

      await db.insert(pageSections).values(sectionsToInsert);
    }

    revalidatePath(`/shops/${storeSlug}/admin/pages`);
    revalidatePath(`/shops/${storeSlug}/pages/${data.slug}`);
    
    return { success: true, pageId: newPage.id, pageSlug: newPage.slug };
  } catch (error) {
    console.error('Error creating page with template:', error);
    return { success: false, error: 'שגיאה ביצירת העמוד' };
  }
}

