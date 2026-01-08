/**
 * Product Reviews Section - Server Component
 * 
 * ⚡ Performance-first:
 * - Server-rendered summary and initial reviews
 * - Client components only for interactions
 * - Uses denormalized summary table
 */

import { db } from '@/lib/db';
import { 
  productReviews, 
  productReviewSummary,
  customers,
  reviewMedia,
  storePlugins,
  orders,
  orderItems,
  ProductReviewSummary,
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { Star } from 'lucide-react';
import { ReviewSummary } from './review-summary';
import { ReviewList } from './review-list';
import { ReviewForm } from './review-form';
import type { ProductReview, ReviewMedia } from '@/lib/db/schema';

interface ProductReviewsSectionProps {
  productId: string;
  storeId: string;
  storeSlug: string;
}

type ReviewWithMedia = ProductReview & {
  media?: ReviewMedia[];
  customerFirstName?: string | null;
  customerLastName?: string | null;
};

// Get plugin config
async function getPluginConfig(storeId: string) {
  const [plugin] = await db
    .select()
    .from(storePlugins)
    .where(and(
      eq(storePlugins.storeId, storeId),
      eq(storePlugins.pluginSlug, 'product-reviews'),
      eq(storePlugins.isActive, true)
    ))
    .limit(1);

  if (!plugin) return null;
  
  return {
    enabled: true,
    requireApproval: ((plugin.config as Record<string, unknown>)?.requireApproval ?? true) as boolean,
    requireText: ((plugin.config as Record<string, unknown>)?.requireText ?? false) as boolean,
    minTextLength: Number((plugin.config as Record<string, unknown>)?.minTextLength) || 10,
    allowMedia: ((plugin.config as Record<string, unknown>)?.allowMedia ?? true) as boolean,
    maxMediaPerReview: Number((plugin.config as Record<string, unknown>)?.maxMediaPerReview) || 5,
    allowGuestReviews: ((plugin.config as Record<string, unknown>)?.allowGuestReviews ?? false) as boolean,
    showVerifiedBadge: ((plugin.config as Record<string, unknown>)?.showVerifiedBadge ?? true) as boolean,
  };
}

// Get initial reviews
async function getInitialReviews(productId: string, storeId: string, limit = 5): Promise<ReviewWithMedia[]> {
  const reviews = await db
    .select({
      id: productReviews.id,
      storeId: productReviews.storeId,
      productId: productReviews.productId,
      customerId: productReviews.customerId,
      orderId: productReviews.orderId,
      variantId: productReviews.variantId,
      rating: productReviews.rating,
      title: productReviews.title,
      content: productReviews.content,
      pros: productReviews.pros,
      cons: productReviews.cons,
      isVerifiedPurchase: productReviews.isVerifiedPurchase,
      badges: productReviews.badges,
      isApproved: productReviews.isApproved,
      isFeatured: productReviews.isFeatured,
      adminReply: productReviews.adminReply,
      adminReplyAt: productReviews.adminReplyAt,
      adminReplyBy: productReviews.adminReplyBy,
      helpfulCount: productReviews.helpfulCount,
      notHelpfulCount: productReviews.notHelpfulCount,
      customerName: productReviews.customerName,
      customerEmail: productReviews.customerEmail,
      createdAt: productReviews.createdAt,
      updatedAt: productReviews.updatedAt,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
    })
    .from(productReviews)
    .leftJoin(customers, eq(productReviews.customerId, customers.id))
    .where(and(
      eq(productReviews.productId, productId),
      eq(productReviews.storeId, storeId),
      eq(productReviews.isApproved, true)
    ))
    .orderBy(desc(productReviews.isFeatured), desc(productReviews.createdAt))
    .limit(limit);

  // Get media for reviews
  const reviewIds = reviews.map(r => r.id);
  const media = reviewIds.length > 0
    ? await db
        .select()
        .from(reviewMedia)
        .where(sql`${reviewMedia.reviewId} IN ${reviewIds}`)
        .orderBy(reviewMedia.sortOrder)
    : [];

  // Group media by review
  const mediaByReview = new Map<string, ReviewMedia[]>();
  for (const m of media) {
    const existing = mediaByReview.get(m.reviewId) || [];
    existing.push(m);
    mediaByReview.set(m.reviewId, existing);
  }

  return reviews.map(review => ({
    ...review,
    media: mediaByReview.get(review.id) || [],
  }));
}

// Get summary from denormalized table (O(1))
async function getReviewSummary(productId: string): Promise<ProductReviewSummary | null> {
  const [summary] = await db
    .select()
    .from(productReviewSummary)
    .where(eq(productReviewSummary.productId, productId))
    .limit(1);
  
  return summary || null;
}

// Get customer orders for this product (for verified purchase selection)
async function getCustomerOrdersForProduct(
  customerId: string | undefined, 
  productId: string
): Promise<{ id: string; orderNumber: string; date: string }[]> {
  if (!customerId) return [];

  const result = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orders.customerId, customerId),
      eq(orderItems.productId, productId)
    ))
    .limit(10);

  return result.map(r => ({
    id: r.id,
    orderNumber: r.orderNumber,
    date: new Date(r.createdAt).toLocaleDateString('he-IL'),
  }));
}

export async function ProductReviewsSection({ 
  productId, 
  storeId,
  storeSlug,
}: ProductReviewsSectionProps) {
  // Check if plugin is enabled
  const config = await getPluginConfig(storeId);
  if (!config) {
    // Plugin not enabled - don't render anything
    return null;
  }

  // Get customer from session (uses proper session lookup)
  const customer = await getCurrentCustomer();
  const customerId = customer?.id;

  // Fetch data in parallel - single query per table
  const [initialReviews, summary, customerOrders] = await Promise.all([
    getInitialReviews(productId, storeId, 5),
    getReviewSummary(productId),  // O(1) from denormalized table
    getCustomerOrdersForProduct(customerId, productId),
  ]);

  // Extract count from summary (avoid extra query)
  const totalCount = summary?.totalReviews || 0;

  // Check if customer can write review
  const canWriteReview = config.allowGuestReviews || !!customerId;

  return (
    <section className="py-16 px-6 border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-light tracking-widest mb-2">
            ביקורות לקוחות
          </h2>
          <p className="text-gray-500 text-sm">
            מה הלקוחות שלנו אומרים
          </p>
        </div>

        {/* Summary - Server Rendered (pre-fetched, no extra query) */}
        <div className="border-b border-gray-100 mb-8">
          <ReviewSummary productId={productId} showWriteButton={canWriteReview} summary={summary} />
        </div>

        {/* Reviews List - Client for interactions */}
        {totalCount > 0 && (
          <ReviewList
            productId={productId}
            storeId={storeId}
            initialReviews={initialReviews}
            totalCount={totalCount}
            pageSize={5}
          />
        )}

        {/* Write Review Form */}
        {canWriteReview && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <ReviewForm
              productId={productId}
              storeId={storeId}
              storeSlug={storeSlug}
              customerId={customerId}
              customerOrders={customerOrders}
              config={{
                requireText: config.requireText,
                minTextLength: config.minTextLength,
                allowMedia: config.allowMedia,
                maxMediaPerReview: config.maxMediaPerReview,
              }}
            />
          </div>
        )}

        {/* Login prompt if guest reviews disabled */}
        {!canWriteReview && !customerId && (
          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-500 mb-4">רוצה לכתוב ביקורת?</p>
            <a 
              href={`/shops/${storeSlug}/login`}
              className="inline-block w-full max-w-xs px-8 py-3 bg-black text-white text-base font-medium hover:bg-gray-800 transition-colors"
            >
              התחבר לחשבון
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

