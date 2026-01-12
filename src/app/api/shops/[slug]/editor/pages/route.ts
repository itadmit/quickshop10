'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { randomUUID } from 'crypto';

// ============================================
// Editor Pages API
// NEW ARCHITECTURE: Sections stored as JSON on pages table
// - Atomic operations (no sync issues)
// - Delete page = delete sections automatically
// ============================================

// GET - List all pages for the editor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get store
    const [store] = await db
      .select({ id: stores.id, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check ownership
    if (store.ownerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all pages
    const storePages = await db.query.pages.findMany({
      where: eq(pages.storeId, store.id),
      columns: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (pages, { asc }) => [asc(pages.title)],
    });

    return NextResponse.json({ pages: storePages });
  } catch (error) {
    console.error('Get pages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create a new page with default sections
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, pageSlug } = body;

    if (!title || !pageSlug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    // Get store
    const [store] = await db
      .select({ id: stores.id, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check ownership
    if (store.ownerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if slug already exists
    const existing = await db.query.pages.findFirst({
      where: and(eq(pages.storeId, store.id), eq(pages.slug, pageSlug)),
    });

    if (existing) {
      return NextResponse.json({ error: 'כתובת URL כבר קיימת' }, { status: 400 });
    }

    // Default section for new pages
    const defaultSections = [
      {
        id: randomUUID(),
        type: 'text_block',
        title: title,
        subtitle: '',
        content: {
          text: '<p>תוכן העמוד...</p>',
          buttonText: '',
          buttonLink: '',
        },
        settings: {
          maxWidth: '800px',
          textAlign: 'center',
          padding: 'large',
        },
        sortOrder: 0,
        isActive: true,
      },
    ];

    // Create the page WITH sections - atomic operation!
    const [newPage] = await db.insert(pages).values({
      storeId: store.id,
      title,
      slug: pageSlug,
      sections: defaultSections, // Sections stored directly on page
      isPublished: false,
      template: 'sections',
    }).returning();

    // Revalidate caches
    revalidatePath(`/shops/${slug}/editor`);
    revalidatePath(`/shops/${slug}/pages/${pageSlug}`);
    revalidateTag('sections', { expire: 0 });

    return NextResponse.json({ 
      success: true, 
      page: newPage,
      pageIdentifier: `pages/${pageSlug}`,
    });
  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
