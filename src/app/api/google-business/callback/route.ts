import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, storeGoogleBusiness, storeGoogleReviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Google Business Profile OAuth - Callback
 * 
 * Handles the OAuth callback from Google:
 * 1. Exchange authorization code for tokens
 * 2. Fetch business accounts and locations
 * 3. Fetch initial reviews
 * 4. Store everything in database
 * 5. Close popup and notify parent window
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_BUSINESS_API = 'https://mybusiness.googleapis.com/v4';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleAccount {
  name: string;
  accountName: string;
  type: string;
}

interface GoogleLocation {
  name: string;
  locationName: string;
  primaryPhone?: string;
  websiteUrl?: string;
  address?: {
    addressLines: string[];
    locality: string;
    postalCode: string;
    regionCode: string;
  };
  metadata?: {
    placeId?: string;
  };
}

interface GoogleReview {
  name: string;
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle error from Google
  if (error) {
    return renderPopupResponse({
      success: false,
      error: `Google authorization failed: ${error}`,
    });
  }

  if (!code || !state) {
    return renderPopupResponse({
      success: false,
      error: 'Missing authorization code or state',
    });
  }

  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { storeSlug, userId } = stateData;

    if (!storeSlug) {
      return renderPopupResponse({
        success: false,
        error: 'Invalid state parameter',
      });
    }

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);

    if (!store) {
      return renderPopupResponse({
        success: false,
        error: 'Store not found',
      });
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const baseUrl = (process.env.NEXTAUTH_URL || '').replace(/\/$/, ''); // Remove trailing slash
    const redirectUri = `${baseUrl}/api/google-business/callback`;

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return renderPopupResponse({
        success: false,
        error: 'Failed to exchange authorization code',
      });
    }

    const tokens: TokenResponse = await tokenResponse.json();

    if (!tokens.refresh_token) {
      console.error('No refresh token received');
      return renderPopupResponse({
        success: false,
        error: 'No refresh token received. Please try again.',
      });
    }

    // Fetch accounts
    const accountsResponse = await fetch(`${GOOGLE_BUSINESS_API}/accounts`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!accountsResponse.ok) {
      console.error('Failed to fetch accounts:', await accountsResponse.text());
      return renderPopupResponse({
        success: false,
        error: 'Failed to fetch Google Business accounts. Make sure you have a Google Business Profile.',
      });
    }

    const accountsData = await accountsResponse.json();
    const accounts: GoogleAccount[] = accountsData.accounts || [];

    if (accounts.length === 0) {
      return renderPopupResponse({
        success: false,
        error: 'No Google Business accounts found. Please create a Google Business Profile first.',
      });
    }

    // Use first account (we can later add account selection UI)
    const account = accounts[0];
    const accountId = account.name; // accounts/123456

    // Fetch locations for this account
    const locationsResponse = await fetch(`${GOOGLE_BUSINESS_API}/${accountId}/locations`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!locationsResponse.ok) {
      console.error('Failed to fetch locations:', await locationsResponse.text());
      return renderPopupResponse({
        success: false,
        error: 'Failed to fetch business locations.',
      });
    }

    const locationsData = await locationsResponse.json();
    const locations: GoogleLocation[] = locationsData.locations || [];

    if (locations.length === 0) {
      return renderPopupResponse({
        success: false,
        error: 'No business locations found.',
      });
    }

    // Use first location
    const location = locations[0];
    const locationId = location.name; // accounts/123456/locations/789

    // Fetch reviews
    const reviewsResponse = await fetch(`${GOOGLE_BUSINESS_API}/${locationId}/reviews`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    let reviews: GoogleReview[] = [];
    let averageRating = 0;
    let totalReviews = 0;

    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();
      reviews = reviewsData.reviews || [];
      averageRating = reviewsData.averageRating || 0;
      totalReviews = reviewsData.totalReviewCount || reviews.length;
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Delete existing integration if any
    await db.delete(storeGoogleBusiness).where(eq(storeGoogleBusiness.storeId, store.id));

    // Create new integration
    const [integration] = await db.insert(storeGoogleBusiness).values({
      storeId: store.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt,
      scope: tokens.scope,
      accountId,
      locationId,
      businessName: location.locationName || account.accountName,
      businessAddress: location.address 
        ? `${location.address.addressLines?.join(', ')}, ${location.address.locality}`
        : null,
      businessPhone: location.primaryPhone || null,
      businessWebsite: location.websiteUrl || null,
      placeId: location.metadata?.placeId || null,
      averageRating: String(averageRating),
      totalReviews,
      lastSyncedAt: new Date(),
    }).returning();

    // Store reviews
    if (reviews.length > 0) {
      const reviewsToInsert = reviews.map((review, index) => ({
        storeId: store.id,
        integrationId: integration.id,
        googleReviewId: review.reviewId || review.name,
        authorName: review.reviewer.displayName,
        authorPhotoUrl: review.reviewer.profilePhotoUrl || null,
        rating: STAR_RATING_MAP[review.starRating] || 5,
        comment: review.comment || null,
        relativeTime: getRelativeTime(new Date(review.createTime)),
        reviewTime: new Date(review.createTime),
        reviewReply: review.reviewReply?.comment || null,
        replyTime: review.reviewReply?.updateTime ? new Date(review.reviewReply.updateTime) : null,
        displayOrder: index,
      }));

      await db.insert(storeGoogleReviews).values(reviewsToInsert);
    }

    // Build success data for parent window
    const responseData = {
      success: true,
      accountId: integration.id,
      businessName: integration.businessName,
      averageRating: parseFloat(String(integration.averageRating)) || 0,
      totalReviews: integration.totalReviews || 0,
      reviews: reviews.slice(0, 10).map((review, index) => ({
        id: review.reviewId || review.name,
        authorName: review.reviewer.displayName,
        authorPhoto: review.reviewer.profilePhotoUrl,
        rating: STAR_RATING_MAP[review.starRating] || 5,
        text: review.comment || '',
        relativeTime: getRelativeTime(new Date(review.createTime)),
      })),
    };

    return renderPopupResponse(responseData);
  } catch (error) {
    console.error('Google Business callback error:', error);
    return renderPopupResponse({
      success: false,
      error: 'An unexpected error occurred',
    });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'היום';
  if (diffDays === 1) return 'אתמול';
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
  if (diffDays < 365) return `לפני ${Math.floor(diffDays / 30)} חודשים`;
  return `לפני ${Math.floor(diffDays / 365)} שנים`;
}

