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
    const dividerEl = el.querySelector('[data-section-divider]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
      titleEl.style.display = updates.title ? '' : 'none';
      titleEl.classList.toggle('hidden', !updates.title);
    }
    // Show/hide divider with title
    if (dividerEl) {
      dividerEl.classList.toggle('hidden', !updates.title);
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
  
  // Title font family override
  if (updates.settings?.titleFontFamily !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const fontFamily = updates.settings.titleFontFamily as string;
      if (fontFamily) {
        titleEl.style.setProperty('font-family', `'${fontFamily}', sans-serif`, 'important');
      } else {
        titleEl.style.removeProperty('font-family');
      }
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
  
  // Subtitle font family override
  if (updates.settings?.subtitleFontFamily !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      const fontFamily = updates.settings.subtitleFontFamily as string;
      if (fontFamily) {
        subtitleEl.style.setProperty('font-family', `'${fontFamily}', sans-serif`, 'important');
      } else {
        subtitleEl.style.removeProperty('font-family');
      }
    }
  }

  // =====================================================
  // DIVIDER UPDATES
  // =====================================================
  
  if (updates.settings?.showDivider !== undefined) {
    const dividerEl = el.querySelector('[data-section-divider]') as HTMLElement;
    if (dividerEl) {
      dividerEl.style.display = updates.settings.showDivider === false ? 'none' : '';
      dividerEl.classList.toggle('hidden', updates.settings.showDivider === false);
    }
  }
  
  if (updates.settings?.dividerColor !== undefined) {
    const dividerEl = el.querySelector('[data-section-divider]') as HTMLElement;
    if (dividerEl) {
      dividerEl.style.backgroundColor = updates.settings.dividerColor as string;
    }
  }
  
  if (updates.settings?.dividerHeight !== undefined) {
    const dividerEl = el.querySelector('[data-section-divider]') as HTMLElement;
    if (dividerEl) {
      dividerEl.style.height = `${updates.settings.dividerHeight}px`;
    }
  }

  // =====================================================
  // TEXT ALIGNMENT
  // =====================================================
  
  if (updates.settings?.textAlign !== undefined) {
    const align = updates.settings.textAlign as string;
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    const dividerEl = el.querySelector('[data-section-divider]') as HTMLElement;
    
    // Remove existing alignment classes
    [titleEl, subtitleEl].forEach(elem => {
      if (elem) {
        elem.classList.remove('text-left', 'text-center', 'text-right');
        elem.classList.add(`text-${align}`);
      }
    });
    
    // Align divider using inline-start/end for RTL support
    // In RTL: left=start (ימין), right=end (שמאל)
    if (dividerEl) {
      if (align === 'center') {
        dividerEl.style.marginInlineStart = 'auto';
        dividerEl.style.marginInlineEnd = 'auto';
      } else if (align === 'left') {
        // left = ימין (start side in RTL)
        dividerEl.style.marginInlineStart = '0';
        dividerEl.style.marginInlineEnd = 'auto';
      } else {
        // right = שמאל (end side in RTL)
        dividerEl.style.marginInlineStart = 'auto';
        dividerEl.style.marginInlineEnd = '0';
      }
    }
  }

  // =====================================================
  // GRID SETTINGS
  // =====================================================
  
  const gridEl = el.querySelector('[data-products-grid]') as HTMLElement;
  const sectionId = el.getAttribute('data-section-id');
  
  if (gridEl) {
    // Columns - use inline styles and inject scoped CSS for responsive
    if (updates.settings?.columns !== undefined || updates.settings?.mobileColumns !== undefined) {
      const cols = (updates.settings?.columns as number) || gridEl.getAttribute('data-columns') || 4;
      const mobileCols = (updates.settings?.mobileColumns as number) || gridEl.getAttribute('data-mobile-columns') || 2;
      
      // Update data attributes
      gridEl.setAttribute('data-columns', String(cols));
      gridEl.setAttribute('data-mobile-columns', String(mobileCols));
      
      // Apply inline style for mobile (default)
      gridEl.style.gridTemplateColumns = `repeat(${mobileCols}, minmax(0, 1fr))`;
      
      // Inject/update scoped CSS for desktop
      if (sectionId) {
        const styleId = `products-grid-style-${sectionId}`;
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
  
  // Card style (standard/minimal/overlay)
  // This changes the card structure - update data attribute for CSS and require save/refresh for full effect
  if (updates.settings?.cardStyle !== undefined) {
    const cardStyle = updates.settings.cardStyle as string;
    el.setAttribute('data-card-style', cardStyle);
    
    // Apply immediate CSS-based changes
    if (sectionId) {
      const styleId = `products-card-style-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      // Apply basic style differences via CSS (full changes need refresh)
      if (cardStyle === 'minimal') {
        styleEl.textContent = `
          [data-section-id="${sectionId}"] [data-product-id] .aspect-\\[3\\/4\\] {
            background-color: transparent !important;
          }
        `;
      } else if (cardStyle === 'overlay') {
        // Overlay needs DOM changes - show indicator that refresh is needed
        styleEl.textContent = `
          [data-section-id="${sectionId}"] [data-product-id] {
            position: relative;
          }
        `;
      } else {
        // Standard
        styleEl.textContent = `
          [data-section-id="${sectionId}"] [data-product-id] .aspect-\\[3\\/4\\] {
            background-color: rgb(249 250 251) !important;
          }
        `;
      }
    }
  }

  // Show/hide add to cart button - live update
  if (updates.settings?.showAddToCart !== undefined) {
    const showCart = updates.settings.showAddToCart as boolean;
    el.setAttribute('data-show-add-to-cart', String(showCart));
    
    if (sectionId) {
      const styleId = `products-add-to-cart-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      if (showCart) {
        styleEl.textContent = `
          [data-section-id="${sectionId}"] [data-add-to-cart-container] {
            display: flex !important;
          }
        `;
      } else {
        styleEl.textContent = `
          [data-section-id="${sectionId}"] [data-add-to-cart-container] {
            display: none !important;
          }
        `;
      }
    }
  }

  // Product name lines - live update
  if (updates.settings?.productNameLines !== undefined) {
    const lines = updates.settings.productNameLines as number;
    el.setAttribute('data-product-name-lines', String(lines));
    
    if (sectionId) {
      const styleId = `products-name-lines-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      let lineClampCSS = '';
      if (lines === 0) {
        lineClampCSS = `
          [data-section-id="${sectionId}"] [data-product-name] {
            -webkit-line-clamp: unset !important;
            display: block !important;
          }
        `;
      } else {
        lineClampCSS = `
          [data-section-id="${sectionId}"] [data-product-name] {
            display: -webkit-box !important;
            -webkit-line-clamp: ${lines} !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
        `;
      }
      
      styleEl.textContent = lineClampCSS;
    }
  }

  // Image aspect ratio - inject CSS for real-time update
  if (updates.settings?.imageAspectRatio !== undefined) {
    const aspectRatio = updates.settings.imageAspectRatio as string;
    el.setAttribute('data-image-aspect-ratio', aspectRatio);
    
    // Inject scoped CSS for aspect ratio
    if (sectionId) {
      const styleId = `products-aspect-ratio-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      // Map aspect ratio to CSS
      const aspectMap: Record<string, string> = {
        'square': '1 / 1',
        'portrait': '3 / 4',
        'portrait-tall': '2 / 3',
        'landscape': '16 / 9',
      };
      const aspectValue = aspectMap[aspectRatio] || '3 / 4';
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-product-image-container] {
          aspect-ratio: ${aspectValue} !important;
        }
      `;
    }
  }
  
  // Image position - inject CSS for real-time update
  if (updates.settings?.imagePosition !== undefined) {
    const imagePosition = updates.settings.imagePosition as string;
    el.setAttribute('data-image-position', imagePosition);
    
    // Inject scoped CSS for image position
    if (sectionId) {
      const styleId = `products-image-position-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      // Map position to CSS object-position
      const positionMap: Record<string, string> = {
        'top': 'top',
        'center': 'center',
        'bottom': 'bottom',
      };
      const positionValue = positionMap[imagePosition] || 'center';
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-product-image-container] img,
        [data-section-id="${sectionId}"] [data-product-image-container] video {
          object-position: ${positionValue} !important;
        }
      `;
    }
  }
  
  // Image fit - inject CSS for real-time update
  if (updates.settings?.imageFit !== undefined) {
    const imageFit = updates.settings.imageFit as string;
    el.setAttribute('data-image-fit', imageFit);
    
    // Inject scoped CSS for image fit
    if (sectionId) {
      const styleId = `products-image-fit-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-product-image-container] img,
        [data-section-id="${sectionId}"] [data-product-image-container] video {
          object-fit: ${imageFit} !important;
        }
      `;
    }
  }

  // Card text alignment - inject CSS for real-time update
  if (updates.settings?.cardTextAlign !== undefined || updates.settings?.textAlign !== undefined) {
    const align = (updates.settings?.cardTextAlign || updates.settings?.textAlign) as string;
    el.setAttribute('data-card-text-align', align);
    
    // Inject scoped CSS for card text alignment
    if (sectionId) {
      const styleId = `products-card-align-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      // Map alignment to CSS and justify classes
      const textAlignCSS = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
      const justifyCSS = align === 'center' ? 'center' : align === 'right' ? 'flex-start' : 'flex-end';
      
      styleEl.textContent = `
        /* Standard card alignment */
        [data-section-id="${sectionId}"] [data-product-id] article > div:last-child {
          text-align: ${textAlignCSS} !important;
        }
        [data-section-id="${sectionId}"] [data-product-id] article > div:last-child > div {
          justify-content: ${justifyCSS} !important;
        }
        /* Overlay card alignment - the gradient div inside absolute container */
        [data-section-id="${sectionId}"] [data-product-id] article > .absolute > div {
          text-align: ${textAlignCSS} !important;
        }
        [data-section-id="${sectionId}"] [data-product-id] article > .absolute > div > div {
          justify-content: ${justifyCSS} !important;
        }
      `;
    }
  }
}

/**
 * Default content for new products sections
 */
export const defaultContent = {
  type: 'all', // 'all' | 'category' | 'featured' | 'specific'
  categoryId: '',
  productIds: [],
  displayLimit: 8,
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
  
  // Divider
  dividerColor: '#C9A962',
  
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
  imageAspectRatio: 'portrait',
  imagePosition: 'center',
  imageFit: 'cover',
  productNameLines: 2,
  
  // Visibility
  hideOnMobile: false,
  hideOnDesktop: false,
};

