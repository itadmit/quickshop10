/**
 * SplitBannerHandler - DOM update logic for split banner section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleSplitBannerUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  // Left/Right images and titles
  if (updates.content?.right !== undefined) {
    const right = updates.content.right as Record<string, string>;
    const rightEl = el.querySelector('[data-side="right"]') as HTMLElement;
    if (rightEl) {
      if (right.title) {
        const title = rightEl.querySelector('[data-side-title]') as HTMLElement;
        if (title) title.textContent = right.title;
      }
      if (right.imageUrl) {
        const bg = rightEl.querySelector('[data-bg-desktop]') as HTMLElement;
        if (bg) bg.style.backgroundImage = `url(${right.imageUrl})`;
      }
    }
  }

  if (updates.content?.left !== undefined) {
    const left = updates.content.left as Record<string, string>;
    const leftEl = el.querySelector('[data-side="left"]') as HTMLElement;
    if (leftEl) {
      if (left.title) {
        const title = leftEl.querySelector('[data-side-title]') as HTMLElement;
        if (title) title.textContent = left.title;
      }
      if (left.imageUrl) {
        const bg = leftEl.querySelector('[data-bg-desktop]') as HTMLElement;
        if (bg) bg.style.backgroundImage = `url(${left.imageUrl})`;
      }
    }
  }
}

export const defaultContent = {
  right: { title: '', imageUrl: '', link: '' },
  left: { title: '', imageUrl: '', link: '' },
};
export const defaultSettings = {
  titleSize: 24, titleSizeMobile: 20, titleColor: '#ffffff',
  overlay: 0.2, minHeight: 400,
  paddingTop: 0, paddingBottom: 0, isVisible: true,
};

