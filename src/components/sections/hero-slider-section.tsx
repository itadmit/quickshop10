/**
 * HeroSliderSection - CSS-Only Sliding Banner
 * 500px height with smooth horizontal scroll-snap sliding
 * Zero JavaScript - uses CSS scroll-snap for native performance!
 */

import Link from 'next/link';

interface Slide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  textPosition?: 'center' | 'bottom-center' | 'bottom-right' | 'bottom-left';
}

interface HeroSliderSectionProps {
  title?: string | null;
  subtitle?: string | null;
  content: {
    slides?: Slide[];
    autoPlay?: boolean;
    interval?: number;
  };
  settings: {
    height?: string;
    overlay?: number;
    showDots?: boolean;
    showArrows?: boolean;
    textStyle?: 'elegant' | 'bold' | 'minimal';
  };
  basePath: string;
  sectionId?: string;
}

export function HeroSliderSection({ 
  content, 
  settings,
  basePath,
  sectionId 
}: HeroSliderSectionProps) {
  const height = settings.height || '500px';
  const overlay = settings.overlay ?? 0.25;
  const showDots = settings.showDots ?? true;
  const textStyle = settings.textStyle || 'elegant';

  const slides = content.slides || [
    { id: '1', imageUrl: '', title: 'Slide 1', subtitle: '' },
    { id: '2', imageUrl: '', title: 'Slide 2', subtitle: '' },
  ];

  // Text style classes
  const titleClasses = {
    elegant: 'font-serif text-4xl md:text-6xl lg:text-7xl font-light tracking-wide',
    bold: 'font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight uppercase',
    minimal: 'font-sans text-2xl md:text-4xl lg:text-5xl font-extralight tracking-[0.2em] uppercase',
  }[textStyle];

  const subtitleClasses = {
    elegant: 'font-sans text-lg md:text-xl font-light tracking-wide opacity-90',
    bold: 'font-sans text-sm md:text-base font-medium tracking-[0.3em] uppercase opacity-80',
    minimal: 'font-sans text-xs md:text-sm tracking-[0.4em] uppercase opacity-70',
  }[textStyle];

  return (
    <section 
      className="relative w-full overflow-hidden bg-gray-100"
      style={{ height }}
      data-section-id={sectionId}
      data-section-type="hero_slider"
      data-section-name="באנר סליידר"
    >
      {/* Slider Container - CSS Scroll Snap */}
      <div 
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide, index) => {
          const textPos = slide.textPosition || 'center';
          const positionClasses = {
            'center': 'items-center justify-center text-center',
            'bottom-center': 'items-end justify-center text-center pb-16 md:pb-24',
            'bottom-right': 'items-end justify-start text-right pb-16 md:pb-24 pr-8 md:pr-16',
            'bottom-left': 'items-end justify-end text-left pb-16 md:pb-24 pl-8 md:pl-16',
          }[textPos];

          return (
            <div 
              key={slide.id}
              className="flex-shrink-0 w-full h-full snap-center relative"
              data-slide-index={index}
              data-slide-id={slide.id}
            >
              {/* Background Image */}
              {slide.imageUrl ? (
                <img 
                  src={slide.imageUrl}
                  alt={slide.title || `Slide ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  data-slide-image
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100" data-slide-placeholder />
              )}
              
              {/* Overlay */}
              <div 
                className="absolute inset-0" 
                style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
                data-slide-overlay
              />

              {/* Content */}
              <div className={`relative z-10 h-full flex flex-col ${positionClasses} px-6 md:px-12`}>
                <div className="max-w-4xl">
                  <h2 
                    className={`${titleClasses} text-white mb-4 md:mb-6 drop-shadow-lg`}
                    style={{ display: slide.title ? '' : 'none' }}
                    data-slide-title
                  >
                    {slide.title || ''}
                  </h2>
                  <p 
                    className={`${subtitleClasses} text-white mb-6 md:mb-8 drop-shadow-md`}
                    style={{ display: slide.subtitle ? '' : 'none' }}
                    data-slide-subtitle
                  >
                    {slide.subtitle || ''}
                  </p>
                  <Link 
                    href={slide.buttonLink?.startsWith('/') ? `${basePath}${slide.buttonLink}` : (slide.buttonLink || '#')}
                    className="inline-block px-8 py-3.5 bg-white/95 text-gray-900 text-sm font-medium tracking-wider uppercase hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    style={{ display: (slide.buttonText && slide.buttonLink) ? '' : 'none' }}
                    data-slide-button
                  >
                    {slide.buttonText || ''}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Dots */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((slide, index) => (
            <a
              key={slide.id}
              href={`#slide-${index}`}
              className="w-2.5 h-2.5 rounded-full bg-white/50 hover:bg-white/90 transition-colors cursor-pointer"
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe Hint - visible only on mobile */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 md:hidden z-20 animate-pulse">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-60">
          <path d="M8 12h8m0 0l-3-3m3 3l-3 3" />
        </svg>
      </div>
    </section>
  );
}

