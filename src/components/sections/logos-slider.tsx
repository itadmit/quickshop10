'use client';

/**
 * LogosSlider - Client Component for Logos/Brands Slider
 * מציג לוגואים/מותגים בסליידר עם חצים ונקודות
 */

import { AutoSlider } from '@/components/ui/slider';
import type { SliderSettings } from '@/components/ui/slider';

interface Logo {
  id: string;
  src: string;
  alt?: string;
  url?: string;
}

interface LogosSliderProps {
  logos: Logo[];
  settings: {
    columns?: number;
    mobileColumns?: number;
    showArrows?: boolean;
    showDots?: boolean;
    arrowStyle?: 'circle' | 'square' | 'minimal';
    dotsStyle?: 'dots' | 'lines' | 'numbers';
    gap?: number;
    autoplay?: boolean;
    autoplayInterval?: number;
    grayscale?: boolean;
    maxHeight?: number;
  };
  sectionId?: string;
}

export function LogosSlider({ logos, settings, sectionId }: LogosSliderProps) {
  // Slider settings
  const sliderSettings: Partial<SliderSettings> = {
    itemsPerView: settings.columns || 5,
    itemsPerViewMobile: settings.mobileColumns || 2,
    itemsPerViewTablet: 3,
    scrollBy: 1,
    showArrows: settings.showArrows !== false,
    showDots: settings.showDots || false,
    arrowPosition: 'inside',
    arrowStyle: settings.arrowStyle || 'minimal',
    dotsPosition: 'bottom',
    dotsStyle: settings.dotsStyle || 'dots',
    gap: settings.gap || 32,
    autoplay: settings.autoplay || false,
    autoplayInterval: settings.autoplayInterval || 3000,
    loop: true,
  };

  const grayscaleClass = settings.grayscale ? 'grayscale hover:grayscale-0 transition-all duration-300' : '';
  const maxHeight = settings.maxHeight || 60;

  return (
    <AutoSlider 
      settings={sliderSettings}
      data-slider-id={sectionId}
      className="relative"
    >
      {logos.map((logo, index) => {
        const ImageContent = (
          <img
            src={logo.src}
            alt={logo.alt || `לוגו ${index + 1}`}
            className={`max-w-full object-contain ${grayscaleClass}`}
            style={{ maxHeight: `${maxHeight}px` }}
            data-logo-image
          />
        );

        return (
          <div
            key={logo.id}
            className="flex items-center justify-center h-full"
            data-logo-id={logo.id}
            data-logo-index={index}
          >
            {logo.url ? (
              <a 
                href={logo.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                {ImageContent}
              </a>
            ) : (
              ImageContent
            )}
          </div>
        );
      })}
    </AutoSlider>
  );
}

