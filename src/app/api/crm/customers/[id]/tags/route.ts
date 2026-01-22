/**
 * Customer Tags API
 * 
 * Manages tags for a specific customer
 * GET - Get customer tags
 * PUT - Update customer tags
 * POST - Add tag to customer
 * DELETE - Remove tag from customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/crm/customers/[id]/tags
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;

    const [customer] = await db
      .select({ tags: customers.tags })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ tags: customer.tags || [] });
  } catch (error) {
    console.error('[Customer Tags API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get customer tags' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/customers/[id]/tags - Replace all customer tags
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;
    const { tags } = await request.json();

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'tags must be an array' }, { status: 400 });
    }

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await db
      .update(customers)
      .set({ tags, updatedAt: new Date() })
      .where(eq(customers.id, customerId));

    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('[Customer Tags API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update customer tags' },
      { status: 500 }
    );
  }
}

// POST /api/crm/customers/[id]/tags - Add a tag to customer
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;
    const { tagId } = await request.json();

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 });
    }

    const [customer] = await db
      .select({ tags: customers.tags })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const currentTags = (customer.tags || []) as string[];
    
    // Don't add duplicate
    if (currentTags.includes(tagId)) {
      return NextResponse.json({ success: true, tags: currentTags, message: 'Tag already exists' });
    }

    const updatedTags = [...currentTags, tagId];

    await db
      .update(customers)
      .set({ tags: updatedTags, updatedAt: new Date() })
      .where(eq(customers.id, customerId));

    return NextResponse.json({ success: true, tags: updatedTags });
  } catch (error) {
    console.error('[Customer Tags API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add tag to customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/customers/[id]/tags?tagId=xxx - Remove tag from customer
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: customerId } = await context.params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json({ error: 'tagId is required' }, { status: 400 });
    }

    const [customer] = await db
      .select({ tags: customers.tags })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const currentTags = (customer.tags || []) as string[];
    const updatedTags = currentTags.filter(t => t !== tagId);

    await db
      .update(customers)
      .set({ tags: updatedTags, updatedAt: new Date() })
      .where(eq(customers.id, customerId));

    return NextResponse.json({ success: true, tags: updatedTags });
  } catch (error) {
    console.error('[Customer Tags API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove tag from customer' },
      { status: 500 }
    );
  }
}

