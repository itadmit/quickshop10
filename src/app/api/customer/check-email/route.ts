import { db } from '@/lib/db';
import { customers, contacts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, storeId } = body;

    if (!email) {
      return NextResponse.json({ exists: false });
    }

    // storeId is required for multi-tenant support
    if (!storeId) {
      return NextResponse.json({ exists: false, error: 'מזהה חנות חסר' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // IMPORTANT: Club members (contacts) are the source of truth for who can log in
    // Check for active club_member contact FIRST
    const [clubMemberContact] = await db
      .select({ 
        id: contacts.id, 
        customerId: contacts.customerId 
      })
      .from(contacts)
      .where(and(
        eq(contacts.storeId, storeId),
        eq(contacts.email, normalizedEmail),
        eq(contacts.type, 'club_member'),
        eq(contacts.status, 'active')
      ))
      .limit(1);

    if (clubMemberContact) {
      // Club member exists - check if they have a linked customer with password
      if (clubMemberContact.customerId) {
        const [linkedCustomer] = await db
          .select({ hasPassword: customers.passwordHash })
          .from(customers)
          .where(eq(customers.id, clubMemberContact.customerId))
          .limit(1);
        
        return NextResponse.json({
          exists: true,
          hasAccount: linkedCustomer?.hasPassword ? true : false,
          isClubMember: true
        });
      }
      
      // Club member without linked customer - can log in via OTP
      return NextResponse.json({
        exists: true,
        hasAccount: false,
        isClubMember: true
      });
    }

    // Not a club member - they need to register first
    // Even if they have a customer record (from guest checkout), they can't log in
    // They need to sign up for the club first
    return NextResponse.json({
      exists: false,
      hasAccount: false
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ exists: false });
  }
}
