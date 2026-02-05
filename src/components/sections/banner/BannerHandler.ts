/**
 * BannerHandler - Live DOM updates for banner section in editor
 * מטפל בעדכוני DOM בזמן אמת לסקשן באנר באדיטור
 */

import { applyCommonUpdates } from '../handlers/common-handler';

// Default content for new banner sections
export const defaultContent = {
  imageUrl: '',
  mobileImageUrl: '',
  linkUrl: '',
  linkTarget: '_self' as const,
  altText: '',
};

// Default settings for new banner sections
export const defaultSettings = {
  sectionWidth: 'full' as const,
  maxWidth: 0,
  paddingTop: 0,
  paddingBottom: 0,
  marginTop: 0,
  marginBottom: 0,
  backgroundColor: 'transparent',
  borderRadius: 0,
  shadow: 'none' as const,
  hideOnDesktop: false,
  hideOnMobile: false,
};

interface BannerUpdates {
  content?: {
    imageUrl?: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    linkTarget?: '_self' | '_blank';
    altText?: string;
  };
  settings?: {
    sectionWidth?: 'full' | 'boxed';
    maxWidth?: number;
    paddingTop?: number;
    paddingBottom?: number;
    marginTop?: number;
    marginBottom?: number;
    backgroundColor?: string;
    borderRadius?: number;
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hideOnDesktop?: boolean;
    hideOnMobile?: boolean;
  };
}

export function handleBannerUpdate(el: HTMLElement, updates: BannerUpdates): void {
  // Apply common updates (padding, margin, visibility, etc.)
  applyCommonUpdates(el, updates);

  const { content, settings } = updates;

  // ==================== Content Updates ====================
  if (content) {
    // Desktop Image
    if (content.imageUrl !== undefined) {
      const desktopImg = el.querySelector('[data-banner-desktop]') as HTMLImageElement;
      if (desktopImg) {
        desktopImg.src = content.imageUrl || '';
        if (!content.imageUrl) {
          desktopImg.style.display = 'none';
        } else {
          desktopImg.style.display = '';
        }
      }
      
      // Also update image in editor placeholder
      const editorImg = el.querySelector('[data-banner-image]') as HTMLImageElement;
      if (editorImg) {
        editorImg.src = content.imageUrl || '';
      }
    }

    // Mobile Image
    if (content.mobileImageUrl !== undefined) {
      const mobileImg = el.querySelector('[data-banner-mobile]') as HTMLImageElement;
      if (mobileImg) {
        mobileImg.src = content.mobileImageUrl || '';
        if (!content.mobileImageUrl) {
          mobileImg.style.display = 'none';
        } else {
          mobileImg.style.display = '';
        }
      }
    }

    // Alt Text
    if (content.altText !== undefined) {
      const allImages = el.querySelectorAll('img');
      allImages.forEach(img => {
        img.alt = content.altText || '';
      });
    }

    // Link URL and Target
    if (content.linkUrl !== undefined || content.linkTarget !== undefined) {
      const linkEl = el.querySelector('[data-banner-link]') as HTMLAnchorElement;
      if (linkEl) {
        if (content.linkUrl !== undefined) {
          linkEl.href = content.linkUrl || '#';
        }
        if (content.linkTarget !== undefined) {
          linkEl.target = content.linkTarget || '_self';
          if (content.linkTarget === '_blank') {
            linkEl.rel = 'noopener noreferrer';
          } else {
            linkEl.removeAttribute('rel');
          }
        }
      }
    }
  }

  // ==================== Settings Updates ====================
  if (settings) {
    // Background Color
    if (settings.backgroundColor !== undefined) {
      el.style.backgroundColor = settings.backgroundColor || 'transparent';
    }

    // Section Width
    if (settings.sectionWidth !== undefined) {
      const container = el.firstElementChild as HTMLElement;
      if (container) {
        if (settings.sectionWidth === 'boxed') {
          container.className = 'max-w-7xl mx-auto px-4';
        } else {
          container.className = 'w-full';
        }
      }
    }

    // Max Width for images
    if (settings.maxWidth !== undefined) {
      const allImages = el.querySelectorAll('img');
      allImages.forEach(img => {
        if (settings.maxWidth && settings.maxWidth > 0) {
          img.style.maxWidth = `${settings.maxWidth}px`;
          img.style.margin = '0 auto';
        } else {
          img.style.maxWidth = 'none';
          img.style.margin = '';
        }
      });
    }

    // Border Radius
    if (settings.borderRadius !== undefined) {
      const allImages = el.querySelectorAll('img');
      allImages.forEach(img => {
        if (settings.borderRadius && settings.borderRadius > 0) {
          img.style.borderRadius = `${settings.borderRadius}px`;
        } else {
          img.style.borderRadius = '';
        }
      });
    }

    // Shadow
    if (settings.shadow !== undefined) {
      const allImages = el.querySelectorAll('img');
      const shadowClasses = ['shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl'];
      allImages.forEach(img => {
        // Remove all shadow classes
        shadowClasses.forEach(cls => img.classList.remove(cls));
        // Add new shadow class if not 'none'
        if (settings.shadow && settings.shadow !== 'none') {
          img.classList.add(`shadow-${settings.shadow}`);
        }
      });
    }
  }
}

// Export handler function for section-system
export function handler(element: Element, updates: Record<string, unknown>) {
  handleBannerUpdate(element as HTMLElement, updates as BannerUpdates);
}
