import { NextRequest, NextResponse } from 'next/server';
import { 
  getInfluencerByEmail, 
  verifyPassword, 
  createInfluencerSession, 
  setInfluencerSessionCookie 
} from '@/lib/influencer-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, storeId } = body;

    // Validation
    if (!email || !password || !storeId) {
      return NextResponse.json(
        { error: 'חסרים פרטים' },
        { status: 400 }
      );
    }

    // Find influencer
    const influencer = await getInfluencerByEmail(storeId, email);

    if (!influencer) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה לא נכונים' },
        { status: 401 }
      );
    }

    // Check password
    if (!influencer.passwordHash) {
      return NextResponse.json(
        { error: 'לא הוגדרה סיסמה. פנה למנהל החנות' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, influencer.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה לא נכונים' },
        { status: 401 }
      );
    }

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      undefined;

    const sessionToken = await createInfluencerSession(
      influencer.id,
      userAgent,
      ipAddress
    );

    // Set cookie
    await setInfluencerSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      influencer: {
        id: influencer.id,
        name: influencer.name,
        email: influencer.email,
      },
    });
  } catch (error) {
    console.error('Influencer login error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}


