/**
 * GalleryHandler - DOM update logic for gallery section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleGalleryUpdate(element: Element, updates: Partial<Section>): void {
  applyCommonUpdates(element, updates);
  
  // Gallery-specific updates handled by common handler (grid, columns, gap)
}

export const defaultContent = { images: [] };
export const defaultSettings = {
  titleSize: 30, titleSizeMobile: 24, titleColor: '#000000',
  columns: 4, mobileColumns: 2, gap: 16,
  backgroundColor: '#ffffff', paddingTop: 64, paddingBottom: 64, isVisible: true,
};

