import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer, hashPassword, verifyPassword } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'הסיסמה חייבת להכיל לפחות 6 תווים' },
        { status: 400 }
      );
    }

    // If customer has a password, verify current password
    if (customer.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'נא להזין סיסמה נוכחית' },
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(currentPassword, customer.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'סיסמה נוכחית שגויה' },
          { status: 400 }
        );
      }
    }

    // Hash and save new password
    const passwordHash = await hashPassword(newPassword);

    await db
      .update(customers)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון הסיסמה' },
      { status: 500 }
    );
  }
}




