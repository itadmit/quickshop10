/**
 * Section System - CSS Class Utilities
 * פונקציות עזר ליצירת classes
 */

import type { 
  TitleSize, 
  SubtitleSize, 
  TextSize, 
  FontWeight,
  TextAlign,
  GridSettings,
  SpacingSettings
} from '../types';

import {
  TITLE_SIZES,
  TITLE_SIZES_LARGE,
  SUBTITLE_SIZES,
  TEXT_SIZES,
  FONT_WEIGHTS,
  FONT_WEIGHTS_HERO,
} from '../constants/typography';

// ============================================
// TYPOGRAPHY CLASSES
// ============================================

export function getTitleClasses(
  size: TitleSize = 'md',
  weight: FontWeight = 'light',
  large = false
): string {
  const sizeClass = large ? TITLE_SIZES_LARGE[size] : TITLE_SIZES[size];
  const weightClass = large ? FONT_WEIGHTS_HERO[weight] : FONT_WEIGHTS[weight];
  return `${sizeClass} ${weightClass}`;
}

export function getSubtitleClasses(
  size: SubtitleSize = 'md',
  weight: FontWeight = 'normal'
): string {
  return `${SUBTITLE_SIZES[size]} ${FONT_WEIGHTS[weight]}`;
}

export function getTextClasses(size: TextSize = 'md'): string {
  return TEXT_SIZES[size];
}

// ============================================
// GRID CLASSES
// ============================================

export function getGridClasses(settings: GridSettings): string {
  const { columns = 3, mobileColumns = 1, gap = 24 } = settings;
  
  // Map columns to Tailwind classes
  const colsMap: Record<number, string> = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  };
  
  const mobileColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };
  
  const gapMap: Record<number, string> = {
    8: 'gap-2',
    12: 'gap-3',
    16: 'gap-4',
    20: 'gap-5',
    24: 'gap-6',
    32: 'gap-8',
    40: 'gap-10',
    48: 'gap-12',
  };
  
  const colClass = colsMap[columns] || 'md:grid-cols-3';
  const mobileColClass = mobileColsMap[mobileColumns] || 'grid-cols-1';
  const gapClass = gapMap[gap] || 'gap-6';
  
  return `grid ${mobileColClass} ${colClass} ${gapClass}`;
}

// ============================================
// SPACING CLASSES
// ============================================

export function getSpacingClasses(settings: SpacingSettings): string {
  const classes: string[] = [];
  
  const spacingMap: Record<number, string> = {
    0: '0',
    4: '1',
    8: '2',
    12: '3',
    16: '4',
    20: '5',
    24: '6',
    32: '8',
    40: '10',
    48: '12',
    56: '14',
    64: '16',
    80: '20',
    96: '24',
  };
  
  if (settings.marginTop !== undefined) {
    const val = spacingMap[settings.marginTop] || '0';
    classes.push(`mt-${val}`);
  }
  
  if (settings.marginBottom !== undefined) {
    const val = spacingMap[settings.marginBottom] || '0';
    classes.push(`mb-${val}`);
  }
  
  if (settings.paddingTop !== undefined) {
    const val = spacingMap[settings.paddingTop] || '0';
    classes.push(`pt-${val}`);
  }
  
  if (settings.paddingBottom !== undefined) {
    const val = spacingMap[settings.paddingBottom] || '0';
    classes.push(`pb-${val}`);
  }
  
  return classes.join(' ');
}

// ============================================
// ALIGNMENT CLASSES (RTL-aware)
// ============================================

/**
 * Get text alignment class
 * In RTL: 'left' visually appears on right, 'right' visually appears on left
 */
export function getTextAlignClass(align: TextAlign = 'center'): string {
  // The stored value represents the visual alignment in RTL
  // 'left' in settings = visual left = text-right in code (because RTL)
  // 'right' in settings = visual right = text-left in code (because RTL)
  switch (align) {
    case 'left':
      return 'text-right'; // Visual left in RTL
    case 'right':
      return 'text-left'; // Visual right in RTL
    default:
      return 'text-center';
  }
}

/**
 * Get flex justify class for alignment
 */
export function getFlexJustifyClass(align: TextAlign = 'center'): string {
  switch (align) {
    case 'left':
      return 'justify-start';
    case 'right':
      return 'justify-end';
    default:
      return 'justify-center';
  }
}

/**
 * Get items align class
 */
export function getItemsAlignClass(align: TextAlign = 'center'): string {
  switch (align) {
    case 'left':
      return 'items-start';
    case 'right':
      return 'items-end';
    default:
      return 'items-center';
  }
}

// ============================================
// HELPER: Combine classes
// ============================================

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

