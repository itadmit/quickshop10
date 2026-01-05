import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
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

    // Check if customer exists
    const [existingCustomer] = await db
      .select({ id: customers.id, hasPassword: customers.passwordHash })
      .from(customers)
      .where(and(
        eq(customers.storeId, storeId),
        eq(customers.email, email.toLowerCase().trim())
      ))
      .limit(1);

    return NextResponse.json({ 
      exists: !!existingCustomer,
      hasAccount: existingCustomer?.hasPassword ? true : false
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ exists: false });
  }
}


