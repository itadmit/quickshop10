/**
 * ProductsSliderHandler - DOM update logic for products slider section
 * לוגיקת עדכון DOM בזמן אמת לסקשן סליידר מוצרים
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

/**
 * Handle all real-time updates for products slider section
 */
export function handleProductsSliderUpdate(
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
      // Use setProperty with !important to override Tailwind classes
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
    
    [titleEl, subtitleEl].forEach(elem => {
      if (elem) {
        elem.classList.remove('text-left', 'text-center', 'text-right');
        elem.classList.add(`text-${align}`);
      }
    });
    
    if (dividerEl) {
      if (align === 'center') {
        dividerEl.style.marginInlineStart = 'auto';
        dividerEl.style.marginInlineEnd = 'auto';
      } else if (align === 'left') {
        dividerEl.style.marginInlineStart = '0';
        dividerEl.style.marginInlineEnd = 'auto';
      } else {
        dividerEl.style.marginInlineStart = 'auto';
        dividerEl.style.marginInlineEnd = '0';
      }
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

    el.setAttribute('data-display-limit', String(limit || ''));
  }

  // =====================================================
  // CONTAINER TYPE (full/boxed)
  // =====================================================
  
  if (updates.settings?.containerType !== undefined) {
    const container = updates.settings.containerType as string;
    const contentWrapper = el.querySelector('[data-content-wrapper]') as HTMLElement;
    
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
  // SLIDER SETTINGS - Live updates where possible
  // =====================================================

  const sectionId = el.getAttribute('data-section-id');

  // Slider gap
  if (updates.settings?.gap !== undefined) {
    const sliderTrack = el.querySelector('[data-slider-track]') as HTMLElement;
    if (sliderTrack) {
      sliderTrack.style.gap = `${updates.settings.gap}px`;
    }
  }

  // Show/hide arrows - live update
  if (updates.settings?.showArrows !== undefined) {
    const arrowsContainer = el.querySelector('[data-slider-arrows]') as HTMLElement;
    if (arrowsContainer) {
      arrowsContainer.style.display = updates.settings.showArrows ? '' : 'none';
    }
  }

  // Show/hide dots - live update
  if (updates.settings?.showDots !== undefined) {
    const dotsContainer = el.querySelector('[data-slider-dots]') as HTMLElement;
    if (dotsContainer) {
      dotsContainer.style.display = updates.settings.showDots ? '' : 'none';
    }
  }

  // Arrow style - live update (inject CSS)
  if (updates.settings?.arrowStyle !== undefined) {
    const arrowStyle = updates.settings.arrowStyle as string;
    
    if (sectionId) {
      const styleId = `products-slider-arrow-style-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      let buttonStyles = '';
      if (arrowStyle === 'circle') {
        buttonStyles = `
          background: white !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
          width: 40px !important;
          height: 40px !important;
          border-radius: 9999px !important;
        `;
      } else if (arrowStyle === 'minimal') {
        buttonStyles = `
          background: transparent !important;
          box-shadow: none !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 0 !important;
        `;
      } else {
        // square - ללא עיגול פינות
        buttonStyles = `
          background: white !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
          width: 40px !important;
          height: 40px !important;
          border-radius: 0 !important;
        `;
      }
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-slider-prev],
        [data-section-id="${sectionId}"] [data-slider-next] {
          ${buttonStyles}
        }
      `;
    }
  }

  // Arrow background color - live update
  if (updates.settings?.arrowBgColor !== undefined) {
    const bgColor = updates.settings.arrowBgColor as string;
    
    if (sectionId) {
      const styleId = `products-slider-arrow-bg-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-slider-prev],
        [data-section-id="${sectionId}"] [data-slider-next] {
          background-color: ${bgColor} !important;
        }
      `;
    }
  }

  // Arrow icon color - live update
  if (updates.settings?.arrowColor !== undefined) {
    const arrowColor = updates.settings.arrowColor as string;
    
    if (sectionId) {
      const styleId = `products-slider-arrow-color-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-slider-prev] svg,
        [data-section-id="${sectionId}"] [data-slider-next] svg {
          color: ${arrowColor} !important;
        }
      `;
    }
  }

  // Dots style - live update (inject CSS)
  if (updates.settings?.dotsStyle !== undefined) {
    const dotsStyle = updates.settings.dotsStyle as string;
    
    if (sectionId) {
      const styleId = `products-slider-dots-style-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      let dotStyles = '';
      if (dotsStyle === 'lines') {
        dotStyles = `
          [data-section-id="${sectionId}"] [data-slider-dots] button {
            height: 4px !important;
            border-radius: 2px !important;
          }
          [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="true"] {
            width: 32px !important;
          }
          [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="false"] {
            width: 16px !important;
          }
          [data-section-id="${sectionId}"] [data-slider-dots] [data-dot-number] {
            display: none !important;
          }
        `;
      } else if (dotsStyle === 'numbers') {
        dotStyles = `
          [data-section-id="${sectionId}"] [data-slider-dots] button {
            width: 32px !important;
            height: 32px !important;
            border-radius: 0 !important;
            font-size: 12px !important;
          }
          [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="true"] {
            background-color: rgb(17 24 39) !important;
            color: white !important;
          }
          [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="false"] {
            background-color: rgb(243 244 246) !important;
            color: rgb(75 85 99) !important;
          }
          [data-section-id="${sectionId}"] [data-slider-dots] [data-dot-number] {
            display: inline !important;
          }
        `;
      } else {
        // dots (default)
        dotStyles = `
          [data-section-id="${sectionId}"] [data-slider-dots] button {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
          }
          [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="true"] {
            width: 12px !important;
          }
          [data-section-id="${sectionId}"] [data-slider-dots] [data-dot-number] {
            display: none !important;
          }
        `;
      }
      
      styleEl.textContent = dotStyles;
    }
  }

  // Dots active color - live update
  if (updates.settings?.dotsActiveColor !== undefined) {
    const activeColor = updates.settings.dotsActiveColor as string;
    
    if (sectionId) {
      const styleId = `products-slider-dots-active-color-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="true"] {
          background-color: ${activeColor} !important;
        }
      `;
    }
  }

  // Dots inactive color - live update
  if (updates.settings?.dotsInactiveColor !== undefined) {
    const inactiveColor = updates.settings.dotsInactiveColor as string;
    
    if (sectionId) {
      const styleId = `products-slider-dots-inactive-color-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="false"] {
          background-color: ${inactiveColor} !important;
        }
      `;
    }
  }

  // Columns - inject CSS for responsive columns
  if (updates.settings?.columns !== undefined || updates.settings?.mobileColumns !== undefined) {
    const cols = (updates.settings?.columns as number) || 4;
    const mobileCols = (updates.settings?.mobileColumns as number) || 2;
    
    if (sectionId) {
      const styleId = `products-slider-columns-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      // Calculate item width based on columns
      const gap = (updates.settings?.gap as number) || 24;
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-slider-track] > * {
          width: calc((100% - ${(cols - 1) * gap}px) / ${cols}) !important;
        }
        @media (max-width: 768px) {
          [data-section-id="${sectionId}"] [data-slider-track] > * {
            width: calc((100% - ${(mobileCols - 1) * gap}px) / ${mobileCols}) !important;
          }
        }
      `;
    }
  }

  // Card style
  if (updates.settings?.cardStyle !== undefined) {
    const cardStyle = updates.settings.cardStyle as string;
    el.setAttribute('data-card-style', cardStyle);
  }

  // Show/hide add to cart button - live update
  if (updates.settings?.showAddToCart !== undefined) {
    const showCart = updates.settings.showAddToCart as boolean;
    el.setAttribute('data-show-add-to-cart', String(showCart));
    
    if (sectionId) {
      const styleId = `products-slider-add-to-cart-${sectionId}`;
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
      const styleId = `products-slider-name-lines-${sectionId}`;
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

  // Image aspect ratio
  if (updates.settings?.imageAspectRatio !== undefined) {
    const aspectRatio = updates.settings.imageAspectRatio as string;
    el.setAttribute('data-image-aspect-ratio', aspectRatio);
    
    if (sectionId) {
      const styleId = `products-slider-aspect-ratio-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
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
  
  // Image position
  if (updates.settings?.imagePosition !== undefined) {
    const imagePosition = updates.settings.imagePosition as string;
    el.setAttribute('data-image-position', imagePosition);
    
    if (sectionId) {
      const styleId = `products-slider-image-position-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
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
  
  // Image fit
  if (updates.settings?.imageFit !== undefined) {
    const imageFit = updates.settings.imageFit as string;
    el.setAttribute('data-image-fit', imageFit);
    
    if (sectionId) {
      const styleId = `products-slider-image-fit-${sectionId}`;
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

  // Card text alignment
  if (updates.settings?.cardTextAlign !== undefined || updates.settings?.textAlign !== undefined) {
    const align = (updates.settings?.cardTextAlign || updates.settings?.textAlign) as string;
    el.setAttribute('data-card-text-align', align);
    
    if (sectionId) {
      const styleId = `products-slider-card-align-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      const textAlignCSS = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
      const justifyCSS = align === 'center' ? 'center' : align === 'right' ? 'flex-start' : 'flex-end';
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-product-id] article > div:last-child {
          text-align: ${textAlignCSS} !important;
        }
        [data-section-id="${sectionId}"] [data-product-id] article > div:last-child > div {
          justify-content: ${justifyCSS} !important;
        }
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
 * Default content for new products slider sections
 */
export const defaultContent = {
  type: 'all', // 'all' | 'category' | 'featured' | 'specific'
  categoryId: '',
  productIds: [],
  displayLimit: 8,
};

/**
 * Default settings for new products slider sections
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
  gap: 24,
  containerType: 'container',
  
  // Slider specific
  showArrows: true,
  showDots: true,
  arrowStyle: 'circle',
  dotsStyle: 'dots',
  autoplay: false,
  autoplayInterval: 5000,
  loop: true,
  
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
