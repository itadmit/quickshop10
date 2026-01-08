import { db } from '@/lib/db';
import { customers, contacts, stores } from '@/lib/db/schema';
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

    // storeId is required for multi-tenant support
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'מזהה חנות חסר' },
        { status: 400 }
      );
    }
    
    const normalizedEmail = email.toLowerCase().trim();

    // Get store details for email branding
    const storeResult = await db
      .select({ name: stores.name })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    
    const storeName = storeResult[0]?.name || undefined;

    // IMPORTANT: Only club members can log in
    // Check for active club_member contact FIRST
    const [clubMemberContact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.storeId, storeId),
          eq(contacts.email, normalizedEmail),
          eq(contacts.type, 'club_member'),
          eq(contacts.status, 'active')
        )
      )
      .limit(1);

    if (!clubMemberContact) {
      // Not a club member - for security, don't reveal this
      // Return success but don't send email
      return NextResponse.json({
        success: true,
        message: 'אם כתובת המייל קיימת, נשלח קוד אימות',
      });
    }

    // Club member exists - find or create linked customer
    let customer;
    
    if (clubMemberContact.customerId) {
      // Already linked to a customer
      const [existingCustomer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, clubMemberContact.customerId))
        .limit(1);
      customer = existingCustomer;
    }
    
    if (!customer) {
      // Create customer from club_member contact
      const [newCustomer] = await db.insert(customers).values({
        storeId,
        email: normalizedEmail,
        firstName: clubMemberContact.firstName || '',
        lastName: clubMemberContact.lastName || '',
        phone: clubMemberContact.phone || '',
        acceptsMarketing: true, // Club members opted in
        totalOrders: 0,
        totalSpent: '0',
      }).returning();
      
      customer = newCustomer;

      // Link the contact to the new customer
      await db.update(contacts)
        .set({ customerId: newCustomer.id, updatedAt: new Date() })
        .where(eq(contacts.id, clubMemberContact.id));
    }

    // Create OTP code
    const code = await createOtpCode(customer.id);

    // Send email with store branding
    await sendOtpEmail(customer.email, code, storeName);

    return NextResponse.json({
      success: true,
      message: 'קוד אימות נשלח למייל',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בשליחת קוד אימות' },
      { status: 500 }
    );
  }
}