interface PopupResponse {
  success: boolean;
  error?: string;
  accountId?: string;
  businessName?: string | null;
  averageRating?: number;
  totalReviews?: number;
  reviews?: Array<{
    id: string;
    authorName: string;
    authorPhoto?: string;
    rating: number;
    text: string;
    relativeTime: string;
  }>;
}

function renderPopupResponse(data: PopupResponse): NextResponse {
  // Render HTML that sends message to parent window and closes
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Google Business - חיבור</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          max-width: 400px;
        }
        .icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
        }
        .success { color: #22c55e; }
        .error { color: #ef4444; }
        h2 { margin: 0 0 0.5rem; font-size: 1.25rem; }
        p { margin: 0; color: #64748b; font-size: 0.875rem; }
      </style>
    </head>
    <body>
      <div class="container">
        ${data.success ? `
          <svg class="icon success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2>החיבור הצליח!</h2>
          <p>${data.businessName || 'העסק שלך'} חובר בהצלחה</p>
          <p style="margin-top: 0.5rem">${data.totalReviews || 0} ביקורות נמצאו</p>
        ` : `
          <svg class="icon error" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2>שגיאה בחיבור</h2>
          <p>${data.error || 'אירעה שגיאה'}</p>
        `}
        <p style="margin-top: 1rem; font-size: 0.75rem;">החלון ייסגר אוטומטית...</p>
      </div>
      <script>
        const data = ${JSON.stringify(data)};
        
        // Send message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'google-business-connected',
            ...data,
          }, '*');
          
          // Close popup after short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          // If no opener, redirect to admin
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

