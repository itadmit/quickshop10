import { NextResponse } from 'next/server';
import { getCurrentInfluencer } from '@/lib/influencer-auth';

export async function GET() {
  try {
    const influencer = await getCurrentInfluencer();

    if (!influencer) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      influencer: {
        id: influencer.id,
        name: influencer.name,
        email: influencer.email,
        couponCode: influencer.couponCode,
        totalSales: influencer.totalSales,
        totalOrders: influencer.totalOrders,
        totalCommission: influencer.totalCommission,
      },
    });
  } catch (error) {
    console.error('Get current influencer error:', error);
    return NextResponse.json(
      { error: 'שגיאה בקבלת פרטי משתמש' },
      { status: 500 }
    );
  }
}



