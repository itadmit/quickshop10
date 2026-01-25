'use client';

/**
 * ReviewsSlider - Client Component for Reviews Slider
 * מציג ביקורות בסליידר עם חצים ונקודות
 */

import { AutoSlider, SliderArrows, SliderDots, SliderTrack } from '@/components/ui/slider';
import type { SliderSettings } from '@/components/ui/slider';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
  avatar?: string;
  verified?: boolean;
}

interface ReviewsSliderProps {
  reviews: Review[];
  settings: {
    columns?: number;
    mobileColumns?: number;
    showRating?: boolean;
    showAvatar?: boolean;
    style?: 'cards' | 'minimal' | 'quotes';
    textAlign?: 'left' | 'center' | 'right';
    showArrows?: boolean;
    showDots?: boolean;
    arrowStyle?: 'circle' | 'square' | 'minimal';
    dotsStyle?: 'dots' | 'lines' | 'numbers';
    gap?: number;
    autoplay?: boolean;
    autoplayInterval?: number;
  };
  sectionId?: string;
}

// Star rating component
function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`דירוג ${rating} מתוך ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsSlider({ reviews, settings, sectionId }: ReviewsSliderProps) {
  const showRating = settings.showRating !== false;
  const showAvatar = settings.showAvatar !== false;
  const style = settings.style || 'cards';
  const textAlign = settings.textAlign || 'center';
  
  // Text alignment classes
  const alignClass = textAlign === 'left' ? 'text-right' : textAlign === 'right' ? 'text-left' : 'text-center';
  const flexJustify = textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center';

  // Slider settings
  const sliderSettings: Partial<SliderSettings> = {
    itemsPerView: settings.columns || 3,
    itemsPerViewMobile: settings.mobileColumns || 1,
    itemsPerViewTablet: 2,
    scrollBy: 1,
    showArrows: settings.showArrows !== false,
    showDots: settings.showDots !== false,
    arrowPosition: 'inside',
    arrowStyle: settings.arrowStyle || 'circle',
    dotsPosition: 'bottom',
    dotsStyle: settings.dotsStyle || 'dots',
    gap: settings.gap || 24,
    autoplay: settings.autoplay || false,
    autoplayInterval: settings.autoplayInterval || 5000,
    loop: true,
  };

  return (
    <AutoSlider 
      settings={sliderSettings}
      data-slider-id={sectionId}
      className="relative"
    >
      {reviews.map((review, index) => (
        <div
          key={review.id}
          className={`
            h-full
            ${style === 'cards' ? 'bg-white p-6 rounded-lg shadow-sm border border-gray-100' : ''}
            ${style === 'minimal' ? 'p-4 border-b border-gray-100' : ''}
            ${style === 'quotes' ? 'p-6' : ''}
            ${alignClass}
          `}
          data-review-index={index}
          data-review-id={review.id}
        >
          {/* Quote icon for quotes style */}
          {style === 'quotes' && (
            <svg className="w-8 h-8 text-gray-200 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          )}

          {/* Rating */}
          {showRating && (
            <div className={`mb-3 flex ${flexJustify}`} data-review-rating={review.rating}>
              <Stars rating={review.rating} />
            </div>
          )}

          {/* Review Text */}
          <p 
            className={`text-gray-700 mb-4 ${style === 'quotes' ? 'text-lg italic' : ''}`}
            data-review-text
          >
            "{review.text}"
          </p>

          {/* Author */}
          <div className={`flex items-center gap-3 ${flexJustify}`}>
            {showAvatar && (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium" data-review-avatar>
                {review.avatar ? (
                  <img src={review.avatar} alt={review.author} className="w-full h-full rounded-full object-cover" />
                ) : (
                  review.author.charAt(0)
                )}
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-2" data-review-author>
                {review.author}
                {review.verified && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {review.date && (
                <div className="text-sm text-gray-500" data-review-date>{review.date}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </AutoSlider>
  );
}

