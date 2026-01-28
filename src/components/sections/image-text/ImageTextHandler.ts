/**
 * ImageTextHandler - DOM update logic for image+text section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

// Helper to inject/update scoped CSS for layout
function updateLayoutCSS(el: HTMLElement, sectionId: string, position: string, imageWidth: string) {
  let styleEl = el.querySelector('style[data-handler-style]') as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-handler-style', '');
    el.prepend(styleEl);
  }
  
  styleEl.innerHTML = `
    [data-section-id="${sectionId}"] [data-image-text-container] {
      flex-direction: column;
    }
    @media (min-width: 768px) {
      [data-section-id="${sectionId}"] [data-image-text-container] {
        flex-direction: ${position === 'right' ? 'row' : 'row-reverse'};
      }
      [data-section-id="${sectionId}"] [data-image-container] {
        flex-basis: ${imageWidth};
        width: ${imageWidth};
      }
      [data-section-id="${sectionId}"] [data-text-container] {
        flex-basis: calc(100% - ${imageWidth});
        width: calc(100% - ${imageWidth});
      }
    }
  `;
}

export function handleImageTextUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  const sectionId = el.dataset?.sectionId;
  if (!sectionId) return;

  const content = (updates.content || {}) as Record<string, unknown>;
  const settings = (updates.settings || {}) as Record<string, unknown>;

  // Get current values from dataset or use defaults
  const currentPosition = el.dataset.imagePosition || 'right';
  const currentWidth = el.dataset.imageWidth || '50%';

  // Image position (left/right) - inject CSS for responsive behavior
  if (settings.imagePosition !== undefined) {
    const position = settings.imagePosition as string;
    const imageWidth = (settings.imageWidth as string) || currentWidth;
    
    // Store in dataset for future reference
    el.dataset.imagePosition = position;
    
    updateLayoutCSS(el, sectionId, position, imageWidth);
  }

  // Update image width
  if (settings.imageWidth !== undefined) {
    const imageWidth = settings.imageWidth as string;
    const position = (settings.imagePosition as string) || currentPosition;
    
    // Store in dataset for future reference
    el.dataset.imageWidth = imageWidth;
    
    updateLayoutCSS(el, sectionId, position, imageWidth);
  }

  // Update vertical alignment
  if (settings.verticalAlign !== undefined) {
    const textContainer = el.querySelector('[data-text-container]') as HTMLElement;
    if (textContainer) {
      textContainer.classList.remove('items-start', 'items-center', 'items-end');
      const align = settings.verticalAlign as string;
      if (align === 'top') {
        textContainer.classList.add('items-start');
      } else if (align === 'bottom') {
        textContainer.classList.add('items-end');
      } else {
        textContainer.classList.add('items-center');
      }
    }
  }

  // Update content image
  if (content.imageUrl !== undefined) {
    const img = el.querySelector('[data-content-image]') as HTMLImageElement;
    const placeholder = el.querySelector('[data-image-placeholder]') as HTMLElement;
    
    if (content.imageUrl) {
      if (img) {
        img.src = content.imageUrl as string;
        img.classList.remove('hidden');
      }
      if (placeholder) {
        placeholder.classList.add('hidden');
      }
    } else {
      if (img) {
        img.classList.add('hidden');
      }
      if (placeholder) {
        placeholder.classList.remove('hidden');
      }
    }
  }
}

// Export handler function
export function handler(element: Element, updates: Record<string, unknown>) {
  handleImageTextUpdate(element, updates as Partial<Section>);
}

export const defaultContent = { 
  imageUrl: '', 
  text: '<p>הזינו את הטקסט שלכם כאן...</p>', 
  buttonText: '', 
  buttonLink: '' 
};

export const defaultSettings = {
  titleSize: 32, 
  titleSizeMobile: 24, 
  titleColor: '#000000', 
  titleWeight: 'light',
  subtitleSize: 16,
  subtitleSizeMobile: 14,
  subtitleColor: '#6b7280',
  textSize: 16, 
  textSizeMobile: 14, 
  textColor: '#374151',
  imagePosition: 'right', 
  imageWidth: '50%',
  verticalAlign: 'center',
  backgroundColor: '#ffffff', 
  paddingTop: 0, 
  paddingBottom: 0, 
  isVisible: true,
};

