import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/actions/auth';
import { verifyRecaptcha, checkRateLimit } from '@/lib/recaptcha';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, storeName, recaptchaToken } = body;

    if (!name || !email || !password || !storeName) {
      return NextResponse.json(
        { success: false, error: 'כל השדות הם חובה' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit (5 attempts per 15 minutes per IP)
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.' },
        { status: 429 }
      );
    }

    // Verify reCAPTCHA token if provided
    if (recaptchaToken) {
      const verification = await verifyRecaptcha(recaptchaToken);
      if (!verification.success) {
        console.warn('reCAPTCHA verification failed:', verification.error, 'Score:', verification.score);
        return NextResponse.json(
          { success: false, error: 'אימות נכשל. אנא נסה שוב.' },
          { status: 400 }
        );
      }
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


