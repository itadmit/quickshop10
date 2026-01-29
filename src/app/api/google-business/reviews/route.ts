import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stores, storeGoogleBusiness, storeGoogleReviews } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

/**
 * Google Business Reviews API
 * 
 * GET - Fetch reviews for a store (from cache or sync from Google)
 * POST - Force sync reviews from Google
 */

const GOOGLE_BUSINESS_API = 'https://mybusiness.googleapis.com/v4';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

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

// GET - Get cached reviews
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get('storeSlug');

    if (!storeSlug) {
      return NextResponse.json({ error: 'Missing storeSlug' }, { status: 400 });
    }

    // Get store and integration
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get integration
    const [integration] = await db
      .select()
      .from(storeGoogleBusiness)
      .where(eq(storeGoogleBusiness.storeId, store.id))
      .limit(1);

    if (!integration) {
      return NextResponse.json({ 
        connected: false,
        message: 'Google Business not connected' 
      });
    }

    // Get cached reviews
    const reviews = await db
      .select()
      .from(storeGoogleReviews)
      .where(
        and(
          eq(storeGoogleReviews.storeId, store.id),
          eq(storeGoogleReviews.isVisible, true)
        )
      )
      .orderBy(storeGoogleReviews.displayOrder);

    return NextResponse.json({
      connected: true,
      businessName: integration.businessName,
      averageRating: parseFloat(String(integration.averageRating)) || 0,
      totalReviews: integration.totalReviews,
      lastSyncedAt: integration.lastSyncedAt,
      reviews: reviews.map(r => ({
        id: r.googleReviewId,
        authorName: r.authorName,
        authorPhoto: r.authorPhotoUrl,
        rating: r.rating,
        text: r.comment,
        relativeTime: r.relativeTime,
      })),
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    );
  }
}

// POST - Force sync reviews from Google
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeSlug } = body;

    if (!storeSlug) {
      return NextResponse.json({ error: 'Missing storeSlug' }, { status: 400 });
    }

    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get integration
    const [integration] = await db
      .select()
      .from(storeGoogleBusiness)
      .where(eq(storeGoogleBusiness.storeId, store.id))
      .limit(1);

    if (!integration) {
      return NextResponse.json({ error: 'Google Business not connected' }, { status: 400 });
    }

    // Check if token needs refresh
    let accessToken = integration.accessToken;
    if (new Date() >= integration.tokenExpiresAt) {
      // Refresh token
      const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: integration.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        console.error('Token refresh failed');
        return NextResponse.json({ error: 'Token refresh failed. Please reconnect.' }, { status: 401 });
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
      
      // Update tokens in database
      await db
        .update(storeGoogleBusiness)
        .set({
          accessToken: tokens.access_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        })
        .where(eq(storeGoogleBusiness.id, integration.id));
    }

    // Fetch reviews from Google
    const reviewsResponse = await fetch(`${GOOGLE_BUSINESS_API}/${integration.locationId}/reviews`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!reviewsResponse.ok) {
      console.error('Failed to fetch reviews:', await reviewsResponse.text());
      return NextResponse.json({ error: 'Failed to fetch reviews from Google' }, { status: 500 });
    }

    const reviewsData = await reviewsResponse.json();
    const reviews: GoogleReview[] = reviewsData.reviews || [];
    const averageRating = reviewsData.averageRating || 0;
    const totalReviews = reviewsData.totalReviewCount || reviews.length;

    // Delete old reviews
    await db
      .delete(storeGoogleReviews)
      .where(eq(storeGoogleReviews.integrationId, integration.id));

    // Insert new reviews
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

    // Update integration stats
    await db
      .update(storeGoogleBusiness)
      .set({
        averageRating: String(averageRating),
        totalReviews,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(storeGoogleBusiness.id, integration.id));

    return NextResponse.json({
      success: true,
      message: `Synced ${reviews.length} reviews`,
      averageRating,
      totalReviews,
      reviews: reviews.slice(0, 10).map(r => ({
        id: r.reviewId || r.name,
        authorName: r.reviewer.displayName,
        authorPhoto: r.reviewer.profilePhotoUrl,
        rating: STAR_RATING_MAP[r.starRating] || 5,
        text: r.comment || '',
        relativeTime: getRelativeTime(new Date(r.createTime)),
      })),
    });
  } catch (error) {
    console.error('Sync reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to sync reviews' },
      { status: 500 }
    );
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

