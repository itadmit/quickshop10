/**
 * FeaturedItemsHandler - עדכון DOM בזמן אמת לסקשן פריטים מובחרים
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleFeaturedItemsUpdate(
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

  // Grid columns - use inline styles and inject scoped CSS for responsive
  const gridEl = el.querySelector('[data-products-grid]') as HTMLElement;
  const sectionId = el.getAttribute('data-section-id');
  
  if (gridEl && (updates.settings?.columns !== undefined || updates.settings?.mobileColumns !== undefined)) {
    const cols = (updates.settings?.columns as number) || gridEl.getAttribute('data-columns') || 4;
    const mobileCols = (updates.settings?.mobileColumns as number) || gridEl.getAttribute('data-mobile-columns') || 2;
    
    // Update data attributes
    gridEl.setAttribute('data-columns', String(cols));
    gridEl.setAttribute('data-mobile-columns', String(mobileCols));
    
    // Apply inline style for mobile (default)
    gridEl.style.gridTemplateColumns = `repeat(${mobileCols}, minmax(0, 1fr))`;
    
    // Inject/update scoped CSS for desktop
    if (sectionId) {
      const styleId = `featured-items-grid-style-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        @media (min-width: 1024px) {
          [data-section-id="${sectionId}"] [data-products-grid] {
            grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important;
          }
        }
      `;
    }
  }

  // Gap
  if (updates.settings?.gap !== undefined && gridEl) {
    gridEl.style.gap = `${updates.settings.gap}px`;
  }
}

export const defaultContent = {
  displayLimit: 4,
};

export const defaultSettings = {
  backgroundColor: '#ffffff',
  titleSize: 28,
  titleSizeMobile: 22,
  titleWeight: 'light',
  titleColor: '#000000',
  subtitleSize: 12,
  subtitleSizeMobile: 10,
  subtitleColor: '#9ca3af',
  columns: 4,
  mobileColumns: 2,
  gap: 24,
  showAddToCart: false,
  cardStyle: 'standard',
  hoverEffect: 'scale',
  paddingTop: 80,
  paddingBottom: 80,
  paddingLeft: 24,
  paddingRight: 24,
};

export const config = {
  type: 'featured_items',
  name: 'פריטים מובחרים',
  icon: 'Star',
};

