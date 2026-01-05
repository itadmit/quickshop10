import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyPassword, 
  createCustomerSession, 
  setSessionCookie 
} from '@/lib/customer-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, storeId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'נא למלא אימייל וסיסמה' },
        { status: 400 }
      );
    }

    // Get store - storeId is required for multi-tenant support
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'מזהה חנות חסר' },
        { status: 400 }
      );
    }
    const targetStoreId = storeId;

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
        { success: false, error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Check if customer has a password
    if (!customer.passwordHash) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'לחשבון זה לא הוגדרה סיסמה',
          needsOtp: true 
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, customer.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'אימייל או סיסמה שגויים' },
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
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}


