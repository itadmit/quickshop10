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
  
  // Category selection and ordering
  if (updates.content?.categoryIds !== undefined || updates.content?.selectionMode !== undefined) {
    const selectionMode = (updates.content?.selectionMode as string) || 'all';
    const categoryIds = (updates.content?.categoryIds as string[]) || [];
    const displayLimit = (updates.content?.displayLimit as number) || 6;
    const gridEl = el.querySelector('[data-categories-grid]') as HTMLElement;
    
    if (gridEl) {
      const categoryElements = Array.from(gridEl.querySelectorAll('[data-category-id]')) as HTMLElement[];
      
      if (selectionMode === 'manual' && categoryIds.length > 0) {
        // Hide unselected categories
        categoryElements.forEach(catEl => {
          const catId = catEl.getAttribute('data-category-id');
          if (catId && !categoryIds.includes(catId)) {
            catEl.style.display = 'none';
          } else {
            catEl.style.display = '';
          }
        });
        
        // Reorder based on selection order
        categoryIds.forEach((catId, index) => {
          const catEl = gridEl.querySelector(`[data-category-id="${catId}"]`) as HTMLElement;
          if (catEl) {
            catEl.style.order = String(index);
          }
        });
      } else {
        // Show all mode - show all with limit
        categoryElements.forEach((catEl, index) => {
          catEl.style.display = index < displayLimit ? '' : 'none';
          catEl.style.order = '';
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
      const gridEl = el.querySelector('[data-categories-grid]') as HTMLElement;
      if (gridEl) {
        const categoryElements = Array.from(gridEl.querySelectorAll('[data-category-id]')) as HTMLElement[];
        categoryElements.forEach((catEl, index) => {
          catEl.style.display = index < displayLimit ? '' : 'none';
        });
      }
    }
  }
  
  // Update selection mode on element for future reference
  if (updates.content?.selectionMode !== undefined) {
    el.setAttribute('data-selection-mode', updates.content.selectionMode as string);
  }
  
  // Custom category images
  if (updates.content?.categoryImages !== undefined) {
    const categoryImages = updates.content.categoryImages as Record<string, string>;
    const gridEl = el.querySelector('[data-categories-grid]') as HTMLElement;
    if (gridEl) {
      // Get all categories
      const allCategories = Array.from(gridEl.querySelectorAll('[data-category-id]')) as HTMLElement[];
      
      allCategories.forEach(catEl => {
        const catId = catEl.getAttribute('data-category-id');
        if (!catId) return;
        
        const imageContainer = catEl.querySelector('[data-category-image-container]') as HTMLElement;
        const imgEl = catEl.querySelector('[data-category-image]') as HTMLImageElement;
        const placeholderEl = catEl.querySelector('[data-category-placeholder]') as HTMLElement;
        
        const customImageUrl = categoryImages[catId];
        const originalImageUrl = imageContainer?.getAttribute('data-original-image');
        
        if (customImageUrl && customImageUrl !== 'https://') {
          // Use custom image
          if (imgEl) {
            imgEl.src = customImageUrl;
            imgEl.style.display = '';
          } else if (imageContainer) {
            // Create img if it doesn't exist
            const newImg = document.createElement('img');
            newImg.src = customImageUrl;
            newImg.alt = '';
            newImg.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-700';
            newImg.setAttribute('data-category-image', '');
            if (placeholderEl) placeholderEl.style.display = 'none';
            imageContainer.appendChild(newImg);
          }
        } else if (originalImageUrl) {
          // Restore original image
          if (imgEl) {
            imgEl.src = originalImageUrl;
            imgEl.style.display = '';
          }
          if (placeholderEl) placeholderEl.style.display = 'none';
        } else {
          // No image - show placeholder
          if (imgEl) imgEl.style.display = 'none';
          if (placeholderEl) placeholderEl.style.display = '';
        }
      });
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

