/**
 * HeroSliderHandler - Real-time updates for hero slider section
 */

import { applyCommonUpdates } from '../handlers/common-handler';

export function handler(element: Element, updates: Record<string, unknown>) {
  const el = element as HTMLElement;
  
  // Apply common updates (background, spacing, visibility, animation, etc.)
  applyCommonUpdates(element, updates);
  
  const settings = (updates.settings || {}) as Record<string, unknown>;
  const content = (updates.content || {}) as Record<string, unknown>;
  
  // ====================================
  // Slides updates (require refresh for full Embla reinit)
  // ====================================
  if (content.slides) {
    // Note: Full slide updates require iframe refresh since Embla needs to reinitialize
    // We can update text/images in real-time though
    const slides = content.slides as Array<{
      id: string;
      title?: string;
      subtitle?: string;
      imageUrl?: string;
      mobileImageUrl?: string;
      mobileImagePosition?: string;
      buttonText?: string;
      buttonLink?: string;
    }>;
    
    slides.forEach((slide, index) => {
      const slideEl = el.querySelector(`[data-slide-index="${index}"]`);
      if (!slideEl) return;
      
      // Update title
      const titleEl = slideEl.querySelector('[data-slide-title]') as HTMLElement;
      if (titleEl && slide.title !== undefined) {
        titleEl.textContent = slide.title;
      }
      
      // Update subtitle
      const subtitleEl = slideEl.querySelector('[data-slide-subtitle]') as HTMLElement;
      if (subtitleEl && slide.subtitle !== undefined) {
        subtitleEl.textContent = slide.subtitle;
      }
      
      // Update button text
      const buttonEl = slideEl.querySelector('[data-slide-button]') as HTMLElement;
      if (buttonEl && slide.buttonText !== undefined) {
        buttonEl.textContent = slide.buttonText;
      }
      
      // Update background image
      const desktopImg = slideEl.querySelector('[data-slide-image-desktop]') as HTMLImageElement;
      if (desktopImg && slide.imageUrl !== undefined) {
        desktopImg.src = slide.imageUrl;
      }
      
      // Update mobile image
      const mobileImg = slideEl.querySelector('[data-slide-image-mobile]') as HTMLImageElement;
      if (mobileImg && slide.mobileImageUrl !== undefined) {
        mobileImg.src = slide.mobileImageUrl;
      }
      
      // Update mobile image position (object-position)
      if (slide.mobileImagePosition !== undefined) {
        const sectionId = el.dataset?.sectionId;
        let styleEl = el.querySelector(`style[data-mobile-position-${index}]`) as HTMLStyleElement;
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.setAttribute(`data-mobile-position-${index}`, '');
          el.appendChild(styleEl);
        }
        
        const position = slide.mobileImagePosition || 'center';
        styleEl.textContent = `
          @media (max-width: 767px) {
            [data-section-id="${sectionId}"] [data-slide-index="${index}"] [data-slide-image-desktop],
            [data-section-id="${sectionId}"] [data-slide-index="${index}"] [data-slide-image-mobile] {
              object-position: ${position} center !important;
            }
          }
        `;
      }
    });
  }
  
  // ====================================
  // Typography updates via scoped CSS
  // ====================================
  const styleEl = el.querySelector('style');
  const sectionId = el.dataset?.sectionId;
  
  if (styleEl && sectionId && (
    settings.titleSize !== undefined || 
    settings.titleSizeMobile !== undefined || 
    settings.titleColor !== undefined || 
    settings.titleWeight !== undefined ||
    settings.subtitleSize !== undefined ||
    settings.subtitleSizeMobile !== undefined ||
    settings.subtitleColor !== undefined ||
    settings.subtitleWeight !== undefined
  )) {
    const titleSize = settings.titleSize ?? 72;
    const titleSizeMobile = settings.titleSizeMobile ?? 36;
    const titleColor = settings.titleColor ?? '#ffffff';
    const titleWeight = settings.titleWeight ?? 'extralight';
    const subtitleSize = settings.subtitleSize ?? 18;
    const subtitleSizeMobile = settings.subtitleSizeMobile ?? 14;
    const subtitleColor = settings.subtitleColor ?? 'rgba(255,255,255,0.9)';
    const subtitleWeight = settings.subtitleWeight ?? 'normal';
    
    const getWeightValue = (weight: string) => {
      switch(weight) {
        case 'extralight': return 200;
        case 'light': return 300;
        case 'normal': return 400;
        case 'medium': return 500;
        case 'semibold': return 600;
        case 'bold': return 700;
        default: return 400;
      }
    };
    
    styleEl.innerHTML = `
      [data-section-id="${sectionId}"] [data-slide-title] {
        font-size: ${titleSizeMobile}px;
        font-weight: ${getWeightValue(String(titleWeight))};
        color: ${titleColor};
      }
      @media (min-width: 768px) {
        [data-section-id="${sectionId}"] [data-slide-title] {
          font-size: ${titleSize}px;
        }
      }
      [data-section-id="${sectionId}"] [data-slide-subtitle] {
        font-size: ${subtitleSizeMobile}px;
        font-weight: ${getWeightValue(String(subtitleWeight))};
        color: ${subtitleColor};
      }
      @media (min-width: 768px) {
        [data-section-id="${sectionId}"] [data-slide-subtitle] {
          font-size: ${subtitleSize}px;
        }
      }
    `;
  }
  
  // ====================================
  // Min Height
  // ====================================
  if (settings.minHeight !== undefined || settings.minHeightUnit !== undefined) {
    const minHeight = settings.minHeight ?? 90;
    const unit = settings.minHeightUnit ?? 'vh';
    const minHeightValue = `${minHeight}${unit}`;
    
    el.style.minHeight = minHeightValue;
    
    // Update inner container
    const innerContainer = el.querySelector('.flex.h-full');
    if (innerContainer) {
      (innerContainer as HTMLElement).style.minHeight = minHeightValue;
    }
    
    // Update each slide
    el.querySelectorAll('[data-slide-index]').forEach(slide => {
      (slide as HTMLElement).style.minHeight = minHeightValue;
    });
  }
  
  // ====================================
  // Section Width / Content Width
  // ====================================
  if (settings.sectionWidth !== undefined || settings.contentWidth !== undefined) {
    const sectionWidth = (settings.sectionWidth as string) || 'full';
    const contentWidth = (settings.contentWidth as number) || 1200;
    
    // Update ALL content wrappers (one per slide)
    el.querySelectorAll('[data-content-wrapper]').forEach(wrapper => {
      const wrapperEl = wrapper as HTMLElement;
      
      if (sectionWidth === 'full') {
        // Full width - remove constraints (like content-block-section)
        wrapperEl.style.setProperty('max-width', 'none', 'important');
        wrapperEl.style.removeProperty('margin');
      } else {
        // Boxed - apply contentWidth with centered margin (like content-block-section)
        wrapperEl.style.setProperty('max-width', `${contentWidth}px`, 'important');
        wrapperEl.style.setProperty('margin', '0 auto', 'important');
      }
    });
  }
  
  // ====================================
  // Overlay
  // ====================================
  if (settings.overlay !== undefined) {
    el.querySelectorAll('[data-slide-overlay]').forEach(overlay => {
      (overlay as HTMLElement).style.backgroundColor = `rgba(0,0,0,${settings.overlay})`;
    });
  }
  
  // ====================================
  // Gradient
  // ====================================
  if (settings.showGradient !== undefined || settings.gradientDirection !== undefined) {
    const showGradient = settings.showGradient ?? true;
    const direction = settings.gradientDirection ?? 'top';
    
    el.querySelectorAll('[data-slide-gradient]').forEach(gradient => {
      const gradientEl = gradient as HTMLElement;
      if (!showGradient) {
        gradientEl.style.display = 'none';
      } else {
        gradientEl.style.display = 'block';
        gradientEl.style.background = direction === 'top' 
          ? 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)';
      }
    });
  }
  
  // ====================================
  // Text Alignment
  // ====================================
  if (settings.textAlign !== undefined) {
    const textAlign = settings.textAlign as string;
    const alignClasses = {
      right: { text: 'text-right', items: 'items-end', margin: 'ml-auto' },
      center: { text: 'text-center', items: 'items-center', margin: 'mx-auto' },
      left: { text: 'text-left', items: 'items-start', margin: 'mr-auto' },
    };
    
    el.querySelectorAll('[data-slide-index]').forEach(slide => {
      const contentContainer = slide.querySelector('.flex.flex-col');
      const innerDiv = slide.querySelector('.max-w-4xl');
      
      if (contentContainer) {
        // Remove old alignment classes from content container
        Object.values(alignClasses).forEach(({ text, items }) => {
          contentContainer.classList.remove(text, items);
        });
        // Add new alignment classes
        const align = alignClasses[textAlign as keyof typeof alignClasses] || alignClasses.center;
        contentContainer.classList.add(align.text, align.items);
      }
      
      if (innerDiv) {
        // Remove old alignment classes from inner div
        innerDiv.classList.remove('text-left', 'text-center', 'text-right', 'ml-auto', 'mr-auto', 'mx-auto');
        // Add new alignment classes
        const align = alignClasses[textAlign as keyof typeof alignClasses] || alignClasses.center;
        innerDiv.classList.add(align.text, align.margin);
      }
      
      // Update subtitle alignment
      const subtitle = slide.querySelector('[data-slide-subtitle]');
      if (subtitle) {
        subtitle.classList.remove('mx-auto', 'mr-auto', 'ml-auto');
        if (textAlign === 'center') {
          subtitle.classList.add('mx-auto');
        } else if (textAlign === 'left') {
          subtitle.classList.add('mr-auto');
        } else {
          subtitle.classList.add('ml-auto');
        }
      }
    });
  }
  
  // ====================================
  // Vertical Alignment
  // ====================================
  if (settings.verticalAlign !== undefined) {
    const verticalAlign = settings.verticalAlign as string;
    const alignMap = {
      top: 'justify-start',
      center: 'justify-center',
      bottom: 'justify-end',
    };
    
    el.querySelectorAll('[data-slide-index]').forEach(slide => {
      const contentContainer = slide.querySelector('.flex.flex-col');
      if (contentContainer) {
        // Remove old alignment classes
        Object.values(alignMap).forEach(cls => {
          contentContainer.classList.remove(cls);
        });
        // Add new alignment class
        const align = alignMap[verticalAlign as keyof typeof alignMap] || 'justify-center';
        contentContainer.classList.add(align);
        
        // Add/remove padding classes based on position
        contentContainer.classList.remove('pt-16', 'md:pt-24', 'pb-16', 'md:pb-24');
        if (verticalAlign === 'top') {
          contentContainer.classList.add('pt-16', 'md:pt-24');
        } else if (verticalAlign === 'bottom') {
          contentContainer.classList.add('pb-16', 'md:pb-24');
        }
      }
    });
  }
  
  // ====================================
  // Button Styles
  // ====================================
  if (settings.buttonTextColor !== undefined || 
      settings.buttonBackgroundColor !== undefined || 
      settings.buttonBorderColor !== undefined || 
      settings.buttonStyle !== undefined) {
    
    const buttonStyle = settings.buttonStyle as string || 'filled';
    const buttonTextColor = settings.buttonTextColor as string || '#000000';
    const buttonBackgroundColor = settings.buttonBackgroundColor as string || '#ffffff';
    const buttonBorderColor = settings.buttonBorderColor as string || '#ffffff';
    
    const buttons = el.querySelectorAll('[data-slide-button]') as NodeListOf<HTMLElement>;
    buttons.forEach(button => {
      button.style.color = buttonTextColor;
      button.style.borderColor = buttonBorderColor;
      
      if (buttonStyle === 'filled') {
        button.style.backgroundColor = buttonBackgroundColor;
        button.style.borderWidth = '0';
        button.style.textDecoration = 'none';
      } else if (buttonStyle === 'outline') {
        button.style.backgroundColor = 'transparent';
        button.style.borderWidth = '2px';
        button.style.textDecoration = 'none';
      } else if (buttonStyle === 'underline') {
        button.style.backgroundColor = 'transparent';
        button.style.borderWidth = '0';
        button.style.borderBottomWidth = '2px';
        button.style.textDecoration = 'none';
      }
    });
  }
  
  // ====================================
  // Dots visibility (requires refresh for React state)
  // ====================================
  if (settings.showDots !== undefined) {
    const dotsContainer = el.querySelector('.absolute.bottom-6, .absolute.bottom-8');
    if (dotsContainer) {
      (dotsContainer as HTMLElement).style.display = settings.showDots ? 'flex' : 'none';
    }
  }
  
  // ====================================
  // Arrows visibility (requires refresh for React state)
  // ====================================
  if (settings.showArrows !== undefined) {
    const arrows = el.querySelectorAll('button[aria-label="הקודם"], button[aria-label="הבא"]');
    arrows.forEach(arrow => {
      (arrow as HTMLElement).style.display = settings.showArrows ? 'flex' : 'none';
    });
  }
}

