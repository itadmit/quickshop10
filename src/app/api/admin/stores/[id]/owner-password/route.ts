import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// POST - Update store owner's password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // Only allow platform admin
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const { newPassword } = body;

  if (!newPassword || typeof newPassword !== 'string') {
    return NextResponse.json({ error: 'נדרשת סיסמה חדשה' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 });
  }

  try {
    // Get store with owner
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, id),
    });

    if (!store) {
      return NextResponse.json({ error: 'החנות לא נמצאה' }, { status: 404 });
    }

    if (!store.ownerId) {
      return NextResponse.json({ error: 'לחנות זו אין בעלים' }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    await db
      .update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date() 
      })
      .where(eq(users.id, store.ownerId));

    console.log(`[Admin] Password updated for store owner of "${store.name}" (user: ${store.ownerId})`);

    return NextResponse.json({ 
      success: true,
      message: 'הסיסמה עודכנה בהצלחה'
    });
  } catch (error) {
    console.error('[Admin] Error updating owner password:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון הסיסמה. נסה שוב מאוחר יותר.' },
      { status: 500 }
    );
  }
}

