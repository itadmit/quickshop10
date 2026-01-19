/**
 * Reviews API Endpoint
 * 
 * ⚡ Performance-optimized queries with pagination
 * GET: Fetch reviews for a product with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  productReviews, 
  customers,
  reviewMedia,
} from '@/lib/db/schema';
import { eq, and, desc, asc, sql, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get('productId');
    const storeId = searchParams.get('storeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const sort = searchParams.get('sort') || 'recent';
    const rating = searchParams.get('rating');
    const withMedia = searchParams.get('withMedia') === 'true';

    if (!productId || !storeId) {
      return NextResponse.json(
        { error: 'productId and storeId are required' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [
      eq(productReviews.productId, productId),
      eq(productReviews.storeId, storeId),
      eq(productReviews.isApproved, true),
    ];

    if (rating && rating !== 'all') {
      conditions.push(eq(productReviews.rating, parseInt(rating)));
    }

    // Sort order
    let orderBy;
    switch (sort) {
      case 'helpful':
        orderBy = desc(productReviews.helpfulCount);
        break;
      case 'rating_high':
        orderBy = desc(productReviews.rating);
        break;
      case 'rating_low':
        orderBy = asc(productReviews.rating);
        break;
      default:
        orderBy = desc(productReviews.createdAt);
    }

    // Main query
    let query = db
      .select({
        id: productReviews.id,
        rating: productReviews.rating,
        title: productReviews.title,
        content: productReviews.content,
        pros: productReviews.pros,
        cons: productReviews.cons,
        isVerifiedPurchase: productReviews.isVerifiedPurchase,
        isFeatured: productReviews.isFeatured,
        badges: productReviews.badges,
        helpfulCount: productReviews.helpfulCount,
        notHelpfulCount: productReviews.notHelpfulCount,
        adminReply: productReviews.adminReply,
        adminReplyAt: productReviews.adminReplyAt,
        customerName: productReviews.customerName,
        createdAt: productReviews.createdAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(productReviews)
      .leftJoin(customers, eq(productReviews.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // If filtering by media, we need a different approach
    // For now, we'll filter in the subquery
    if (withMedia) {
      // Get reviews that have media
      const reviewsWithMedia = await db
        .select({ reviewId: reviewMedia.reviewId })
        .from(reviewMedia)
        .groupBy(reviewMedia.reviewId);
      
      const reviewIdsWithMedia = reviewsWithMedia.map(r => r.reviewId);
      
      if (reviewIdsWithMedia.length === 0) {
        return NextResponse.json({
          reviews: [],
          total: 0,
          page,
          limit,
        });
      }
      
      conditions.push(sql`${productReviews.id} IN ${reviewIdsWithMedia}`);
    }

    const reviews = await db
      .select({
        id: productReviews.id,
        rating: productReviews.rating,
        title: productReviews.title,
        content: productReviews.content,
        pros: productReviews.pros,
        cons: productReviews.cons,
        isVerifiedPurchase: productReviews.isVerifiedPurchase,
        isFeatured: productReviews.isFeatured,
        badges: productReviews.badges,
        helpfulCount: productReviews.helpfulCount,
        notHelpfulCount: productReviews.notHelpfulCount,
        adminReply: productReviews.adminReply,
        adminReplyAt: productReviews.adminReplyAt,
        customerName: productReviews.customerName,
        createdAt: productReviews.createdAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(productReviews)
      .leftJoin(customers, eq(productReviews.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get media for each review
    const reviewIds = reviews.map(r => r.id);
    const mediaItems = reviewIds.length > 0
      ? await db
          .select()
          .from(reviewMedia)
          .where(sql`${reviewMedia.reviewId} IN ${reviewIds}`)
          .orderBy(reviewMedia.sortOrder)
      : [];

    // Group media by review
    const mediaByReview = new Map<string, typeof mediaItems>();
    for (const item of mediaItems) {
      const existing = mediaByReview.get(item.reviewId) || [];
      existing.push(item);
      mediaByReview.set(item.reviewId, existing);
    }

    // Combine reviews with media
    const reviewsWithMediaData = reviews.map(review => ({
      ...review,
      media: mediaByReview.get(review.id) || [],
    }));

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(productReviews)
      .where(and(...conditions));

    return NextResponse.json({
      reviews: reviewsWithMediaData,
      total: countResult?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}