export const defaultContent = {
  slides: [
    {
      id: '1',
      title: 'שקופית 1',
      subtitle: 'תיאור קצר לשקופית הראשונה',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920',
      buttonText: 'לחנות',
      buttonLink: '/products',
    },
  ],
};

export const defaultSettings = {
  // Layout
  minHeight: 90,
  minHeightUnit: 'vh',
  sectionWidth: 'full',
  contentWidth: 1200,
  textAlign: 'center',
  verticalAlign: 'center',
  
  // Slider
  autoplay: true,
  autoplayInterval: 5000,
  loop: true,
  showDots: true,
  showArrows: true,
  
  // Background
  overlay: 0.3,
  showGradient: true,
  gradientDirection: 'top',
  
  // Typography - Title
  titleColor: '#ffffff',
  titleSize: 72,
  titleSizeMobile: 36,
  titleWeight: 'extralight',
  
  // Typography - Subtitle
  subtitleColor: 'rgba(255,255,255,0.9)',
  subtitleSize: 18,
  subtitleSizeMobile: 14,
  subtitleWeight: 'normal',
  
  // Button
  buttonStyle: 'filled',
  buttonTextColor: '#000000',
  buttonBackgroundColor: '#ffffff',
  buttonBorderColor: '#ffffff',
  
  // Dots
  dotsColor: 'rgba(255,255,255,0.5)',
  dotsActiveColor: '#ffffff',
};

export const config = {
  name: 'סליידר הירו',
  description: 'באנר סליידר עם מספר שקופיות',
  category: 'באנרים',
  icon: 'Layers',
};
