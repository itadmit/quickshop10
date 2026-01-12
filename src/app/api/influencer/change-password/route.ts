import { NextResponse } from 'next/server';
import { getCurrentInfluencer, verifyPassword, hashPassword } from '@/lib/influencer-auth';
import { db } from '@/lib/db';
import { influencers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const influencer = await getCurrentInfluencer();
    if (!influencer) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'יש למלא את כל השדות' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      );
    }

    // Get influencer with password hash
    const [influencerWithPassword] = await db
      .select({ passwordHash: influencers.passwordHash })
      .from(influencers)
      .where(eq(influencers.id, influencer.id))
      .limit(1);

    if (!influencerWithPassword?.passwordHash) {
      return NextResponse.json(
        { error: 'אין אפשרות לשנות סיסמה לחשבון זה' },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, influencerWithPassword.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'הסיסמה הנוכחית שגויה' },
        { status: 400 }
      );
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    
    await db
      .update(influencers)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(influencers.id, influencer.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון הסיסמה' },
      { status: 500 }
    );
  }
}



