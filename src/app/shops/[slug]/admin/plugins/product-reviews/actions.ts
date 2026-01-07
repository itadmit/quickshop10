'use server';

/**
 * Product Reviews Plugin - Server Actions
 * 
 * ⚡ Performance-first:
 * - Denormalized summary for O(1) lookups
 * - Batch operations where possible
 * - Revalidation only on changes
 */

import { db } from '@/lib/db';
import { 
  productReviews, 
  reviewMedia, 
  reviewVotes,
  productReviewSummary,
  orders,
  orderItems,
} from '@/lib/db/schema';
import { eq, and, desc, asc, sql, count, avg } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================
// Types
// ============================================

export interface ReviewFormData {
  productId: string;
  customerId?: string;
  orderId?: string;
  variantId?: string;
  rating: number;
  title?: string;
  content?: string;
  pros?: string;
  cons?: string;
  customerName?: string;
  customerEmail?: string;
  media?: { url: string; type: 'image' | 'video'; publicId?: string; width?: number; height?: number }[];
}

export interface AdminReviewUpdate {
  isApproved?: boolean;
  isFeatured?: boolean;
  badges?: string[];
  title?: string;
  content?: string;
  adminReply?: string;
}

// ============================================
// Public Actions (Storefront)
// ============================================

/**
 * Create a new review
 */
export async function createReview(
  storeId: string,
  storeSlug: string,
  data: ReviewFormData
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Check if customer already reviewed this product
    if (data.customerId) {
      const existing = await db
        .select({ id: productReviews.id })
        .from(productReviews)
        .where(and(
          eq(productReviews.productId, data.productId),
          eq(productReviews.customerId, data.customerId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return { success: false, error: 'כבר כתבת ביקורת למוצר זה' };
      }
    }

    // Check if this is a verified purchase
    let isVerifiedPurchase = false;
    if (data.orderId && data.customerId) {
      const [orderCheck] = await db
        .select({ id: orders.id })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(orders.id, data.orderId),
          eq(orders.customerId, data.customerId),
          eq(orderItems.productId, data.productId)
        ))
        .limit(1);
      
      isVerifiedPurchase = !!orderCheck;
    }

    // Create the review
    const [review] = await db.insert(productReviews).values({
      storeId,
      productId: data.productId,
      customerId: data.customerId || null,
      orderId: data.orderId || null,
      variantId: data.variantId || null,
      rating: data.rating,
      title: data.title || null,
      content: data.content || null,
      pros: data.pros || null,
      cons: data.cons || null,
      isVerifiedPurchase,
      isApproved: false, // Will be auto-approved based on settings
      customerName: data.customerName || null,
      customerEmail: data.customerEmail || null,
    }).returning();

    // Add media if provided
    if (data.media && data.media.length > 0) {
      await db.insert(reviewMedia).values(
        data.media.map((m, i) => ({
          reviewId: review.id,
          type: m.type,
          url: m.url,
          publicId: m.publicId || null,
          width: m.width || null,
          height: m.height || null,
          sortOrder: i,
        }))
      );
    }

    // Update summary (will be done after approval in production)
    // For now, we update it here for simplicity
    
    revalidatePath(`/shops/${storeSlug}/admin/plugins/product-reviews`);
    
    return { success: true, reviewId: review.id };
  } catch (error) {
    console.error('Error creating review:', error);
    return { success: false, error: 'שגיאה ביצירת הביקורת' };
  }
}

/**
 * Vote on a review (helpful/not helpful)
 */
