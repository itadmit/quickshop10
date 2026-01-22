/**
 * Automations API
 * 
 * GET - List all automations for a store
 * POST - Create new automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { automations, stores } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET - List all automations
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
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

    // Get automations
    const storeAutomations = await db
      .select()
      .from(automations)
      .where(eq(automations.storeId, store[0].id))
      .orderBy(desc(automations.createdAt));

    return NextResponse.json({ automations: storeAutomations });
  } catch (error) {
    console.error('[Automations API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST - Create new automation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      triggerType, 
      triggerConditions = {},
      actionType, 
      actionConfig = {},
      delayMinutes = 0,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !triggerType || !actionType) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, triggerType, actionType' 
      }, { status: 400 });
    }

    // Get store
    const store = await db
      .select({ id: stores.id, ownerId: stores.ownerId, settings: stores.settings })
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

    // Check if CRM action requires CRM plugin
    const crmActions = ['crm.create_task', 'crm.add_note'];
    if (crmActions.includes(actionType)) {
      const settings = store[0].settings as Record<string, unknown> || {};
      const plugins = (settings.plugins as string[]) || [];
      if (!plugins.includes('crm')) {
        return NextResponse.json({ 
          error: 'CRM plugin required for this action type' 
        }, { status: 400 });
      }
    }

    // Create automation
    const [automation] = await db.insert(automations).values({
      storeId: store[0].id,
      name,
      description,
      triggerType,
      triggerConditions,
      actionType,
      actionConfig,
      delayMinutes,
      isActive,
      isBuiltIn: false,
    }).returning();

    return NextResponse.json({ automation }, { status: 201 });
  } catch (error) {
    console.error('[Automations API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

