import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

// ============================================
// API: Update Page Sections
// NEW ARCHITECTURE: Sections stored as JSON on pages/stores
// Much simpler - single atomic update, no sync issues
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
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Internal pages (pages/about, pages/privacy, etc.)
    if (page.startsWith('pages/')) {
      const pageSlug = page.replace('pages/', '');
      await db.update(pages)
        .set({ 
          sections: sections,
          updatedAt: new Date()
        })
        .where(and(
          eq(pages.storeId, store.id),
          eq(pages.slug, pageSlug)
        ));
      
      // Revalidate
      revalidateTag('sections', { expire: 0 });
      revalidatePath(`/shops/${slug}/pages/${pageSlug}`);
      
      return NextResponse.json({ success: true });
    }
    
    // System pages (home, coming_soon)
    if (page === 'coming_soon') {
      await db.update(stores)
        .set({ 
          comingSoonSections: sections,
          updatedAt: new Date()
        })
        .where(eq(stores.id, store.id));
      
      revalidateTag('sections', { expire: 0 });
      revalidatePath(`/shops/${slug}/coming-soon`);
    } else {
      // Default to home
      await db.update(stores)
        .set({ 
          homeSections: sections,
          updatedAt: new Date()
        })
        .where(eq(stores.id, store.id));
      
      revalidateTag('sections', { expire: 0 });
      revalidatePath(`/shops/${slug}`);
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
      .select({ 
        id: stores.id,
        homeSections: stores.homeSections,
        comingSoonSections: stores.comingSoonSections
      })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Internal pages
    if (page.startsWith('pages/')) {
      const pageSlug = page.replace('pages/', '');
      const [pageData] = await db
        .select({ sections: pages.sections })
        .from(pages)
        .where(and(
          eq(pages.storeId, store.id),
          eq(pages.slug, pageSlug)
        ))
        .limit(1);
      
      const sections = (pageData?.sections || []) as Section[];
      return NextResponse.json({ 
        sections: sections.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      });
    }

    // System pages
    const sections = page === 'coming_soon' 
      ? (store.comingSoonSections || []) as Section[]
      : (store.homeSections || []) as Section[];

    return NextResponse.json({ 
      sections: sections.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}
