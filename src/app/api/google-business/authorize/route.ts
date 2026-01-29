import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Google Business Profile OAuth - Authorization URL
 * 
 * Starts the OAuth flow by redirecting to Google's consent screen.
 * Required scopes: business.manage
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/business.manage', // Access to Google Business Profile
  'openid',
  'email',
  'profile',
];

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get storeSlug from query params
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get('storeSlug');
    
    if (!storeSlug) {
      return NextResponse.json({ error: 'Missing storeSlug parameter' }, { status: 400 });
    }

    // Verify user has access to this store (owner)
    const [store] = await db
      .select({ id: stores.id, slug: stores.slug, ownerId: stores.ownerId })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check if user is owner or team member
    const isOwner = store.ownerId === session.user.id;
    
    if (!isOwner) {
      // Check if user is a store member
      const [member] = await db
        .select({ id: storeMembers.id })
        .from(storeMembers)
        .where(and(
          eq(storeMembers.storeId, store.id),
          eq(storeMembers.userId, session.user.id)
        ))
        .limit(1);
      
      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Build OAuth URL
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/google-business/callback`;
    
    if (!clientId) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    // State parameter to pass storeSlug back to callback
    const state = Buffer.from(JSON.stringify({ 
      storeSlug,
      userId: session.user.id,
    })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: REQUIRED_SCOPES.join(' '),
      access_type: 'offline',  // Get refresh token
      prompt: 'consent',       // Always show consent to get refresh token
      state: state,
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google Business authorize error:', error);
    return NextResponse.json(
      { error: 'Failed to start authorization' },
      { status: 500 }
    );
  }
}

