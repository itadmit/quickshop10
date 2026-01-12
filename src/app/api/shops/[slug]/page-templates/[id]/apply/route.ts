import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageTemplates, pageSections, pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

// POST /api/shops/[slug]/page-templates/[id]/apply - Apply template to a page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json();
    const { pageSlug } = body;

    if (!pageSlug) {
      return NextResponse.json({ error: 'pageSlug is required' }, { status: 400 });
    }

    const store = await getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get the template
    const template = await db.query.pageTemplates.findFirst({
      where: and(
        eq(pageTemplates.id, id),
        eq(pageTemplates.storeId, store.id)
      ),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Verify the page exists
    const page = await db.query.pages.findFirst({
      where: and(
        eq(pages.storeId, store.id),
        eq(pages.slug, pageSlug)
      ),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Delete existing sections for this page
    const pagePath = `pages/${pageSlug}`;
    await db
      .delete(pageSections)
      .where(and(
        eq(pageSections.storeId, store.id),
        eq(pageSections.page, pagePath)
      ));

    // Create new sections from template
    const templateSections = (template.sections as Array<{
      type: string;
      title?: string;
      subtitle?: string;
      content?: Record<string, unknown>;
      settings?: Record<string, unknown>;
      sortOrder?: number;
    }>) || [];

    if (templateSections.length > 0) {
      const newSections = templateSections.map((section, index) => ({
        storeId: store.id,
        page: pagePath,
        type: section.type as 'hero' | 'banner' | 'split_banner' | 'video_banner' | 'categories' | 'products' | 'newsletter' | 'custom' | 'reviews' | 'image_text' | 'features' | 'banner_small' | 'gallery' | 'text_block' | 'logos' | 'faq' | 'contact' | 'hero_slider' | 'hero_premium' | 'series_grid' | 'quote_banner' | 'featured_items',
        title: section.title || null,
        subtitle: section.subtitle || null,
        content: section.content || {},
        settings: section.settings || {},
        sortOrder: section.sortOrder ?? index,
        isActive: true,
      }));

      await db.insert(pageSections).values(newSections);
    }

    // Revalidate paths
    revalidatePath(`/shops/${slug}/pages/${pageSlug}`);
    revalidatePath(`/shops/${slug}/editor`);

    return NextResponse.json({ 
      success: true,
      sectionsCreated: templateSections.length,
    });
  } catch (error) {
    console.error('Error applying page template:', error);
    return NextResponse.json({ error: 'Failed to apply template' }, { status: 500 });
  }
}

