import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyOtpCode, 
  createCustomerSession, 
  setSessionCookie,
  incrementOtpAttempts 
} from '@/lib/customer-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, storeId } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'נא למלא אימייל וקוד אימות' },
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
      return NextResponse.json(
        { success: false, error: 'משתמש לא נמצא' },
        { status: 404 }
      );
    }

    // Verify OTP
    const result = await verifyOtpCode(customer.id, code);

    if (!result.success) {
      // Increment attempts on failure
      await incrementOtpAttempts(customer.id, code);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      undefined;
    
    const sessionToken = await createCustomerSession(
      customer.id,
      userAgent,
      ipAddress
    );

    // Set cookie
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        defaultAddress: customer.defaultAddress,
        hasPassword: !!customer.passwordHash,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה באימות קוד' },
      { status: 500 }
    );
  }
}


