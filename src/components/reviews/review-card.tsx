/**
 * Review Card - Server Component
 * 
 * ⚡ Pure HTML, no hydration
 * Displays a single review with badges, media, and admin reply
 */

import { Star, CheckCircle, User, ThumbsUp } from 'lucide-react';
import { CloudinaryImage } from '@/components/cloudinary-image';
import type { ProductReview, ReviewMedia } from '@/lib/db/schema';

interface ReviewCardProps {
  review: ProductReview & {
    media?: ReviewMedia[];
    customerFirstName?: string | null;
    customerLastName?: string | null;
  };
  showHelpful?: boolean;
}

// Format date in Hebrew
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

// Get display name
function getDisplayName(review: ReviewCardProps['review']): string {
  if (review.customerName) return review.customerName;
  if (review.customerFirstName) {
    const lastName = review.customerLastName ? ` ${review.customerLastName.charAt(0)}.` : '';
    return `${review.customerFirstName}${lastName}`;
  }
  return 'לקוח אנונימי';
}

export function ReviewCard({ review, showHelpful = true }: ReviewCardProps) {
  const displayName = getDisplayName(review);
  const badges = review.badges || [];

  return (
    <div className="border-b border-gray-100 py-6 last:border-0">
      {/* Header: Rating + Title + Date */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          {/* Stars */}
          <div className="flex gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          {/* Title */}
          {review.title && (
            <h4 className="font-medium text-gray-900">{review.title}</h4>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {formatDate(review.createdAt)}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {review.isVerifiedPurchase && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            רכישה מאומתת
          </span>
        )}
        {review.rating >= 4 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full">
            <Star className="w-3 h-3 fill-current" />
            ממליץ
          </span>
        )}
        {badges.includes('editors-pick') && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
            👑 בחירת העורך
          </span>
        )}
        {badges.includes('top-reviewer') && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full">
            🏆 מבקר מוביל
          </span>
        )}
        {badges.includes('helpful') && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">
            👍 מועיל במיוחד
          </span>
        )}
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
        <User className="w-4 h-4" />
        <span>{displayName}</span>
      </div>

      {/* Content */}
      {review.content && (
        <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
          {review.content}
        </p>
      )}

      {/* Pros & Cons */}
      {(review.pros || review.cons) && (
        <div className="flex flex-col sm:flex-row gap-4 mb-4 text-sm">
          {review.pros && (
            <div className="flex-1">
              <span className="text-green-600 font-medium">✓ מה אהבתי:</span>
              <span className="text-gray-600 mr-2">{review.pros}</span>
            </div>
          )}
          {review.cons && (
            <div className="flex-1">
              <span className="text-red-600 font-medium">✗ מה פחות:</span>
              <span className="text-gray-600 mr-2">{review.cons}</span>
            </div>
          )}
        </div>
      )}

      {/* Media */}
      {review.media && review.media.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {review.media.map((m) => (
            <div 
              key={m.id} 
              className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100"
            >
              {m.type === 'image' ? (
                <CloudinaryImage
                  src={m.url}
                  alt="תמונת ביקורת"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={m.url}
                  className="w-full h-full object-cover"
                  poster={m.thumbnailUrl || undefined}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helpful Button */}
      {showHelpful && (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <button 
            className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
            data-review-id={review.id}
            data-action="helpful"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>מועיל ({review.helpfulCount})</span>
          </button>
        </div>
      )}

      {/* Admin Reply */}
      {review.adminReply && (
        <div className="mt-4 mr-4 p-4 bg-gray-50 rounded-lg border-r-2 border-gray-300">
          <p className="text-sm font-medium text-gray-700 mb-1">תגובת בעל החנות</p>
          <p className="text-sm text-gray-600">{review.adminReply}</p>
          {review.adminReplyAt && (
            <p className="text-xs text-gray-400 mt-2">
              {formatDate(review.adminReplyAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

