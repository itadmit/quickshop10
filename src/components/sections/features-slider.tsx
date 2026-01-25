'use client';

/**
 * FeaturesSlider - Client Component for Features/Strengths Slider
 * מציג חוזקות/פיצ'רים בסליידר עם חצים ונקודות
 */

import { AutoSlider } from '@/components/ui/slider';
import type { SliderSettings } from '@/components/ui/slider';

// Feature icons - same as in features-section.tsx
const FEATURE_ICON_PATHS: Record<string, string> = {
  truck: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  gift: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  check: 'M5 13l4 4L19 7',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
};

interface Feature {
  id: string;
  icon?: string;
  emoji?: string;
  title: string;
  description: string;
}

interface FeaturesSliderProps {
  features: Feature[];
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
    iconStyle?: 'filled' | 'outline';
    iconColor?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
  sectionId?: string;
}

export function FeaturesSlider({ features, settings, sectionId }: FeaturesSliderProps) {
  const textAlign = settings.textAlign || 'center';
  const iconStyle = settings.iconStyle || 'outline';
  const iconColor = settings.iconColor || '#3B82F6';
  
  // Text alignment classes
  const alignClass = textAlign === 'left' ? 'text-right' : textAlign === 'right' ? 'text-left' : 'text-center';
  const flexJustify = textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center';

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
    gap: settings.gap || 24,
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
      {features.map((feature, index) => {
        const iconPath = feature.icon ? FEATURE_ICON_PATHS[feature.icon] : null;
        
        return (
          <div
            key={feature.id}
            className={`p-6 ${alignClass}`}
            data-feature-id={feature.id}
            data-feature-index={index}
          >
            {/* Icon */}
            <div className={`flex ${flexJustify} mb-4`}>
              <div 
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  iconStyle === 'filled' 
                    ? 'text-white' 
                    : 'bg-opacity-10'
                }`}
                style={{ 
                  backgroundColor: iconStyle === 'filled' ? iconColor : `${iconColor}20`,
                }}
                data-feature-icon={feature.icon || ''}
              >
                {iconPath ? (
                  <svg 
                    className="w-7 h-7" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke={iconStyle === 'filled' ? 'currentColor' : iconColor}
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                  </svg>
                ) : feature.emoji ? (
                  <span className="text-2xl">{feature.emoji}</span>
                ) : (
                  <svg 
                    className="w-7 h-7" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke={iconStyle === 'filled' ? 'currentColor' : iconColor}
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={FEATURE_ICON_PATHS.star} />
                  </svg>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 
              className="font-semibold text-gray-900 mb-2"
              data-feature-title
            >
              {feature.title}
            </h3>

            {/* Description */}
            <p 
              className="text-gray-600 text-sm"
              data-feature-description
            >
              {feature.description}
            </p>
          </div>
        );
      })}
    </AutoSlider>
  );
}

