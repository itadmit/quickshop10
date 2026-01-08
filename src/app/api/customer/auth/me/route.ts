import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const customer = await getCurrentCustomer();

    if (!customer) {
      return NextResponse.json(
        { success: false, customer: null },
        { status: 401 }
      );
    }

    // Check if customer is a club member (based on contacts table)
    const [clubMemberContact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(
          eq(contacts.storeId, customer.storeId),
          eq(contacts.email, customer.email),
          eq(contacts.type, 'club_member'),
          eq(contacts.status, 'active')
        )
      )
      .limit(1);

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
        emailVerified: !!customer.emailVerifiedAt,
        creditBalance: Number(customer.creditBalance) || 0,
        isClubMember: !!clubMemberContact, // true if has active club_member contact
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת פרטי המשתמש' },
      { status: 500 }
    );
  }
}

