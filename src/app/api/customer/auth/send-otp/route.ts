import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { createOtpCode, sendOtpEmail } from '@/lib/customer-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, storeId } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'נא למלא כתובת אימייל' },
        { status: 400 }
      );
    }

    // Get store - either from body or get the first one (demo)
    let targetStoreId = storeId;
    if (!targetStoreId) {
      const [store] = await db.query.stores.findMany({ limit: 1 });
      if (!store) {
        return NextResponse.json(
          { success: false, error: 'חנות לא נמצאה' },
          { status: 404 }
        );
      }
      targetStoreId = store.id;
    }

    // Find customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.storeId, targetStoreId),
          eq(customers.email, email.toLowerCase().trim())
        )
      )
      .limit(1);

    if (!customer) {
      // For security, don't reveal if email exists
      // But we still return success (no actual email sent)
      return NextResponse.json({
        success: true,
        message: 'אם כתובת המייל קיימת, נשלח קוד אימות',
      });
    }

    // Create OTP code
    const code = await createOtpCode(customer.id);

    // Send email
    await sendOtpEmail(customer.email, code);

    return NextResponse.json({
      success: true,
      message: 'קוד אימות נשלח למייל',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { devCode: code }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בשליחת קוד אימות' },
      { status: 500 }
    );
  }
}


