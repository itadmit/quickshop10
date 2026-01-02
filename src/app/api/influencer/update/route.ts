import { NextResponse } from 'next/server';
import { getCurrentInfluencer } from '@/lib/influencer-auth';
import { db } from '@/lib/db';
import { influencers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
  try {
    const influencer = await getCurrentInfluencer();
    if (!influencer) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone } = body;

    // Validate name
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'שם הוא שדה חובה' },
        { status: 400 }
      );
    }

    // Update influencer
    await db
      .update(influencers)
      .set({
        name: name.trim(),
        phone: phone?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(influencers.id, influencer.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating influencer:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון הפרטים' },
      { status: 500 }
    );
  }
}

