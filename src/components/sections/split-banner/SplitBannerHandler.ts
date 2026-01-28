/**
 * SplitBannerHandler - DOM update logic for split banner section
 * עדכונים בזמן אמת לבאנר מפוצל
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleSplitBannerUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  const settings = (updates.settings || {}) as Record<string, unknown>;
  const content = (updates.content || {}) as Record<string, unknown>;

  // Helper function to update a side
  const updateSide = (sideContent: Record<string, string>, sideEl: HTMLElement | null) => {
    if (!sideEl) return;
    
    // Update title
    if (sideContent.title !== undefined) {
      const title = sideEl.querySelector('[data-side-title]') as HTMLElement;
      if (title) title.textContent = sideContent.title;
    }
    
    // Update image
    if (sideContent.imageUrl !== undefined) {
      let img = sideEl.querySelector('[data-side-image]') as HTMLImageElement;
      const placeholder = sideEl.querySelector('[data-side-placeholder]') as HTMLElement;
      
      if (sideContent.imageUrl) {
        // If there's no image element yet, create one
        if (!img && placeholder) {
          img = document.createElement('img');
          img.className = 'w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105';
          img.setAttribute('data-side-image', '');
          placeholder.replaceWith(img);
        }
        if (img) img.src = sideContent.imageUrl;
      } else {
        // If image is empty, replace with placeholder
        if (img) {
          const newPlaceholder = document.createElement('div');
          newPlaceholder.className = 'w-full h-full bg-gradient-to-b from-gray-200 to-gray-300';
          newPlaceholder.setAttribute('data-side-placeholder', '');
          img.replaceWith(newPlaceholder);
        }
      }
    }
    
    // Update mobile image
    if (sideContent.mobileImageUrl !== undefined) {
      let mobileImg = sideEl.querySelector('[data-side-mobile-image]') as HTMLImageElement;
      const desktopImg = sideEl.querySelector('[data-side-image]') as HTMLElement;
      
      if (sideContent.mobileImageUrl) {
        if (!mobileImg) {
          mobileImg = document.createElement('img');
          mobileImg.className = 'w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 md:hidden';
          mobileImg.setAttribute('data-side-mobile-image', '');
          sideEl.insertBefore(mobileImg, sideEl.firstChild);
          if (desktopImg) {
            desktopImg.classList.add('hidden', 'md:block');
          }
        }
        mobileImg.src = sideContent.mobileImageUrl;
      } else if (mobileImg) {
        mobileImg.remove();
        if (desktopImg) {
          desktopImg.classList.remove('hidden', 'md:block');
        }
      }
    }
    
    // Update link
    if (sideContent.link !== undefined) {
      (sideEl as HTMLAnchorElement).href = sideContent.link;
    }
  };

  // Update right side (index 0)
  if (content.right !== undefined) {
    const right = content.right as Record<string, string>;
    const rightEl = el.querySelector('[data-side-index="0"]') as HTMLElement;
    updateSide(right, rightEl);
  }

  // Update left side (index 1)
  if (content.left !== undefined) {
    const left = content.left as Record<string, string>;
    const leftEl = el.querySelector('[data-side-index="1"]') as HTMLElement;
    updateSide(left, leftEl);
  }

  // Update overlay
  if (settings.overlay !== undefined) {
    el.querySelectorAll('[data-side-overlay]').forEach(overlay => {
      (overlay as HTMLElement).style.backgroundColor = `rgba(0,0,0,${settings.overlay})`;
    });
  }

  // Update height
  if (settings.height !== undefined) {
    el.querySelectorAll('[data-side-index]').forEach(side => {
      (side as HTMLElement).style.height = settings.height as string;
    });
  }

  // Update title color
  if (settings.titleColor !== undefined) {
    el.querySelectorAll('[data-side-title]').forEach(title => {
      (title as HTMLElement).style.color = settings.titleColor as string;
    });
  }

  // Update typography via scoped CSS
  const styleEl = el.querySelector('style');
  const sectionId = el.dataset?.sectionId;
  
  if (sectionId && (settings.titleSize !== undefined || settings.titleSizeMobile !== undefined)) {
    const titleSize = (settings.titleSize as number) ?? 32;
    const titleSizeMobile = (settings.titleSizeMobile as number) ?? titleSize * 0.7;
    
    // Create or update style element
    let targetStyle = styleEl;
    if (!targetStyle) {
      targetStyle = document.createElement('style');
      el.prepend(targetStyle);
    }
    
    targetStyle.innerHTML = `
      [data-section-id="${sectionId}"] [data-side-title] {
        font-size: ${titleSizeMobile}px !important;
      }
      @media (min-width: 768px) {
        [data-section-id="${sectionId}"] [data-side-title] {
          font-size: ${titleSize}px !important;
        }
      }
    `;
  }

  // Update min height
  if (settings.minHeight !== undefined || settings.minHeightUnit !== undefined) {
    const minHeight = settings.minHeight ?? 70;
    const unit = settings.minHeightUnit ?? 'vh';
    el.querySelectorAll('[data-side-index]').forEach(side => {
      (side as HTMLElement).style.height = `${minHeight}${unit}`;
    });
  }
  
  // Update vertical alignment
  if (settings.verticalAlign !== undefined) {
    const align = settings.verticalAlign as string;
    el.querySelectorAll('[data-side-content]').forEach(contentEl => {
      const htmlEl = contentEl as HTMLElement;
      // Remove old classes
      htmlEl.classList.remove('items-start', 'items-center', 'items-end', 'pt-16', 'pb-16');
      // Add new classes
      if (align === 'top') {
        htmlEl.classList.add('items-start', 'pt-16');
      } else if (align === 'center') {
        htmlEl.classList.add('items-center');
      } else {
        htmlEl.classList.add('items-end', 'pb-16');
      }
    });
  }
  
  // Update text alignment (affects both titles)
  // In RTL: right = start (justify-start), left = end (justify-end)
  if (settings.textAlign !== undefined) {
    const align = settings.textAlign as string;
    el.querySelectorAll('[data-side-content]').forEach(contentEl => {
      const htmlEl = contentEl as HTMLElement;
      // Remove old classes
      htmlEl.classList.remove('text-right', 'text-center', 'text-left', 'justify-start', 'justify-center', 'justify-end', 'pl-8', 'pr-8', 'px-12');
      // Add new classes
      if (align === 'right') {
        htmlEl.classList.add('text-right', 'justify-start', 'px-12');
      } else if (align === 'left') {
        htmlEl.classList.add('text-left', 'justify-end', 'px-12');
      } else {
        htmlEl.classList.add('text-center', 'justify-center');
      }
    });
  }
}

// Export handler function for section-system
export function handler(element: Element, updates: Record<string, unknown>) {
  handleSplitBannerUpdate(element, updates as Partial<Section>);
}

export const defaultContent = {
  title: '',
  subtitle: '',
  right: { title: 'נשים', imageUrl: 'https://3lwnd3ucppklouqs.public.blob.vercel-storage.com/quickshop/stores/noir-fashion/x0gDz-4TUp.webp', link: '/category/women' },
  left: { title: 'גברים', imageUrl: 'https://3lwnd3ucppklouqs.public.blob.vercel-storage.com/quickshop/stores/noir-fashion/r6Du0CcW_E.webp', link: '/category/men' },
};

export const defaultSettings = {
  height: '70vh',
  minHeight: 70,
  minHeightUnit: 'vh',
  verticalAlign: 'bottom',
  textAlign: 'center',
  titleSize: 32,
  titleSizeMobile: 24,
  titleColor: '#ffffff',
  titleWeight: 'light',
  overlay: 0.1,
  paddingTop: 0,
  paddingBottom: 0,
  isVisible: true,
};

export const config = {
  name: 'באנר מפוצל',
  description: 'באנר עם 2 תמונות - ימין ושמאל',
  category: 'באנרים',
  icon: 'LayoutGrid',
};
