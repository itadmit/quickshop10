'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pages, pageSections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ============================================
// Editor Single Page API
// Update, delete internal pages
// ============================================

// GET - Get single page
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [store] = await db
      .select({ id: stores.id, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.ownerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const page = await db.query.pages.findFirst({
      where: and(eq(pages.id, id), eq(pages.storeId, store.id)),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Get page error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH - Update page
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const [store] = await db
      .select({ id: stores.id, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.ownerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const page = await db.query.pages.findFirst({
      where: and(eq(pages.id, id), eq(pages.storeId, store.id)),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
      if (body.isPublished && !page.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;

    // If slug is changing, update pageSections too
    if (body.pageSlug !== undefined && body.pageSlug !== page.slug) {
      // Check for duplicate
      const existing = await db.query.pages.findFirst({
        where: and(eq(pages.storeId, store.id), eq(pages.slug, body.pageSlug)),
      });

      if (existing) {
        return NextResponse.json({ error: 'כתובת URL כבר קיימת' }, { status: 400 });
      }

      updateData.slug = body.pageSlug;

      // Update pageSections page identifier
      const oldIdentifier = `pages/${page.slug}`;
      const newIdentifier = `pages/${body.pageSlug}`;

      await db
        .update(pageSections)
        .set({ page: newIdentifier, updatedAt: new Date() })
        .where(and(eq(pageSections.storeId, store.id), eq(pageSections.page, oldIdentifier)));
    }

    await db.update(pages).set(updateData).where(eq(pages.id, id));

    revalidatePath(`/shops/${slug}/editor`);
    revalidatePath(`/shops/${slug}/pages/${page.slug}`);
    if (body.pageSlug && body.pageSlug !== page.slug) {
      revalidatePath(`/shops/${slug}/pages/${body.pageSlug}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update page error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete page and its sections
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [store] = await db
      .select({ id: stores.id, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.ownerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const page = await db.query.pages.findFirst({
      where: and(eq(pages.id, id), eq(pages.storeId, store.id)),
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Delete sections first
    const pageIdentifier = `pages/${page.slug}`;
    await db.delete(pageSections).where(
      and(eq(pageSections.storeId, store.id), eq(pageSections.page, pageIdentifier))
    );

    // Delete the page
    await db.delete(pages).where(eq(pages.id, id));

    revalidatePath(`/shops/${slug}/editor`);
    revalidatePath(`/shops/${slug}/pages/${page.slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

