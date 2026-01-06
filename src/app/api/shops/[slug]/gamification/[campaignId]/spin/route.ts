/**
 * Gamification Spin/Reveal API
 * POST - Process spin or scratch to reveal prize
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  stores, 
  gamificationCampaigns, 
  gamificationEntries,
  gamificationPrizes,
  gamificationWins,
  discounts 
} from '@/lib/db/schema';
import { eq, and, sql, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; campaignId: string }> }
) {
  try {
    const { slug, campaignId } = await params;
    const body = await request.json();
    const { entryId } = body;

    if (!entryId) {
      return NextResponse.json({ error: 'חסר מזהה רישום' }, { status: 400 });
    }

    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'חנות לא נמצאה' }, { status: 404 });
    }

    // Verify entry exists
    const entry = await db.query.gamificationEntries.findFirst({
      where: and(
        eq(gamificationEntries.id, entryId),
        eq(gamificationEntries.campaignId, campaignId)
      ),
    });

    if (!entry) {
      return NextResponse.json({ error: 'רישום לא נמצא' }, { status: 404 });
    }

    // Check if already has a win for this entry
    const existingWin = await db.query.gamificationWins.findFirst({
      where: eq(gamificationWins.entryId, entryId),
    });

    if (existingWin) {
      // Return existing win
      const prize = await db.query.gamificationPrizes.findFirst({
        where: eq(gamificationPrizes.id, existingWin.prizeId),
      });

      const allPrizes = await db
        .select()
        .from(gamificationPrizes)
        .where(eq(gamificationPrizes.campaignId, campaignId))
        .orderBy(asc(gamificationPrizes.sortOrder));

      const prizeIndex = allPrizes.findIndex(p => p.id === existingWin.prizeId);

      return NextResponse.json({
        success: true,
        win: {
          id: existingWin.id,
          prize: {
            id: prize?.id,
            name: prize?.name,
            type: prize?.type,
            value: prize?.value,
            color: prize?.color,
            icon: prize?.icon,
          },
          couponCode: existingWin.couponCode,
          prizeIndex,
        }
      });
    }

    // Get all active prizes
    const prizes = await db
      .select()
      .from(gamificationPrizes)
      .where(
        and(
          eq(gamificationPrizes.campaignId, campaignId),
          eq(gamificationPrizes.isActive, true)
        )
      )
      .orderBy(asc(gamificationPrizes.sortOrder));

    if (prizes.length === 0) {
      return NextResponse.json({ error: 'אין פרסים זמינים' }, { status: 400 });
    }

    // Calculate winning prize based on probability
    const random = Math.random() * 100;
    let cumulative = 0;
    let winningPrize = prizes[0];
    let winningPrizeIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
      const prize = prizes[i];
      cumulative += parseFloat(prize.probability);
      
      // Check if prize is available (not depleted)
      if (random <= cumulative) {
        if (prize.totalAvailable === null || prize.totalWon < prize.totalAvailable) {
          winningPrize = prize;
          winningPrizeIndex = i;
          break;
        }
      }
    }

    // If all prizes with good probability are depleted, find any available one
    if (winningPrize.totalAvailable !== null && winningPrize.totalWon >= winningPrize.totalAvailable) {
      for (let i = 0; i < prizes.length; i++) {
        const prize = prizes[i];
        if (prize.totalAvailable === null || prize.totalWon < (prize.totalAvailable ?? 0)) {
          winningPrize = prize;
          winningPrizeIndex = i;
          break;
        }
      }
    }

    // Generate coupon code if needed
    let couponCode: string | null = null;
    let discountId: string | null = null;

    if (['coupon_percentage', 'coupon_fixed', 'free_shipping', 'gift_product'].includes(winningPrize.type)) {
      // Generate unique coupon code
      const prefix = winningPrize.couponPrefix || 'WIN';
      couponCode = `${prefix}-${nanoid(8).toUpperCase()}`;

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (winningPrize.couponValidDays || 30));

      // Determine discount type
      let discountType: 'percentage' | 'fixed_amount' | 'free_shipping' | 'gift_product';
      switch (winningPrize.type) {
        case 'coupon_percentage':
          discountType = 'percentage';
          break;
        case 'coupon_fixed':
          discountType = 'fixed_amount';
          break;
        case 'free_shipping':
          discountType = 'free_shipping';
          break;
        case 'gift_product':
          discountType = 'gift_product';
          break;
        default:
          discountType = 'percentage';
      }

      // Create discount in discounts table - tied to the email
      const [discount] = await db.insert(discounts).values({
        storeId: store.id,
        code: couponCode,
        title: `🎁 פרס: ${winningPrize.name}`,
        type: discountType,
        value: winningPrize.value || '0',
        minimumAmount: winningPrize.couponMinPurchase || null,
        usageLimit: 1, // Single use
        usageCount: 0,
        oncePerCustomer: true,
        startsAt: new Date(),
        endsAt: expiryDate,
        isActive: true,
        appliesTo: 'all',
        giftProductIds: winningPrize.giftProductId ? [winningPrize.giftProductId] : [],
      }).returning({ id: discounts.id });

      discountId = discount.id;
    }

    // Create win record
    const [win] = await db.insert(gamificationWins).values({
      entryId,
      prizeId: winningPrize.id,
      campaignId,
      couponCode,
      discountId,
    }).returning();

    // Update prize won count
    await db
      .update(gamificationPrizes)
      .set({ totalWon: sql`${gamificationPrizes.totalWon} + 1` })
      .where(eq(gamificationPrizes.id, winningPrize.id));

    return NextResponse.json({
      success: true,
      win: {
        id: win.id,
        prize: {
          id: winningPrize.id,
          name: winningPrize.name,
          type: winningPrize.type,
          value: winningPrize.value,
          color: winningPrize.color,
          icon: winningPrize.icon,
        },
        couponCode,
        prizeIndex: winningPrizeIndex,
      }
    });
  } catch (error) {
    console.error('Gamification spin error:', error);
    return NextResponse.json({ error: 'אירעה שגיאה' }, { status: 500 });
  }
}

