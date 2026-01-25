/**
 * Slider Module - Exports
 * ייצוא כל הקומפוננטות של הסליידר
 */

// Main components
export { Slider, SliderTrack, SliderItem, AutoSlider } from './slider';
export { SliderArrows, SliderPrevButton, SliderNextButton } from './slider-arrows';
export { SliderDots, SliderProgress, SliderCounter } from './slider-dots';

// Context and hooks
export { SliderProvider, useSlider, useSliderSafe } from './slider-context';

// Types
export type {
  SliderSettings,
  SliderState,
  SliderContextValue,
  SliderProps,
  SliderArrowsProps,
  SliderDotsProps,
  SliderItemProps,
} from './types';

// Constants
export { DEFAULT_SLIDER_SETTINGS } from './types';

