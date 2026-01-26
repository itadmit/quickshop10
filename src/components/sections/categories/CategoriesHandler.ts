/**
 * CategoriesHandler - עדכון DOM בזמן אמת לסקשן קטגוריות
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleCategoriesUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // Apply common updates first (background, spacing, visibility, etc.)
  applyCommonUpdates(el, updates);

  // Title
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
    }
  }

  // Subtitle
  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
    }
  }

  // Title typography
  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) titleEl.style.color = updates.settings.titleColor as string;
  }

  // Subtitle typography
  if (updates.settings?.subtitleColor !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) subtitleEl.style.color = updates.settings.subtitleColor as string;
  }

  // Grid columns
  if (updates.settings?.columns !== undefined) {
    const gridEl = el.querySelector('[data-categories-grid]') as HTMLElement;
    if (gridEl) {
      gridEl.style.gridTemplateColumns = `repeat(${updates.settings.columns}, minmax(0, 1fr))`;
    }
  }

  // Gap
  if (updates.settings?.gap !== undefined) {
    const gridEl = el.querySelector('[data-categories-grid]') as HTMLElement;
    if (gridEl) {
      gridEl.style.gap = `${updates.settings.gap}px`;
    }
  }
}

export const defaultContent = {
  displayLimit: 6,
};

export const defaultSettings = {
  backgroundColor: '#ffffff',
  titleSize: 28,
  titleSizeMobile: 22,
  titleWeight: 'bold',
  titleColor: '#000000',
  subtitleSize: 14,
  subtitleSizeMobile: 12,
  subtitleColor: '#6b7280',
  columns: 4,
  mobileColumns: 2,
  gap: 24,
  showImages: true,
  showCount: false,
  paddingTop: 64,
  paddingBottom: 64,
  paddingLeft: 16,
  paddingRight: 16,
};

export const config = {
  type: 'categories',
  name: 'קטגוריות',
  icon: 'Grid',
};

