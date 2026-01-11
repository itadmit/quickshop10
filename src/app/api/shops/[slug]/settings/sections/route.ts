import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageSections, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

// ============================================
// API: Update Page Sections
// PUT /api/shops/[slug]/settings/sections
// ============================================

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { sections, page = 'home' } = body as { sections: Section[]; page?: string };

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Simple upsert logic - client sends real UUIDs
    const sectionIds = sections.map(s => s.id);
    
    // Upsert each section (insert or update)
    for (const section of sections) {
      // Try to update first
      const updated = await db
        .update(pageSections)
        .set({
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          settings: section.settings,
          sortOrder: section.sortOrder,
          isActive: section.isActive,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pageSections.id, section.id),
            eq(pageSections.storeId, store.id)
          )
        )
        .returning({ id: pageSections.id });
      
      // If no rows updated, insert new section
      if (updated.length === 0) {
        await db.insert(pageSections).values({
          id: section.id, // Use the UUID from client
          storeId: store.id,
          page: page,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: section.type as any,
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          settings: section.settings,
          sortOrder: section.sortOrder,
          isActive: section.isActive,
        });
      }
    }

    // Delete sections that are no longer in the list
    const existingSections = await db
      .select({ id: pageSections.id })
      .from(pageSections)
      .where(
        and(
          eq(pageSections.storeId, store.id),
          eq(pageSections.page, page)
        )
      );

    for (const existing of existingSections) {
      if (!sectionIds.includes(existing.id)) {
        await db
          .delete(pageSections)
          .where(eq(pageSections.id, existing.id));
      }
    }

    // Revalidate cache so the storefront shows updated content
    // IMPORTANT: revalidateTag invalidates unstable_cache with 'sections' tag!
    // In Next.js 16, revalidateTag requires a profile - use expire: 0 for immediate invalidation
    revalidateTag('sections', { expire: 0 });
    revalidatePath(`/shops/${slug}`);
    if (page === 'coming_soon') {
      revalidatePath(`/shops/${slug}/coming-soon`);
    }
    // Revalidate internal pages
    if (page.startsWith('pages/')) {
      const pageSlug = page.replace('pages/', '');
      revalidatePath(`/shops/${slug}/pages/${pageSlug}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating sections:', error);
    return NextResponse.json(
      { error: 'Failed to update sections' },
      { status: 500 }
    );
  }
}

// GET - Get all sections for a page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 'home';

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get sections
    const sections = await db
      .select()
      .from(pageSections)
      .where(
        and(
          eq(pageSections.storeId, store.id),
          eq(pageSections.page, page)
        )
      )
      .orderBy(pageSections.sortOrder);

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