export async function voteOnReview(
  reviewId: string,
  isHelpful: boolean,
  customerId?: string,
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already voted
    const existingVote = customerId
      ? await db
          .select()
          .from(reviewVotes)
          .where(and(
            eq(reviewVotes.reviewId, reviewId),
            eq(reviewVotes.customerId, customerId)
          ))
          .limit(1)
      : sessionId
        ? await db
            .select()
            .from(reviewVotes)
            .where(and(
              eq(reviewVotes.reviewId, reviewId),
              eq(reviewVotes.sessionId, sessionId)
            ))
            .limit(1)
        : [];

    if (existingVote.length > 0) {
      return { success: false, error: 'כבר הצבעת על ביקורת זו' };
    }

    // Insert vote
    await db.insert(reviewVotes).values({
      reviewId,
      customerId: customerId || null,
      sessionId: sessionId || null,
      isHelpful,
    });

    // Update count on review
    await db
      .update(productReviews)
      .set({
        helpfulCount: isHelpful ? sql`${productReviews.helpfulCount} + 1` : productReviews.helpfulCount,
        notHelpfulCount: !isHelpful ? sql`${productReviews.notHelpfulCount} + 1` : productReviews.notHelpfulCount,
      })
      .where(eq(productReviews.id, reviewId));

    return { success: true };
  } catch (error) {
    console.error('Error voting on review:', error);
    return { success: false, error: 'שגיאה בהצבעה' };
  }
}

// ============================================
// Admin Actions
// ============================================

/**
 * Update review (admin)
 */
export async function updateReview(
  reviewId: string,
  storeId: string,
  storeSlug: string,
  data: AdminReviewUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.isApproved !== undefined) updateData.isApproved = data.isApproved;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.badges !== undefined) updateData.badges = data.badges;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;

    await db
      .update(productReviews)
      .set(updateData)
      .where(and(
        eq(productReviews.id, reviewId),
        eq(productReviews.storeId, storeId)
      ));

    // If approval status changed, update the summary
    if (data.isApproved !== undefined) {
      const [review] = await db
        .select({ productId: productReviews.productId })
        .from(productReviews)
        .where(eq(productReviews.id, reviewId))
        .limit(1);
      
      if (review) {
        await updateReviewSummary(review.productId);
      }
    }

    revalidatePath(`/shops/${storeSlug}/admin/plugins/product-reviews`);
    revalidatePath(`/shops/${storeSlug}/admin/plugins/product-reviews/${reviewId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating review:', error);
    return { success: false, error: 'שגיאה בעדכון הביקורת' };
  }
}

/**
 * Add admin reply
 */
export async function addAdminReply(
  reviewId: string,
  storeId: string,
  storeSlug: string,
  userId: string,
  reply: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(productReviews)
      .set({
        adminReply: reply,
        adminReplyAt: new Date(),
        adminReplyBy: userId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(productReviews.id, reviewId),
        eq(productReviews.storeId, storeId)
      ));

    revalidatePath(`/shops/${storeSlug}/admin/plugins/product-reviews/${reviewId}`);

    return { success: true };
  } catch (error) {
    console.error('Error adding admin reply:', error);
    return { success: false, error: 'שגיאה בהוספת התגובה' };
  }
}

/**
 * Delete review
 */
export async function deleteReview(
  reviewId: string,
  storeId: string,
  storeSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get product ID before deleting
    const [review] = await db
      .select({ productId: productReviews.productId })
      .from(productReviews)
      .where(and(
        eq(productReviews.id, reviewId),
        eq(productReviews.storeId, storeId)
      ))
      .limit(1);

    if (!review) {
      return { success: false, error: 'הביקורת לא נמצאה' };
    }

    // Delete review (cascades to media and votes)
    await db
      .delete(productReviews)
      .where(eq(productReviews.id, reviewId));

    // Update summary
    await updateReviewSummary(review.productId);

    revalidatePath(`/shops/${storeSlug}/admin/plugins/product-reviews`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false, error: 'שגיאה במחיקת הביקורת' };
  }
}

/**
 * Bulk approve reviews
 */
export async function bulkApproveReviews(
  reviewIds: string[],
  storeId: string,
  storeSlug: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Get product IDs first
    const reviews = await db
      .select({ id: productReviews.id, productId: productReviews.productId })
      .from(productReviews)
      .where(and(
        sql`${productReviews.id} IN ${reviewIds}`,
        eq(productReviews.storeId, storeId)
      ));

    // Update all
    await db
      .update(productReviews)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(sql`${productReviews.id} IN ${reviewIds}`);

    // Update summaries for affected products
    const productIds = [...new Set(reviews.map(r => r.productId))];
    for (const productId of productIds) {
      await updateReviewSummary(productId);
    }

    revalidatePath(`/shops/${storeSlug}/admin/plugins/product-reviews`);

    return { success: true, count: reviews.length };
  } catch (error) {
    console.error('Error bulk approving reviews:', error);
    return { success: false, count: 0, error: 'שגיאה באישור הביקורות' };
  }
}

/**
 * Delete review media
 */
export async function deleteReviewMedia(
  mediaId: string,
  storeId: string,
  storeSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the media belongs to a review in this store
    const [media] = await db
      .select({
        id: reviewMedia.id,
        storeId: productReviews.storeId,
        reviewId: reviewMedia.reviewId,
      })
      .from(reviewMedia)
      .innerJoin(productReviews, eq(reviewMedia.reviewId, productReviews.id))
      .where(and(
        eq(reviewMedia.id, mediaId),
        eq(productReviews.storeId, storeId)
      ))
      .limit(1);

    if (!media) {
      return { success: false, error: 'המדיה לא נמצאה' };
    }

    await db.delete(reviewMedia).where(eq(reviewMedia.id, mediaId));

    revalidatePath(`/shops/${storeSlug}/admin/plugins/product-reviews/${media.reviewId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting review media:', error);
    return { success: false, error: 'שגיאה במחיקת המדיה' };
  }
}

