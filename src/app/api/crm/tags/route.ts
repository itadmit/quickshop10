/**
 * CRM Tags API
 * 
 * Manages customer tags for a store
 * GET - Get all tags for a store
 * POST - Add a new tag
 * PUT - Update store tags
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface CrmTag {
  id: string;
  label: string;
  color: string;
  isDefault?: boolean;
}

// GET /api/crm/tags?storeId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const [store] = await db
      .select({ crmTags: stores.crmTags })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ tags: store.crmTags || [] });
  } catch (error) {
    console.error('[CRM Tags API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get tags' },
      { status: 500 }
    );
  }
}

// POST /api/crm/tags - Add a new tag
export async function POST(request: NextRequest) {
  try {
    const { storeId, label, color } = await request.json();

    if (!storeId || !label || !color) {
      return NextResponse.json({ error: 'storeId, label, and color are required' }, { status: 400 });
    }

    const [store] = await db
      .select({ crmTags: stores.crmTags })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const currentTags = (store.crmTags || []) as CrmTag[];
    const newTag: CrmTag = {
      id: nanoid(10),
      label: label.trim(),
      color,
      isDefault: false,
    };

    const updatedTags = [...currentTags, newTag];

    await db
      .update(stores)
      .set({ crmTags: updatedTags, updatedAt: new Date() })
      .where(eq(stores.id, storeId));

    return NextResponse.json({ success: true, tag: newTag, tags: updatedTags });
  } catch (error) {
    console.error('[CRM Tags API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add tag' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/tags - Update all tags or a specific tag
export async function PUT(request: NextRequest) {
  try {
    const { storeId, tags, tagId, label, color } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    const [store] = await db
      .select({ crmTags: stores.crmTags })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    let updatedTags: CrmTag[];

    // If tags array is provided, replace all
    if (tags) {
      updatedTags = tags;
    } else if (tagId) {
      // Update a specific tag
      const currentTags = (store.crmTags || []) as CrmTag[];
      updatedTags = currentTags.map(tag => 
        tag.id === tagId 
          ? { ...tag, label: label || tag.label, color: color || tag.color }
          : tag
      );
    } else {
      return NextResponse.json({ error: 'Either tags array or tagId is required' }, { status: 400 });
    }

    await db
      .update(stores)
      .set({ crmTags: updatedTags, updatedAt: new Date() })
      .where(eq(stores.id, storeId));

    return NextResponse.json({ success: true, tags: updatedTags });
  } catch (error) {
    console.error('[CRM Tags API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tags' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/tags - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const tagId = searchParams.get('tagId');

    if (!storeId || !tagId) {
      return NextResponse.json({ error: 'storeId and tagId are required' }, { status: 400 });
    }

    const [store] = await db
      .select({ crmTags: stores.crmTags })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const currentTags = (store.crmTags || []) as CrmTag[];
    const updatedTags = currentTags.filter(tag => tag.id !== tagId);

    await db
      .update(stores)
      .set({ crmTags: updatedTags, updatedAt: new Date() })
      .where(eq(stores.id, storeId));

    // Also remove this tag from all customers who have it
    const customersWithTag = await db
      .select({ id: customers.id, tags: customers.tags })
      .from(customers)
      .where(eq(customers.storeId, storeId));

    for (const customer of customersWithTag) {
      const customerTags = (customer.tags || []) as string[];
      if (customerTags.includes(tagId)) {
        const updatedCustomerTags = customerTags.filter(t => t !== tagId);
        await db
          .update(customers)
          .set({ tags: updatedCustomerTags, updatedAt: new Date() })
          .where(eq(customers.id, customer.id));
      }
    }

    return NextResponse.json({ success: true, tags: updatedTags });
  } catch (error) {
    console.error('[CRM Tags API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete tag' },
      { status: 500 }
    );
  }
}

