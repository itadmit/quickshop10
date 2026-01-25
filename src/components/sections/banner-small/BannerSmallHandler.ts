/**
 * BannerSmallHandler - DOM update logic for small banner section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleBannerSmallUpdate(element: Element, updates: Partial<Section>): void {
  applyCommonUpdates(element, updates);
}

export const defaultContent = { imageUrl: '', buttonText: '', buttonLink: '' };
export const defaultSettings = {
  titleSize: 24, titleSizeMobile: 20, titleColor: '#ffffff', titleWeight: 'semibold',
  subtitleSize: 14, subtitleSizeMobile: 12, subtitleColor: '#ffffff',
  overlay: 0.3, backgroundColor: '#1f2937',
  paddingTop: 48, paddingBottom: 48, isVisible: true,
};

