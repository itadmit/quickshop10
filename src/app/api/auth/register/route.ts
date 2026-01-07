import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/actions/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, storeName } = body;

    if (!name || !email || !password || !storeName) {
      return NextResponse.json(
        { success: false, error: 'כל השדות הם חובה' },
        { status: 400 }
      );
    }

    const result = await register({ name, email, password, storeName });

    if (result.success) {
      return NextResponse.json({
        success: true,
        userId: result.userId,
        storeSlug: result.storeSlug,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהרשמה' },
      { status: 500 }
    );
  }
}

