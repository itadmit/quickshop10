import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, contacts, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, createCustomerSession, setSessionCookie } from '@/lib/customer-auth';
import { sendClubMemberWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, email, firstName, lastName, phone, password, acceptMarketing } = body;

    if (!storeId || !email) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרטים' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if customer already exists for this store
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.storeId, storeId),
          eq(customers.email, normalizedEmail)
        )
      )
      .limit(1);

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'כבר קיים חשבון עם כתובת מייל זו' },
        { status: 400 }
      );
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    // Create customer
    const [customer] = await db
      .insert(customers)
      .values({
        storeId,
        email: normalizedEmail,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        phone: phone?.trim() || null,
        passwordHash,
        acceptsMarketing: acceptMarketing || false,
        emailVerifiedAt: null, // Will be verified later via OTP
      })
      .returning();

    // Also create club_member contact entry
    await db.insert(contacts).values({
      storeId,
      email: normalizedEmail,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      phone: phone?.trim() || null,
      type: 'club_member',
      status: 'active',
      source: 'registration',
      customerId: customer.id,
    });

    // Get store info for welcome email
    const [store] = await db
      .select({ name: stores.name, slug: stores.slug })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    // Send club member welcome email (don't await - fire and forget)
    if (store) {
      sendClubMemberWelcomeEmail({
        email: normalizedEmail,
        customerName: firstName?.trim() || undefined,
        storeName: store.name,
        storeSlug: store.slug,
      }).catch(err => console.error('Failed to send club member welcome email:', err));
    }

    // Create session and set cookie
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : undefined;

    const sessionToken = await createCustomerSession(customer.id, userAgent, ipAddress);
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        hasPassword: !!customer.passwordHash,
        emailVerified: !!customer.emailVerifiedAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}



