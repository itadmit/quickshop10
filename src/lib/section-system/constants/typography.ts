/**
 * Section System - Typography Constants
 * קבועים לטיפוגרפיה - משותפים לכל הסקשנים
 */

import type { TitleSize, SubtitleSize, TextSize, FontWeight } from '../types';

// ============================================
// TITLE SIZES
// ============================================
export const TITLE_SIZES: Record<TitleSize, string> = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-4xl md:text-5xl',
};

// Large variant for hero banners
export const TITLE_SIZES_LARGE: Record<TitleSize, string> = {
  sm: 'text-2xl md:text-4xl',
  md: 'text-3xl md:text-5xl',
  lg: 'text-4xl md:text-6xl lg:text-7xl',
  xl: 'text-5xl md:text-7xl lg:text-8xl',
};

// ============================================
// SUBTITLE SIZES
// ============================================
export const SUBTITLE_SIZES: Record<SubtitleSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

// Smaller subtitle for hero banners (over large text)
export const SUBTITLE_SIZES_HERO: Record<SubtitleSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

// ============================================
// TEXT/PROSE SIZES
// ============================================
export const TEXT_SIZES: Record<TextSize, string> = {
  sm: 'prose-sm',
  md: 'prose',
  lg: 'prose-lg',
};

// ============================================
// FONT WEIGHTS
// ============================================
export const FONT_WEIGHTS: Record<FontWeight, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

// Extra light for hero
export const FONT_WEIGHTS_HERO: Record<FontWeight, string> = {
  light: 'font-extralight',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULT_TITLE_SIZE: TitleSize = 'md';
export const DEFAULT_SUBTITLE_SIZE: SubtitleSize = 'md';
export const DEFAULT_TEXT_SIZE: TextSize = 'md';
export const DEFAULT_FONT_WEIGHT: FontWeight = 'light';

// ============================================
// COLORS
// ============================================
export const DEFAULT_TITLE_COLOR = 'inherit';
export const DEFAULT_SUBTITLE_COLOR = '#4b5563'; // gray-600
export const DEFAULT_TEXT_COLOR = '#4b5563';

