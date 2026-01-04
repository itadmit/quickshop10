import { NextResponse } from 'next/server';
import { logoutInfluencer } from '@/lib/influencer-auth';

export async function POST() {
  try {
    await logoutInfluencer();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Influencer logout error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתנתקות' },
      { status: 500 }
    );
  }
}


