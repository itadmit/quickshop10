/**
 * Slider Types & Interfaces
 * מודולרי - כל הטיפוסים במקום אחד
 */

export interface SliderSettings {
  // Display settings
  itemsPerView: number;
  itemsPerViewMobile: number;
  itemsPerViewTablet?: number;
  
  // Scroll behavior
  scrollBy: number; // How many items to scroll at a time
  scrollByMobile?: number;
  
  // Navigation
  showArrows: boolean;
  showDots: boolean;
  arrowPosition?: 'inside' | 'outside' | 'bottom';
  arrowStyle?: 'circle' | 'square' | 'minimal';
  arrowBgColor?: string;
  arrowColor?: string;
  dotsPosition?: 'bottom' | 'inside-bottom';
  dotsStyle?: 'dots' | 'lines' | 'numbers';
  dotsActiveColor?: string;
  dotsInactiveColor?: string;
  
  // Behavior
  loop?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number; // in ms
  pauseOnHover?: boolean;
  
  // Spacing
  gap?: number; // in pixels
  
  // Responsive breakpoints (optional override)
  breakpoints?: {
    sm?: Partial<SliderSettings>;
    md?: Partial<SliderSettings>;
    lg?: Partial<SliderSettings>;
    xl?: Partial<SliderSettings>;
  };
}

export interface SliderState {
  currentIndex: number;
  totalItems: number;
  isAtStart: boolean;
  isAtEnd: boolean;
  visibleItems: number[];
}

export interface SliderContextValue {
  state: SliderState;
  settings: SliderSettings;
  goToSlide: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface SliderProps {
  children: React.ReactNode;
  settings?: Partial<SliderSettings>;
  className?: string;
  onSlideChange?: (index: number) => void;
  'data-slider-id'?: string;
}

export interface SliderArrowsProps {
  position?: 'inside' | 'outside' | 'bottom';
  style?: 'circle' | 'square' | 'minimal';
  className?: string;
  prevClassName?: string;
  nextClassName?: string;
}

export interface SliderDotsProps {
  position?: 'bottom' | 'inside-bottom';
  style?: 'dots' | 'lines' | 'numbers';
  className?: string;
}

export interface SliderItemProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

// Default settings
export const DEFAULT_SLIDER_SETTINGS: SliderSettings = {
  itemsPerView: 3,
  itemsPerViewMobile: 1,
  itemsPerViewTablet: 2,
  scrollBy: 1,
  showArrows: true,
  showDots: true,
  arrowPosition: 'inside',
  arrowStyle: 'circle',
  dotsPosition: 'bottom',
  dotsStyle: 'dots',
  loop: false,
  autoplay: false,
  autoplayInterval: 5000,
  pauseOnHover: true,
  gap: 24,
};

