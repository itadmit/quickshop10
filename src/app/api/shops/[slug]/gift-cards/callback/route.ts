/**
 * Gift Card Payment Callback
 * POST /api/shops/[slug]/gift-cards/callback
 * 
 * Called by payment provider when gift card payment is completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, giftCards, pendingPayments, giftCardTransactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendGiftCardEmail } from '@/lib/email';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// Generate unique gift card code
function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // Get common fields from payment provider callback
    const transactionId = body.transaction_uid || body.transactionId || body.order_id;
    const status = body.status || body.transaction?.status;
    const isApproved = status === 'approved' || status === 'success' || body.approved === true;

    if (!transactionId) {
      console.error('[Gift Card Callback] Missing transaction ID');
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      console.error('[Gift Card Callback] Store not found:', slug);
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Find pending payment
    const [pendingPayment] = await db
      .select()
      .from(pendingPayments)
      .where(
        and(
          eq(pendingPayments.storeId, store.id),
          eq(pendingPayments.transactionId, transactionId)
        )
      )
      .limit(1);

    if (!pendingPayment) {
      console.error('[Gift Card Callback] Pending payment not found:', transactionId);
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Gift card metadata is stored in orderData
    const metadata = (pendingPayment.orderData as { metadata?: Record<string, unknown> })?.metadata as {
      type: string;
      recipientName: string;
      recipientEmail: string;
      senderName?: string;
      message?: string;
      cardImage?: string;
      expiresAt?: string;
      storeName: string;
    } | undefined;

    if (!metadata || metadata.type !== 'gift_card') {
      console.error('[Gift Card Callback] Not a gift card payment:', transactionId);
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Update pending payment status
    await db
      .update(pendingPayments)
      .set({
        status: isApproved ? 'completed' : 'failed',
      })
      .where(eq(pendingPayments.id, pendingPayment.id));

    if (!isApproved) {
      console.log('[Gift Card Callback] Payment not approved:', transactionId);
      return NextResponse.json({ success: true, approved: false });
    }

    // Generate unique gift card code
    let code = generateGiftCardCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db
        .select({ id: giftCards.id })
        .from(giftCards)
        .where(and(eq(giftCards.storeId, store.id), eq(giftCards.code, code)))
        .limit(1);

      if (existing.length === 0) break;
      code = generateGiftCardCode();
      attempts++;
    }

    const amount = Number(pendingPayment.amount);
    const expiresAt = metadata.expiresAt ? new Date(metadata.expiresAt) : null;

    // Create gift card
    const [newGiftCard] = await db
      .insert(giftCards)
      .values({
        storeId: store.id,
        code,
        initialBalance: amount.toString(),
        currentBalance: amount.toString(),
        status: 'active',
        recipientEmail: metadata.recipientEmail,
        recipientName: metadata.recipientName,
        senderName: metadata.senderName || null,
        message: metadata.message || null,
        expiresAt,
      })
      .returning();

    // Record initial transaction
    await db.insert(giftCardTransactions).values({
      giftCardId: newGiftCard.id,
      amount: amount.toString(),
      balanceAfter: amount.toString(),
      note: 'רכישה באתר',
    });

    // Send email to recipient
    await sendGiftCardEmail({
      recipientEmail: metadata.recipientEmail,
      recipientName: metadata.recipientName,
      senderName: metadata.senderName,
      message: metadata.message,
      giftCardCode: code,
      amount,
      storeName: metadata.storeName,
      storeSlug: slug,
      cardImage: metadata.cardImage,
      expiresAt,
    });

    console.log('[Gift Card Callback] Gift card created and email sent:', code);

    return NextResponse.json({ 
      success: true,
      giftCardId: newGiftCard.id,
    });

  } catch (error) {
    console.error('[Gift Card Callback] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}

