import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageTemplates, pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { revalidatePath, revalidateTag } from 'next/cache';
import { randomUUID } from 'crypto';

// ============================================
// POST /api/shops/[slug]/page-templates/[id]/apply
// Apply template to a page
// NEW ARCHITECTURE: Sections stored as JSON on pages table
// ============================================

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

    // Create new sections from template
    const templateSections = (template.sections as Array<{
      type: string;
      title?: string;
      subtitle?: string;
      content?: Record<string, unknown>;
      settings?: Record<string, unknown>;
      sortOrder?: number;
    }>) || [];

    // Convert template sections to page sections with new UUIDs
    const newSections = templateSections.map((section, index) => ({
      id: randomUUID(),
      type: section.type,
      title: section.title || null,
      subtitle: section.subtitle || null,
      content: section.content || {},
      settings: section.settings || {},
      sortOrder: section.sortOrder ?? index,
      isActive: true,
    }));

    // Update page with new sections - atomic operation!
    await db.update(pages)
      .set({ 
        sections: newSections,
        updatedAt: new Date()
      })
      .where(eq(pages.id, page.id));

    // Revalidate paths
    revalidatePath(`/shops/${slug}/pages/${pageSlug}`);
    revalidatePath(`/shops/${slug}/editor`);
    revalidateTag('sections', { expire: 0 });

    return NextResponse.json({ 
      success: true,
      sectionsCreated: newSections.length,
    });
  } catch (error) {
    console.error('Error applying page template:', error);
    return NextResponse.json({ error: 'Failed to apply template' }, { status: 500 });
  }
}
