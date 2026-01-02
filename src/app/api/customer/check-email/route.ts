import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ exists: false });
    }

    // Get the demo store
    const [store] = await db.query.stores.findMany({ limit: 1 });
    
    if (!store) {
      return NextResponse.json({ exists: false });
    }

    // Check if customer exists
    const [existingCustomer] = await db
      .select({ id: customers.id, hasPassword: customers.passwordHash })
      .from(customers)
      .where(and(
        eq(customers.storeId, store.id),
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

