'use client';

/**
 * Review List - Client Component
 * 
 * ⚡ Handles pagination and filtering
 * Initial reviews loaded server-side, more loaded on demand
 */

import { useState, useTransition } from 'react';
import { Star, Camera, Filter, ChevronDown } from 'lucide-react';
import { ReviewCard } from './review-card';
import type { ProductReview, ReviewMedia } from '@/lib/db/schema';

type ReviewWithMedia = ProductReview & {
  media?: ReviewMedia[];
  customerFirstName?: string | null;
  customerLastName?: string | null;
};

interface ReviewListProps {
  productId: string;
  storeId: string;
  initialReviews: ReviewWithMedia[];
  totalCount: number;
  pageSize?: number;
}

type SortOption = 'recent' | 'helpful' | 'rating_high' | 'rating_low';
type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';

export function ReviewList({ 
  productId, 
  storeId,
  initialReviews, 
  totalCount,
  pageSize = 5 
}: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewWithMedia[]>(initialReviews);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  
  // Filters
  const [sort, setSort] = useState<SortOption>('recent');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [withMedia, setWithMedia] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const hasMore = reviews.length < totalCount;

  // Load more reviews
  const loadMore = async () => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          productId,
          storeId,
          page: String(page + 1),
          limit: String(pageSize),
          sort,
          ...(ratingFilter !== 'all' && { rating: ratingFilter }),
          ...(withMedia && { withMedia: 'true' }),
        });

        const res = await fetch(`/api/reviews?${params}`);
        const data = await res.json();
        
        if (data.reviews) {
          setReviews(prev => [...prev, ...data.reviews]);
          setPage(p => p + 1);
        }
      } catch (error) {
        console.error('Error loading more reviews:', error);
      }
    });
  };

  // Apply filters (reset and reload)
  const applyFilters = async () => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          productId,
          storeId,
          page: '1',
          limit: String(pageSize),
          sort,
          ...(ratingFilter !== 'all' && { rating: ratingFilter }),
          ...(withMedia && { withMedia: 'true' }),
        });

        const res = await fetch(`/api/reviews?${params}`);
        const data = await res.json();
        
        if (data.reviews) {
          setReviews(data.reviews);
          setPage(1);
        }
      } catch (error) {
        console.error('Error filtering reviews:', error);
      }
    });
  };

  // Handle filter changes
  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setTimeout(applyFilters, 0);
  };

  const handleRatingChange = (newRating: RatingFilter) => {
    setRatingFilter(newRating);
    setTimeout(applyFilters, 0);
  };

  const handleMediaToggle = () => {
    setWithMedia(!withMedia);
    setTimeout(applyFilters, 0);
  };

  return (
    <div>
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 py-4 border-b border-gray-100">
        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="recent">חדש ביותר</option>
            <option value="helpful">הכי מועיל</option>
            <option value="rating_high">דירוג גבוה</option>
            <option value="rating_low">דירוג נמוך</option>
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Rating Filter */}
        <div className="relative">
          <select
            value={ratingFilter}
            onChange={(e) => handleRatingChange(e.target.value as RatingFilter)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">כל הדירוגים</option>
            <option value="5">5 כוכבים</option>
            <option value="4">4 כוכבים</option>
            <option value="3">3 כוכבים</option>
            <option value="2">2 כוכבים</option>
            <option value="1">1 כוכב</option>
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* With Media Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={withMedia}
            onChange={handleMediaToggle}
            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
          />
          <Camera className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">עם תמונות</span>
        </label>
      </div>

      {/* Reviews */}
      <div className="divide-y divide-gray-100">
        {reviews.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            לא נמצאו ביקורות התואמות לסינון
          </p>
        ) : (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="py-6 text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'טוען...' : 'טען עוד ביקורות'}
          </button>
        </div>
      )}
    </div>
  );
}

