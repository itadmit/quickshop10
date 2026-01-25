'use client';

/**
 * SliderDots - Pagination Dots Component
 * נקודות/אינדיקטורים לניווט בסליידר
 */

import { useMemo } from 'react';
import { useSlider } from './slider-context';
import type { SliderDotsProps } from './types';

// Style presets
const stylePresets = {
  dots: {
    container: 'flex items-center justify-center gap-2',
    dot: {
      base: 'w-2 h-2 rounded-full transition-all duration-200 cursor-pointer',
      active: 'bg-gray-900 w-3',
      inactive: 'bg-gray-300 hover:bg-gray-400',
    },
  },
  lines: {
    container: 'flex items-center justify-center gap-1',
    dot: {
      base: 'h-1 rounded-full transition-all duration-200 cursor-pointer',
      active: 'bg-gray-900 w-8',
      inactive: 'bg-gray-300 hover:bg-gray-400 w-4',
    },
  },
  numbers: {
    container: 'flex items-center justify-center gap-1 text-sm',
    dot: {
      base: 'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer font-medium',
      active: 'bg-gray-900 text-white',
      inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    },
  },
};

// Position presets
const positionPresets = {
  bottom: 'mt-6',
  'inside-bottom': 'absolute bottom-4 left-0 right-0',
};

export function SliderDots({
  position = 'bottom',
  style = 'dots',
  className = '',
}: SliderDotsProps) {
  const { state, settings, goToSlide } = useSlider();
  
  const stylePreset = stylePresets[style];
  const positionClass = positionPresets[position];

  // Calculate number of dots based on items and items per view
  const dotCount = useMemo(() => {
    if (typeof window === 'undefined') return state.totalItems;
    
    const width = window.innerWidth;
    let itemsPerView = settings.itemsPerView;
    if (width < 640) itemsPerView = settings.itemsPerViewMobile;
    else if (width < 1024) itemsPerView = settings.itemsPerViewTablet || settings.itemsPerViewMobile;
    
    return Math.ceil(state.totalItems / itemsPerView);
  }, [state.totalItems, settings.itemsPerView, settings.itemsPerViewMobile, settings.itemsPerViewTablet]);

  // Calculate which dot is active
  const activeDot = useMemo(() => {
    if (typeof window === 'undefined') return state.currentIndex;
    
    const width = window.innerWidth;
    let itemsPerView = settings.itemsPerView;
    if (width < 640) itemsPerView = settings.itemsPerViewMobile;
    else if (width < 1024) itemsPerView = settings.itemsPerViewTablet || settings.itemsPerViewMobile;
    
    return Math.floor(state.currentIndex / itemsPerView);
  }, [state.currentIndex, settings.itemsPerView, settings.itemsPerViewMobile, settings.itemsPerViewTablet]);

  // Don't render if only one "page"
  if (dotCount <= 1) return null;

  const handleDotClick = (dotIndex: number) => {
    let itemsPerView = settings.itemsPerView;
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) itemsPerView = settings.itemsPerViewMobile;
      else if (width < 1024) itemsPerView = settings.itemsPerViewTablet || settings.itemsPerViewMobile;
    }
    goToSlide(dotIndex * itemsPerView);
  };

  return (
    <div 
      className={`${stylePreset.container} ${positionClass} ${className}`}
      data-slider-dots
      data-dots-style={style}
    >
      {Array.from({ length: dotCount }).map((_, index) => (
        <button
          key={index}
          onClick={() => handleDotClick(index)}
          className={`
            ${stylePreset.dot.base}
            ${index === activeDot ? stylePreset.dot.active : stylePreset.dot.inactive}
          `}
          aria-label={`עבור לשקופית ${index + 1}`}
          aria-current={index === activeDot ? 'true' : 'false'}
          data-slider-dot={index}
          data-active={index === activeDot}
        >
          {style === 'numbers' ? index + 1 : null}
        </button>
      ))}
    </div>
  );
}

// Progress indicator variant
export function SliderProgress({ className = '' }: { className?: string }) {
  const { state, settings } = useSlider();
  
  const progress = useMemo(() => {
    let itemsPerView = settings.itemsPerView;
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) itemsPerView = settings.itemsPerViewMobile;
      else if (width < 1024) itemsPerView = settings.itemsPerViewTablet || settings.itemsPerViewMobile;
    }
    
    const maxIndex = Math.max(0, state.totalItems - itemsPerView);
    if (maxIndex === 0) return 100;
    return (state.currentIndex / maxIndex) * 100;
  }, [state.currentIndex, state.totalItems, settings.itemsPerView, settings.itemsPerViewMobile, settings.itemsPerViewTablet]);

  return (
    <div className={`w-full h-1 bg-gray-200 rounded-full overflow-hidden ${className}`} data-slider-progress>
      <div 
        className="h-full bg-gray-900 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Counter variant (e.g., "1 / 5")
export function SliderCounter({ 
  className = '',
  separator = '/',
}: { 
  className?: string;
  separator?: string;
}) {
  const { state, settings } = useSlider();
  
  const { current, total } = useMemo(() => {
    let itemsPerView = settings.itemsPerView;
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) itemsPerView = settings.itemsPerViewMobile;
      else if (width < 1024) itemsPerView = settings.itemsPerViewTablet || settings.itemsPerViewMobile;
    }
    
    const pageCount = Math.ceil(state.totalItems / itemsPerView);
    const currentPage = Math.floor(state.currentIndex / itemsPerView) + 1;
    
    return { current: currentPage, total: pageCount };
  }, [state.currentIndex, state.totalItems, settings.itemsPerView, settings.itemsPerViewMobile, settings.itemsPerViewTablet]);

  if (total <= 1) return null;

  return (
    <div className={`text-sm text-gray-600 font-medium ${className}`} data-slider-counter>
      <span className="text-gray-900">{current}</span>
      <span className="mx-1">{separator}</span>
      <span>{total}</span>
    </div>
  );
}

