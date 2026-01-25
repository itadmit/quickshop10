'use client';

/**
 * Slider - Main Slider Component
 * קומפוננטת סליידר ראשית - מודולרית וגמישה
 */

import { useMemo, Children, cloneElement, isValidElement } from 'react';
import { SliderProvider, useSlider } from './slider-context';
import { SliderArrows } from './slider-arrows';
import { SliderDots } from './slider-dots';
import type { SliderProps, SliderSettings, SliderItemProps } from './types';
import { DEFAULT_SLIDER_SETTINGS } from './types';

// Main Slider Component
export function Slider({
  children,
  settings: customSettings,
  className = '',
  onSlideChange,
  'data-slider-id': sliderId,
}: SliderProps) {
  // Merge custom settings with defaults
  const settings: SliderSettings = useMemo(() => ({
    ...DEFAULT_SLIDER_SETTINGS,
    ...customSettings,
  }), [customSettings]);

  return (
    <SliderProvider settings={settings} onSlideChange={onSlideChange}>
      <SliderContainer className={className} data-slider-id={sliderId}>
        {children}
      </SliderContainer>
    </SliderProvider>
  );
}

// Container that handles the slider layout
function SliderContainer({ 
  children, 
  className,
  'data-slider-id': sliderId,
}: { 
  children: React.ReactNode; 
  className?: string;
  'data-slider-id'?: string;
}) {
  const { settings, containerRef } = useSlider();
  
  // Separate children into SliderItems and other elements (arrows, dots)
  const { items, controls } = useMemo(() => {
    const items: React.ReactNode[] = [];
    const controls: React.ReactNode[] = [];
    
    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        // Check if it's a SliderItem, SliderArrows, SliderDots, etc.
        const childType = child.type as { displayName?: string };
        if (childType.displayName === 'SliderTrack') {
          items.push(child);
        } else if (
          childType.displayName === 'SliderArrows' ||
          childType.displayName === 'SliderDots' ||
          childType.displayName === 'SliderProgress' ||
          childType.displayName === 'SliderCounter'
        ) {
          controls.push(child);
        } else {
          // Default to items
          items.push(child);
        }
      }
    });
    
    return { items, controls };
  }, [children]);

  return (
    <div 
      className={`relative ${className}`}
      data-slider
      data-slider-id={sliderId}
    >
      {items}
      {controls}
      
      {/* Auto-render arrows and dots if settings enabled and not manually included */}
      {settings.showArrows && !controls.some(c => 
        isValidElement(c) && (c.type as { displayName?: string }).displayName === 'SliderArrows'
      ) && (
        <SliderArrows 
          position={settings.arrowPosition} 
          style={settings.arrowStyle}
        />
      )}
      
      {settings.showDots && !controls.some(c => 
        isValidElement(c) && (c.type as { displayName?: string }).displayName === 'SliderDots'
      ) && (
        <SliderDots 
          position={settings.dotsPosition} 
          style={settings.dotsStyle}
        />
      )}
    </div>
  );
}

// Track component - contains the scrollable items
export function SliderTrack({ 
  children,
  className = '',
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const { settings, containerRef } = useSlider();
  
  // Calculate gap and item width styles
  const trackStyle = useMemo(() => ({
    gap: `${settings.gap || 24}px`,
    scrollbarWidth: 'none' as const,
  }), [settings.gap]);

  // Clone children to add slider-item attributes and responsive widths
  const enhancedChildren = useMemo(() => {
    return Children.map(children, (child, index) => {
      if (isValidElement(child)) {
        return cloneElement(child as React.ReactElement<{ 
          'data-slider-item'?: string;
          className?: string;
          style?: React.CSSProperties;
        }>, {
          'data-slider-item': String(index),
          className: `${(child.props as { className?: string }).className || ''} flex-shrink-0 snap-start`,
          style: {
            ...(child.props as { style?: React.CSSProperties }).style,
            // Width calculated based on items per view
            width: `calc((100% - ${(settings.itemsPerView - 1) * (settings.gap || 24)}px) / ${settings.itemsPerView})`,
          },
        });
      }
      return child;
    });
  }, [children, settings.itemsPerView, settings.gap]);

  return (
    <div
      ref={containerRef}
      className={`
        flex overflow-x-auto snap-x snap-mandatory
        [&::-webkit-scrollbar]:hidden
        ${className}
      `}
      style={trackStyle}
      data-slider-track
    >
      {enhancedChildren}
    </div>
  );
}
SliderTrack.displayName = 'SliderTrack';

// Individual slider item wrapper
export function SliderItem({ 
  children, 
  index, 
  className = '' 
}: SliderItemProps) {
  const { settings } = useSlider();
  
  return (
    <div
      className={`flex-shrink-0 snap-start ${className}`}
      data-slider-item={index}
      style={{
        width: `calc((100% - ${(settings.itemsPerView - 1) * (settings.gap || 24)}px) / ${settings.itemsPerView})`,
      }}
    >
      {children}
    </div>
  );
}

// Add display names for identification
(SliderArrows as unknown as { displayName: string }).displayName = 'SliderArrows';
(SliderDots as unknown as { displayName: string }).displayName = 'SliderDots';

// Simple auto-slider that handles everything
export function AutoSlider({
  children,
  settings: customSettings,
  className = '',
  trackClassName = '',
  onSlideChange,
  'data-slider-id': sliderId,
}: {
  children: React.ReactNode;
  settings?: Partial<SliderSettings>;
  className?: string;
  trackClassName?: string;
  onSlideChange?: (index: number) => void;
  'data-slider-id'?: string;
}) {
  const settings: SliderSettings = useMemo(() => ({
    ...DEFAULT_SLIDER_SETTINGS,
    ...customSettings,
  }), [customSettings]);

  return (
    <Slider 
      settings={settings} 
      className={className} 
      onSlideChange={onSlideChange}
      data-slider-id={sliderId}
    >
      <SliderTrack className={trackClassName}>
        {children}
      </SliderTrack>
    </Slider>
  );
}

