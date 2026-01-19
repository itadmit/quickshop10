/**
 * Billing Details API
 * POST /api/shops/[slug]/billing-details
 * 
 * עדכון פרטי חיוב לחשבוניות
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeSubscriptions, storeMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { billingName, billingEmail, vatNumber } = body as {
      billingName?: string;
      billingEmail?: string;
      vatNumber?: string;
    };

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if user is owner or member
    const isOwner = store.ownerId === session.user.id;
    const isMember = !isOwner && await db
      .select({ id: storeMembers.id })
      .from(storeMembers)
      .where(and(
        eq(storeMembers.storeId, store.id),
        eq(storeMembers.userId, session.user.id)
      ))
      .then(rows => rows.length > 0);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update billing details in subscription
    const existingSubscription = await db.query.storeSubscriptions.findFirst({
      where: eq(storeSubscriptions.storeId, store.id),
    });

    if (!existingSubscription) {
      // Create subscription if doesn't exist
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      await db.insert(storeSubscriptions).values({
        storeId: store.id,
        plan: 'trial',
        status: 'trial',
        trialEndsAt,
        billingName: billingName || store.name,
        billingEmail: billingEmail || null,
        vatNumber: vatNumber || null,
      });
    } else {
      // Update existing subscription
      await db
        .update(storeSubscriptions)
        .set({
          billingName: billingName || store.name,
          billingEmail: billingEmail || null,
          vatNumber: vatNumber || null,
          updatedAt: new Date(),
        })
        .where(eq(storeSubscriptions.storeId, store.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating billing details:', error);
    return NextResponse.json(
      { error: 'Failed to update billing details' },
      { status: 500 }
    );
  }
}

