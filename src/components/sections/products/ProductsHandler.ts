/**
 * ProductsHandler - DOM update logic for products section
 * לוגיקת עדכון DOM בזמן אמת לסקשן מוצרים נבחרים
 * 
 * כל הגדרה שמשתנה באדיטור -> מתעדכנת כאן -> משתקפת באייפריים
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

/**
 * Handle all real-time updates for products section
 */
export function handleProductsUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // =====================================================
  // COMMON SETTINGS (background, visibility, spacing, animation, etc.)
  // =====================================================
  applyCommonUpdates(el, updates);

  // =====================================================
  // TITLE UPDATES
  // =====================================================
  
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
      titleEl.style.display = updates.title ? '' : 'none';
      titleEl.classList.toggle('hidden', !updates.title);
    }
  }

  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.style.color = updates.settings.titleColor as string;
    }
  }

  if (updates.settings?.titleSize !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const size = updates.settings.titleSize as number;
      if (typeof size === 'number') {
        titleEl.style.fontSize = `${size}px`;
      }
    }
  }

  if (updates.settings?.titleWeight !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const weightMap: Record<string, string> = {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      };
      titleEl.style.fontWeight = weightMap[updates.settings.titleWeight as string] || '400';
    }
  }

  // =====================================================
  // SUBTITLE UPDATES
  // =====================================================
  
  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
      subtitleEl.style.display = updates.subtitle ? '' : 'none';
      subtitleEl.classList.toggle('hidden', !updates.subtitle);
    }
  }

  if (updates.settings?.subtitleColor !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.style.color = updates.settings.subtitleColor as string;
    }
  }

  if (updates.settings?.subtitleSize !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      const size = updates.settings.subtitleSize as number;
      if (typeof size === 'number') {
        subtitleEl.style.fontSize = `${size}px`;
      }
    }
  }

  // =====================================================
  // TEXT ALIGNMENT
  // =====================================================
  
  if (updates.settings?.textAlign !== undefined) {
    const align = updates.settings.textAlign as string;
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    
    // Remove existing alignment classes
    [titleEl, subtitleEl].forEach(elem => {
      if (elem) {
        elem.classList.remove('text-left', 'text-center', 'text-right');
        elem.classList.add(`text-${align}`);
      }
    });
  }

  // =====================================================
  // GRID SETTINGS
  // =====================================================
  
  const gridEl = el.querySelector('[data-products-grid]') as HTMLElement;
  
  if (gridEl) {
    // Columns
    if (updates.settings?.columns !== undefined) {
      const cols = updates.settings.columns as number;
      gridEl.classList.remove('lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5', 'lg:grid-cols-6');
      gridEl.classList.add(`lg:grid-cols-${cols}`);
    }

    // Mobile columns
    if (updates.settings?.mobileColumns !== undefined) {
      const cols = updates.settings.mobileColumns as number;
      gridEl.classList.remove('grid-cols-1', 'grid-cols-2');
      gridEl.classList.add(`grid-cols-${cols}`);
    }

    // Gap
    if (updates.settings?.gap !== undefined) {
      const gap = updates.settings.gap as number;
      gridEl.style.gap = `${gap}px`;
    }
  }

  // =====================================================
  // DISPLAY LIMIT (כמות להצגה)
  // =====================================================
  
  if (updates.settings?.displayLimit !== undefined || updates.content?.displayLimit !== undefined) {
    const limit = (updates.settings?.displayLimit || updates.content?.displayLimit) as number;
    const productCards = el.querySelectorAll('[data-product-index]');
    
    productCards.forEach((card) => {
      const index = parseInt(card.getAttribute('data-product-index') || '0');
      if (limit && index >= limit) {
        (card as HTMLElement).classList.add('hidden');
      } else {
        (card as HTMLElement).classList.remove('hidden');
      }
    });

    // Update data attribute for persistence
    el.setAttribute('data-display-limit', String(limit || ''));
  }

  // =====================================================
  // CONTAINER TYPE (full/boxed)
  // =====================================================
  
  if (updates.settings?.containerType !== undefined) {
    const container = updates.settings.containerType as string;
    const contentWrapper = el.querySelector('.max-w-7xl') as HTMLElement;
    
    if (contentWrapper) {
      if (container === 'full') {
        contentWrapper.classList.remove('max-w-7xl', 'mx-auto');
        contentWrapper.classList.add('w-full', 'px-4');
      } else {
        contentWrapper.classList.remove('w-full');
        contentWrapper.classList.add('max-w-7xl', 'mx-auto');
      }
    }
  }

  // =====================================================
  // LAYOUT (grid/slider) - Note: Full slider implementation may need refresh
  // =====================================================
  
  if (updates.settings?.layout !== undefined) {
    // For now, just store the preference - full layout change may need page refresh
    el.setAttribute('data-layout', updates.settings.layout as string);
  }

  // =====================================================
  // CARD STYLES
  // =====================================================
  
  // Card background color
  if (updates.settings?.cardBackgroundColor !== undefined) {
    const cards = el.querySelectorAll('[data-product-id]');
    cards.forEach((card) => {
      (card as HTMLElement).style.backgroundColor = updates.settings?.cardBackgroundColor as string;
    });
  }
}

/**
 * Default content for new products sections
 */
export const defaultContent = {
  displayBy: 'category', // 'category' | 'manual' | 'all'
  categoryId: '',
  productIds: [],
  displayLimit: 4,
};

/**
 * Default settings for new products sections
 */
export const defaultSettings = {
  // Typography - Title
  titleSize: 28,
  titleSizeMobile: 22,
  titleColor: '#000000',
  titleWeight: 'light',
  
  // Typography - Subtitle
  subtitleSize: 12,
  subtitleSizeMobile: 10,
  subtitleColor: '#9ca3af',
  
  // Layout
  textAlign: 'center',
  columns: 4,
  mobileColumns: 2,
  gap: 32,
  containerType: 'container',
  layout: 'grid',
  
  // Background
  backgroundColor: '#ffffff',
  
  // Spacing
  paddingTop: 80,
  paddingBottom: 80,
  paddingLeft: 24,
  paddingRight: 24,
  marginTop: 0,
  marginBottom: 0,
  
  // Card styling
  cardStyle: 'standard',
  hoverEffect: 'scale',
  showAddToCart: false,
  addToCartStyle: 'outline',
  
  // Visibility
  hideOnMobile: false,
  hideOnDesktop: false,
};

