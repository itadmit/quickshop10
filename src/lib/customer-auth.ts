import { db } from '@/lib/db';
import { customers, customerSessions, customerOtpCodes } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const CUSTOMER_SESSION_COOKIE = 'customer_session';
const SESSION_EXPIRY_DAYS = 30;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// Generate a random session token
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate a 6-digit OTP code
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create customer session
export async function createCustomerSession(
  customerId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db.insert(customerSessions).values({
    customerId,
    sessionToken,
    expiresAt,
    userAgent,
    ipAddress,
  });

  // Update last login
  await db.update(customers)
    .set({ lastLoginAt: new Date() })
    .where(eq(customers.id, customerId));

  return sessionToken;
}

// Set session cookie
export async function setSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

// Get current customer from session
export async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const [session] = await db
    .select()
    .from(customerSessions)
    .where(
      and(
        eq(customerSessions.sessionToken, sessionToken),
        gt(customerSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, session.customerId))
    .limit(1);

  return customer || null;
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

// Delete session from database
export async function deleteSession(sessionToken: string): Promise<void> {
  await db
    .delete(customerSessions)
    .where(eq(customerSessions.sessionToken, sessionToken));
}

// Create OTP code for customer
export async function createOtpCode(customerId: string): Promise<string> {
  const code = generateOtpCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  // Invalidate old unused OTP codes for this customer
  await db
    .delete(customerOtpCodes)
    .where(
      and(
        eq(customerOtpCodes.customerId, customerId),
        eq(customerOtpCodes.usedAt, null as unknown as Date)
      )
    );

  await db.insert(customerOtpCodes).values({
    customerId,
    code,
    expiresAt,
  });

  return code;
}

// Verify OTP code
export async function verifyOtpCode(
  customerId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const [otpRecord] = await db
    .select()
    .from(customerOtpCodes)
    .where(
      and(
        eq(customerOtpCodes.customerId, customerId),
        eq(customerOtpCodes.code, code)
      )
    )
    .limit(1);

  if (!otpRecord) {
    return { success: false, error: 'קוד לא תקין' };
  }

  if (otpRecord.usedAt) {
    return { success: false, error: 'קוד כבר נוצל' };
  }

  if (otpRecord.expiresAt < new Date()) {
    return { success: false, error: 'פג תוקף הקוד' };
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    return { success: false, error: 'חרגת ממספר הניסיונות המותר' };
  }

  // Mark as used
  await db
    .update(customerOtpCodes)
    .set({ usedAt: new Date() })
    .where(eq(customerOtpCodes.id, otpRecord.id));

  // Mark email as verified
  await db
    .update(customers)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(customers.id, customerId));

  return { success: true };
}

// Increment OTP attempts
export async function incrementOtpAttempts(customerId: string, code: string): Promise<void> {
  const [otpRecord] = await db
    .select()
    .from(customerOtpCodes)
    .where(
      and(
        eq(customerOtpCodes.customerId, customerId),
        eq(customerOtpCodes.code, code)
      )
    )
    .limit(1);

  if (otpRecord) {
    await db
      .update(customerOtpCodes)
      .set({ attempts: otpRecord.attempts + 1 })
      .where(eq(customerOtpCodes.id, otpRecord.id));
  }
}

// Find or create customer by email (for a specific store)
export async function findOrCreateCustomer(
  storeId: string,
  email: string,
  data?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }
): Promise<typeof customers.$inferSelect> {
  const normalizedEmail = email.toLowerCase().trim();
  
  let [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.storeId, storeId),
        eq(customers.email, normalizedEmail)
      )
    )
    .limit(1);

  if (!customer) {
    [customer] = await db
      .insert(customers)
      .values({
        storeId,
        email: normalizedEmail,
        firstName: data?.firstName,
        lastName: data?.lastName,
        phone: data?.phone,
      })
      .returning();
  }

  return customer;
}

// Send OTP email via SendGrid
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const { sendEmail } = await import('@/lib/email');
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f7f7; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; text-align: center; }
        h1 { font-size: 24px; color: #1a1a1a; margin: 0 0 16px; }
        p { color: #666; line-height: 1.6; margin: 0 0 20px; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; background: #f7f7f7; padding: 20px 30px; border-radius: 12px; display: inline-block; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>קוד האימות שלך</h1>
        <p>הזן את הקוד הבא כדי להתחבר לחשבון שלך:</p>
        <div class="code">${code}</div>
        <p style="font-size: 14px; color: #999;">
          הקוד תקף ל-10 דקות. אם לא ביקשת קוד זה, התעלם מהמייל.
        </p>
        <div class="footer">
          <p>© QuickShop</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({
    to: email,
    subject: `${code} - קוד אימות`,
    html,
  });
  
  // Also log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP code for ${email}: ${code}`);
  }
}

