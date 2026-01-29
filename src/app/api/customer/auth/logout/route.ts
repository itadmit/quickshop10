import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearSessionCookie, deleteSession } from '@/lib/customer-auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('customer_session')?.value;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהתנתקות' },
      { status: 500 }
    );
  }
}










