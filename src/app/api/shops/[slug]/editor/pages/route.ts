'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pages, pageSections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

// ============================================
// Editor Pages API
// Manage internal pages from the theme editor
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

// POST - Create a new page
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

    // Create the page
    const [newPage] = await db.insert(pages).values({
      storeId: store.id,
      title,
      slug: pageSlug,
      isPublished: false,
      template: 'sections', // Using sections-based template
    }).returning();

    // Create default sections for the page (TextBlock for content)
    const pageIdentifier = `pages/${pageSlug}`;
    await db.insert(pageSections).values([
      {
        storeId: store.id,
        page: pageIdentifier,
        type: 'text_block',
        title: title,
        subtitle: '',
        content: {
          text: '<p>תוכן העמוד...</p>', // Note: "text" not "body" - matches TextBlockContentSettings
          buttonText: '', // Empty = hidden button
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
    ]);

    // Revalidate caches
    revalidatePath(`/shops/${slug}/editor`);
    revalidatePath(`/shops/${slug}/pages/${pageSlug}`);
    revalidateTag('sections', { expire: 0 }); // Important: invalidate sections cache immediately

    return NextResponse.json({ 
      success: true, 
      page: newPage,
      pageIdentifier,
    });
  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

