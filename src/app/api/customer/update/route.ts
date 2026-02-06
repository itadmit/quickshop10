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
    const { firstName, lastName, phone, acceptsMarketing, defaultAddress } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Update basic fields
    if (firstName !== undefined) {
      updateData.firstName = firstName?.trim() || null;
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName?.trim() || null;
    }
    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }
    if (acceptsMarketing !== undefined) {
      updateData.acceptsMarketing = acceptsMarketing || false;
    }

    // Update default address (jsonb field)
    if (defaultAddress !== undefined) {
      // Validate address structure
      if (defaultAddress && typeof defaultAddress === 'object') {
        const address = defaultAddress as Record<string, unknown>;
        updateData.defaultAddress = {
          address: address.address || null,
          city: address.city || null,
          zipCode: address.zipCode || null,
          country: address.country || 'IL', // Default to Israel
          state: address.state || null,
        };
      } else {
        updateData.defaultAddress = null;
      }
    }

    await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, customer.id));

    return NextResponse.json({ 
      success: true,
      message: 'הפרטים עודכנו בהצלחה'
    });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון הפרטים' },
      { status: 500 }
    );
  }
}











