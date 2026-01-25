'use client';

/**
 * SliderArrows - Navigation Arrows Component
 * חצים לניווט בסליידר
 */

import { useSlider } from './slider-context';
import type { SliderArrowsProps } from './types';

// Arrow SVG Icons
const ChevronLeft = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// Style presets
const stylePresets = {
  circle: {
    base: 'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
    enabled: 'bg-white shadow-md hover:shadow-lg hover:scale-105 text-gray-700 hover:text-gray-900',
    disabled: 'bg-gray-100 text-gray-300 cursor-not-allowed',
  },
  square: {
    base: 'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
    enabled: 'bg-white shadow-md hover:shadow-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50',
    disabled: 'bg-gray-100 text-gray-300 cursor-not-allowed',
  },
  minimal: {
    base: 'w-8 h-8 flex items-center justify-center transition-all duration-200',
    enabled: 'text-gray-600 hover:text-gray-900',
    disabled: 'text-gray-200 cursor-not-allowed',
  },
};

// Position presets
const positionPresets = {
  inside: {
    container: 'absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none',
    button: 'pointer-events-auto',
  },
  outside: {
    container: 'absolute inset-y-0 -left-14 -right-14 flex items-center justify-between pointer-events-none',
    button: 'pointer-events-auto',
  },
  bottom: {
    container: 'flex items-center justify-center gap-4 mt-4',
    button: '',
  },
};

export function SliderArrows({
  position = 'inside',
  style = 'circle',
  className = '',
  prevClassName = '',
  nextClassName = '',
}: SliderArrowsProps) {
  const { state, settings, goNext, goPrev } = useSlider();
  
  const stylePreset = stylePresets[style];
  const positionPreset = positionPresets[position];
  
  const prevDisabled = !settings.loop && state.isAtStart;
  const nextDisabled = !settings.loop && state.isAtEnd;

  // Don't render if only one "page" of items
  if (state.totalItems <= 1) return null;

  return (
    <div 
      className={`${positionPreset.container} ${className}`}
      data-slider-arrows
      data-arrow-position={position}
    >
      {/* Previous Button */}
      <button
        onClick={goPrev}
        disabled={prevDisabled}
        className={`
          ${stylePreset.base}
          ${prevDisabled ? stylePreset.disabled : stylePreset.enabled}
          ${positionPreset.button}
          ${prevClassName}
        `}
        aria-label="הקודם"
        data-slider-prev
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Next Button */}
      <button
        onClick={goNext}
        disabled={nextDisabled}
        className={`
          ${stylePreset.base}
          ${nextDisabled ? stylePreset.disabled : stylePreset.enabled}
          ${positionPreset.button}
          ${nextClassName}
        `}
        aria-label="הבא"
        data-slider-next
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
}

// Standalone arrows for custom positioning
export function SliderPrevButton({
  style = 'circle',
  className = '',
  children,
}: {
  style?: 'circle' | 'square' | 'minimal';
  className?: string;
  children?: React.ReactNode;
}) {
  const { state, settings, goPrev } = useSlider();
  const stylePreset = stylePresets[style];
  const disabled = !settings.loop && state.isAtStart;

  return (
    <button
      onClick={goPrev}
      disabled={disabled}
      className={`
        ${stylePreset.base}
        ${disabled ? stylePreset.disabled : stylePreset.enabled}
        ${className}
      `}
      aria-label="הקודם"
      data-slider-prev
    >
      {children || <ChevronRight className="w-5 h-5" />}
    </button>
  );
}

export function SliderNextButton({
  style = 'circle',
  className = '',
  children,
}: {
  style?: 'circle' | 'square' | 'minimal';
  className?: string;
  children?: React.ReactNode;
}) {
  const { state, settings, goNext } = useSlider();
  const stylePreset = stylePresets[style];
  const disabled = !settings.loop && state.isAtEnd;

  return (
    <button
      onClick={goNext}
      disabled={disabled}
      className={`
        ${stylePreset.base}
        ${disabled ? stylePreset.disabled : stylePreset.enabled}
        ${className}
      `}
      aria-label="הבא"
      data-slider-next
    >
      {children || <ChevronLeft className="w-5 h-5" />}
    </button>
  );
}

