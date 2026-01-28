/**
 * HeroSliderSection - סליידר באנרים
 * מבוסס על content_block - כל שקופית היא בעצם content_block
 * 
 * תוכן אפשרי לכל שקופית:
 * - כותרת + תת-כותרת
 * - תמונת רקע (מחשב + מובייל)
 * - וידאו רקע (מחשב + מובייל)
 * - כפתור
 */

'use client';

import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState } from 'react';

// Slide interface - same structure as content_block
interface Slide {
  id: string;
  title?: string;
  subtitle?: string;
  text?: string;
  buttonText?: string;
  buttonLink?: string;
  // Media
  imageUrl?: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  mobileVideoUrl?: string;
  // Per-slide overrides
  textAlign?: 'right' | 'center' | 'left';
  verticalAlign?: 'top' | 'center' | 'bottom';
  overlay?: number;
}

interface HeroSliderSectionProps {
  sectionId?: string;
  title?: string | null;
  subtitle?: string | null;
  content: {
    slides?: Slide[];
  };
  settings: {
    // Layout
    height?: string;
    minHeight?: number;
    minHeightUnit?: 'px' | 'vh';
    sectionWidth?: 'full' | 'boxed';
    contentWidth?: number;
    
    // Slider settings
    autoplay?: boolean;
    autoplayInterval?: number; // in milliseconds
    loop?: boolean;
    showDots?: boolean;
    showArrows?: boolean;
    
    // Default for all slides
    textAlign?: 'right' | 'center' | 'left';
    verticalAlign?: 'top' | 'center' | 'bottom';
    overlay?: number;
    showGradient?: boolean;
    gradientDirection?: 'top' | 'bottom';
    
    // Typography - Title
    titleColor?: string;
    titleSize?: number;
    titleSizeMobile?: number;
    titleWeight?: string;
    
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    subtitleWeight?: string;
    
    // Button
    buttonStyle?: 'filled' | 'outline' | 'underline';
    buttonTextColor?: string;
    buttonBackgroundColor?: string;
    buttonBorderColor?: string;
    
    // Dots styling
    dotsColor?: string;
    dotsActiveColor?: string;
    
    // Advanced
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
    customClass?: string;
    customId?: string;
  };
  basePath: string;
}

