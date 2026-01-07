/**
 * Single Review Admin Page
 * 
 * ⚡ Server Component with client islands for interactions
 * Edit review, add badges, reply, delete
 */

import { db } from '@/lib/db';
import { 
  productReviews, 
  products, 
  customers,
  reviewMedia,
  productImages,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStoreBySlug } from '@/lib/db/queries';
import { Star, ArrowRight, CheckCircle, Camera, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { CloudinaryImage } from '@/components/cloudinary-image';
import { ReviewEditForm } from './review-edit-form';

// Format date helper
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) return <div>חנות לא נמצאה</div>;

  // Fetch review with all related data
  const [review] = await db
    .select({
      id: productReviews.id,
      rating: productReviews.rating,
      title: productReviews.title,
      content: productReviews.content,
      pros: productReviews.pros,
      cons: productReviews.cons,
      isVerifiedPurchase: productReviews.isVerifiedPurchase,
      isApproved: productReviews.isApproved,
      isFeatured: productReviews.isFeatured,
      badges: productReviews.badges,
      helpfulCount: productReviews.helpfulCount,
      notHelpfulCount: productReviews.notHelpfulCount,
      adminReply: productReviews.adminReply,
      adminReplyAt: productReviews.adminReplyAt,
      customerName: productReviews.customerName,
      customerEmail: productReviews.customerEmail,
      createdAt: productReviews.createdAt,
      updatedAt: productReviews.updatedAt,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerEmailFromCustomer: customers.email,
    })
    .from(productReviews)
    .leftJoin(products, eq(productReviews.productId, products.id))
    .leftJoin(customers, eq(productReviews.customerId, customers.id))
    .where(and(
      eq(productReviews.id, id),
      eq(productReviews.storeId, store.id)
    ))
    .limit(1);

  if (!review) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-600">הביקורת לא נמצאה</h2>
          <Link
            href={`/shops/${slug}/admin/plugins/product-reviews`}
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            חזרה לרשימה
          </Link>
        </div>
      </div>
    );
  }

  // Fetch media
  const media = await db
    .select()
    .from(reviewMedia)
    .where(eq(reviewMedia.reviewId, id))
    .orderBy(reviewMedia.sortOrder);

  const displayName = review.customerName 
    || (review.customerFirstName 
        ? `${review.customerFirstName} ${review.customerLastName || ''}`
        : review.customerEmail || review.customerEmailFromCustomer || 'אנונימי'
    );

  return (
    <div className="p-6 max-w-4xl">
      {/* Back Link */}
      <Link
        href={`/shops/${slug}/admin/plugins/product-reviews`}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לרשימת הביקורות
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex gap-6">

          <div className="flex-1">
            {/* Product Name */}
            <Link
              href={`/shops/${slug}/admin/products/${review.productId}`}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              {review.productName}
            </Link>

            {/* Rating */}
            <div className="flex gap-1 mt-2 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star 
                  key={i} 
                  className={`w-6 h-6 ${
                    i <= review.rating 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Title */}
            {review.title && (
              <h1 className="text-xl font-bold">{review.title}</h1>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col items-end gap-2">
            {review.isApproved ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                מאושר
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                ממתין לאישור
              </span>
            )}
            {review.isFeatured && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                מומלץ
              </span>
            )}
            {review.isVerifiedPurchase && (
            <span className="px-3 py-1 bg-green-50 text-green-600 text-sm rounded-full inline-flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              רכישה מאומתת
            </span>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>{displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(review.createdAt)}</span>
        </div>
          {(review.helpfulCount > 0 || review.notHelpfulCount > 0) && (
            <div className="flex items-center gap-2">
              <span>👍 {review.helpfulCount}</span>
              <span>👎 {review.notHelpfulCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-medium mb-4">תוכן הביקורת</h2>
        
        {review.content ? (
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {review.content}
          </p>
        ) : (
          <p className="text-gray-400 italic">אין תוכן טקסט</p>
        )}

        {/* Pros & Cons */}
        {(review.pros || review.cons) && (
          <div className="flex gap-6 mt-6 pt-4 border-t">
            {review.pros && (
              <div className="flex-1">
                <span className="text-green-600 font-medium text-sm">✓ מה אהב:</span>
                <p className="text-gray-600 mt-1">{review.pros}</p>
              </div>
            )}
            {review.cons && (
              <div className="flex-1">
                <span className="text-red-600 font-medium text-sm">✗ מה פחות:</span>
                <p className="text-gray-600 mt-1">{review.cons}</p>
              </div>
            )}
          </div>
        )}

        {/* Media */}
        {media.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              תמונות ווידאו ({media.length})
            </h3>
            <div className="flex gap-3 flex-wrap">
              {media.map(m => (
                <div 
                  key={m.id}
                  className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 relative group"
                >
                  {m.type === 'image' ? (
                    <CloudinaryImage
                      src={m.url}
                      alt="תמונת ביקורת"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={m.url}
                      className="w-full h-full object-cover"
                      poster={m.thumbnailUrl || undefined}
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Admin Actions */}
      <ReviewEditForm
        review={{
          id: review.id,
          isApproved: review.isApproved,
          isFeatured: review.isFeatured,
          badges: review.badges || [],
          adminReply: review.adminReply || '',
        }}
        storeId={store.id}
        storeSlug={slug}
      />
    </div>
  );
}

