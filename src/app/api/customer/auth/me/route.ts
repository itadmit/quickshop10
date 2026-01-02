import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';

export async function GET() {
  try {
    const customer = await getCurrentCustomer();

    if (!customer) {
      return NextResponse.json(
        { success: false, customer: null },
        { status: 401 }
      );
    }

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

