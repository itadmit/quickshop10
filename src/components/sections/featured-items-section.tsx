/**
 * FeaturedItemsSection - Simple Image Cards with Names
 * 
 * Perfect for "Our Best Sellers", "Featured Products", etc.
 * Simple clickable cards with:
 * - Image
 * - Name below
 * - Link
 * 
 * Live editor support with data-* attributes
 */

import Link from 'next/link';

interface FeaturedItem {
  id: string;
  name: string;
  imageUrl?: string;
  videoUrl?: string;
  link: string;
}

interface FeaturedItemsSectionProps {
  title?: string | null;
  subtitle?: string | null;
  content: {
    items: FeaturedItem[];
  };
  settings: {
    columns?: 2 | 3 | 4;
    imageAspectRatio?: 'square' | 'portrait' | 'landscape';
    textAlign?: 'right' | 'center' | 'left';
    sectionBackground?: string;
    cardBackground?: string;
    textColor?: string;
    hoverEffect?: 'zoom' | 'lift' | 'none';
    imageStyle?: 'rounded' | 'square' | 'circle';
  };
  basePath: string;
  sectionId?: string;
}

export function FeaturedItemsSection({ 
  title, 
  subtitle, 
  content, 
  settings, 
  basePath, 
  sectionId 
}: FeaturedItemsSectionProps) {
  const columns = settings.columns || 3;
  const aspectRatio = settings.imageAspectRatio || 'square';
  const textAlign = settings.textAlign || 'center';
  const sectionBg = settings.sectionBackground || '#ffffff';
  const cardBg = settings.cardBackground || 'transparent';
  const textColor = settings.textColor || '#1f2937';
  const hoverEffect = settings.hoverEffect || 'zoom';
  const imageStyle = settings.imageStyle || 'rounded';

  const gridCols = columns === 2 
    ? 'md:grid-cols-2' 
    : columns === 4 
      ? 'md:grid-cols-2 lg:grid-cols-4'
      : 'md:grid-cols-3';

  const aspectClass = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-video',
  }[aspectRatio];

  const alignClass = {
    right: 'text-right',
    center: 'text-center',
    left: 'text-left',
  }[textAlign];

  const imageRoundedClass = {
    rounded: 'rounded-xl',
    square: 'rounded-none',
    circle: 'rounded-full',
  }[imageStyle];

  const hoverImageClass = {
    zoom: 'group-hover:scale-105',
    lift: '',
    none: '',
  }[hoverEffect];

  const hoverCardClass = {
    zoom: '',
    lift: 'hover:-translate-y-2 hover:shadow-lg',
    none: '',
  }[hoverEffect];

  return (
    <section 
      className="w-full py-16 px-4 md:px-10"
      style={{ backgroundColor: sectionBg }}
      data-section-id={sectionId}
      data-section-name="פריטים מובילים"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section Header - always rendered for live editor */}
        <div className={`mb-12 ${alignClass}`} style={{ display: (title || subtitle) ? '' : 'none' }}>
          <h2 
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ color: textColor, display: title ? '' : 'none' }}
            data-section-title
          >
            {title || ''}
          </h2>
          <p 
            className="text-gray-600"
            style={{ display: subtitle ? '' : 'none' }}
            data-section-subtitle
          >
            {subtitle || ''}
          </p>
        </div>

        {/* Items Grid */}
        <div className={`grid grid-cols-2 ${gridCols} gap-6 md:gap-8`}>
          {content.items.map((item, index) => {
            const href = item.link.startsWith('/') ? `${basePath}${item.link}` : item.link;
            
            return (
              <Link
                key={item.id}
                href={href}
                className={`group block transition-all duration-300 ${hoverCardClass}`}
                style={{ animationDelay: `${index * 100}ms` }}
                data-item-id={item.id}
              >
                {/* Image/Video Container */}
                <div 
                  className={`relative ${aspectClass} overflow-hidden mb-4 ${imageRoundedClass}`}
                  style={{ backgroundColor: cardBg || '#f3f4f6' }}
                >
                  {item.videoUrl ? (
                    <video 
                      src={item.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className={`w-full h-full object-cover transition-transform duration-500 ${hoverImageClass}`}
                    />
                  ) : item.imageUrl ? (
                    <img 
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${hoverImageClass}`}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center transition-transform duration-500 ${hoverImageClass}`}>
                      <span className="text-4xl opacity-30">📦</span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 
                  className={`font-medium text-base md:text-lg transition-colors ${alignClass}`}
                  style={{ color: textColor }}
                  data-item-name
                >
                  {item.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
