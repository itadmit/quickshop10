import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageTemplates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';

// GET /api/shops/[slug]/page-templates/[id] - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    
    const store = await getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const template = await db.query.pageTemplates.findFirst({
      where: and(
        eq(pageTemplates.id, id),
        eq(pageTemplates.storeId, store.id)
      ),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching page template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/shops/[slug]/page-templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json();
    const { name, description, sections } = body;

    const store = await getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sections !== undefined) updateData.sections = sections;

    await db
      .update(pageTemplates)
      .set(updateData)
      .where(and(
        eq(pageTemplates.id, id),
        eq(pageTemplates.storeId, store.id)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating page template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/shops/[slug]/page-templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;

    const store = await getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    await db
      .delete(pageTemplates)
      .where(and(
        eq(pageTemplates.id, id),
        eq(pageTemplates.storeId, store.id)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}




