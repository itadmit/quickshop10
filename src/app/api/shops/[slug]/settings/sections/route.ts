import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageSections, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

    // Update each section
    for (const section of sections) {
      // Check if it's a new section (temp id)
      if (section.id.startsWith('temp-')) {
        // Create new section
        await db.insert(pageSections).values({
          storeId: store.id,
          page: page, // Use the page parameter
          type: section.type as 'hero' | 'banner' | 'split_banner' | 'video_banner' | 'categories' | 'products' | 'newsletter' | 'custom',
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          settings: section.settings,
          sortOrder: section.sortOrder,
          isActive: section.isActive,
        });
      } else {
        // Update existing section
        await db
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
          );
      }
    }

    // Delete sections that are no longer in the list
    const currentSectionIds = sections
      .filter(s => !s.id.startsWith('temp-'))
      .map(s => s.id);

    const existingSections = await db
      .select({ id: pageSections.id })
      .from(pageSections)
      .where(
        and(
          eq(pageSections.storeId, store.id),
          eq(pageSections.page, page) // Use the page parameter
        )
      );

    for (const existing of existingSections) {
      if (!currentSectionIds.includes(existing.id)) {
        await db
          .delete(pageSections)
          .where(eq(pageSections.id, existing.id));
      }
    }

    // Revalidate cache so the storefront shows updated content
    revalidatePath(`/shops/${slug}`);
    if (page === 'coming_soon') {
      revalidatePath(`/shops/${slug}/coming-soon`);
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

