import { db } from '@/lib/db';
import { influencers, influencerSessions } from '@/lib/db/schema';
import { eq, and, gt, ilike } from 'drizzle-orm';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const INFLUENCER_SESSION_COOKIE = 'influencer_session';
const SESSION_EXPIRY_DAYS = 30;

// Generate a random session token
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create influencer session
export async function createInfluencerSession(
  influencerId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await db.insert(influencerSessions).values({
    influencerId,
    sessionToken,
    expiresAt,
    userAgent,
    ipAddress,
  });

  // Update last login
  await db.update(influencers)
    .set({ lastLoginAt: new Date() })
    .where(eq(influencers.id, influencerId));

  return sessionToken;
}

// Set session cookie
export async function setInfluencerSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(INFLUENCER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

// Get current influencer from session
export async function getCurrentInfluencer() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(INFLUENCER_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const [session] = await db
    .select()
    .from(influencerSessions)
    .where(
      and(
        eq(influencerSessions.sessionToken, sessionToken),
        gt(influencerSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const [influencer] = await db
    .select()
    .from(influencers)
    .where(
      and(
        eq(influencers.id, session.influencerId),
        eq(influencers.isActive, true)
      )
    )
    .limit(1);

  return influencer || null;
}

// Get influencer by store and email (case-insensitive)
export async function getInfluencerByEmail(storeId: string, email: string) {
  const [influencer] = await db
    .select()
    .from(influencers)
    .where(
      and(
        eq(influencers.storeId, storeId),
        ilike(influencers.email, email.trim()),
        eq(influencers.isActive, true)
      )
    )
    .limit(1);

  return influencer || null;
}

// Clear session cookie
export async function clearInfluencerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(INFLUENCER_SESSION_COOKIE);
}

// Delete session from database
export async function deleteInfluencerSession(sessionToken: string): Promise<void> {
  await db
    .delete(influencerSessions)
    .where(eq(influencerSessions.sessionToken, sessionToken));
}

// Logout (clear cookie + delete session)
export async function logoutInfluencer(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(INFLUENCER_SESSION_COOKIE)?.value;
  
  if (sessionToken) {
    await deleteInfluencerSession(sessionToken);
  }
  
  await clearInfluencerSessionCookie();
}



