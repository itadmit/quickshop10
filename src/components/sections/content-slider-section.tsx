/**
 * ContentSliderSection - סליידר תוכן
 * מציג מספר כרטיסי תוכן בקרוסלה עם peek effect
 * 
 * תכונות:
 * - מציג כמה פריטים בו זמנית
 * - Peek effect - רואים קצת מהפריט הבא (+0.25)
 * - כל פריט יכול להכיל: תמונה, כותרת, תיאור, כפתור
 */

'use client';

import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';

// Content Item interface
interface ContentItem {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  // Media
  imageUrl?: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  // Per-item overrides
  textAlign?: 'right' | 'center' | 'left';
  overlay?: number;
  backgroundColor?: string;
}

interface ContentSliderSectionProps {
  sectionId?: string;
  title?: string | null;
  subtitle?: string | null;
  content: {
    items?: ContentItem[];
  };
  settings: {
    // Layout
    columns?: number; // Desktop columns (1-4)
    mobileColumns?: number; // Mobile columns (1-2)
    gap?: number;
    aspectRatio?: 'square' | 'portrait' | 'landscape' | '16:9';
    itemHeight?: number;
    
    // Section
    backgroundColor?: string;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    sectionWidth?: 'full' | 'boxed';
    contentWidth?: number;
    
    // Slider settings
    autoplay?: boolean;
    autoplayInterval?: number;
    loop?: boolean;
    showDots?: boolean;
    showDotsOnMobile?: boolean;
    showArrows?: boolean;
    showArrowsOnMobile?: boolean;
    
    // Title/Subtitle
    showTitle?: boolean;
    textAlign?: 'right' | 'center' | 'left';
    titleColor?: string;
    titleSize?: number;
    titleSizeMobile?: number;
    titleWeight?: string;
    subtitleColor?: string;
    subtitleSize?: number;
    
    // Item Typography
    itemTitleColor?: string;
    itemTitleSize?: number;
    itemSubtitleColor?: string;
    itemDescriptionColor?: string;
    
    // Item styling
    itemOverlay?: number;
    itemBorderRadius?: number;
    itemTextPosition?: 'inside-bottom' | 'inside-center' | 'outside-bottom';
    
    // Button
    buttonStyle?: 'filled' | 'outline' | 'underline';
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    buttonBorderColor?: string;
    
    // Arrows/Dots styling
    arrowStyle?: 'circle' | 'square' | 'minimal';
    arrowBgColor?: string;
    arrowColor?: string;
    dotsStyle?: 'dots' | 'lines';
    dotsActiveColor?: string;
    dotsInactiveColor?: string;
    
    // Divider
    showDivider?: boolean;
    dividerColor?: string;
    dividerHeight?: number;
    
    // Advanced
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
    customClass?: string;
    customId?: string;
  };
  basePath: string;
}

