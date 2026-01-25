/**
 * TextBlockHandler - DOM update logic for text_block section
 * לוגיקת עדכון DOM בזמן אמת לסקשן בלוק טקסט
 * 
 * כל הגדרה שמשתנה באדיטור -> מתעדכנת כאן -> משתקפת באייפריים
 */

import { Section } from '../types';

/**
 * Handle all real-time updates for text_block section
 */
export function handleTextBlockUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // =====================================================
  // TITLE UPDATES
  // =====================================================
  
  // Title text content
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
      titleEl.style.display = updates.title ? '' : 'none';
      titleEl.classList.toggle('hidden', !updates.title);
    }
  }

  // Title color
  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.style.color = updates.settings.titleColor as string;
    }
  }

  // Title size (desktop & mobile)
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
      
      // Apply correct size based on viewport
      const currentDesktop = titleEl.style.getPropertyValue('--title-size-desktop') || `${desktopSize || 36}px`;
      const currentMobile = titleEl.style.getPropertyValue('--title-size-mobile') || currentDesktop;
      const isMobile = window.innerWidth < 768;
      titleEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
    }
  }

  // Title weight
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
  
  // Subtitle text content
  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
      subtitleEl.style.display = updates.subtitle ? '' : 'none';
      subtitleEl.classList.toggle('hidden', !updates.subtitle);
    }
  }

  // Subtitle color
  if (updates.settings?.subtitleColor !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.style.color = updates.settings.subtitleColor as string;
    }
  }

  // Subtitle size (desktop & mobile)
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
      
      const currentDesktop = subtitleEl.style.getPropertyValue('--subtitle-size-desktop') || `${desktopSize || 18}px`;
      const currentMobile = subtitleEl.style.getPropertyValue('--subtitle-size-mobile') || currentDesktop;
      const isMobile = window.innerWidth < 768;
      subtitleEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
    }
  }

  // Subtitle weight
  if (updates.settings?.subtitleWeight !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold');
      subtitleEl.classList.add(`font-${updates.settings.subtitleWeight}`);
    }
  }

  // =====================================================
  // CONTENT TEXT UPDATES
  // =====================================================
  
  // Text content
  if (updates.content?.text !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) {
      textEl.innerHTML = updates.content.text as string;
      textEl.style.display = updates.content.text ? '' : 'none';
    }
  }

  // Text color
  if (updates.settings?.textColor !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) {
      textEl.style.color = updates.settings.textColor as string;
    }
  }

  // Text size (desktop & mobile)
  if (updates.settings?.textSize !== undefined || updates.settings?.textSizeMobile !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) {
      const desktopSize = updates.settings?.textSize as number | undefined;
      const mobileSize = updates.settings?.textSizeMobile as number | undefined;
      
      if (typeof desktopSize === 'number') {
        textEl.style.setProperty('--text-size-desktop', `${desktopSize}px`);
      }
      if (typeof mobileSize === 'number') {
        textEl.style.setProperty('--text-size-mobile', `${mobileSize}px`);
      }
      
      const currentDesktop = textEl.style.getPropertyValue('--text-size-desktop') || `${desktopSize || 16}px`;
      const currentMobile = textEl.style.getPropertyValue('--text-size-mobile') || currentDesktop;
      const isMobile = window.innerWidth < 768;
      textEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
    }
  }

  // Text weight
  if (updates.settings?.textWeight !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) {
      textEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold');
      textEl.classList.add(`font-${updates.settings.textWeight}`);
    }
  }

  // =====================================================
  // BUTTON UPDATES
  // =====================================================
  
  // Button text
  if (updates.content?.buttonText !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.textContent = updates.content.buttonText as string;
      btnEl.style.display = updates.content.buttonText ? '' : 'none';
    }
  }

  // Button link
  if (updates.content?.buttonLink !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLAnchorElement;
    if (btnEl && btnEl.tagName === 'A') {
      btnEl.href = updates.content.buttonLink as string || '#';
    }
  }

  // Button text color
  if (updates.settings?.buttonTextColor !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.color = updates.settings.buttonTextColor as string;
    }
  }

  // Button background color (support both keys)
  if (updates.settings?.buttonBackgroundColor !== undefined || updates.settings?.buttonBgColor !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      const color = (updates.settings.buttonBackgroundColor || updates.settings.buttonBgColor) as string;
      btnEl.style.backgroundColor = color === 'transparent' ? 'transparent' : color;
    }
  }

  // Button border color
  if (updates.settings?.buttonBorderColor !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.borderColor = updates.settings.buttonBorderColor as string;
    }
  }

  // Button border radius
  if (updates.settings?.buttonBorderRadius !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.borderRadius = `${updates.settings.buttonBorderRadius}px`;
    }
  }

  // Button border width
  if (updates.settings?.buttonBorderWidth !== undefined) {
    const btnEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (btnEl) {
      btnEl.style.borderWidth = `${updates.settings.buttonBorderWidth}px`;
      btnEl.style.borderStyle = 'solid';
    }
  }

  // =====================================================
  // LAYOUT & SPACING UPDATES
  // =====================================================
  
  // Background color
  if (updates.settings?.backgroundColor !== undefined) {
    el.style.backgroundColor = updates.settings.backgroundColor as string;
  }

  // Padding top
  if (updates.settings?.paddingTop !== undefined) {
    el.style.paddingTop = `${updates.settings.paddingTop}px`;
  }

  // Padding bottom
  if (updates.settings?.paddingBottom !== undefined) {
    el.style.paddingBottom = `${updates.settings.paddingBottom}px`;
  }

  // Margin top
  if (updates.settings?.marginTop !== undefined) {
    el.style.marginTop = `${updates.settings.marginTop}px`;
  }

  // Margin bottom
  if (updates.settings?.marginBottom !== undefined) {
    el.style.marginBottom = `${updates.settings.marginBottom}px`;
  }

  // Text alignment
  if (updates.settings?.textAlign !== undefined) {
    const align = updates.settings.textAlign as string;
    el.classList.remove('text-left', 'text-center', 'text-right');
    el.classList.add(`text-${align}`);
    
    // Also update inner content wrapper if exists
    const contentWrapper = el.querySelector('.max-w-2xl, .max-w-3xl, .max-w-4xl') as HTMLElement;
    if (contentWrapper) {
      contentWrapper.classList.remove('text-left', 'text-center', 'text-right');
      contentWrapper.classList.add(`text-${align}`);
    }
  }

  // Max width
  if (updates.settings?.maxWidth !== undefined) {
    const contentWrapper = el.querySelector('[class*="max-w-"]') as HTMLElement;
    if (contentWrapper) {
      contentWrapper.classList.remove('max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl', 'max-w-full');
      const widthMap: Record<string, string> = {
        'sm': 'max-w-xl',
        'md': 'max-w-2xl',
        'lg': 'max-w-3xl',
        'xl': 'max-w-4xl',
        'full': 'max-w-7xl',
      };
      contentWrapper.classList.add(widthMap[updates.settings.maxWidth as string] || 'max-w-2xl');
    }
  }

  // Visibility
  if (updates.settings?.isVisible !== undefined) {
    el.style.display = updates.settings.isVisible ? '' : 'none';
  }
}

