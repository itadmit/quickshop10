/**
 * SeriesGridSection - Elegant Product Series Grid (Action Cards)
 * 
 * This is NOT linked to actual categories - it's a standalone action cards section.
 * Each card has its own:
 * - Image (uploaded by user)
 * - Title
 * - Subtitle (eyebrow text)
 * - Description
 * - Link
 * 
 * Supports two styles:
 * - 'overlay' (default): Full background with hover overlay reveal
 * - 'cards': Image on top, text content below (clean card style)
 */

import Link from 'next/link';

interface SeriesItem {
  id: string;
  title: string;
  subtitle?: string;      // Small eyebrow text above title
  description?: string;
  imageUrl?: string;      // Image for this card (uploaded by user)
  gradientFrom?: string;  // Fallback gradient if no image
  gradientTo?: string;
  icon?: string;          // Emoji/icon for gradient fallback
  link: string;
}

interface SeriesGridSectionProps {
  title?: string | null;
  subtitle?: string | null;
  content: {
    items: SeriesItem[];
  };
  settings: {
    style?: 'overlay' | 'cards';
    columns?: 2 | 3 | 4;
    mobileColumns?: 1 | 2;         // Mobile columns (1 or 2)
    cardHeight?: string;           // Card height for overlay style
    minImageHeight?: string;       // Min height for cards style images
    sectionBackground?: string;
    accentColor?: string;
    buttonText?: string;
    cardBackground?: string;
    layout?: 'uniform' | 'featured';
    imageAspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
    showDescriptionAlways?: boolean; // Show description always (not just on hover)
    roundedCorners?: boolean;      // Rounded corners for cards (default: true)
  };
  basePath: string;
  sectionId?: string;
}

