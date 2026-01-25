/**
 * Section System - Data Attributes Utilities
 * פונקציות ליצירת data attributes לעריכה בזמן אמת
 */

// ============================================
// BASE SECTION ATTRIBUTES
// ============================================

export interface SectionDataAttributes {
  'data-section-id': string;
  'data-section-type': string;
  'data-section-title'?: string;
  'data-section-subtitle'?: string;
}

export function getSectionDataAttributes(
  sectionId: string,
  type: string,
  hasTitle = true,
  hasSubtitle = true
): SectionDataAttributes {
  const attrs: SectionDataAttributes = {
    'data-section-id': sectionId,
    'data-section-type': type,
  };
  
  if (hasTitle) {
    attrs['data-section-title'] = '';
  }
  
  if (hasSubtitle) {
    attrs['data-section-subtitle'] = '';
  }
  
  return attrs;
}

// ============================================
// ITEM ATTRIBUTES (for lists)
// ============================================

export function getItemDataAttributes(
  type: string,
  index: number,
  id?: string
): Record<string, string | number> {
  const prefix = type.replace(/-/g, '_');
  return {
    [`data-${prefix}-index`]: index,
    [`data-${prefix}-id`]: id || `${prefix}-${index}`,
  };
}

// ============================================
// SPECIFIC SECTION ATTRIBUTES
// ============================================

// Reviews
export interface ReviewDataAttributes {
  'data-review-index': number;
  'data-review-id': string;
  'data-review-text'?: string;
  'data-review-author'?: string;
  'data-review-rating'?: string;
  'data-review-date'?: string;
  'data-review-avatar'?: string;
}

export function getReviewDataAttributes(
  index: number,
  id: string
): ReviewDataAttributes {
  return {
    'data-review-index': index,
    'data-review-id': id,
    'data-review-text': '',
    'data-review-author': '',
    'data-review-rating': '',
    'data-review-date': '',
    'data-review-avatar': '',
  };
}

// Features
export interface FeatureDataAttributes {
  'data-feature-index': number;
  'data-feature-id': string;
  'data-feature-icon'?: string;
  'data-feature-title'?: string;
  'data-feature-description'?: string;
}

export function getFeatureDataAttributes(
  index: number,
  id: string
): FeatureDataAttributes {
  return {
    'data-feature-index': index,
    'data-feature-id': id,
    'data-feature-icon': '',
    'data-feature-title': '',
    'data-feature-description': '',
  };
}

// Gallery
export interface GalleryItemDataAttributes {
  'data-gallery-item-index': number;
  'data-gallery-item-id': string;
  'data-gallery-image'?: string;
}

export function getGalleryItemDataAttributes(
  index: number,
  id: string
): GalleryItemDataAttributes {
  return {
    'data-gallery-item-index': index,
    'data-gallery-item-id': id,
    'data-gallery-image': '',
  };
}

// Logos
export interface LogoDataAttributes {
  'data-logo-index': number;
  'data-logo-id': string;
  'data-logo-image'?: string;
}

export function getLogoDataAttributes(
  index: number,
  id: string
): LogoDataAttributes {
  return {
    'data-logo-index': index,
    'data-logo-id': id,
    'data-logo-image': '',
  };
}

// FAQ
export interface FAQItemDataAttributes {
  'data-faq-item-index': number;
  'data-faq-item-id': string;
  'data-faq-question'?: string;
  'data-faq-answer'?: string;
}

export function getFAQItemDataAttributes(
  index: number,
  id: string
): FAQItemDataAttributes {
  return {
    'data-faq-item-index': index,
    'data-faq-item-id': id,
    'data-faq-question': '',
    'data-faq-answer': '',
  };
}

// Hero Slides
export interface SlideDataAttributes {
  'data-slide-index': number;
  'data-slide-id': string;
  'data-slide-title'?: string;
  'data-slide-subtitle'?: string;
  'data-slide-button'?: string;
  'data-slide-image'?: string;
}

export function getSlideDataAttributes(
  index: number,
  id: string
): SlideDataAttributes {
  return {
    'data-slide-index': index,
    'data-slide-id': id,
    'data-slide-title': '',
    'data-slide-subtitle': '',
    'data-slide-button': '',
    'data-slide-image': '',
  };
}

// ============================================
// GRID/CONTAINER ATTRIBUTES
// ============================================

export function getGridDataAttributes(
  type: string
): Record<string, string> {
  return {
    [`data-${type}-grid`]: '',
  };
}

