import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { popups } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ popupId: string }> }
) {
  try {
    const { popupId } = await params;

    // Increment impressions count
    await db.update(popups)
      .set({ impressions: sql`${popups.impressions} + 1` })
      .where(eq(popups.id, popupId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to track popup impression:', error);
    return new NextResponse(null, { status: 500 });
  }
}