export function SeriesGridSection({ 
  title, 
  subtitle, 
  content, 
  settings, 
  basePath, 
  sectionId 
}: SeriesGridSectionProps) {
  const style = settings.style || 'overlay';
  const columns = settings.columns || 3;
  const mobileColumns = settings.mobileColumns || 1;
  const cardHeight = settings.cardHeight || '400px';
  const minImageHeight = settings.minImageHeight || '200px';
  const sectionBg = settings.sectionBackground || '#ffffff';
  const accentColor = settings.accentColor || '#d4af37';
  const buttonText = settings.buttonText || '';  // Empty by default = no button
  const cardBg = settings.cardBackground || '#f9f7f4';
  const layout = settings.layout || 'uniform';
  const imageAspectRatio = settings.imageAspectRatio || 'auto';
  const showDescriptionAlways = settings.showDescriptionAlways || false;
  const roundedCorners = settings.roundedCorners !== false; // Default: true
  
  // Rounded corners class
  const roundedClass = roundedCorners ? 'rounded-2xl' : 'rounded-none';

  // Mobile grid (1 or 2 columns)
  const mobileGridCols = mobileColumns === 2 ? 'grid-cols-2' : 'grid-cols-1';
  
  // Desktop grid
  const gridCols = columns === 2 
    ? `${mobileGridCols} md:grid-cols-2` 
    : columns === 4 
      ? `${mobileGridCols} md:grid-cols-2 lg:grid-cols-4`
      : `${mobileGridCols} md:grid-cols-2 lg:grid-cols-3`;

  // Aspect ratio classes for cards style
  const getAspectClass = () => {
    switch (imageAspectRatio) {
      case 'square': return 'aspect-square';
      case 'portrait': return 'aspect-[3/4]';
      case 'landscape': return 'aspect-video';
      default: return '';
    }
  };

  return (
    <section 
      className="w-full py-20 px-4 md:px-10"
      style={{ backgroundColor: sectionBg }}
      data-section-id={sectionId}
      data-section-name="גריד סדרות"
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16" style={{ display: (title || subtitle) ? '' : 'none' }}>
          <span 
            className="font-bold tracking-[0.2em] uppercase text-sm"
            style={{ color: accentColor, display: subtitle ? '' : 'none' }}
            data-section-subtitle
            data-accent-color
          >
            {subtitle}
          </span>
          <h2 
            className="text-4xl md:text-5xl font-black mt-3 text-gray-900"
            style={{ display: title ? '' : 'none' }}
            data-section-title
          >
            {title}
          </h2>
          <div 
            className="w-20 h-1 mx-auto mt-6"
            style={{ backgroundColor: accentColor }}
            data-accent-color-bg
          />
        </div>

        {/* Cards Grid - Overlay Style */}
        {style === 'overlay' && (
          <div className={`grid grid-cols-1 ${gridCols} gap-8`} data-items-grid>
            {content.items.map((item, index) => (
              <Link
                key={item.id}
                href={item.link.startsWith('/') ? `${basePath}${item.link}` : item.link}
                className={`group relative overflow-hidden ${roundedClass} shadow-lg hover:shadow-2xl transition-all duration-500`}
                style={{ animationDelay: `${index * 100}ms` }}
                data-item-id={item.id}
              >
                {/* Background - Image or Gradient */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ 
                    backgroundImage: item.imageUrl 
                      ? `url("${item.imageUrl}")` 
                      : `linear-gradient(to bottom right, ${item.gradientFrom || '#5e5e8b'}, ${item.gradientTo || '#2a2a4a'})`
                  }}
                  data-item-bg
                />
                
                {/* Icon (for gradient backgrounds) */}
                {item.icon && !item.imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <span className="text-9xl text-white">{item.icon}</span>
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300" />
                
                {/* Content */}
                <div 
                  className="relative p-8 flex flex-col justify-end text-white"
                  style={{ height: cardHeight }}
                >
                  {/* Subtitle - always render for live updates */}
                  <span 
                    className="text-xs font-bold tracking-wider uppercase mb-2"
                    style={{ color: accentColor, display: item.subtitle ? '' : 'none' }}
                    data-item-subtitle
                  >
                    {item.subtitle}
                  </span>
                  
                  <h3 className="text-2xl font-bold mb-2" data-item-title>{item.title}</h3>
                  
                  {/* Description - always render for live updates */}
                  <p 
                    className={`text-gray-200 mb-4 transition-all duration-300 ${
                      showDescriptionAlways 
                        ? 'opacity-100' 
                        : 'opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0'
                    }`}
                    style={{ display: item.description ? '' : 'none' }}
                    data-item-description
                  >
                    {item.description}
                  </p>
                  
                  {buttonText && (
                    <span 
                      className="w-fit bg-white/20 backdrop-blur-sm border border-white/40 group-hover:bg-white group-hover:text-black text-white px-6 py-2 rounded-full text-sm font-bold transition-all"
                      data-card-button
                    >
                      {buttonText}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Cards Grid - Cards Style (Image top, text below) */}
        {style === 'cards' && (
          <div className={`grid grid-cols-1 ${layout === 'featured' ? 'md:grid-cols-2 lg:grid-cols-3' : gridCols} gap-8`} data-items-grid>
            {content.items.map((item, index) => {
              const isLarge = layout === 'featured' && index < 2;
              
              return (
                <div
                  key={item.id}
                  className={`
                    group overflow-hidden ${roundedClass} shadow-sm hover:shadow-xl transition-all duration-300
                    ${layout === 'featured' && index < 2 ? 'lg:col-span-1' : ''}
                  `}
                  style={{ 
                    backgroundColor: cardBg,
                    animationDelay: `${index * 100}ms` 
                  }}
                  data-item-id={item.id}
                >
                  {/* Image Container */}
                  <div 
                    className={`relative overflow-hidden ${getAspectClass()}`}
                    style={{ minHeight: imageAspectRatio === 'auto' ? minImageHeight : undefined }}
                  >
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ 
                        backgroundImage: item.imageUrl 
                          ? `url("${item.imageUrl}")` 
                          : `linear-gradient(to bottom right, ${item.gradientFrom || '#5e5e8b'}, ${item.gradientTo || '#2a2a4a'})`
                      }}
                      data-item-bg
                    >
                      {item.icon && !item.imageUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl opacity-60">{item.icon}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Text Content */}
                  <div className="p-6">
                    {/* Eyebrow / Subtitle - always render for live updates */}
                    <span 
                      className="text-xs font-bold tracking-wider uppercase"
                      style={{ color: accentColor, display: item.subtitle ? '' : 'none' }}
                      data-item-subtitle
                    >
                      {item.subtitle}
                    </span>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mt-1 mb-3" data-item-title>
                      {item.title}
                    </h3>
                    
                    {/* Description - always render for live updates */}
                    <p 
                      className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3"
                      style={{ display: item.description ? '' : 'none' }}
                      data-item-description
                    >
                      {item.description}
                    </p>
                    
                    {/* Link - only show if buttonText is not empty */}
                    {buttonText && (
                      <Link
                        href={item.link.startsWith('/') ? `${basePath}${item.link}` : item.link}
                        className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:gap-3"
                        style={{ color: accentColor }}
                        data-card-button
                      >
                        {buttonText}
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          className="rtl:rotate-180"
                        >
                          <path d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
