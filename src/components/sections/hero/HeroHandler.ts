/**
 * HeroHandler - DOM update logic for hero section
 * לוגיקת עדכון DOM בזמן אמת לסקשן באנר ראשי
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

/**
 * Handle all real-time updates for hero section
 */
export function handleHeroUpdate(
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

  if (updates.settings?.titleSize !== undefined || updates.settings?.titleSizeMobile !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const desktopSize = updates.settings?.titleSize as number | undefined;
      const mobileSize = updates.settings?.titleSizeMobile as number | undefined;
      
      if (typeof desktopSize === 'number') {
        titleEl.style.setProperty('--title-size-desktop', `${desktopSize}px`);
      }
      if (typeof mobileSize === 'number') {
        titleEl.style.setProperty('--title-size-mobile', `${mobileSize}px`);
      }
      
      const currentDesktop = titleEl.style.getPropertyValue('--title-size-desktop') || `${desktopSize || 48}px`;
      const currentMobile = titleEl.style.getPropertyValue('--title-size-mobile') || currentDesktop;
      const isMobile = window.innerWidth < 768;
      titleEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
    }
  }

  if (updates.settings?.titleWeight !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold');
      titleEl.classList.add(`font-${updates.settings.titleWeight}`);
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

  if (updates.settings?.subtitleSize !== undefined || updates.settings?.subtitleSizeMobile !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      const desktopSize = updates.settings?.subtitleSize as number | undefined;
      const mobileSize = updates.settings?.subtitleSizeMobile as number | undefined;
      
      if (typeof desktopSize === 'number') {
        subtitleEl.style.setProperty('--subtitle-size-desktop', `${desktopSize}px`);
      }
      if (typeof mobileSize === 'number') {
        subtitleEl.style.setProperty('--subtitle-size-mobile', `${mobileSize}px`);
      }
      
      const currentDesktop = subtitleEl.style.getPropertyValue('--subtitle-size-desktop') || `${desktopSize || 20}px`;
      const currentMobile = subtitleEl.style.getPropertyValue('--subtitle-size-mobile') || currentDesktop;
      const isMobile = window.innerWidth < 768;
      subtitleEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
    }
  }

  if (updates.settings?.subtitleWeight !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold');
      subtitleEl.classList.add(`font-${updates.settings.subtitleWeight}`);
    }
  }

  // =====================================================
  // BUTTON UPDATES
  // =====================================================
  
  if (updates.content?.buttonText !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.textContent = updates.content.buttonText as string;
      btnEl.style.display = updates.content.buttonText ? '' : 'none';
      btnEl.classList.toggle('hidden', !updates.content.buttonText);
    }
  }

  if (updates.content?.buttonLink !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLAnchorElement;
    if (btnEl && btnEl.tagName === 'A') {
      btnEl.href = updates.content.buttonLink as string || '#';
    }
  }

  if (updates.settings?.buttonTextColor !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.color = updates.settings.buttonTextColor as string;
    }
  }

  // Handle all variations of button background color key
  if (updates.settings?.buttonBackgroundColor !== undefined || 
      updates.settings?.buttonBgColor !== undefined || 
      updates.settings?.buttonBackground !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      const color = (updates.settings.buttonBackgroundColor || updates.settings.buttonBgColor || updates.settings.buttonBackground) as string;
      btnEl.style.backgroundColor = color === 'transparent' ? 'transparent' : color;
      // Also update border to match if it was using background color
      if (btnEl.style.borderColor === btnEl.style.backgroundColor || !btnEl.style.borderColor) {
        btnEl.style.borderColor = color === 'transparent' ? 'transparent' : color;
      }
    }
  }

  if (updates.settings?.buttonBorderColor !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.borderColor = updates.settings.buttonBorderColor as string;
    }
  }

  if (updates.settings?.buttonBorderRadius !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.borderRadius = `${updates.settings.buttonBorderRadius}px`;
    }
  }

  if (updates.settings?.buttonBorderWidth !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.borderWidth = `${updates.settings.buttonBorderWidth}px`;
      btnEl.style.borderStyle = 'solid';
    }
  }

  // Button text decoration (underline style)
  if (updates.settings?.buttonTextDecoration !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.textDecoration = updates.settings.buttonTextDecoration as string;
    }
  }

  // Button style preset - apply the colors that come with it
  // The colors are already sent separately by ButtonControl, so we just need
  // to make sure borderStyle is set
  if (updates.settings?.buttonStyle !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.borderStyle = 'solid';
    }
  }

  // =====================================================
  // IMAGE UPDATES
  // =====================================================
  
  if (updates.content?.imageUrl !== undefined) {
    const bgDesktop = el.querySelector('[data-bg-desktop]') as HTMLElement;
    if (bgDesktop) {
      bgDesktop.style.backgroundImage = updates.content.imageUrl 
        ? `url(${updates.content.imageUrl})` 
        : 'none';
      bgDesktop.classList.remove('bg-gray-200', 'bg-gray-100', 'bg-gray-300');
    }
    
    // Update hasImage attribute
    const hasImage = !!(updates.content.imageUrl || el.querySelector('[data-bg-mobile]')?.getAttribute('style')?.includes('url'));
    el.dataset.hasImage = hasImage ? 'true' : 'false';
    
    // Show/hide fallback
    const fallback = el.querySelector('[data-bg-fallback]') as HTMLElement;
    if (fallback) {
      fallback.style.display = updates.content.imageUrl ? 'none' : 'block';
    }
  }

  if (updates.content?.mobileImageUrl !== undefined) {
    const bgMobile = el.querySelector('[data-bg-mobile]') as HTMLElement;
    if (bgMobile) {
      bgMobile.style.backgroundImage = updates.content.mobileImageUrl 
        ? `url(${updates.content.mobileImageUrl})` 
        : 'none';
    }
  }

  // =====================================================
  // OVERLAY & BACKGROUND
  // =====================================================
  
  if (updates.settings?.overlay !== undefined) {
    const overlayEl = el.querySelector('[data-overlay]') as HTMLElement;
    if (overlayEl) {
      const opacity = updates.settings.overlay as number;
      overlayEl.style.backgroundColor = `rgba(0,0,0,${opacity})`;
    }
  }

  if (updates.settings?.backgroundColor !== undefined) {
    const hasImage = el.dataset.hasImage === 'true';
    if (!hasImage) {
      el.style.backgroundColor = updates.settings.backgroundColor as string;
    }
  }

  // =====================================================
  // LAYOUT SETTINGS
  // =====================================================
  
  if (updates.settings?.textAlign !== undefined) {
    const container = el.querySelector('[data-content-container]') as HTMLElement;
    if (container) {
      container.classList.remove('text-left', 'text-center', 'text-right', 'items-start', 'items-center', 'items-end');
      container.classList.add(`text-${updates.settings.textAlign}`);
      // In RTL (Hebrew), we need to flip the items alignment:
      // - 'right' text alignment should use 'items-start' (RTL start = visual right)
      // - 'left' text alignment should use 'items-end' (RTL end = visual left)
      const alignMap: Record<string, string> = {
        'left': 'items-end',     // RTL: left = end
        'center': 'items-center',
        'right': 'items-start',  // RTL: right = start
      };
      container.classList.add(alignMap[updates.settings.textAlign as string] || 'items-center');
    }
  }

  if (updates.settings?.contentPosition !== undefined || updates.settings?.verticalAlign !== undefined) {
    const container = el.querySelector('[data-content-container]') as HTMLElement;
    if (container) {
      container.classList.remove('justify-start', 'justify-center', 'justify-end', 'pt-20', 'pb-20');
      const position = (updates.settings?.contentPosition || updates.settings?.verticalAlign) as string;
      const posMap: Record<string, string> = {
        'top': 'justify-start',
        'start': 'justify-start',
        'center': 'justify-center',
        'bottom': 'justify-end',
        'end': 'justify-end',
      };
      container.classList.add(posMap[position] || 'justify-center');
    }
  }

  if (updates.settings?.minHeight !== undefined || updates.settings?.minHeightUnit !== undefined) {
    const minHeightValue = updates.settings?.minHeight !== undefined 
      ? Number(updates.settings.minHeight) 
      : (el.dataset.minHeight ? Number(el.dataset.minHeight) : 0);
    const minHeightUnit = (updates.settings?.minHeightUnit as string) ?? el.dataset.minHeightUnit ?? 'px';
    
    if (minHeightValue && minHeightValue > 0) {
      // For hero, use height instead of minHeight since it already has inline height
      el.style.height = `${minHeightValue}${minHeightUnit}`;
      el.style.minHeight = `${minHeightValue}${minHeightUnit}`;
      el.dataset.minHeight = String(minHeightValue);
      el.dataset.minHeightUnit = minHeightUnit;
    } else {
      // Reset to default
      el.style.height = '90vh';
      el.style.minHeight = '';
      delete el.dataset.minHeight;
      delete el.dataset.minHeightUnit;
    }
  }

  if (updates.settings?.isVisible !== undefined) {
    el.style.display = updates.settings.isVisible ? '' : 'none';
  }

  // Scroll Arrow visibility
  if (updates.settings?.showScrollArrow !== undefined) {
    const arrowEl = el.querySelector('[data-scroll-arrow]') as HTMLElement;
    if (arrowEl) {
      // showScrollArrow: false means hide, anything else (true, undefined) means show
      const shouldHide = updates.settings.showScrollArrow === false;
      arrowEl.style.display = shouldHide ? 'none' : '';
    }
  }
}

export const defaultContent = {
  imageUrl: '',
  mobileImageUrl: '',
  buttonText: 'קנה עכשיו',
  buttonLink: '#',
};

export const defaultSettings = {
  titleSize: 48,
  titleSizeMobile: 32,
  titleColor: '#ffffff',
  titleWeight: 'bold',
  subtitleSize: 20,
  subtitleSizeMobile: 16,
  subtitleColor: '#ffffff',
  subtitleWeight: 'normal',
  buttonTextColor: '#000000',
  buttonBackground: '#ffffff',  // Primary key used by hero-section
  buttonBgColor: '#ffffff',     // Alternative key
  buttonBorderColor: '#ffffff',
  buttonBorderRadius: 0,
  buttonBorderWidth: 1,
  buttonTextDecoration: 'none',
  buttonStyle: 'filled',
  overlay: 0.3,
  backgroundColor: '#1f2937',
  textAlign: 'center',
  contentPosition: 'center',
  minHeight: 500,
  isVisible: true,
  showScrollArrow: true,
};

