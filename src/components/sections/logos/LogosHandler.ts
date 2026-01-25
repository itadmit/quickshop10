/**
 * LogosHandler - DOM update logic for logos section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleLogosUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  // Logo height
  if (updates.settings?.logoHeight !== undefined) {
    const height = updates.settings.logoHeight as number;
    const logos = el.querySelectorAll('[data-logo-image]');
    logos.forEach((img) => {
      (img as HTMLElement).style.height = `${height}px`;
    });
  }

  // Grayscale
  if (updates.settings?.grayscale !== undefined) {
    const isGray = updates.settings.grayscale as boolean;
    const logos = el.querySelectorAll('[data-logo-id]');
    logos.forEach((wrapper) => {
      const img = wrapper.querySelector('[data-logo-image]') as HTMLElement;
      if (img) {
        if (isGray) {
          (wrapper as HTMLElement).classList.add('opacity-60');
          img.classList.add('grayscale');
        } else {
          (wrapper as HTMLElement).classList.remove('opacity-60');
          img.classList.remove('grayscale');
        }
      }
    });
  }
}

export const defaultContent = { logos: [] };
export const defaultSettings = {
  titleSize: 30, titleSizeMobile: 24, titleColor: '#000000',
  logoHeight: 48, grayscale: false, backgroundColor: '#ffffff',
  paddingTop: 48, paddingBottom: 48, isVisible: true,
};