// ============================================
// Summary Updates
// ============================================

/**
 * Update product review summary (denormalized table)
 * Called after any review change
 */
export async function updateReviewSummary(productId: string): Promise<void> {
  try {
    // Calculate stats from approved reviews only
    const stats = await db
      .select({
        total: count(),
        avgRating: avg(productReviews.rating),
        r1: sql<number>`COUNT(*) FILTER (WHERE ${productReviews.rating} = 1)`,
        r2: sql<number>`COUNT(*) FILTER (WHERE ${productReviews.rating} = 2)`,
        r3: sql<number>`COUNT(*) FILTER (WHERE ${productReviews.rating} = 3)`,
        r4: sql<number>`COUNT(*) FILTER (WHERE ${productReviews.rating} = 4)`,
        r5: sql<number>`COUNT(*) FILTER (WHERE ${productReviews.rating} = 5)`,
        verified: sql<number>`COUNT(*) FILTER (WHERE ${productReviews.isVerifiedPurchase} = true)`,
      })
      .from(productReviews)
      .where(and(
        eq(productReviews.productId, productId),
        eq(productReviews.isApproved, true)
      ));

    // Count reviews with media
    const mediaCount = await db
      .select({ count: count() })
      .from(productReviews)
      .innerJoin(reviewMedia, eq(reviewMedia.reviewId, productReviews.id))
      .where(and(
        eq(productReviews.productId, productId),
        eq(productReviews.isApproved, true)
      ));

    const s = stats[0];
    
    // Upsert summary
    await db
      .insert(productReviewSummary)
      .values({
        productId,
        totalReviews: s.total,
        averageRating: s.avgRating ? String(Number(s.avgRating).toFixed(1)) : '0',
        rating1Count: Number(s.r1) || 0,
        rating2Count: Number(s.r2) || 0,
        rating3Count: Number(s.r3) || 0,
        rating4Count: Number(s.r4) || 0,
        rating5Count: Number(s.r5) || 0,
        verifiedCount: Number(s.verified) || 0,
        withMediaCount: mediaCount[0]?.count || 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: productReviewSummary.productId,
        set: {
          totalReviews: s.total,
          averageRating: s.avgRating ? String(Number(s.avgRating).toFixed(1)) : '0',
          rating1Count: Number(s.r1) || 0,
          rating2Count: Number(s.r2) || 0,
          rating3Count: Number(s.r3) || 0,
          rating4Count: Number(s.r4) || 0,
          rating5Count: Number(s.r5) || 0,
          verifiedCount: Number(s.verified) || 0,
          withMediaCount: mediaCount[0]?.count || 0,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Error updating review summary:', error);
  }
}

