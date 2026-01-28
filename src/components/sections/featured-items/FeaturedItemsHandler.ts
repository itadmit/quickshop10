/**
 * FeaturedItemsHandler - עדכון DOM בזמן אמת לסקשן פריטים מובחרים
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleFeaturedItemsUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // Apply common updates first (background, spacing, visibility, etc.)
  applyCommonUpdates(el, updates);

  // Title
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
    }
  }

  // Subtitle
  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
    }
  }

  // Title typography
  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) titleEl.style.color = updates.settings.titleColor as string;
  }

  // Subtitle typography
  if (updates.settings?.subtitleColor !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) subtitleEl.style.color = updates.settings.subtitleColor as string;
  }

  // Grid columns - use inline styles and inject scoped CSS for responsive
  const gridEl = el.querySelector('[data-products-grid]') as HTMLElement;
  const sectionId = el.getAttribute('data-section-id');
  
  if (gridEl && (updates.settings?.columns !== undefined || updates.settings?.mobileColumns !== undefined)) {
    const cols = (updates.settings?.columns as number) || gridEl.getAttribute('data-columns') || 4;
    const mobileCols = (updates.settings?.mobileColumns as number) || gridEl.getAttribute('data-mobile-columns') || 2;
    
    // Update data attributes
    gridEl.setAttribute('data-columns', String(cols));
    gridEl.setAttribute('data-mobile-columns', String(mobileCols));
    
    // Apply inline style for mobile (default)
    gridEl.style.gridTemplateColumns = `repeat(${mobileCols}, minmax(0, 1fr))`;
    
    // Inject/update scoped CSS for desktop
    if (sectionId) {
      const styleId = `featured-items-grid-style-${sectionId}`;
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
  if (updates.settings?.gap !== undefined && gridEl) {
    gridEl.style.gap = `${updates.settings.gap}px`;
  }

  // Card text alignment
  if (updates.settings?.cardTextAlign !== undefined) {
    const nameEls = el.querySelectorAll('[data-item-name]');
    const align = updates.settings.cardTextAlign as string;
    nameEls.forEach((nameEl) => {
      (nameEl as HTMLElement).classList.remove('text-right', 'text-center', 'text-left');
      (nameEl as HTMLElement).classList.add(`text-${align}`);
    });
  }

  // Card style (standard/minimal/overlay) - store for CSS
  if (updates.settings?.cardStyle !== undefined) {
    el.setAttribute('data-card-style', updates.settings.cardStyle as string);
  }
  
  // Items - update names, images, links in real-time
  if (updates.content?.items !== undefined) {
    const items = updates.content.items as Array<{
      id: string;
      name: string;
      imageUrl?: string;
      videoUrl?: string;
      link?: string;
    }>;
    
    items.forEach((item) => {
      const itemEl = el.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement;
      if (!itemEl) return;
      
      // Update name
      const nameEl = itemEl.querySelector('[data-item-name]') as HTMLElement;
      if (nameEl && item.name !== undefined) {
        nameEl.textContent = item.name;
      }
      
      // Update image
      const imgEl = itemEl.querySelector('img') as HTMLImageElement;
      if (imgEl && item.imageUrl !== undefined) {
        if (item.imageUrl) {
          imgEl.src = item.imageUrl;
          imgEl.style.display = '';
        } else {
          imgEl.style.display = 'none';
        }
      }
      
      // Update video
      const videoEl = itemEl.querySelector('video') as HTMLVideoElement;
      if (videoEl && item.videoUrl !== undefined) {
        if (item.videoUrl) {
          videoEl.src = item.videoUrl;
          videoEl.style.display = '';
          if (imgEl) imgEl.style.display = 'none';
        } else {
          videoEl.style.display = 'none';
          if (imgEl && item.imageUrl) imgEl.style.display = '';
        }
      }
      
      // Update link
      if (item.link !== undefined) {
        const linkEl = itemEl.closest('a') || itemEl;
        if (linkEl.tagName === 'A') {
          (linkEl as HTMLAnchorElement).href = item.link || '#';
        }
      }
    });
  }
}

export const defaultContent = {
  displayLimit: 4,
  items: [
    { id: '1', name: 'מוצר א׳', imageUrl: '', link: '/products' },
    { id: '2', name: 'מוצר ב׳', imageUrl: '', link: '/products' },
    { id: '3', name: 'מוצר ג׳', imageUrl: '', link: '/products' },
  ],
};

export const defaultSettings = {
  backgroundColor: '#ffffff',
  titleSize: 28,
  titleSizeMobile: 22,
  titleWeight: 'light',
  titleColor: '#000000',
  subtitleSize: 12,
  subtitleSizeMobile: 10,
  subtitleColor: '#9ca3af',
  columns: 4,
  mobileColumns: 2,
  gap: 24,
  showAddToCart: false,
  cardStyle: 'standard',
  cardTextAlign: 'center',
  hoverEffect: 'scale',
  paddingTop: 80,
  paddingBottom: 80,
  paddingLeft: 24,
  paddingRight: 24,
};

export const config = {
  type: 'featured_items',
  name: 'פריטים מובחרים',
  icon: 'Star',
};

