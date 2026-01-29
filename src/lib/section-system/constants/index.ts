/**
 * Section System - Constants Index
 */

export * from './typography';
export * from './icons';

// ============================================
// GRID DEFAULTS
// ============================================
export const DEFAULT_COLUMNS = 3;
export const DEFAULT_MOBILE_COLUMNS = 1;
export const DEFAULT_TABLET_COLUMNS = 2;
export const DEFAULT_GAP = 24; // in pixels

// ============================================
// SLIDER DEFAULTS
// ============================================
export const DEFAULT_SHOW_ARROWS = true;
export const DEFAULT_SHOW_DOTS = true;
export const DEFAULT_AUTOPLAY = false;
export const DEFAULT_AUTOPLAY_INTERVAL = 5000; // ms
export const DEFAULT_LOOP = true;

// ============================================
// SECTION NAMES (Hebrew)
// ============================================
export const SECTION_NAMES: Record<string, string> = {
  hero: 'באנר ראשי',
  'hero-slider': 'באנר סליידר',
  'hero-premium': 'באנר פרימיום',
  'video-banner': 'באנר וידאו',
  'split-banner': 'באנר מפוצל',
  'banner-small': 'באנר קטן',
  'quote-banner': 'באנר ציטוט',
  'text-block': 'בלוק טקסט',
  'image-text': 'תמונה + טקסט',
  newsletter: 'הצטרפו למועדון',
  contact: 'צור קשר',
  products: 'מוצרים נבחרים',
  categories: 'קטגוריות',
  'featured-items': 'פריטים מובחרים',
  'series-grid': 'גריד סדרות',
  'reviews-grid': 'ביקורות - גריד',
  'reviews-carousel': 'ביקורות - קרוסלה',
  reviews: 'ביקורות',
  'google-reviews': 'ביקורות גוגל',
  'google_reviews': 'ביקורות גוגל',
  logos: 'לוגואים',
  'features-grid': 'חוזקות - גריד',
  'features-carousel': 'חוזקות - קרוסלה',
  features: 'חוזקות',
  faq: 'שאלות נפוצות',
  'gallery-grid': 'גלריה - גריד',
  'gallery-carousel': 'גלריה - קרוסלה',
  gallery: 'גלריה',
};

// ============================================
// ASPECT RATIOS
// ============================================
export const ASPECT_RATIOS = {
  square: 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:4': 'aspect-[3/4]',
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  auto: '',
};

// ============================================
// MAX WIDTHS
// ============================================
export const MAX_WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-7xl',
};