/**
 * Default content for new text_block sections
 */
export const defaultContent = {
  text: 'זהו טקסט לדוגמה. ניתן לערוך אותו לפי הצורך ולהוסיף תוכן מותאם אישית לעסק שלכם.',
  buttonText: 'קרא עוד',
  buttonLink: '#',
};

/**
 * Default settings for new text_block sections
 */
export const defaultSettings = {
  // Title typography
  titleSize: 36,
  titleSizeMobile: 28,
  titleColor: '#000000',
  titleWeight: 'bold',
  
  // Subtitle typography
  subtitleSize: 18,
  subtitleSizeMobile: 16,
  subtitleColor: '#6b7280',
  subtitleWeight: 'normal',
  
  // Text typography
  textSize: 16,
  textSizeMobile: 14,
  textColor: '#374151',
  textWeight: 'normal',
  
  // Button styling
  buttonTextColor: '#000000',
  buttonBgColor: 'transparent',
  buttonBorderColor: '#000000',
  buttonBorderRadius: 0,
  buttonBorderWidth: 1,
  
  // Layout
  textAlign: 'center',
  maxWidth: 'md',
  backgroundColor: '#ffffff',
  
  // Spacing
  paddingTop: 64,
  paddingBottom: 64,
  marginTop: 0,
  marginBottom: 0,
  
  // Visibility
  isVisible: true,
};

