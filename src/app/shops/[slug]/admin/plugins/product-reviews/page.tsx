/**
 * Product Reviews Admin - Main Page
 * 
 * ⚡ Server Component - No hydration for the list
 * Displays all reviews with filters and bulk actions
 */

import { db } from '@/lib/db';
import { 
  productReviews, 
  products, 
  customers,
  reviewMedia,
} from '@/lib/db/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { Star, CheckCircle, Clock, Trash2, Eye, MessageSquare, Image } from 'lucide-react';
import Link from 'next/link';
import { ReviewsListActions } from './reviews-list-actions';

// Format relative time helper
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(new Date(date));
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; rating?: string; page?: string }>;
}

export default async function ProductReviewsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { status = 'all', rating = 'all', page = '1' } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) return <div>חנות לא נמצאה</div>;

  const pageNum = parseInt(page);
  const pageSize = 20;
  const offset = (pageNum - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(productReviews.storeId, store.id)];
  
  if (status === 'pending') {
    conditions.push(eq(productReviews.isApproved, false));
  } else if (status === 'approved') {
    conditions.push(eq(productReviews.isApproved, true));
  }
  
  if (rating !== 'all') {
    conditions.push(eq(productReviews.rating, parseInt(rating)));
  }

  // Fetch reviews with related data
  const reviews = await db
    .select({
      id: productReviews.id,
      rating: productReviews.rating,
      title: productReviews.title,
      content: productReviews.content,
      isVerifiedPurchase: productReviews.isVerifiedPurchase,
      isApproved: productReviews.isApproved,
      isFeatured: productReviews.isFeatured,
      badges: productReviews.badges,
      helpfulCount: productReviews.helpfulCount,
      adminReply: productReviews.adminReply,
      createdAt: productReviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerEmail: customers.email,
    })
    .from(productReviews)
    .leftJoin(products, eq(productReviews.productId, products.id))
    .leftJoin(customers, eq(productReviews.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(productReviews.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get media counts for each review
  const reviewIds = reviews.map(r => r.id);
  const mediaCounts = reviewIds.length > 0
    ? await db
        .select({
          reviewId: reviewMedia.reviewId,
          count: count(),
        })
        .from(reviewMedia)
        .where(sql`${reviewMedia.reviewId} IN ${reviewIds}`)
        .groupBy(reviewMedia.reviewId)
    : [];

  const mediaCountMap = new Map(mediaCounts.map(m => [m.reviewId, m.count]));

  // Get total counts for tabs
  const [totalCounts] = await db
    .select({
      all: count(),
      pending: sql<number>`COUNT(*) FILTER (WHERE ${productReviews.isApproved} = false)`,
      approved: sql<number>`COUNT(*) FILTER (WHERE ${productReviews.isApproved} = true)`,
    })
    .from(productReviews)
    .where(eq(productReviews.storeId, store.id));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">ביקורות מוצרים</h1>
          <p className="text-gray-500 text-sm mt-1">
            נהל ביקורות, אשר ביקורות חדשות והגב ללקוחות
          </p>
        </div>
        <Link
          href={`/shops/${slug}/admin/plugins/product-reviews/settings`}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          הגדרות
        </Link>
      </div>

      {/* Stats Tabs */}
      <div className="flex gap-2 mb-6">
        <Link
          href={`/shops/${slug}/admin/plugins/product-reviews?status=all`}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            status === 'all'
              ? 'bg-black text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          הכל ({totalCounts?.all || 0})
        </Link>
        <Link
          href={`/shops/${slug}/admin/plugins/product-reviews?status=pending`}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            status === 'pending'
              ? 'bg-black text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            ממתינים ({totalCounts?.pending || 0})
          </span>
        </Link>
        <Link
          href={`/shops/${slug}/admin/plugins/product-reviews?status=approved`}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            status === 'approved'
              ? 'bg-black text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            מאושרים ({totalCounts?.approved || 0})
          </span>
        </Link>
      </div>

      {/* Rating Filter */}
      <div className="flex gap-2 mb-6">
        <span className="text-sm text-gray-500 ml-2">סנן לפי דירוג:</span>
        {['all', '5', '4', '3', '2', '1'].map(r => (
          <Link
            key={r}
            href={`/shops/${slug}/admin/plugins/product-reviews?status=${status}&rating=${r}`}
            className={`px-3 py-1 rounded text-sm ${
              rating === r
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {r === 'all' ? 'הכל' : `${r}⭐`}
          </Link>
        ))}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">אין ביקורות</h3>
          <p className="text-gray-500 text-sm">עדיין לא התקבלו ביקורות התואמות לסינון זה</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y">
          {reviews.map(review => {
            const mediaCount = mediaCountMap.get(review.id) || 0;
            
            return (
              <div key={review.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex gap-4">
                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        {/* Stars */}
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i <= review.rating 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {review.title && (
                          <h4 className="font-medium">{review.title}</h4>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {review.isApproved ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            מאושר
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            ממתין
                          </span>
                        )}
                        {review.isFeatured && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            מומלץ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded">
                          <CheckCircle className="w-3 h-3" />
                          רכישה מאומתת
                        </span>
                      )}
                      {mediaCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                          <Image className="w-3 h-3" />
                          {mediaCount} תמונות
                        </span>
                      )}
                      {review.adminReply && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          <MessageSquare className="w-3 h-3" />
                          יש תגובת מנהל
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    {review.content && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {review.content}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {review.customerFirstName 
                          ? `${review.customerFirstName} ${review.customerLastName?.charAt(0) || ''}.`
                          : review.customerEmail || 'אנונימי'
                        }
                      </span>
                      <span>•</span>
                      <span>{review.productName}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(review.createdAt)}</span>
                      {review.helpfulCount > 0 && (
                        <>
                          <span>•</span>
                          <span>👍 {review.helpfulCount}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/shops/${slug}/admin/plugins/product-reviews/${review.id}`}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="צפייה ועריכה"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <ReviewsListActions
                      reviewId={review.id}
                      storeId={store.id}
                      storeSlug={slug}
                      isApproved={review.isApproved}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalCounts && Number(totalCounts.all) > pageSize && (
        <div className="flex justify-center gap-2 mt-6">
          {pageNum > 1 && (
            <Link
              href={`/shops/${slug}/admin/plugins/product-reviews?status=${status}&rating=${rating}&page=${pageNum - 1}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              הקודם
            </Link>
          )}
          <span className="px-4 py-2 text-gray-500">
            עמוד {pageNum}
          </span>
          {offset + pageSize < Number(totalCounts.all) && (
            <Link
              href={`/shops/${slug}/admin/plugins/product-reviews?status=${status}&rating=${rating}&page=${pageNum + 1}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              הבא
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

