/**
 * ContentSliderHandler - DOM update logic for content slider section
 * לוגיקת עדכון DOM בזמן אמת לסקשן סליידר תוכן
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

/**
 * Handle all real-time updates for content slider section
 */
export function handleContentSliderUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // =====================================================
  // COMMON SETTINGS (background, visibility, spacing, etc.)
  // =====================================================
  applyCommonUpdates(el, updates);

  // =====================================================
  // SECTION TITLE/SUBTITLE
  // =====================================================
  
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
      titleEl.style.display = updates.title ? '' : 'none';
    }
  }

  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
      subtitleEl.style.display = updates.subtitle ? '' : 'none';
    }
  }

  // =====================================================
  // TITLE STYLING
  // =====================================================
  
  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.style.color = updates.settings.titleColor as string;
    }
  }

  if (updates.settings?.titleSize !== undefined) {
    const sectionId = el.getAttribute('data-section-id');
    if (sectionId) {
      const styleId = `content-slider-title-size-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      const size = updates.settings.titleSize as number;
      const mobileSize = (updates.settings.titleSizeMobile as number) || Math.round(size * 0.75);
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-section-title] {
          font-size: ${mobileSize}px !important;
        }
        @media (min-width: 768px) {
          [data-section-id="${sectionId}"] [data-section-title] {
            font-size: ${size}px !important;
          }
        }
      `;
    }
  }

  if (updates.settings?.titleWeight !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const weight = updates.settings.titleWeight as string;
      const weightMap: Record<string, string> = {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      };
      titleEl.style.fontWeight = weightMap[weight] || '400';
    }
  }

  // =====================================================
  // TEXT ALIGNMENT
  // =====================================================
  
  if (updates.settings?.textAlign !== undefined) {
    const align = updates.settings.textAlign as string;
    const titleWrapper = el.querySelector('[data-section-title]')?.parentElement as HTMLElement;
    const dividerEl = el.querySelector('[data-section-divider]') as HTMLElement;
    
    if (titleWrapper) {
      titleWrapper.classList.remove('text-left', 'text-center', 'text-right');
      titleWrapper.classList.add(`text-${align}`);
    }
    
    if (dividerEl) {
      dividerEl.classList.remove('mx-auto', 'mr-auto', 'ml-auto');
      if (align === 'center') dividerEl.classList.add('mx-auto');
      else if (align === 'left') dividerEl.classList.add('mr-auto');
      else dividerEl.classList.add('ml-auto');
    }
  }

  // =====================================================
  // DIVIDER
  // =====================================================
  
  if (updates.settings?.showDivider !== undefined) {
    const dividerEl = el.querySelector('[data-section-divider]') as HTMLElement;
    if (dividerEl) {
      dividerEl.style.display = updates.settings.showDivider ? '' : 'none';
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
  // SLIDER CONTROLS
  // =====================================================
  
  const sectionId = el.getAttribute('data-section-id');

  if (updates.settings?.showArrows !== undefined) {
    const arrows = el.querySelectorAll('[data-slider-prev], [data-slider-next]');
    arrows.forEach(arrow => {
      (arrow as HTMLElement).style.display = updates.settings?.showArrows ? '' : 'none';
    });
  }

  if (updates.settings?.showDots !== undefined) {
    const dotsContainer = el.querySelector('[data-slider-dots]') as HTMLElement;
    if (dotsContainer) {
      dotsContainer.style.display = updates.settings.showDots ? '' : 'none';
    }
  }

  // Arrow styling
  if (updates.settings?.arrowBgColor !== undefined) {
    const arrows = el.querySelectorAll('[data-slider-prev], [data-slider-next]');
    arrows.forEach(arrow => {
      (arrow as HTMLElement).style.backgroundColor = updates.settings?.arrowBgColor as string;
    });
  }

  if (updates.settings?.arrowColor !== undefined) {
    const arrows = el.querySelectorAll('[data-slider-prev] svg, [data-slider-next] svg');
    arrows.forEach(svg => {
      (svg as SVGElement).style.stroke = updates.settings?.arrowColor as string;
    });
  }

  // Dots styling
  if (updates.settings?.dotsActiveColor !== undefined || updates.settings?.dotsInactiveColor !== undefined) {
    if (sectionId) {
      const styleId = `content-slider-dots-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      const activeColor = updates.settings?.dotsActiveColor || '#111827';
      const inactiveColor = updates.settings?.dotsInactiveColor || '#d1d5db';
      
      styleEl.textContent = `
        [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="true"] {
          background-color: ${activeColor} !important;
        }
        [data-section-id="${sectionId}"] [data-slider-dots] button[data-active="false"] {
          background-color: ${inactiveColor} !important;
        }
      `;
    }
  }

  // =====================================================
  // COLUMNS/GAP (requires rebuild - update data attributes)
  // =====================================================
  
  if (updates.settings?.columns !== undefined || updates.settings?.mobileColumns !== undefined || updates.settings?.gap !== undefined) {
    const cols = (updates.settings?.columns as number) || 4;
    const mobileCols = (updates.settings?.mobileColumns as number) || 1;
    const gap = (updates.settings?.gap as number) || 16;
    
    if (sectionId) {
      const styleId = `content-slider-columns-${sectionId}`;
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      // Peek effect: columns + 0.25
      styleEl.textContent = `
        [data-section-id="${sectionId}"] .embla__slide {
          flex: 0 0 ${100 / (mobileCols + 0.25)}% !important;
          padding-left: ${gap / 2}px !important;
          padding-right: ${gap / 2}px !important;
        }
        @media (min-width: 768px) {
          [data-section-id="${sectionId}"] .embla__slide {
            flex: 0 0 ${100 / (cols + 0.25)}% !important;
          }
        }
      `;
    }
  }

  // =====================================================
  // ITEM STYLING
  // =====================================================
  
  if (updates.settings?.itemBorderRadius !== undefined) {
    const items = el.querySelectorAll('[data-item-index]');
    items.forEach(item => {
      const inner = item.querySelector(':scope > div') as HTMLElement;
      if (inner) {
        inner.style.borderRadius = `${updates.settings?.itemBorderRadius}px`;
      }
    });
  }

  if (updates.settings?.itemTitleColor !== undefined) {
    const titles = el.querySelectorAll('[data-item-title]');
    titles.forEach(title => {
      (title as HTMLElement).style.color = updates.settings?.itemTitleColor as string;
    });
  }

  if (updates.settings?.itemTitleSize !== undefined) {
    const titles = el.querySelectorAll('[data-item-title]');
    titles.forEach(title => {
      (title as HTMLElement).style.fontSize = `${updates.settings?.itemTitleSize}px`;
    });
  }

  if (updates.settings?.itemOverlay !== undefined) {
    const overlays = el.querySelectorAll('[data-item-overlay]');
    overlays.forEach(overlay => {
      (overlay as HTMLElement).style.backgroundColor = `rgba(0,0,0,${updates.settings?.itemOverlay})`;
    });
  }

  // =====================================================
  // ASPECT RATIO
  // =====================================================
  
  if (updates.settings?.aspectRatio !== undefined) {
    const items = el.querySelectorAll('[data-item-index]');
    const aspectMap: Record<string, string> = {
      'square': '1 / 1',
      'portrait': '3 / 4',
      'landscape': '16 / 10',
      '16:9': '16 / 9',
    };
    const aspectValue = aspectMap[updates.settings.aspectRatio as string] || '3 / 4';
    
    items.forEach(item => {
      const inner = item.querySelector(':scope > div') as HTMLElement;
      if (inner) {
        inner.style.aspectRatio = aspectValue;
      }
    });
  }

  // =====================================================
  // CONTENT ITEMS - Real-time update of each card
  // =====================================================
  
  if (updates.content?.items !== undefined) {
    const items = updates.content.items as Array<{
      id?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      imageUrl?: string;
      mobileImageUrl?: string;
      videoUrl?: string;
      buttonText?: string;
      buttonLink?: string;
      overlay?: number;
      textAlign?: string;
    }>;
    
    items.forEach((item, index) => {
      const itemEl = el.querySelector(`[data-item-index="${index}"]`) as HTMLElement;
      if (!itemEl) return;
      
      // Update title
      if (item.title !== undefined) {
        const titleEl = itemEl.querySelector('[data-item-title]') as HTMLElement;
        if (titleEl) {
          titleEl.textContent = item.title || '';
          titleEl.style.display = item.title ? '' : 'none';
        }
      }
      
      // Update subtitle
      if (item.subtitle !== undefined) {
        const subtitleEl = itemEl.querySelector('[data-item-subtitle]') as HTMLElement;
        if (subtitleEl) {
          subtitleEl.textContent = item.subtitle || '';
          subtitleEl.style.display = item.subtitle ? '' : 'none';
        }
      }
      
      // Update description
      if (item.description !== undefined) {
        const descEl = itemEl.querySelector('[data-item-description]') as HTMLElement;
        if (descEl) {
          descEl.textContent = item.description || '';
          descEl.style.display = item.description ? '' : 'none';
        }
      }
      
      // Update button text
      if (item.buttonText !== undefined) {
        const buttonEl = itemEl.querySelector('[data-item-button]') as HTMLElement;
        if (buttonEl) {
          buttonEl.textContent = item.buttonText || '';
        }
        // Show/hide button wrapper
        const buttonWrapper = buttonEl?.parentElement;
        if (buttonWrapper) {
          buttonWrapper.style.display = (item.buttonText && item.buttonLink) ? '' : 'none';
        }
      }
      
      // Update button link
      if (item.buttonLink !== undefined) {
        const buttonEl = itemEl.querySelector('[data-item-button]') as HTMLAnchorElement;
        if (buttonEl) {
          buttonEl.href = item.buttonLink || '#';
        }
        // Show/hide button wrapper
        const buttonWrapper = buttonEl?.parentElement;
        if (buttonWrapper) {
          buttonWrapper.style.display = (item.buttonText && item.buttonLink) ? '' : 'none';
        }
      }
      
      // Update image (desktop and mobile)
      const videoEl = itemEl.querySelector('[data-item-video]') as HTMLVideoElement;
      const desktopImg = itemEl.querySelector('[data-item-image-desktop]') as HTMLImageElement;
      const mobileImg = itemEl.querySelector('[data-item-image-mobile]') as HTMLImageElement;
      const placeholderEl = itemEl.querySelector('[data-item-placeholder]') as HTMLElement;
      
      // Check what media is available after update
      const hasVideo = item.videoUrl !== undefined ? !!item.videoUrl : !!videoEl?.src;
      const hasDesktopImage = item.imageUrl !== undefined ? !!item.imageUrl : !!desktopImg?.src;
      const hasMobileImage = item.mobileImageUrl !== undefined ? !!item.mobileImageUrl : !!mobileImg?.src;
      
      // Update video
      if (item.videoUrl !== undefined) {
        if (item.videoUrl) {
          // Show video, create if doesn't exist
          if (videoEl) {
            videoEl.src = item.videoUrl;
            videoEl.style.display = '';
          }
          // Hide images and placeholder
          if (desktopImg) desktopImg.style.display = 'none';
          if (mobileImg) mobileImg.style.display = 'none';
          if (placeholderEl) placeholderEl.style.display = 'none';
        } else {
          // Hide video
          if (videoEl) videoEl.style.display = 'none';
        }
      }
      
      // Update desktop image
      if (item.imageUrl !== undefined) {
        if (item.imageUrl) {
          if (desktopImg) {
            desktopImg.src = item.imageUrl;
            desktopImg.style.display = hasMobileImage ? '' : '';
          }
          if (placeholderEl) placeholderEl.style.display = 'none';
        } else {
          if (desktopImg) desktopImg.style.display = 'none';
        }
      }
      
      // Update mobile image
      if (item.mobileImageUrl !== undefined) {
        if (item.mobileImageUrl) {
          if (mobileImg) {
            mobileImg.src = item.mobileImageUrl;
            mobileImg.style.display = '';
          }
          if (placeholderEl) placeholderEl.style.display = 'none';
        } else {
          if (mobileImg) mobileImg.style.display = 'none';
        }
      }
      
      // Show placeholder if no media
      if (!hasVideo && !hasDesktopImage && !hasMobileImage) {
        if (placeholderEl) placeholderEl.style.display = '';
      }
      
      // Update overlay
      if (item.overlay !== undefined) {
        const overlayEl = itemEl.querySelector('[data-item-overlay]') as HTMLElement;
        if (overlayEl) {
          overlayEl.style.backgroundColor = `rgba(0,0,0,${item.overlay})`;
        }
      }
      
      // Update text alignment
      if (item.textAlign !== undefined) {
        const contentEl = itemEl.querySelector('[data-item-content]') as HTMLElement;
        if (contentEl) {
          contentEl.classList.remove('text-left', 'text-center', 'text-right', 'items-start', 'items-center', 'items-end');
          contentEl.classList.add(`text-${item.textAlign}`);
          if (item.textAlign === 'left') contentEl.classList.add('items-start');
          else if (item.textAlign === 'right') contentEl.classList.add('items-end');
          else contentEl.classList.add('items-center');
        }
      }
    });
  }

  // =====================================================
  // SECTION WIDTH
  // =====================================================
  
  if (updates.settings?.sectionWidth !== undefined) {
    const width = updates.settings.sectionWidth as string;
    const contentWrapper = el.querySelector('[data-content-wrapper]') as HTMLElement;
    
    if (contentWrapper) {
      if (width === 'full') {
        contentWrapper.classList.remove('mx-auto');
        contentWrapper.classList.add('w-full');
        contentWrapper.style.maxWidth = 'none';
      } else {
        contentWrapper.classList.remove('w-full');
        contentWrapper.classList.add('mx-auto');
        contentWrapper.style.maxWidth = `${updates.settings.contentWidth || 1200}px`;
      }
    }
  }

  if (updates.settings?.contentWidth !== undefined && updates.settings?.sectionWidth === 'boxed') {
    const contentWrapper = el.querySelector('[data-content-wrapper]') as HTMLElement;
    if (contentWrapper) {
      contentWrapper.style.maxWidth = `${updates.settings.contentWidth}px`;
    }
  }
}

/**
 * Default content for new content slider sections
 */
export const defaultContent = {
  items: [
    { id: '1', title: 'פריט 1', subtitle: 'תיאור קצר', buttonText: 'קרא עוד', buttonLink: '#' },
    { id: '2', title: 'פריט 2', subtitle: 'תיאור קצר', buttonText: 'קרא עוד', buttonLink: '#' },
    { id: '3', title: 'פריט 3', subtitle: 'תיאור קצר', buttonText: 'קרא עוד', buttonLink: '#' },
    { id: '4', title: 'פריט 4', subtitle: 'תיאור קצר', buttonText: 'קרא עוד', buttonLink: '#' },
    { id: '5', title: 'פריט 5', subtitle: 'תיאור קצר', buttonText: 'קרא עוד', buttonLink: '#' },
  ],
};

/**
 * Default settings for new content slider sections
 */
export const defaultSettings = {
  // Layout
  columns: 4,
  mobileColumns: 1,
  gap: 16,
  aspectRatio: 'portrait',
  
  // Section
  backgroundColor: '#ffffff',
  paddingTop: 64,
  paddingBottom: 64,
  paddingLeft: 0,
  paddingRight: 0,
  sectionWidth: 'full',
  
  // Slider
  autoplay: false,
  autoplayInterval: 5000,
  loop: true,
  showDots: true,
  showDotsOnMobile: true,
  showArrows: true,
  showArrowsOnMobile: false,
  
  // Title
  showTitle: true,
  textAlign: 'center',
  titleColor: '#000000',
  titleSize: 32,
  titleSizeMobile: 24,
  titleWeight: 'light',
  subtitleColor: '#6b7280',
  
  // Item styling
  itemOverlay: 0.3,
  itemBorderRadius: 0,
  itemTextPosition: 'inside-bottom',
  itemTitleColor: '#ffffff',
  itemTitleSize: 20,
  
  // Divider
  showDivider: false,
  dividerColor: '#C9A962',
  dividerHeight: 2,
  
  // Arrows/Dots
  arrowStyle: 'circle',
  arrowBgColor: '#ffffff',
  arrowColor: '#374151',
  dotsStyle: 'dots',
  dotsActiveColor: '#111827',
  dotsInactiveColor: '#d1d5db',
};
