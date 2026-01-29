/**
 * GoogleReviewsSection - Server Component
 * ביקורות גוגל בעיצוב רשמי עם סליידר
 */

import { GoogleReviewsSlider } from './google-reviews-slider';

export interface GoogleReview {
  id: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  relativeTime: string; // "2 לפני שנים"
  profileUrl?: string;
  images?: string[]; // Review images
}

interface GoogleReviewsSectionProps {
  title?: string | null;
  subtitle?: string | null;
  content: {
    // Google Account Connection
    googleAccountId?: string | null;
    // Business info (from Google API)
    businessName?: string;
    businessImage?: string;
    averageRating?: number;
    totalReviews?: number;
    googlePlaceUrl?: string;
    // Reviews (from Google API)
    reviews?: GoogleReview[];
  };
  settings: {
    // Layout
    layout?: 'full' | 'compact';
    backgroundColor?: string;
    cardStyle?: 'white' | 'transparent';
    // Slider
    columns?: number;
    mobileColumns?: number;
    showArrows?: boolean;
    showDots?: boolean;
    autoplay?: boolean;
    autoplayInterval?: number;
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
  };
  sectionId?: string;
}

// Google Logo
function GoogleLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// Star Rating - Google Style
function GoogleStars({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  return (
    <div className="flex gap-0.5" aria-label={`דירוג ${rating} מתוך 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${starSize} ${i < rating ? 'text-[#FBBC05]' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Verified Badge (Google style checkmark)
function VerifiedBadge() {
  return (
    <svg className="w-4 h-4 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );
}

// Avatar with initial letter
function ReviewerAvatar({ name, photo }: { name: string; photo?: string }) {
  // Generate consistent color based on name
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
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

// Not Connected Placeholder Component
function NotConnectedPlaceholder({ title, subtitle, backgroundColor }: { title?: string | null; subtitle?: string | null; backgroundColor: string }) {
  return (
    <div className="max-w-7xl mx-auto text-center py-12">
      <h2 className="text-2xl md:text-3xl font-medium mb-2">{title || 'ביקורות בגוגל'}</h2>
      {subtitle && <p className="text-gray-600 mb-8">{subtitle}</p>}
      
      <div className="flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
          <GoogleLogo size={40} />
        </div>
        <h3 className="text-xl font-medium text-gray-800 mb-2">לא מחובר לגוגל ביזנס</h3>
        <p className="text-gray-500 max-w-md">
          התחבר לחשבון Google Business שלך באדיטור כדי להציג ביקורות אמיתיות
        </p>
      </div>
    </div>
  );
}

export function GoogleReviewsSection({
  title,
  subtitle,
  content,
  settings,
  sectionId,
}: GoogleReviewsSectionProps) {
  const backgroundColor = settings.backgroundColor || '#fce7f3';
  const cardStyle = settings.cardStyle || 'white';
  
  // Check if connected (has googleAccountId and reviews)
  const isConnected = !!(content.googleAccountId);
  const hasReviews = content.reviews && content.reviews.length > 0;
  
  const businessName = content.businessName || '';
  const businessImage = content.businessImage;
  const averageRating = content.averageRating || 0;
  const totalReviews = content.totalReviews || 0;
  const reviews = content.reviews || [];
  const googlePlaceUrl = content.googlePlaceUrl;
  
  // Visibility classes
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';

  // If not connected or no reviews, don't render anything on storefront
  // (The editor will show a placeholder)
  if (!isConnected || !hasReviews) {
    return (
      <section
        className={`py-8 md:py-12 px-4 md:px-8 ${hideOnMobileClass} ${hideOnDesktopClass}`.trim()}
        style={{ backgroundColor }}
        data-section-id={sectionId}
        data-section-type="google-reviews"
        data-section-name="ביקורות גוגל"
        {...(settings.hideOnMobile && { 'data-hide-on-mobile': 'true' })}
        {...(settings.hideOnDesktop && { 'data-hide-on-desktop': 'true' })}
      >
        <NotConnectedPlaceholder title={title} subtitle={subtitle} backgroundColor={backgroundColor} />
      </section>
    );
  }

  return (
    <section
      className={`py-8 md:py-12 px-4 md:px-8 ${hideOnMobileClass} ${hideOnDesktopClass}`.trim()}
      style={{ backgroundColor }}
      data-section-id={sectionId}
      data-section-type="google-reviews"
      data-section-name="ביקורות גוגל"
      {...(settings.hideOnMobile && { 'data-hide-on-mobile': 'true' })}
      {...(settings.hideOnDesktop && { 'data-hide-on-desktop': 'true' })}
    >
      <div className="max-w-7xl mx-auto">
        {/* Title/Subtitle - with default */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-medium mb-2">{title || 'ביקורות בגוגל'}</h2>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Business Card - Left Side */}
          <div className="flex-shrink-0 w-full lg:w-64 bg-white rounded-xl p-6 shadow-sm text-center">
            {/* Business Image */}
            {businessImage && (
              <img 
                src={businessImage} 
                alt={businessName}
                className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            
            {/* Business Name */}
            <h3 className="font-medium text-gray-900 mb-2 text-lg leading-tight">
              {businessName}
            </h3>
            
            {/* Stars */}
            <div className="flex justify-center mb-1">
              <GoogleStars rating={Math.round(averageRating)} />
            </div>
            
            {/* Reviews Count */}
            <p className="text-sm text-gray-500 mb-4">
              Google {totalReviews} ביקורות
            </p>
            
            {/* Write Review Button */}
            {googlePlaceUrl && (
              <a
                href={googlePlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
              >
                כתוב ביקורת
              </a>
            )}
          </div>

          {/* Reviews Slider - Right Side */}
          <div className="flex-1 min-w-0">
            <GoogleReviewsSlider
              reviews={reviews}
              settings={{
                columns: settings.columns || 3,
                mobileColumns: settings.mobileColumns || 1,
                showArrows: settings.showArrows !== false,
                showDots: settings.showDots !== false,
                autoplay: settings.autoplay || false,
                autoplayInterval: settings.autoplayInterval || 5000,
                cardStyle,
              }}
              sectionId={sectionId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Export sub-components for potential reuse
export { GoogleLogo, GoogleStars, VerifiedBadge, ReviewerAvatar };

