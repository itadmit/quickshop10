/**
 * Gamification Impression Tracking
 * POST - Track campaign impression
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gamificationCampaigns } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; campaignId: string }> }
) {
  try {
    const { campaignId } = await params;

    // Increment impressions counter
    await db
      .update(gamificationCampaigns)
      .set({ impressions: sql`${gamificationCampaigns.impressions} + 1` })
      .where(eq(gamificationCampaigns.id, campaignId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gamification impression error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

