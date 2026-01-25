'use client';

/**
 * SliderContext - State Management
 * מנהל את כל הסטייט של הסליידר
 */

import { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { SliderContextValue, SliderSettings, SliderState } from './types';
import { DEFAULT_SLIDER_SETTINGS } from './types';

const SliderContext = createContext<SliderContextValue | null>(null);

export function useSlider() {
  const context = useContext(SliderContext);
  if (!context) {
    throw new Error('useSlider must be used within a SliderProvider');
  }
  return context;
}

// Hook to safely use slider context (returns null if outside provider)
export function useSliderSafe() {
  return useContext(SliderContext);
}

interface SliderProviderProps {
  children: React.ReactNode;
  settings: SliderSettings;
  onSlideChange?: (index: number) => void;
}

export function SliderProvider({ children, settings, onSlideChange }: SliderProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [itemCount, setItemCount] = useState(0);

  // Get current items per view based on screen size
  const getItemsPerView = useCallback(() => {
    if (typeof window === 'undefined') return settings.itemsPerView;
    
    const width = window.innerWidth;
    if (width < 640) return settings.itemsPerViewMobile;
    if (width < 1024) return settings.itemsPerViewTablet || settings.itemsPerViewMobile;
    return settings.itemsPerView;
  }, [settings.itemsPerView, settings.itemsPerViewMobile, settings.itemsPerViewTablet]);

  // Calculate state
  const state: SliderState = useMemo(() => {
    const itemsPerView = getItemsPerView();
    const maxIndex = Math.max(0, itemCount - itemsPerView);
    
    return {
      currentIndex,
      totalItems: itemCount,
      isAtStart: currentIndex === 0,
      isAtEnd: currentIndex >= maxIndex,
      visibleItems,
    };
  }, [currentIndex, itemCount, visibleItems, getItemsPerView]);

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const itemsPerView = getItemsPerView();
    const maxIndex = Math.max(0, itemCount - itemsPerView);
    
    let targetIndex = index;
    
    if (settings.loop) {
      if (index < 0) targetIndex = maxIndex;
      else if (index > maxIndex) targetIndex = 0;
    } else {
      targetIndex = Math.max(0, Math.min(index, maxIndex));
    }

    // Calculate scroll position
    const items = container.querySelectorAll('[data-slider-item]');
    if (items[targetIndex]) {
      const item = items[targetIndex] as HTMLElement;
      const scrollLeft = item.offsetLeft - (settings.gap || 0);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }

    setCurrentIndex(targetIndex);
    onSlideChange?.(targetIndex);
  }, [itemCount, settings.loop, settings.gap, getItemsPerView, onSlideChange]);

  const goNext = useCallback(() => {
    const scrollBy = typeof window !== 'undefined' && window.innerWidth < 640 
      ? (settings.scrollByMobile || settings.scrollBy)
      : settings.scrollBy;
    goToSlide(currentIndex + scrollBy);
  }, [currentIndex, settings.scrollBy, settings.scrollByMobile, goToSlide]);

  const goPrev = useCallback(() => {
    const scrollBy = typeof window !== 'undefined' && window.innerWidth < 640 
      ? (settings.scrollByMobile || settings.scrollBy)
      : settings.scrollBy;
    goToSlide(currentIndex - scrollBy);
  }, [currentIndex, settings.scrollBy, settings.scrollByMobile, goToSlide]);

  // Track visible items using IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('[data-slider-item]');
    setItemCount(items.length);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible: number[] = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt((entry.target as HTMLElement).dataset.sliderItem || '0', 10);
            visible.push(index);
          }
        });
        if (visible.length > 0) {
          setVisibleItems(visible.sort((a, b) => a - b));
          // Update current index to first visible item
          const firstVisible = Math.min(...visible);
          if (firstVisible !== currentIndex) {
            setCurrentIndex(firstVisible);
          }
        }
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [itemCount]);

  // Autoplay
  useEffect(() => {
    if (!settings.autoplay || !settings.autoplayInterval) return;

    const interval = setInterval(() => {
      goNext();
    }, settings.autoplayInterval);

    return () => clearInterval(interval);
  }, [settings.autoplay, settings.autoplayInterval, goNext]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      // Recalculate visible items on resize
      const container = containerRef.current;
      if (!container) return;
      
      // Force recalculation by triggering scroll to current position
      goToSlide(currentIndex);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex, goToSlide]);

  const contextValue: SliderContextValue = {
    state,
    settings,
    goToSlide,
    goNext,
    goPrev,
    containerRef,
  };

  return (
    <SliderContext.Provider value={contextValue}>
      {children}
    </SliderContext.Provider>
  );
}