export function HeroSliderSection({ 
  sectionId,
  content, 
  settings,
  basePath 
}: HeroSliderSectionProps) {
  
  // ====================================
  // Settings with defaults
  // ====================================
  const minHeight = settings.minHeight ?? 90;
  const minHeightUnit = settings.minHeightUnit || 'vh';
  const sectionWidth = settings.sectionWidth || 'full';
  const contentWidth = settings.contentWidth || 1200;
  const autoplay = settings.autoplay ?? true;
  const autoplayInterval = settings.autoplayInterval ?? 5000;
  const loop = settings.loop ?? true;
  const showDots = settings.showDots ?? true;
  const showArrows = settings.showArrows ?? true;
  const textAlign = settings.textAlign || 'center';
  const verticalAlign = settings.verticalAlign || 'center';
  const overlay = settings.overlay ?? 0.3;
  const showGradient = settings.showGradient ?? true;
  const gradientDirection = settings.gradientDirection || 'top';
  
  // Typography
  const titleColor = settings.titleColor || '#ffffff';
  const titleSize = settings.titleSize || 72;
  const titleSizeMobile = settings.titleSizeMobile || 36;
  const titleWeight = settings.titleWeight || 'extralight';
  const subtitleColor = settings.subtitleColor || 'rgba(255,255,255,0.9)';
  const subtitleSize = settings.subtitleSize || 18;
  const subtitleSizeMobile = settings.subtitleSizeMobile || 14;
  
  // Button
  const buttonStyle = settings.buttonStyle || 'filled';
  const buttonTextColor = settings.buttonTextColor || '#000000';
  const buttonBackgroundColor = settings.buttonBackgroundColor || '#ffffff';
  const buttonBorderColor = settings.buttonBorderColor || '#ffffff';
  
  // Dots
  const dotsColor = settings.dotsColor || 'rgba(255,255,255,0.5)';
  const dotsActiveColor = settings.dotsActiveColor || '#ffffff';
  
  // Slides
  const slides: Slide[] = content.slides && content.slides.length > 0 
    ? content.slides 
    : [
        { 
          id: '1', 
          title: 'שקופית 1', 
          subtitle: 'תיאור קצר',
          imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920',
          buttonText: 'לחנות',
          buttonLink: '/products',
        },
      ];
  
  // ====================================
  // Embla Carousel
  // ====================================
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop, direction: 'rtl' },
    autoplay ? [Autoplay({ delay: autoplayInterval, stopOnInteraction: false })] : []
  );
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  
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
  const getVerticalAlignClass = (align: string) => {
    switch (align) {
      case 'top': return 'justify-start pt-16 md:pt-24';
      case 'bottom': return 'justify-end pb-16 md:pb-24';
      default: return 'justify-center';
    }
  };
  
  const getTextAlignClass = (align: string) => {
    switch (align) {
      case 'right': return 'text-right items-end';
      case 'left': return 'text-left items-start';
      default: return 'text-center items-center';
    }
  };
  
  const getButtonStyles = () => {
    const base = 'inline-block px-8 py-3 text-sm font-medium tracking-wider uppercase transition-all';
    switch (buttonStyle) {
      case 'outline':
        return `${base} bg-transparent border-2`;
      case 'underline':
        return `${base} bg-transparent border-b-2 px-0`;
      default:
        return `${base} border-0`;
    }
  };
  
  // ====================================
  // Render
  // ====================================
  return (
    <section 
      className={`relative w-full overflow-hidden ${settings.customClass || ''}`}
      style={{ 
        minHeight: `${minHeight}${minHeightUnit}`,
      }}
      id={settings.customId}
      data-section-id={sectionId}
      data-section-type="hero_slider"
      data-section-name="סליידר הירו"
      data-hide-on-mobile={settings.hideOnMobile || undefined}
      data-hide-on-desktop={settings.hideOnDesktop || undefined}
    >
      {/* Scoped CSS for responsive typography */}
      <style dangerouslySetInnerHTML={{ __html: `
        [data-section-id="${sectionId}"] [data-slide-title] {
          font-size: ${titleSizeMobile}px;
          font-weight: ${titleWeight === 'extralight' ? 200 : titleWeight === 'light' ? 300 : titleWeight === 'normal' ? 400 : titleWeight === 'medium' ? 500 : titleWeight === 'semibold' ? 600 : titleWeight === 'bold' ? 700 : 400};
          color: ${titleColor};
        }
        @media (min-width: 768px) {
          [data-section-id="${sectionId}"] [data-slide-title] {
            font-size: ${titleSize}px;
          }
        }
        [data-section-id="${sectionId}"] [data-slide-subtitle] {
          font-size: ${subtitleSizeMobile}px;
          color: ${subtitleColor};
        }
        @media (min-width: 768px) {
          [data-section-id="${sectionId}"] [data-slide-subtitle] {
            font-size: ${subtitleSize}px;
          }
        }
      ` }} />
      
      {/* Embla Carousel */}
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full" style={{ minHeight: `${minHeight}${minHeightUnit}` }}>
          {slides.map((slide, index) => {
            const slideTextAlign = slide.textAlign || textAlign;
            const slideVerticalAlign = slide.verticalAlign || verticalAlign;
            const slideOverlay = slide.overlay ?? overlay;
            const hasVideo = !!(slide.videoUrl || slide.mobileVideoUrl);
            const hasImage = !!(slide.imageUrl || slide.mobileImageUrl);
            
            return (
              <div 
                key={slide.id}
                className="flex-[0_0_100%] min-w-0 relative"
                style={{ minHeight: `${minHeight}${minHeightUnit}` }}
                data-slide-index={index}
                data-slide-id={slide.id}
              >
                {/* Background Image - Desktop */}
                {hasImage && (
                  <>
                    <img 
                      src={slide.imageUrl}
                      alt={slide.title || `שקופית ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover ${slide.mobileImageUrl ? 'hidden md:block' : ''}`}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      data-slide-image-desktop
                    />
                    {slide.mobileImageUrl && (
                      <img 
                        src={slide.mobileImageUrl}
                        alt={slide.title || `שקופית ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover md:hidden"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        data-slide-image-mobile
                      />
                    )}
                  </>
                )}
                
                {/* Background Video - Desktop */}
                {hasVideo && (
                  <>
                    <video
                      src={slide.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className={`absolute inset-0 w-full h-full object-cover ${slide.mobileVideoUrl ? 'hidden md:block' : ''}`}
                      data-slide-video-desktop
                    />
                    {slide.mobileVideoUrl && (
                      <video
                        src={slide.mobileVideoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover md:hidden"
                        data-slide-video-mobile
                      />
                    )}
                  </>
                )}
                
                {/* Placeholder if no media */}
                {!hasImage && !hasVideo && (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                )}
                
                {/* Overlay */}
                <div 
                  className="absolute inset-0 z-[1]"
                  style={{ backgroundColor: `rgba(0,0,0,${slideOverlay})` }}
                  data-slide-overlay
                />
                
                {/* Gradient Overlay */}
                {showGradient && (
                  <div 
                    className="absolute inset-0 z-[2]"
                    style={{
                      background: gradientDirection === 'top' 
                        ? 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)'
                        : 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)'
                    }}
                    data-slide-gradient
                  />
                )}
                
                {/* Content */}
                <div className={`relative z-10 h-full flex flex-col ${getVerticalAlignClass(slideVerticalAlign)} ${getTextAlignClass(slideTextAlign)} px-6 md:px-12`} data-content-container>
                  <div 
                    className={`w-full ${slideTextAlign === 'center' ? 'mx-auto text-center' : slideTextAlign === 'left' ? 'mr-auto text-left' : 'ml-auto text-right'}`}
                    style={{ 
                      maxWidth: sectionWidth === 'boxed' ? `${contentWidth}px` : 'none',
                      margin: sectionWidth === 'boxed' ? '0 auto' : undefined,
                    }}
                    data-content-wrapper
                  >
                    {slide.title && (
                      <h2 
                        className="font-display tracking-[0.2em] uppercase mb-4 md:mb-6"
                        data-slide-title
                      >
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p 
                        className={`opacity-90 mb-6 md:mb-8 max-w-2xl ${slideTextAlign === 'center' ? 'mx-auto' : slideTextAlign === 'left' ? 'mr-auto' : 'ml-auto'}`}
                        data-slide-subtitle
                      >
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.buttonText && slide.buttonLink && (
                      <Link 
                        href={slide.buttonLink.startsWith('/') ? `${basePath}${slide.buttonLink}` : slide.buttonLink}
                        className={getButtonStyles()}
                        style={{
                          color: buttonTextColor,
                          backgroundColor: buttonStyle === 'filled' ? buttonBackgroundColor : 'transparent',
                          borderColor: buttonBorderColor,
                        }}
                        data-slide-button
                      >
                        {slide.buttonText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={scrollNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all"
            aria-label="הקודם"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button
            onClick={scrollPrev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all"
            aria-label="הבא"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </>
      )}
      
      {/* Navigation Dots */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                backgroundColor: index === selectedIndex ? dotsActiveColor : dotsColor,
                transform: index === selectedIndex ? 'scale(1.2)' : 'scale(1)',
              }}
              aria-label={`עבור לשקופית ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
