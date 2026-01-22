/**
 * Individual Automation API
 * 
 * GET - Get automation details with runs
 * PUT - Update automation
 * DELETE - Delete automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { automations, automationRuns, stores } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ slug: string; id: string }>;
}

// GET - Get automation with recent runs
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get store
    const store = await db
      .select({ id: stores.id, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (store.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verify access
    if (store[0].ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get automation
    const automation = await db
      .select()
      .from(automations)
      .where(and(
        eq(automations.id, id),
        eq(automations.storeId, store[0].id)
      ))
      .limit(1);

    if (automation.length === 0) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Get recent runs
    const recentRuns = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.automationId, id))
      .orderBy(desc(automationRuns.createdAt))
      .limit(20);

    return NextResponse.json({ 
      automation: automation[0],
      recentRuns,
    });
  } catch (error) {
    console.error('[Automations API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PUT - Update automation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get store
    const store = await db
      .select({ id: stores.id, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (store.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verify access
    if (store[0].ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get existing automation
    const existing = await db
      .select()
      .from(automations)
      .where(and(
        eq(automations.id, id),
        eq(automations.storeId, store[0].id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.triggerConditions !== undefined) updateData.triggerConditions = body.triggerConditions;
    if (body.actionConfig !== undefined) updateData.actionConfig = body.actionConfig;
    if (body.delayMinutes !== undefined) updateData.delayMinutes = body.delayMinutes;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Don't allow changing trigger/action type for built-in automations
    if (!existing[0].isBuiltIn) {
      if (body.triggerType !== undefined) updateData.triggerType = body.triggerType;
      if (body.actionType !== undefined) updateData.actionType = body.actionType;
    }

    // Update
    const [updated] = await db
      .update(automations)
      .set(updateData)
      .where(eq(automations.id, id))
      .returning();

    return NextResponse.json({ automation: updated });
  } catch (error) {
    console.error('[Automations API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE - Delete automation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get store
    const store = await db
      .select({ id: stores.id, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (store.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verify access
    if (store[0].ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get automation
    const automation = await db
      .select({ isBuiltIn: automations.isBuiltIn })
      .from(automations)
      .where(and(
        eq(automations.id, id),
        eq(automations.storeId, store[0].id)
      ))
      .limit(1);

    if (automation.length === 0) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Don't allow deleting built-in automations
    if (automation[0].isBuiltIn) {
      return NextResponse.json({ 
        error: 'Cannot delete built-in automations. Disable it instead.' 
      }, { status: 400 });
    }

    // Delete automation (runs will cascade delete)
    await db.delete(automations).where(eq(automations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Automations API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

