/**
 * ImageTextHandler - DOM update logic for image+text section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleImageTextUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  // Image position (left/right)
  if (updates.settings?.imagePosition !== undefined) {
    const container = el.querySelector('[data-content-container]') as HTMLElement;
    if (container) {
      container.classList.remove('flex-row', 'flex-row-reverse');
      container.classList.add(updates.settings.imagePosition === 'left' ? 'flex-row-reverse' : 'flex-row');
    }
  }
}

export const defaultContent = { imageUrl: '', text: '', buttonText: '', buttonLink: '' };
export const defaultSettings = {
  titleSize: 36, titleSizeMobile: 28, titleColor: '#000000', titleWeight: 'bold',
  textSize: 16, textSizeMobile: 14, textColor: '#374151',
  imagePosition: 'right', overlay: 0,
  backgroundColor: '#ffffff', paddingTop: 64, paddingBottom: 64, isVisible: true,
};

