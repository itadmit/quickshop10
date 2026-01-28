/**
 * SeriesGridHandler - עדכון DOM בזמן אמת לסקשן סדרות
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleSeriesGridUpdate(
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
    const gridEl = el.querySelector('[data-series-grid]') as HTMLElement;
    if (gridEl) {
      gridEl.style.gridTemplateColumns = `repeat(${updates.settings.columns}, minmax(0, 1fr))`;
    }
  }

  // Gap
  if (updates.settings?.gap !== undefined) {
    const gridEl = el.querySelector('[data-series-grid]') as HTMLElement;
    if (gridEl) {
      gridEl.style.gap = `${updates.settings.gap}px`;
    }
  }
  
  // Category/item selection and ordering
  if (updates.content?.categoryIds !== undefined || updates.content?.selectionMode !== undefined) {
    const selectionMode = (updates.content?.selectionMode as string) || 'all';
    const categoryIds = (updates.content?.categoryIds as string[]) || [];
    const displayLimit = (updates.content?.displayLimit as number) || 4;
    const gridEl = el.querySelector('[data-items-grid]') as HTMLElement;
    
    if (gridEl) {
      const itemElements = Array.from(gridEl.querySelectorAll('[data-item-id]')) as HTMLElement[];
      
      if (selectionMode === 'manual' && categoryIds.length > 0) {
        // Hide unselected items
        itemElements.forEach(itemEl => {
          const itemId = itemEl.getAttribute('data-item-id');
          if (itemId && !categoryIds.includes(itemId)) {
            itemEl.style.display = 'none';
          } else {
            itemEl.style.display = '';
          }
        });
        
        // Reorder based on selection order
        categoryIds.forEach((catId, index) => {
          const itemEl = gridEl.querySelector(`[data-item-id="${catId}"]`) as HTMLElement;
          if (itemEl) {
            itemEl.style.order = String(index);
          }
        });
      } else {
        // Show all mode - show all with limit
        itemElements.forEach((itemEl, index) => {
          itemEl.style.display = index < displayLimit ? '' : 'none';
          itemEl.style.order = '';
        });
      }
    }
  }
  
  // Display limit (for "all" mode)
  if (updates.content?.displayLimit !== undefined) {
    // Get current selection mode from element dataset or updates
    const currentSelectionMode = (updates.content?.selectionMode as string) || 
                                  el.getAttribute('data-selection-mode') || 
                                  'all';
    if (currentSelectionMode === 'all') {
      const displayLimit = updates.content.displayLimit as number;
      const gridEl = el.querySelector('[data-items-grid]') as HTMLElement;
      if (gridEl) {
        const itemElements = Array.from(gridEl.querySelectorAll('[data-item-id]')) as HTMLElement[];
        itemElements.forEach((itemEl, index) => {
          itemEl.style.display = index < displayLimit ? '' : 'none';
        });
      }
    }
  }
  
  // Update selection mode on element for future reference
  if (updates.content?.selectionMode !== undefined) {
    el.setAttribute('data-selection-mode', updates.content.selectionMode as string);
  }
  
  // Custom category/item images
  if (updates.content?.categoryImages !== undefined) {
    const categoryImages = updates.content.categoryImages as Record<string, string>;
    const gridEl = el.querySelector('[data-items-grid]') as HTMLElement;
    if (gridEl) {
      // Get all items in the grid
      const allItems = Array.from(gridEl.querySelectorAll('[data-item-id]')) as HTMLElement[];
      
      allItems.forEach(itemEl => {
        const itemId = itemEl.getAttribute('data-item-id');
        if (!itemId) return;
        
        const bgEl = itemEl.querySelector('[data-item-bg]') as HTMLElement;
        if (!bgEl) return;
        
        const customImageUrl = categoryImages[itemId];
        const originalImageUrl = bgEl.getAttribute('data-original-image');
        
        if (customImageUrl && customImageUrl !== 'https://') {
          // Use custom image
          bgEl.style.backgroundImage = `url("${customImageUrl}")`;
        } else if (originalImageUrl) {
          // Restore original image
          bgEl.style.backgroundImage = `url("${originalImageUrl}")`;
        }
      });
    }
  }
}

export const defaultContent = {
  displayLimit: 4,
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
  paddingTop: 64,
  paddingBottom: 64,
  paddingLeft: 16,
  paddingRight: 16,
};

export const config = {
  type: 'series_grid',
  name: 'סדרות',
  icon: 'Grid',
};
