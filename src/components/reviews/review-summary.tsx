/**
 * Review Summary - Server Component
 * 
 * ⚡ No hydration - pure HTML from server
 * Accepts pre-fetched summary OR loads from denormalized table
 */

import { db } from '@/lib/db';
import { productReviewSummary, ProductReviewSummary } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Star, Camera, CheckCircle } from 'lucide-react';

interface ReviewSummaryProps {
  productId: string;
  showWriteButton?: boolean;
  summary?: ProductReviewSummary | null; // Pre-fetched summary for optimization
}

// Fallback query (only if summary not provided)
async function getSummary(productId: string) {
  const [summary] = await db
    .select()
    .from(productReviewSummary)
    .where(eq(productReviewSummary.productId, productId))
    .limit(1);
  
  return summary;
}

export async function ReviewSummary({ productId, showWriteButton = true, summary: preloadedSummary }: ReviewSummaryProps) {
  // Use pre-fetched summary if provided, otherwise fetch
  const summary = preloadedSummary !== undefined ? preloadedSummary : await getSummary(productId);
  
  // No reviews yet
  if (!summary || summary.totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className="w-6 h-6 text-gray-200" />
          ))}
        </div>
        <p className="text-gray-500 mb-4">אין עדיין ביקורות למוצר זה</p>
        {showWriteButton && (
          <a 
            href="#write-review" 
            className="inline-block px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
          >
            כתוב ביקורת ראשונה
          </a>
        )}
      </div>
    );
  }

  const avgRating = Number(summary.averageRating);
  const ratings = [
    { stars: 5, count: summary.rating5Count },
    { stars: 4, count: summary.rating4Count },
    { stars: 3, count: summary.rating3Count },
    { stars: 2, count: summary.rating2Count },
    { stars: 1, count: summary.rating1Count },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 py-6">
      {/* Rating Overview */}
      <div className="text-center md:text-right md:w-48 shrink-0">
        <div className="text-5xl font-light mb-2">{avgRating.toFixed(1)}</div>
        <div className="flex justify-center md:justify-start gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Star 
              key={i} 
              className={`w-5 h-5 ${i <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">{summary.totalReviews} ביקורות</p>
        
        {/* Stats */}
        <div className="flex justify-center md:justify-start gap-4 mt-4 text-xs text-gray-500">
          {summary.withMediaCount > 0 && (
            <div className="flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              <span>{summary.withMediaCount}</span>
            </div>
          )}
          {summary.verifiedCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>{summary.verifiedCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating Bars */}
      <div className="flex-1 space-y-2">
        {ratings.map(({ stars, count }) => {
          const percent = summary.totalReviews > 0 
            ? Math.round((count / summary.totalReviews) * 100) 
            : 0;
          
          return (
            <div key={stars} className="flex items-center gap-3">
              <span className="w-3 text-sm text-gray-600">{stars}</span>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-10 text-xs text-gray-500 text-left">{percent}%</span>
            </div>
          );
        })}
      </div>

      {/* Write Review Button */}
      {showWriteButton && (
        <div className="md:w-40 shrink-0 flex items-center justify-center">
          <a 
            href="#write-review"
            className="w-full md:w-auto px-6 py-3 bg-black text-white text-sm text-center hover:bg-gray-800 transition-colors"
          >
            כתוב ביקורת
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Mini summary for product cards - Server Component
 */
export async function ReviewSummaryMini({ productId }: { productId: string }) {
  const summary = await getSummary(productId);
  
  if (!summary || summary.totalReviews === 0) {
    return null;
  }

  const avgRating = Number(summary.averageRating);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">({summary.totalReviews})</span>
    </div>
  );
}

