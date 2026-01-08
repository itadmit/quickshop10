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
export async function sendOtpEmail(
  email: string, 
  code: string, 
  storeName?: string
): Promise<void> {
  const { sendEmail } = await import('@/lib/email');
  
  const displayName = storeName || 'החנות';
  
  // Using inline styles for better email client compatibility
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; direction: rtl;" dir="rtl">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; width: 100%;">
              <tr>
                <td style="background: #ffffff; border-radius: 12px; padding: 40px 32px; text-align: right;" dir="rtl" align="right">
                  
                  <!-- Store Name -->
                  <div style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 24px 0; text-align: right;" dir="rtl" align="right">${displayName}</div>
                  
                  <!-- Title -->
                  <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0; text-align: right; line-height: 1.4;" dir="rtl" align="right">קוד האימות שלך</h1>
                  
                  <!-- Subtitle -->
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0; text-align: right;" dir="rtl" align="right">הזן את הקוד הבא כדי להתחבר לחשבון שלך:</p>
                  
                  <!-- Code Box -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; text-align: center;" align="center">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: 'SF Mono', 'Consolas', 'Monaco', monospace; direction: ltr; display: inline-block;" dir="ltr">${code}</span>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Info Text -->
                  <p style="color: #888888; font-size: 13px; line-height: 1.6; margin: 24px 0 8px 0; text-align: right;" dir="rtl" align="right">הקוד תקף ל-10 דקות.</p>
                  <p style="color: #888888; font-size: 13px; line-height: 1.6; margin: 0 0 0 0; text-align: right;" dir="rtl" align="right">אם לא ביקשת קוד זה, התעלם מהמייל הזה.</p>
                  
                  <!-- Divider -->
                  <div style="height: 1px; background-color: #eeeeee; margin: 24px 0;"></div>
                  
                  <!-- Footer -->
                  <p style="color: #999999; font-size: 11px; margin: 0; text-align: center;" align="center">${displayName}</p>
                  
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  await sendEmail({
    to: email,
    subject: `${displayName} - קוד אימות: ${code}`,
    html,
    senderName: displayName,
  });
}

