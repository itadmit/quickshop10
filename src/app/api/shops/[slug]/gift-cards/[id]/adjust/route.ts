import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { giftCards, giftCardTransactions, stores, storeMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, id } = await params;
    const body = await request.json();
    const { amount, note } = body;

    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check user has access to this store
    const isOwner = store.ownerId === session.user.id;
    const isMember = await db.query.storeMembers.findFirst({
      where: and(
        eq(storeMembers.storeId, store.id),
        eq(storeMembers.userId, session.user.id)
      ),
    });

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get gift card
    const giftCard = await db.query.giftCards.findFirst({
      where: and(
        eq(giftCards.id, id),
        eq(giftCards.storeId, store.id)
      ),
    });

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    const currentBalance = Number(giftCard.currentBalance);
    const newBalance = currentBalance + amount;

    // Validate
    if (newBalance < 0) {
      return NextResponse.json({ error: 'Cannot reduce balance below zero' }, { status: 400 });
    }

    // Determine new status
    let newStatus = giftCard.status;
    if (newBalance <= 0) {
      newStatus = 'used';
    } else if (giftCard.status === 'used') {
      newStatus = 'active';
    }

    // Update gift card
    await db
      .update(giftCards)
      .set({
        currentBalance: newBalance.toFixed(2),
        status: newStatus,
        lastUsedAt: amount < 0 ? new Date() : giftCard.lastUsedAt,
      })
      .where(eq(giftCards.id, id));

    // Create transaction record
    await db.insert(giftCardTransactions).values({
      giftCardId: id,
      amount: amount.toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      note: note || (amount > 0 ? 'טעינה ידנית' : 'הפחתה ידנית'),
    });

    return NextResponse.json({
      success: true,
      newBalance,
      status: newStatus,
    });
  } catch (error) {
    console.error('Gift card adjust error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

