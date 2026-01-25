'use client';

/**
 * GallerySlider - Client Component for Gallery Slider
 * מציג גלריית תמונות בסליידר עם חצים ונקודות
 */

import { AutoSlider } from '@/components/ui/slider';
import type { SliderSettings } from '@/components/ui/slider';

interface GalleryImage {
  id: string;
  src: string;
  alt?: string;
  caption?: string;
}

interface GallerySliderProps {
  images: GalleryImage[];
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
    aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
  };
  sectionId?: string;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-video',
  auto: '',
};

export function GallerySlider({ images, settings, sectionId }: GallerySliderProps) {
  // Slider settings
  const sliderSettings: Partial<SliderSettings> = {
    itemsPerView: settings.columns || 4,
    itemsPerViewMobile: settings.mobileColumns || 1,
    itemsPerViewTablet: 2,
    scrollBy: 1,
    showArrows: settings.showArrows !== false,
    showDots: settings.showDots !== false,
    arrowPosition: 'inside',
    arrowStyle: settings.arrowStyle || 'circle',
    dotsPosition: 'bottom',
    dotsStyle: settings.dotsStyle || 'dots',
    gap: settings.gap || 16,
    autoplay: settings.autoplay || false,
    autoplayInterval: settings.autoplayInterval || 5000,
    loop: true,
  };

  const aspectClass = aspectRatioClasses[settings.aspectRatio || 'square'];

  return (
    <AutoSlider 
      settings={sliderSettings}
      data-slider-id={sectionId}
      className="relative"
    >
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`relative overflow-hidden rounded-lg ${aspectClass}`}
          data-gallery-item-id={image.id}
          data-gallery-item-index={index}
        >
          <img
            src={image.src}
            alt={image.alt || `תמונה ${index + 1}`}
            className="w-full h-full object-cover"
            data-gallery-image
          />
          {image.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white text-sm" data-gallery-caption>{image.caption}</p>
            </div>
          )}
        </div>
      ))}
    </AutoSlider>
  );
}

