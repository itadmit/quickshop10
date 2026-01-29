import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'לא מחובר' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, acceptsMarketing } = body;

    await db
      .update(customers)
      .set({
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        phone: phone?.trim() || null,
        acceptsMarketing: acceptsMarketing || false,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון הפרטים' },
      { status: 500 }
    );
  }
}










