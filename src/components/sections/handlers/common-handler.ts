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

  // Helper to apply spacing - always apply the value
  // All sections now use explicit values, not Tailwind classes
  const applySpacing = (prop: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft', val: unknown, unit: string) => {
    if (val === 'auto') {
      el.style[prop] = 'auto';
    } else if (val === '' || val === undefined || val === null) {
      // If no value provided, don't change (keep existing)
      return;
    } else {
      el.style[prop] = `${val}${unit}`;
    }
  };

  // Margin - all four sides
  if (updates.settings?.marginTop !== undefined) {
    applySpacing('marginTop', updates.settings.marginTop, marginUnit);
  }
  if (updates.settings?.marginRight !== undefined) {
    applySpacing('marginRight', updates.settings.marginRight, marginUnit);
  }
  if (updates.settings?.marginBottom !== undefined) {
    applySpacing('marginBottom', updates.settings.marginBottom, marginUnit);
  }
  if (updates.settings?.marginLeft !== undefined) {
    applySpacing('marginLeft', updates.settings.marginLeft, marginUnit);
  }

  // Padding - all four sides
  if (updates.settings?.paddingTop !== undefined) {
    applySpacing('paddingTop', updates.settings.paddingTop, paddingUnit);
  }
  if (updates.settings?.paddingRight !== undefined) {
    applySpacing('paddingRight', updates.settings.paddingRight, paddingUnit);
  }
  if (updates.settings?.paddingBottom !== undefined) {
    applySpacing('paddingBottom', updates.settings.paddingBottom, paddingUnit);
  }
  if (updates.settings?.paddingLeft !== undefined) {
    applySpacing('paddingLeft', updates.settings.paddingLeft, paddingUnit);
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
    const align = updates.settings.textAlign as string;
    el.classList.remove('text-left', 'text-center', 'text-right');
    el.classList.add(`text-${align}`);
    
    // Also update inner content wrapper if exists
    const contentWrapper = el.querySelector('[data-content-wrapper]') as HTMLElement;
    if (contentWrapper) {
      contentWrapper.classList.remove('text-left', 'text-center', 'text-right');
      contentWrapper.classList.add(`text-${align}`);
    }
  }

  if (updates.settings?.isVisible !== undefined) {
    el.style.display = updates.settings.isVisible ? '' : 'none';
  }

  // Hide on Mobile/Tablet or Desktop - in editor show with low opacity
  // Handle both settings together to avoid race conditions
  if (updates.settings?.hideOnMobile !== undefined || updates.settings?.hideOnDesktop !== undefined) {
    // Get current values from data attributes or updates
    const hideOnMobile = updates.settings?.hideOnMobile !== undefined 
      ? (updates.settings.hideOnMobile as boolean)
      : (el.dataset.hideOnMobile === 'true');
    
    const hideOnDesktop = updates.settings?.hideOnDesktop !== undefined 
      ? (updates.settings.hideOnDesktop as boolean)
      : (el.dataset.hideOnDesktop === 'true');
    
    // Update data attributes
    el.dataset.hideOnMobile = String(hideOnMobile);
    el.dataset.hideOnDesktop = String(hideOnDesktop);
    
    // In editor: show with low opacity if hidden on ANY device
    // This makes it clear the section has visibility restrictions
    const shouldShowHidden = hideOnMobile || hideOnDesktop;
    
    if (shouldShowHidden) {
      el.style.opacity = '0.5';
      el.style.outline = '2px dashed rgba(239, 68, 68, 0.6)';
      el.style.outlineOffset = '-2px';
      // Remove Tailwind hiding classes effect in real-time
      el.classList.remove('max-md:hidden', 'md:hidden');
      el.style.display = '';
    } else {
      el.style.opacity = '';
      el.style.outline = '';
      el.style.outlineOffset = '';
    }
  }

  // =====================================================
  // SECTION WIDTH SETTINGS (Elementor style)
  // =====================================================
  
  if (updates.settings?.sectionWidth !== undefined) {
    const sectionWidth = updates.settings.sectionWidth as string;
    
    // Find the content wrapper (usually has max-w-* class)
    const contentWrapper = el.querySelector('[data-content-wrapper]') as HTMLElement || el.firstElementChild as HTMLElement;
    
    if (sectionWidth === 'full') {
      // Full width - remove container constraints
      el.classList.remove('container', 'mx-auto');
      el.style.maxWidth = '100%';
      el.style.width = '100%';
      if (contentWrapper) {
        contentWrapper.classList.remove('container', 'mx-auto', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl');
        contentWrapper.style.maxWidth = '100%';
      }
    } else {
      // Boxed - apply container
      el.style.maxWidth = '';
      el.style.width = '';
    }
  }
  
  if (updates.settings?.contentWidth !== undefined) {
    const contentWidth = updates.settings.contentWidth as string;
    const contentWrapper = el.querySelector('[data-content-wrapper]') as HTMLElement || el.firstElementChild as HTMLElement;
    
    if (contentWrapper) {
      // Remove all max-width classes
      contentWrapper.classList.remove('max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl');
      contentWrapper.style.maxWidth = '';
      
      // Apply new max-width
      const widthMap: Record<string, string> = {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      };
      
      if (widthMap[contentWidth]) {
        contentWrapper.style.maxWidth = widthMap[contentWidth];
        contentWrapper.style.marginLeft = 'auto';
        contentWrapper.style.marginRight = 'auto';
      }
    }
  }

  // =====================================================
  // ANIMATION
  // =====================================================
  
  if (updates.settings?.animation !== undefined || updates.settings?.animationDuration !== undefined) {
    const animation = (updates.settings?.animation as string) ?? el.dataset.animation ?? 'none';
    const duration = (updates.settings?.animationDuration as number) ?? parseFloat(el.dataset.animationDuration || '0.6');
    
    // Store in data attributes
    el.dataset.animation = animation;
    el.dataset.animationDuration = String(duration);
    
    // Inject keyframes if not exists
    if (!document.getElementById('section-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'section-animation-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove existing animation classes
    el.classList.remove('animate-fadeIn', 'animate-slideUp', 'animate-slideDown', 'animate-slideLeft', 'animate-slideRight');
    
    if (animation !== 'none') {
      // Apply animation using inline style for preview
      const animationMap: Record<string, string> = {
        fadeIn: `fadeIn ${duration}s ease-out forwards`,
        slideUp: `slideUp ${duration}s ease-out forwards`,
        slideDown: `slideDown ${duration}s ease-out forwards`,
        slideLeft: `slideLeft ${duration}s ease-out forwards`,
        slideRight: `slideRight ${duration}s ease-out forwards`,
      };
      
      // Reset animation to trigger it fresh
      el.style.animation = 'none';
      // Force browser to acknowledge the change
      void el.offsetWidth;
      // Apply the animation
      requestAnimationFrame(() => {
        el.style.animation = animationMap[animation] || '';
      });
    } else {
      // No animation - clear it
      el.style.animation = '';
    }
  }

  // =====================================================
  // MIN HEIGHT & VERTICAL ALIGN
  // =====================================================
  
  if (updates.settings?.minHeight !== undefined || updates.settings?.minHeightUnit !== undefined) {
    const minHeightValue = updates.settings?.minHeight !== undefined 
      ? Number(updates.settings.minHeight) 
      : (el.dataset.minHeight ? Number(el.dataset.minHeight) : 0);
    const minHeightUnit = (updates.settings?.minHeightUnit as string) ?? el.dataset.minHeightUnit ?? 'px';
    
    if (minHeightValue && minHeightValue > 0) {
      el.style.minHeight = `${minHeightValue}${minHeightUnit}`;
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.dataset.minHeight = String(minHeightValue);
      el.dataset.minHeightUnit = minHeightUnit;
    } else {
      el.style.minHeight = '';
      el.style.display = '';
      el.style.flexDirection = '';
      delete el.dataset.minHeight;
      delete el.dataset.minHeightUnit;
    }
  }

  // Vertical Alignment (requires flex)
  if (updates.settings?.verticalAlign !== undefined) {
    const verticalAlign = updates.settings.verticalAlign as string;
    const alignMap: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
    };
    // Ensure flex is enabled for vertical alignment to work
    if (!el.style.display || el.style.display === 'block') {
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
    }
    el.style.justifyContent = alignMap[verticalAlign] || 'center';
    el.dataset.verticalAlign = verticalAlign;
  }

  // =====================================================
  // BACKGROUND IMAGE/VIDEO (settings level)
  // =====================================================
  
  if (updates.settings?.backgroundImage !== undefined) {
    const bgImage = updates.settings.backgroundImage as string;
    if (bgImage) {
      el.style.backgroundImage = `url(${bgImage})`;
      el.style.backgroundSize = el.style.backgroundSize || 'cover';
      el.style.backgroundPosition = el.style.backgroundPosition || 'center';
      el.style.backgroundRepeat = 'no-repeat';
      // Remove background video if exists
      const videoEl = el.querySelector('[data-bg-video]') as HTMLVideoElement;
      if (videoEl) videoEl.style.display = 'none';
    } else {
      el.style.backgroundImage = '';
      el.style.backgroundSize = '';
      el.style.backgroundPosition = '';
      el.style.backgroundRepeat = '';
    }
  }

  if (updates.settings?.backgroundVideo !== undefined) {
    const bgVideo = updates.settings.backgroundVideo as string;
    let videoEl = el.querySelector('[data-bg-video]') as HTMLVideoElement;
    
    if (bgVideo) {
      // Create video element if doesn't exist
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.setAttribute('data-bg-video', '');
        videoEl.autoplay = true;
        videoEl.loop = true;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;';
        el.style.position = 'relative';
        el.insertBefore(videoEl, el.firstChild);
      }
      videoEl.src = bgVideo;
      videoEl.style.display = '';
      // Remove background image
      el.style.backgroundImage = '';
    } else if (videoEl) {
      videoEl.style.display = 'none';
      videoEl.src = '';
    }
  }

  if (updates.settings?.backgroundSize !== undefined) {
    el.style.backgroundSize = updates.settings.backgroundSize as string;
  }

  if (updates.settings?.backgroundPosition !== undefined) {
    el.style.backgroundPosition = updates.settings.backgroundPosition as string;
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

