/**
 * Common Handler - Shared DOM update logic for all sections
 * לוגיקת עדכון DOM משותפת לכל הסקשנים
 * 
 * מכסה את כל הדפוסים הנפוצים:
 * - title, subtitle
 * - typography (color, size, weight)
 * - background, spacing
 * - button styling
 */

import { Section } from '../types';

/**
 * Apply common updates that work for most sections
 */
export function applyCommonUpdates(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

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
      applyTypographySize(titleEl, 'title', updates.settings);
    }
  }

  if (updates.settings?.titleWeight !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      applyFontWeight(titleEl, updates.settings.titleWeight as string);
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
      applyTypographySize(subtitleEl, 'subtitle', updates.settings);
    }
  }

  if (updates.settings?.subtitleWeight !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      applyFontWeight(subtitleEl, updates.settings.subtitleWeight as string);
    }
  }

  // =====================================================
  // TEXT CONTENT UPDATES
  // =====================================================
  
  if (updates.content?.text !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) {
      textEl.innerHTML = updates.content.text as string;
      textEl.style.display = updates.content.text ? '' : 'none';
    }
  }

  if (updates.settings?.textColor !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) {
      textEl.style.color = updates.settings.textColor as string;
    }
  }

  if (updates.settings?.textSize !== undefined || updates.settings?.textSizeMobile !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) {
      applyTypographySize(textEl, 'text', updates.settings);
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

  // Button styling
  applyButtonStyles(el, updates.settings);

  // =====================================================
  // LAYOUT & SPACING
  // =====================================================
  
  if (updates.settings?.backgroundColor !== undefined) {
    el.style.backgroundColor = updates.settings.backgroundColor as string;
  }

  // Get units (default to px)
  const marginUnit = (updates.settings?.marginUnit as string) || 'px';
  const paddingUnit = (updates.settings?.paddingUnit as string) || 'px';

  // Margin - all four sides
  if (updates.settings?.marginTop !== undefined) {
    const val = updates.settings.marginTop;
    el.style.marginTop = val === '' || val === 'auto' ? 'auto' : `${val}${marginUnit}`;
  }
  if (updates.settings?.marginRight !== undefined) {
    const val = updates.settings.marginRight;
    el.style.marginRight = val === '' || val === 'auto' ? 'auto' : `${val}${marginUnit}`;
  }
  if (updates.settings?.marginBottom !== undefined) {
    const val = updates.settings.marginBottom;
    el.style.marginBottom = val === '' || val === 'auto' ? 'auto' : `${val}${marginUnit}`;
  }
  if (updates.settings?.marginLeft !== undefined) {
    const val = updates.settings.marginLeft;
    el.style.marginLeft = val === '' || val === 'auto' ? 'auto' : `${val}${marginUnit}`;
  }

  // Padding - all four sides
  if (updates.settings?.paddingTop !== undefined) {
    const val = updates.settings.paddingTop;
    el.style.paddingTop = val === '' ? '' : `${val}${paddingUnit}`;
  }
  if (updates.settings?.paddingRight !== undefined) {
    const val = updates.settings.paddingRight;
    el.style.paddingRight = val === '' ? '' : `${val}${paddingUnit}`;
  }
  if (updates.settings?.paddingBottom !== undefined) {
    const val = updates.settings.paddingBottom;
    el.style.paddingBottom = val === '' ? '' : `${val}${paddingUnit}`;
  }
  if (updates.settings?.paddingLeft !== undefined) {
    const val = updates.settings.paddingLeft;
    el.style.paddingLeft = val === '' ? '' : `${val}${paddingUnit}`;
  }

  // Z-Index
  if (updates.settings?.zIndex !== undefined) {
    const val = updates.settings.zIndex;
    el.style.zIndex = val === '' ? '' : String(val);
    if (val !== '') {
      el.style.position = 'relative';
    }
  }

  // CSS ID
  if (updates.settings?.customId !== undefined) {
    const newId = updates.settings.customId as string;
    if (newId) {
      el.id = newId;
    } else {
      el.removeAttribute('id');
    }
  }

  // CSS Classes
  if (updates.settings?.customClass !== undefined) {
    // Remove old custom classes (those that were added previously)
    const oldCustomClass = el.dataset.customClass;
    if (oldCustomClass) {
      oldCustomClass.split(' ').forEach(cls => cls && el.classList.remove(cls));
    }
    
    // Add new custom classes
    const newCustomClass = updates.settings.customClass as string;
    if (newCustomClass) {
      newCustomClass.split(' ').forEach(cls => cls && el.classList.add(cls));
      el.dataset.customClass = newCustomClass;
    }
  }

  if (updates.settings?.textAlign !== undefined) {
    el.classList.remove('text-left', 'text-center', 'text-right');
    el.classList.add(`text-${updates.settings.textAlign}`);
  }

  if (updates.settings?.isVisible !== undefined) {
    el.style.display = updates.settings.isVisible ? '' : 'none';
  }

  // =====================================================
  // GRID/COLUMNS SETTINGS
  // =====================================================
  
  const gridEl = el.querySelector('[data-grid], [class*="-grid"]') as HTMLElement;
  if (gridEl) {
    if (updates.settings?.columns !== undefined) {
      gridEl.classList.remove('md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5', 'md:grid-cols-6');
      gridEl.classList.add(`md:grid-cols-${updates.settings.columns}`);
    }

    if (updates.settings?.mobileColumns !== undefined) {
      gridEl.classList.remove('grid-cols-1', 'grid-cols-2');
      gridEl.classList.add(`grid-cols-${updates.settings.mobileColumns}`);
    }

    if (updates.settings?.gap !== undefined) {
      gridEl.style.gap = `${updates.settings.gap}px`;
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
    el.dataset.hasImage = updates.content.imageUrl ? 'true' : 'false';
  }

  if (updates.content?.mobileImageUrl !== undefined) {
    const bgMobile = el.querySelector('[data-bg-mobile]') as HTMLElement;
    if (bgMobile) {
      bgMobile.style.backgroundImage = updates.content.mobileImageUrl 
        ? `url(${updates.content.mobileImageUrl})` 
        : 'none';
    }
  }

  // Overlay
  if (updates.settings?.overlay !== undefined) {
    const overlayEl = el.querySelector('[data-overlay]') as HTMLElement;
    if (overlayEl) {
      const opacity = updates.settings.overlay as number;
      overlayEl.style.backgroundColor = `rgba(0,0,0,${opacity})`;
    }
  }
}

/**
 * Apply typography size (desktop & mobile) using responsive CSS
 * Injects a <style> tag with media queries for proper viewport-based sizing
 */
function applyTypographySize(
  element: HTMLElement,
  prefix: string,
  settings: Record<string, unknown> | undefined
): void {
  if (!settings) return;
  
  const desktopKey = `${prefix}Size`;
  const mobileKey = `${prefix}SizeMobile`;
  
  const desktopSize = settings[desktopKey] as number | undefined;
  const mobileSize = settings[mobileKey] as number | undefined;
  
  // Find the section container to inject styles
  const section = element.closest('[data-section-id]') as HTMLElement;
  if (!section) {
    // Fallback to direct inline style
    if (typeof desktopSize === 'number') {
      element.style.fontSize = `${desktopSize}px`;
    }
    return;
  }
  
  const sectionId = section.getAttribute('data-section-id');
  if (!sectionId) return;
  
  // Build element selector based on data attribute
  let dataAttr = '';
  if (prefix === 'title') dataAttr = 'data-section-title';
  else if (prefix === 'subtitle') dataAttr = 'data-section-subtitle';
  else if (prefix === 'text') dataAttr = 'data-content-text';
  else dataAttr = `data-${prefix}`;
  
  // Create unique style ID
  const styleId = `dynamic-${prefix}-${sectionId}`;
  
  // Remove existing style tag if present
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Only inject if we have numeric sizes
  if (typeof desktopSize !== 'number') return;
  
  const mobileVal = typeof mobileSize === 'number' ? mobileSize : Math.round(desktopSize * 0.75);
  
  // Create style tag with media queries
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    [data-section-id="${sectionId}"] [${dataAttr}] {
      font-size: ${mobileVal}px !important;
    }
    @media (min-width: 768px) {
      [data-section-id="${sectionId}"] [${dataAttr}] {
        font-size: ${desktopSize}px !important;
      }
    }
  `;
  
  // Inject into document head
  document.head.appendChild(style);
  
  // Also remove any inline fontSize that might override
  element.style.removeProperty('font-size');
}

/**
 * Apply font weight using inline styles for reliable rendering
 */
function applyFontWeight(element: HTMLElement, weight: string): void {
  // Map Tailwind weight names to CSS font-weight values
  const weightMap: Record<string, string> = {
    'thin': '100',
    'extralight': '200',
    'light': '300',
    'normal': '400',
    'medium': '500',
    'semibold': '600',
    'bold': '700',
    'extrabold': '800',
    'black': '900',
  };
  
  const cssWeight = weightMap[weight] || weight;
  element.style.fontWeight = cssWeight;
  
  // Also update class for consistency (in case CSS is watching)
  element.classList.remove('font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black');
  element.classList.add(`font-${weight}`);
}

/**
 * Apply button styles
 */
function applyButtonStyles(
  container: HTMLElement,
  settings: Record<string, unknown> | undefined
): void {
  if (!settings) return;
  
  const btnEl = container.querySelector('[data-section-button]') as HTMLElement;
  if (!btnEl) return;

  if (settings.buttonTextColor !== undefined) {
    btnEl.style.color = settings.buttonTextColor as string;
  }

  if (settings.buttonBackgroundColor !== undefined || settings.buttonBgColor !== undefined) {
    const color = (settings.buttonBackgroundColor || settings.buttonBgColor) as string;
    btnEl.style.backgroundColor = color === 'transparent' ? 'transparent' : color;
  }

  if (settings.buttonBorderColor !== undefined) {
    btnEl.style.borderColor = settings.buttonBorderColor as string;
  }

  if (settings.buttonBorderRadius !== undefined) {
    btnEl.style.borderRadius = `${settings.buttonBorderRadius}px`;
  }

  if (settings.buttonBorderWidth !== undefined) {
    btnEl.style.borderWidth = `${settings.buttonBorderWidth}px`;
    btnEl.style.borderStyle = 'solid';
  }
}

/**
 * Create a handler using the common updates
 * This allows section-specific handlers to extend common functionality
 */
export function createHandler(
  customHandler?: (element: Element, updates: Partial<Section>) => void
) {
  return (element: Element, updates: Partial<Section>) => {
    // Apply common updates first
    applyCommonUpdates(element, updates);
    
    // Then apply any custom handling
    if (customHandler) {
      customHandler(element, updates);
    }
  };
}

