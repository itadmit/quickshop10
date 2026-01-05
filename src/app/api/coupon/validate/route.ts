import { validateCoupon } from '@/app/actions/coupon';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, code, cartTotal, email } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'שגיאה בטעינת החנות' }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ success: false, error: 'נא להזין קוד קופון' }, { status: 400 });
    }

    const result = await validateCoupon(storeId, code, cartTotal || 0, email);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ success: false, error: 'שגיאה בבדיקת הקופון' }, { status: 500 });
  }
}