export function ContentSliderSection({ 
  sectionId,
  title,
  subtitle,
  content, 
  settings,
  basePath 
}: ContentSliderSectionProps) {
  
  // ====================================
  // Settings with defaults
  // ====================================
  const columns = settings.columns ?? 4;
  const mobileColumns = settings.mobileColumns ?? 1;
  const gap = settings.gap ?? 16;
  const aspectRatio = settings.aspectRatio || 'portrait';
  const itemHeight = settings.itemHeight ?? 400;
  
  // Section
  const backgroundColor = settings.backgroundColor || '#ffffff';
  const paddingTop = settings.paddingTop ?? 64;
  const paddingBottom = settings.paddingBottom ?? 64;
  const paddingLeft = settings.paddingLeft ?? 16;
  const paddingRight = settings.paddingRight ?? 16;
  const sectionWidth = settings.sectionWidth || 'full';
  const contentWidth = settings.contentWidth || 1200;
  
  // Slider
  const autoplay = settings.autoplay ?? false;
  const autoplayInterval = settings.autoplayInterval ?? 5000;
  const loop = settings.loop ?? true;
  const showDots = settings.showDots ?? true;
  const showDotsOnMobile = settings.showDotsOnMobile ?? true;
  const showArrows = settings.showArrows ?? true;
  const showArrowsOnMobile = settings.showArrowsOnMobile ?? false;
  
  // Title
  const showTitle = settings.showTitle ?? true;
  const textAlign = settings.textAlign || 'center';
  const titleColor = settings.titleColor || '#000000';
  const titleSize = settings.titleSize || 32;
  const titleSizeMobile = settings.titleSizeMobile || 24;
  const titleWeight = settings.titleWeight || 'light';
  const subtitleColor = settings.subtitleColor || '#6b7280';
  const subtitleSize = settings.subtitleSize || 14;
  
  // Item styling
  const itemOverlay = settings.itemOverlay ?? 0.3;
  const itemBorderRadius = settings.itemBorderRadius ?? 0;
  const itemTextPosition = settings.itemTextPosition || 'inside-bottom';
  const itemTitleColor = settings.itemTitleColor || '#ffffff';
  const itemTitleSize = settings.itemTitleSize || 20;
  const itemSubtitleColor = settings.itemSubtitleColor || 'rgba(255,255,255,0.8)';
  const itemDescriptionColor = settings.itemDescriptionColor || 'rgba(255,255,255,0.9)';
  
  // Button
  const buttonStyle = settings.buttonStyle || 'filled';
  const buttonTextColor = settings.buttonTextColor || '#000000';
  const buttonBackgroundColor = settings.buttonBackgroundColor || '#ffffff';
  const buttonBorderColor = settings.buttonBorderColor || '#ffffff';
  
  // Arrows/Dots
  const arrowStyle = settings.arrowStyle || 'circle';
  const arrowBgColor = settings.arrowBgColor || '#ffffff';
  const arrowColor = settings.arrowColor || '#374151';
  const dotsStyle = settings.dotsStyle || 'dots';
  const dotsActiveColor = settings.dotsActiveColor || '#111827';
  const dotsInactiveColor = settings.dotsInactiveColor || '#d1d5db';
  
  // Divider
  const showDivider = settings.showDivider ?? false;
  const dividerColor = settings.dividerColor || '#C9A962';
  const dividerHeight = settings.dividerHeight || 2;
  
  // Items
  const items: ContentItem[] = content.items && content.items.length > 0 
    ? content.items 
    : [
        { id: '1', title: 'פריט 1', imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800' },
        { id: '2', title: 'פריט 2', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        { id: '3', title: 'פריט 3', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
        { id: '4', title: 'פריט 4', imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=800' },
        { id: '5', title: 'פריט 5', imageUrl: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800' },
      ];
  
  // ====================================
  // Calculate slides to show with peek effect
  // ====================================
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Add 0.25 for peek effect
  const slidesToShow = isMobile ? mobileColumns + 0.25 : columns + 0.25;
  const slideWidth = 100 / slidesToShow;
  
  // ====================================
  // Embla Carousel
  // ====================================
  // Enable loop only if there's more than 1 item
  const canLoop = loop && items.length > 1;
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: canLoop,
      direction: 'rtl',
      align: 'start',
      slidesToScroll: 1,
      // containScroll must be false for loop to work properly in Embla
      containScroll: canLoop ? false : 'trimSnaps',
      dragFree: false,
    },
    autoplay ? [Autoplay({ delay: autoplayInterval, stopOnInteraction: false })] : []
  );
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);
  
  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);
  
  // ====================================
  // Helper functions
  // ====================================
  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case 'square': return '1 / 1';
      case 'portrait': return '3 / 4';
      case 'landscape': return '16 / 10';
      case '16:9': return '16 / 9';
      default: return '3 / 4';
    }
  };
  
  const getTextAlignClass = (align: string) => {
    switch (align) {
      case 'right': return 'text-right';
      case 'left': return 'text-left';
      default: return 'text-center';
    }
  };
  
  const getArrowStyles = () => {
    const base = 'flex items-center justify-center transition-all';
    switch (arrowStyle) {
      case 'square':
        return `${base} w-10 h-10`;
      case 'minimal':
        return `${base} w-8 h-8 bg-transparent`;
      default: // circle
        return `${base} w-10 h-10 rounded-full shadow-lg`;
    }
  };
  
  const getButtonStyles = () => {
    const base = 'inline-block px-6 py-2 text-sm font-medium tracking-wider transition-all';
    switch (buttonStyle) {
      case 'outline':
        return `${base} bg-transparent border-2`;
      case 'underline':
        return `${base} bg-transparent border-b-2 px-0`;
      default:
        return `${base} border-0`;
    }
  };
  
  const hideOnMobileClass = settings.hideOnMobile ? 'max-md:hidden' : '';
  const hideOnDesktopClass = settings.hideOnDesktop ? 'md:hidden' : '';
  
  // ====================================
  // Render
  // ====================================
  return (
    <section 
      className={`relative ${hideOnMobileClass} ${hideOnDesktopClass} ${settings.customClass || ''}`}
      style={{ 
        backgroundColor,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
      }}
      id={settings.customId || 'content-slider'}
      data-section-id={sectionId}
      data-section-type="content_slider"
      data-section-name="סליידר תוכן"
      data-hide-on-mobile={settings.hideOnMobile || undefined}
      data-hide-on-desktop={settings.hideOnDesktop || undefined}
    >
      {/* Scoped CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        [data-section-id="${sectionId}"] [data-section-title] {
          font-size: ${titleSizeMobile}px;
          color: ${titleColor};
        }
        @media (min-width: 768px) {
          [data-section-id="${sectionId}"] [data-section-title] {
            font-size: ${titleSize}px;
          }
        }
        /* Mobile: add right padding for peek effect */
        @media (max-width: 767px) {
          [data-section-id="${sectionId}"] {
            padding-right: ${paddingRight || 16}px !important;
          }
        }
        [data-section-id="${sectionId}"] .embla__slide {
          flex: 0 0 ${100 / (mobileColumns + 0.25)}%;
          padding-left: ${gap / 2}px;
          padding-right: ${gap / 2}px;
        }
        @media (min-width: 768px) {
          [data-section-id="${sectionId}"] .embla__slide {
            flex: 0 0 ${100 / (columns + 0.25)}%;
          }
        }
      ` }} />
      
      <div 
        className={`${sectionWidth === 'boxed' ? 'mx-auto' : 'w-full'}`}
        style={{ maxWidth: sectionWidth === 'boxed' ? `${contentWidth}px` : 'none' }}
        data-content-wrapper
      >
        {/* Section Title */}
        {showTitle && (title || subtitle) && (
          <div className={`mb-8 md:mb-12 px-4 ${getTextAlignClass(textAlign)}`}>
            {subtitle && (
              <p 
                className="tracking-[0.2em] uppercase mb-3"
                style={{ color: subtitleColor, fontSize: `${subtitleSize}px` }}
                data-section-subtitle
              >
                {subtitle}
              </p>
            )}
            {title && (
              <h2 
                className="font-display tracking-[0.15em] uppercase"
                style={{ fontWeight: titleWeight === 'bold' ? 700 : titleWeight === 'semibold' ? 600 : titleWeight === 'medium' ? 500 : titleWeight === 'light' ? 300 : 400 }}
                data-section-title
              >
                {title}
              </h2>
            )}
            {showDivider && (
              <div 
                className={`w-16 mt-6 ${textAlign === 'center' ? 'mx-auto' : textAlign === 'left' ? 'mr-auto' : 'ml-auto'}`}
                style={{ backgroundColor: dividerColor, height: `${dividerHeight}px` }}
                data-section-divider
              />
            )}
          </div>
        )}
        
        {/* Slider Container */}
        <div className="relative">
          {/* Embla Carousel */}
          <div className="overflow-hidden" ref={emblaRef} style={{ marginLeft: `-${gap / 2}px`, marginRight: `-${gap / 2}px` }}>
            <div className="flex" data-slider-track>
              {items.map((item, index) => {
                const itemTextAlign = item.textAlign || 'center';
                const itemOverlayValue = item.overlay ?? itemOverlay;
                const hasDesktopImage = !!item.imageUrl;
                const hasMobileImage = !!item.mobileImageUrl;
                const hasVideo = !!item.videoUrl;
                const hasAnyMedia = hasDesktopImage || hasMobileImage || hasVideo;
                const itemBgColor = item.backgroundColor || '#f3f4f6';
                
                return (
                  <div 
                    key={item.id}
                    className="embla__slide min-w-0"
                    data-item-index={index}
                    data-item-id={item.id}
                  >
                    <div 
                      className="relative overflow-hidden h-full"
                      style={{ 
                        borderRadius: `${itemBorderRadius}px`,
                        aspectRatio: getAspectRatioStyle(),
                      }}
                    >
                      {/* Background - Video overrides images */}
                      {hasVideo ? (
                        <video
                          src={item.videoUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                          data-item-video
                        />
                      ) : hasDesktopImage ? (
                        <>
                          {/* Desktop Image */}
                          <img 
                            src={item.imageUrl}
                            alt={item.title || `פריט ${index + 1}`}
                            className={`absolute inset-0 w-full h-full object-cover ${hasMobileImage ? 'hidden md:block' : ''}`}
                            loading={index < columns ? 'eager' : 'lazy'}
                            data-item-image-desktop
                          />
                          {/* Mobile Image */}
                          {hasMobileImage && (
                            <img 
                              src={item.mobileImageUrl}
                              alt={item.title || `פריט ${index + 1}`}
                              className="absolute inset-0 w-full h-full object-cover md:hidden"
                              loading={index < columns ? 'eager' : 'lazy'}
                              data-item-image-mobile
                            />
                          )}
                        </>
                      ) : hasMobileImage ? (
                        <img 
                          src={item.mobileImageUrl}
                          alt={item.title || `פריט ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading={index < columns ? 'eager' : 'lazy'}
                          data-item-image-mobile
                        />
                      ) : (
                        <div 
                          className="absolute inset-0 w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: itemBgColor }}
                          data-item-placeholder
                        >
                          {/* Placeholder icon when no image */}
                          <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Overlay */}
                      {hasAnyMedia && itemOverlayValue > 0 && (
                        <div 
                          className="absolute inset-0 z-[1]"
                          style={{ backgroundColor: `rgba(0,0,0,${itemOverlayValue})` }}
                          data-item-overlay
                        />
                      )}
                      
                      {/* Gradient for text readability */}
                      {itemTextPosition === 'inside-bottom' && hasAnyMedia && (
                        <div 
                          className="absolute inset-x-0 bottom-0 h-1/2 z-[2]"
                          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
                        />
                      )}
                      
                      {/* Content */}
                      <div 
                        className={`relative z-10 h-full flex flex-col ${
                          itemTextPosition === 'inside-bottom' ? 'justify-end' : 
                          itemTextPosition === 'inside-center' ? 'justify-center' : 
                          'justify-end'
                        } p-4 md:p-6 ${getTextAlignClass(itemTextAlign)}`}
                        data-item-content
                      >
                        <p 
                          className="text-xs tracking-wider uppercase mb-2"
                          style={{ 
                            color: itemSubtitleColor,
                            display: item.subtitle ? '' : 'none',
                          }}
                          data-item-subtitle
                        >
                          {item.subtitle || ''}
                        </p>
                        <h3 
                          className="font-medium mb-2"
                          style={{ 
                            color: itemTitleColor, 
                            fontSize: `${itemTitleSize}px`,
                            display: item.title ? '' : 'none',
                          }}
                          data-item-title
                        >
                          {item.title || ''}
                        </h3>
                        <p 
                          className="text-sm mb-4 line-clamp-3"
                          style={{ 
                            color: itemDescriptionColor,
                            display: item.description ? '' : 'none',
                          }}
                          data-item-description
                        >
                          {item.description || ''}
                        </p>
                        <div style={{ display: (item.buttonText && item.buttonLink) ? '' : 'none' }}>
                          <Link 
                            href={(item.buttonLink?.startsWith('/') ? `${basePath}${item.buttonLink}` : item.buttonLink) || '#'}
                            className={getButtonStyles()}
                            style={{
                              color: buttonTextColor,
                              backgroundColor: buttonStyle === 'filled' ? buttonBackgroundColor : 'transparent',
                              borderColor: buttonBorderColor,
                            }}
                            data-item-button
                          >
                            {item.buttonText || ''}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Navigation Arrows */}
          {showArrows && items.length > columns && (
            <>
              <button
                onClick={scrollNext}
                disabled={!loop && !canScrollNext}
                className={`absolute top-1/2 -translate-y-1/2 z-20 ${getArrowStyles()} ${showArrowsOnMobile ? '' : 'hidden md:flex'} transition-opacity`}
                style={{ 
                  right: '8px',
                  backgroundColor: arrowStyle !== 'minimal' ? arrowBgColor : 'transparent',
                  opacity: !loop && !canScrollNext ? 0.3 : 1,
                  cursor: !loop && !canScrollNext ? 'default' : 'pointer',
                }}
                aria-label="הקודם"
                data-slider-prev
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={arrowColor} strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <button
                onClick={scrollPrev}
                disabled={!loop && !canScrollPrev}
                className={`absolute top-1/2 -translate-y-1/2 z-20 ${getArrowStyles()} ${showArrowsOnMobile ? '' : 'hidden md:flex'} transition-opacity`}
                style={{ 
                  left: '8px',
                  backgroundColor: arrowStyle !== 'minimal' ? arrowBgColor : 'transparent',
                  opacity: !loop && !canScrollPrev ? 0.3 : 1,
                  cursor: !loop && !canScrollPrev ? 'default' : 'pointer',
                }}
                aria-label="הבא"
                data-slider-next
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={arrowColor} strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            </>
          )}
        </div>
        
        {/* Navigation Dots */}
        {showDots && items.length > columns && (
          <div 
            className={`flex justify-center gap-2 mt-6 ${showDotsOnMobile ? '' : 'hidden md:flex'}`}
            data-slider-dots
          >
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`transition-all ${dotsStyle === 'lines' ? 'h-1 rounded-full' : 'rounded-full'}`}
                style={{
                  backgroundColor: index === selectedIndex ? dotsActiveColor : dotsInactiveColor,
                  width: dotsStyle === 'lines' 
                    ? (index === selectedIndex ? '32px' : '16px')
                    : (index === selectedIndex ? '12px' : '8px'),
                  height: dotsStyle === 'lines' ? '4px' : (index === selectedIndex ? '12px' : '8px'),
                }}
                data-active={index === selectedIndex}
                aria-label={`עבור לפריט ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
