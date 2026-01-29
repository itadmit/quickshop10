'use client';

/**
 * GoogleReviewsSlider - Client Component
 * סליידר ביקורות גוגל עם עיצוב גוגל רשמי
 */

import { useState } from 'react';
import { AutoSlider } from '@/components/ui/slider';
import type { SliderSettings } from '@/components/ui/slider';
import type { GoogleReview } from './google-reviews-section';

interface GoogleReviewsSliderProps {
  reviews: GoogleReview[];
  settings: {
    columns?: number;
    mobileColumns?: number;
    showArrows?: boolean;
    showDots?: boolean;
    autoplay?: boolean;
    autoplayInterval?: number;
    cardStyle?: 'white' | 'transparent';
  };
  sectionId?: string;
}

// Google Logo Component
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// Star Rating - Google Style (Yellow)
function GoogleStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`דירוג ${rating} מתוך 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-[#FBBC05]' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Verified Badge (Google blue checkmark)
function VerifiedBadge() {
  return (
    <svg className="w-4 h-4 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );
}

// Avatar with initial letter and random color
function ReviewerAvatar({ name, photo }: { name: string; photo?: string }) {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500'
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  if (photo) {
    return (
      <img 
        src={photo} 
        alt={name}
        className="w-10 h-10 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  
  return (
    <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-medium text-lg`}>
      {name.charAt(0)}
    </div>
  );
}

// Single Review Card
function ReviewCard({ 
  review, 
  cardStyle,
  onReadMore 
}: { 
  review: GoogleReview; 
  cardStyle: 'white' | 'transparent';
  onReadMore?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 100;
  const isLong = review.text.length > maxLength;
  const displayText = expanded || !isLong ? review.text : review.text.slice(0, maxLength) + '...';
  
  return (
    <div 
      className={`h-full min-h-[200px] w-full p-5 rounded-xl flex flex-col ${
        cardStyle === 'white' 
          ? 'bg-white shadow-sm border border-gray-100' 
          : 'bg-white/80 backdrop-blur'
      }`}
    >
      {/* Header: Google Logo + Author */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <ReviewerAvatar name={review.authorName} photo={review.authorPhoto} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-gray-900 text-sm">{review.authorName}</span>
              <VerifiedBadge />
            </div>
            <span className="text-xs text-gray-500">{review.relativeTime}</span>
          </div>
        </div>
        <GoogleLogo size={24} />
      </div>
      
      {/* Stars */}
      <div className="mb-3">
        <GoogleStars rating={review.rating} />
      </div>
      
      {/* Review Text */}
      <p className="text-gray-700 text-sm leading-relaxed">
        {displayText}
      </p>
      
      {/* Read More */}
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[#1a73e8] text-sm mt-2 hover:underline"
        >
          קרא עוד
        </button>
      )}
      
      {/* Review Images (if any) */}
      {review.images && review.images.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.images.slice(0, 3).map((img, i) => (
            <img 
              key={i}
              src={img} 
              alt=""
              className="w-16 h-16 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
          ))}
          {review.images.length > 3 && (
            <div className="w-16 h-16 rounded-lg bg-gray-800/70 flex items-center justify-center text-white font-medium">
              +{review.images.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GoogleReviewsSlider({ reviews, settings, sectionId }: GoogleReviewsSliderProps) {
  const sliderSettings: Partial<SliderSettings> = {
    itemsPerView: settings.columns || 3,
    itemsPerViewMobile: settings.mobileColumns || 1,
    itemsPerViewTablet: 2,
    scrollBy: 1,
    showArrows: settings.showArrows !== false,
    showDots: settings.showDots !== false,
    arrowPosition: 'outside',
    arrowStyle: 'minimal',
    dotsPosition: 'bottom',
    dotsStyle: 'dots',
    gap: 16,
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
        <div key={review.id || index} className="h-full">
          <ReviewCard
            review={review}
            cardStyle={settings.cardStyle || 'white'}
          />
        </div>
      ))}
    </AutoSlider>
  );
}

