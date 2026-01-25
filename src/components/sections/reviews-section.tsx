/**
 * ReviewsSection - Server Component with optional Client Slider
 * ביקורות לקוחות - גריד כ-Server Component, סליידר כ-Client Component
 */

import { ReviewsSlider } from './reviews-slider';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
  avatar?: string;
  verified?: boolean;
}

interface ReviewsSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    reviews?: Review[];
  };
  settings: {
    columns?: number;
    mobileColumns?: number;
    showRating?: boolean;
    showDate?: boolean;
    showAvatar?: boolean;
    style?: 'cards' | 'minimal' | 'quotes';
    layout?: 'grid' | 'slider';
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    // Typography - Title (supports numeric px values)
    titleColor?: string;
    titleSize?: number;
    titleSizeMobile?: number;
    titleWeight?: string;
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    // Slider specific settings
    showArrows?: boolean;
    showDots?: boolean;
    arrowStyle?: 'circle' | 'square' | 'minimal';
    dotsStyle?: 'dots' | 'lines' | 'numbers';
    autoplay?: boolean;
    autoplayInterval?: number;
  };
  sectionId?: string;
}

// Star rating component - pure HTML/CSS
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

export function ReviewsSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId 
}: ReviewsSectionProps) {
  const columns = settings.columns || 3;
  const mobileColumns = settings.mobileColumns || 1;
  const showRating = settings.showRating !== false;
  const showDate = settings.showDate !== false;
  const showAvatar = settings.showAvatar !== false;
  const style = settings.style || 'cards';
  const layout = settings.layout || 'grid';
  const textAlign = settings.textAlign || 'center';
  const reviews = content.reviews || [];
  const isSlider = layout === 'slider';

  // Text alignment classes
  // Note: stored value 'left' = user selected ימין (visual RIGHT)
  //       stored value 'right' = user selected שמאל (visual LEFT)
  const alignClass = textAlign === 'left' ? 'text-right' : textAlign === 'right' ? 'text-left' : 'text-center';
  const itemAlignClass = alignClass;
  // For flex items in RTL: justify-start = visual right, justify-end = visual left
  const flexJustify = textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center';

  // Default reviews for preview/empty state
  const defaultReviews: Review[] = [
    { id: '1', author: 'שרה כ.', rating: 5, text: 'מוצר מעולה! איכות גבוהה ומשלוח מהיר. ממליצה בחום!', verified: true },
    { id: '2', author: 'דני מ.', rating: 5, text: 'שירות לקוחות אדיב ומקצועי. המוצר הגיע בזמן ובאריזה מושלמת.', verified: true },
    { id: '3', author: 'רונית ש.', rating: 4, text: 'איכות מעולה, בדיוק כמו בתמונות. אקנה שוב בהחלט!', verified: false },
  ];
  
  // Ensure all reviews have an id
  const displayReviews = (reviews.length > 0 ? reviews : defaultReviews).map((review, idx) => ({
    ...review,
    id: review.id || `review-${idx}`,
  }));

  // Dynamic grid classes based on columns settings
  const gridCols = `grid-cols-${mobileColumns} md:grid-cols-${columns}`;

  // Check for custom numeric font sizes
  const hasCustomTitleSize = typeof settings.titleSize === 'number';
  const hasCustomSubtitleSize = typeof settings.subtitleSize === 'number';
  const hasCustomSizes = hasCustomTitleSize || hasCustomSubtitleSize;

  return (
    <section 
      className="py-16 px-4 md:px-8"
      style={{ backgroundColor: settings.backgroundColor || '#f9fafb' }}
      data-section-id={sectionId}
      data-section-type="reviews"
      data-section-name="ביקורות"
      data-layout={layout}
    >
      {/* Scoped responsive styles for numeric font sizes */}
      {hasCustomSizes && (
        <style dangerouslySetInnerHTML={{ __html: `
          ${hasCustomTitleSize ? `
            [data-section-id="${sectionId}"] [data-section-title] {
              font-size: ${settings.titleSizeMobile || (settings.titleSize as number) * 0.7}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-title] {
                font-size: ${settings.titleSize}px !important;
              }
            }
          ` : ''}
          ${hasCustomSubtitleSize ? `
            [data-section-id="${sectionId}"] [data-section-subtitle] {
              font-size: ${settings.subtitleSizeMobile || (settings.subtitleSize as number) * 0.8}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-subtitle] {
                font-size: ${settings.subtitleSize}px !important;
              }
            }
          ` : ''}
        `}} />
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header - always centered, not affected by content alignment */}
        <div className="text-center mb-12">
          <h2 
            className={`${!hasCustomTitleSize ? 'text-2xl md:text-3xl' : ''} font-display ${settings.titleWeight ? `font-${settings.titleWeight}` : 'font-light'} tracking-wide mb-3`}
            style={{ 
              display: title ? '' : 'none',
              color: settings.titleColor || 'inherit',
            }}
            data-section-title
          >
            {title || ''}
          </h2>
          <p 
            className={`${!hasCustomSubtitleSize ? 'text-sm md:text-base' : ''} max-w-2xl mx-auto`}
            style={{ 
              display: subtitle ? '' : 'none',
              color: settings.subtitleColor || '#4b5563',
            }}
            data-section-subtitle
          >
            {subtitle || ''}
          </p>
        </div>

        {/* Reviews - Grid or Slider */}
        {isSlider ? (
          <ReviewsSlider 
            reviews={displayReviews}
            settings={{
              columns,
              mobileColumns,
              showRating,
              showAvatar,
              style,
              textAlign,
              showArrows: settings.showArrows,
              showDots: settings.showDots,
              arrowStyle: settings.arrowStyle,
              dotsStyle: settings.dotsStyle,
              autoplay: settings.autoplay,
              autoplayInterval: settings.autoplayInterval,
            }}
            sectionId={sectionId}
          />
        ) : (
          <div 
            className={`grid ${gridCols} gap-6`}
            data-reviews-grid
          >
            {displayReviews.map((review, index) => (
              <div 
                key={review.id}
                className={`
                  ${style === 'cards' ? 'bg-white p-6 rounded-lg shadow-sm border border-gray-100' : ''}
                  ${style === 'minimal' ? 'p-4 border-b border-gray-100' : ''}
                  ${style === 'quotes' ? 'p-6' : ''}
                  ${itemAlignClass}
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
                        <img src={review.avatar} alt={review.author || ''} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        review.author?.charAt(0) || '?'
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
                    {showDate && review.date && (
                      <div className="text-sm text-gray-500" data-review-date>{review.date}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
