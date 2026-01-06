/**
 * Gamification Entry API
 * POST - Register user entry for a campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, gamificationCampaigns, gamificationEntries } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; campaignId: string }> }
) {
  try {
    const { slug, campaignId } = await params;
    const body = await request.json();
    const { email, name, phone, birthday, marketingConsent, privacyConsent } = body;

    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'חנות לא נמצאה' }, { status: 404 });
    }

    // Get campaign
    const campaign = await db.query.gamificationCampaigns.findFirst({
      where: and(
        eq(gamificationCampaigns.id, campaignId),
        eq(gamificationCampaigns.storeId, store.id),
        eq(gamificationCampaigns.isActive, true)
      ),
    });

    if (!campaign) {
      return NextResponse.json({ error: 'קמפיין לא נמצא או לא פעיל' }, { status: 404 });
    }

    // Validate required fields
    if (campaign.collectEmail && !email) {
      return NextResponse.json({ error: 'אימייל נדרש' }, { status: 400 });
    }

    if (campaign.collectName && !name) {
      return NextResponse.json({ error: 'שם נדרש' }, { status: 400 });
    }

    if (campaign.collectPhone && !phone) {
      return NextResponse.json({ error: 'טלפון נדרש' }, { status: 400 });
    }

    if (campaign.requirePrivacyConsent && !privacyConsent) {
      return NextResponse.json({ error: 'נדרש אישור מדיניות פרטיות' }, { status: 400 });
    }

    // Check if email already reached max plays
    if (email) {
      const [entryCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(gamificationEntries)
        .where(
          and(
            eq(gamificationEntries.campaignId, campaignId),
            eq(gamificationEntries.email, email)
          )
        );

      if (entryCount.count >= campaign.maxPlaysPerEmail) {
        return NextResponse.json({ error: 'הגעת למספר המשחקים המקסימלי' }, { status: 400 });
      }
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      null;
    const userAgent = request.headers.get('user-agent');

    // Create entry
    const [entry] = await db.insert(gamificationEntries).values({
      campaignId,
      storeId: store.id,
      email: email || '',
      name: name || null,
      phone: phone || null,
      birthday: birthday || null, // Already a string date format YYYY-MM-DD
      marketingConsent: marketingConsent || false,
      privacyConsent: privacyConsent || false,
      ipAddress,
      userAgent,
    }).returning({ id: gamificationEntries.id });

    // Increment plays counter
    await db
      .update(gamificationCampaigns)
      .set({ plays: sql`${gamificationCampaigns.plays} + 1` })
      .where(eq(gamificationCampaigns.id, campaignId));

    return NextResponse.json({ 
      success: true, 
      entryId: entry.id 
    });
  } catch (error) {
    console.error('Gamification entry error:', error);
    return NextResponse.json({ error: 'אירעה שגיאה' }, { status: 500 });
  }
}

