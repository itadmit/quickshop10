/**
 * Section Handlers Registry
 * רישום כל ה-handlers לעדכון DOM בזמן אמת
 */

import { SectionHandler, SectionHandlers } from '../types';

// Import all handlers
import { handler as textBlockHandler } from '../text-block';
import { handler as heroHandler } from '../hero';
import { handler as reviewsHandler } from '../reviews';
import { handler as featuresHandler } from '../features';
import { handler as faqHandler } from '../faq';
import { handler as newsletterHandler } from '../newsletter';
import { handler as contactHandler } from '../contact';
import { handler as logosHandler } from '../logos';
import { handler as galleryHandler } from '../gallery';
import { handler as imageTextHandler } from '../image-text';
import { handler as bannerSmallHandler } from '../banner-small';
import { handler as videoBannerHandler } from '../video-banner';
import { handler as splitBannerHandler } from '../split-banner';

// Registry of all section handlers
export const sectionHandlers: SectionHandlers = {
  text_block: textBlockHandler,
  hero: heroHandler,
  reviews: reviewsHandler,
  features: featuresHandler,
  faq: faqHandler,
  newsletter: newsletterHandler,
  contact: contactHandler,
  logos: logosHandler,
  gallery: galleryHandler,
  image_text: imageTextHandler,
  banner_small: bannerSmallHandler,
  video_banner: videoBannerHandler,
  split_banner: splitBannerHandler,
};

/**
 * Get handler for a specific section type
 */
export function getHandler(sectionType: string): SectionHandler | undefined {
  return sectionHandlers[sectionType];
}

/**
 * Check if a section type has a dedicated handler
 */
export function hasHandler(sectionType: string): boolean {
  return sectionType in sectionHandlers;
}

/**
 * Get list of all section types with dedicated handlers
 */
export function getHandledSectionTypes(): string[] {
  return Object.keys(sectionHandlers);
}

// Export common handler utilities
export { applyCommonUpdates, createHandler } from './common-handler';
