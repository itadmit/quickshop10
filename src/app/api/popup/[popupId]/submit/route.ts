import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { popups, popupSubmissions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ popupId: string }> }
) {
  try {
    const { popupId } = await params;
    const body = await request.json();
    const formData = body.formData || {};

    // Get popup to find store ID
    const popup = await db.query.popups.findFirst({
      where: eq(popups.id, popupId),
    });

    if (!popup) {
      return NextResponse.json({ error: 'Popup not found' }, { status: 404 });
    }

    // Get request headers for metadata
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || 'unknown';
    const referer = headersList.get('referer') || '';

    // Save submission
    await db.insert(popupSubmissions).values({
      popupId,
      storeId: popup.storeId,
      formData,
      ipAddress,
      userAgent,
      pageUrl: referer,
    });

    // Increment conversions count
    await db.update(popups)
      .set({ conversions: sql`${popups.conversions} + 1` })
      .where(eq(popups.id, popupId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save popup submission:', error);
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
  }
}






