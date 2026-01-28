/**
 * QuoteBannerHandler - DOM update logic for quote banner section
 * עדכונים בזמן אמת לבאנר ציטוט
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleQuoteBannerUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  const settings = (updates.settings || {}) as Record<string, unknown>;
  const content = (updates.content || {}) as Record<string, unknown>;

  // Update quote text
  if (content.quote !== undefined) {
    const quoteEl = el.querySelector('[data-section-quote]') as HTMLElement;
    if (quoteEl) {
      quoteEl.textContent = `"${content.quote}"`;
    }
  }

  // Update attribution
  if (content.attribution !== undefined) {
    const attrEl = el.querySelector('[data-section-attribution]') as HTMLElement;
    if (attrEl) {
      attrEl.textContent = content.attribution as string;
      attrEl.style.display = content.attribution ? '' : 'none';
    }
  }

  // Update desktop image
  if (content.imageUrl !== undefined) {
    const bgDesktop = el.querySelector('[data-bg-desktop]') as HTMLElement;
    if (bgDesktop) {
      bgDesktop.style.backgroundImage = content.imageUrl 
        ? `url("${content.imageUrl}")` 
        : 'none';
    }
    // Show fallback if no image
    const fallback = el.querySelector('[data-bg-fallback]') as HTMLElement;
    if (fallback) {
      fallback.style.display = content.imageUrl ? 'none' : 'block';
    }
  }

  // Update mobile image
  if (content.mobileImageUrl !== undefined) {
    const bgMobile = el.querySelector('[data-bg-mobile]') as HTMLElement;
    if (bgMobile) {
      // Use mobile image or fall back to desktop
      const desktopImg = (content.imageUrl as string) || '';
      bgMobile.style.backgroundImage = content.mobileImageUrl 
        ? `url("${content.mobileImageUrl}")` 
        : (desktopImg ? `url("${desktopImg}")` : 'none');
    }
  }

  // Update desktop video
  if (content.videoUrl !== undefined) {
    const videoDesktop = el.querySelector('[data-video-desktop]') as HTMLVideoElement;
    if (videoDesktop) {
      if (content.videoUrl) {
        videoDesktop.src = content.videoUrl as string;
        videoDesktop.load();
      }
    }
  }

  // Update overlay
  if (settings.overlay !== undefined) {
    const overlayEl = el.querySelector('[data-overlay]') as HTMLElement;
    if (overlayEl) {
      overlayEl.style.opacity = String(settings.overlay);
    }
  }

  // Update height
  if (settings.height !== undefined) {
    const container = el.querySelector('[data-content-container]') as HTMLElement;
    if (container) {
      container.style.height = settings.height as string;
    }
  }

  // Update minHeight
  if (settings.minHeight !== undefined || settings.minHeightUnit !== undefined) {
    const minHeight = (settings.minHeight as number) ?? 60;
    const unit = (settings.minHeightUnit as string) ?? 'vh';
    const container = el.querySelector('[data-content-container]') as HTMLElement;
    if (container) {
      container.style.height = `${minHeight}${unit}`;
    }
  }

  // Update text style (serif/sans/italic)
  if (settings.textStyle !== undefined) {
    const quoteEl = el.querySelector('[data-section-quote]') as HTMLElement;
    if (quoteEl) {
      quoteEl.classList.remove('font-serif', 'font-sans', 'italic');
      const style = settings.textStyle as string;
      if (style === 'serif') {
        quoteEl.classList.add('font-serif');
      } else if (style === 'italic') {
        quoteEl.classList.add('font-serif', 'italic');
      } else {
        quoteEl.classList.add('font-sans');
      }
    }
  }

  // Update text alignment
  if (settings.textAlign !== undefined) {
    const contentWrapper = el.querySelector('[data-content-container] > div') as HTMLElement;
    if (contentWrapper) {
      contentWrapper.classList.remove('text-left', 'text-center', 'text-right');
      contentWrapper.classList.add(`text-${settings.textAlign}`);
    }
  }

  // Update vertical alignment
  if (settings.verticalAlign !== undefined) {
    const container = el.querySelector('[data-content-container]') as HTMLElement;
    if (container) {
      container.classList.remove('items-start', 'items-center', 'items-end');
      const align = settings.verticalAlign as string;
      if (align === 'top') {
        container.classList.add('items-start');
      } else if (align === 'bottom') {
        container.classList.add('items-end');
      } else {
        container.classList.add('items-center');
      }
    }
  }

  // Update parallax
  if (settings.parallax !== undefined) {
    const bgDesktop = el.querySelector('[data-bg-desktop]') as HTMLElement;
    if (bgDesktop) {
      bgDesktop.style.backgroundAttachment = settings.parallax ? 'fixed' : 'scroll';
    }
  }
}

// Export handler function for section-system
export function handler(element: Element, updates: Record<string, unknown>) {
  handleQuoteBannerUpdate(element, updates as Partial<Section>);
}

export const defaultContent = {
  quote: 'בפלטפורמה שלנו לא רק בונים חנויות - בפלטפורמה שלנו בונים עסקים מצליחים',
  attribution: 'יוגב אביטן, מנכ״ל קוויק שופ',
  imageUrl: '',
  mobileImageUrl: '',
  videoUrl: '',
  mediaType: 'image',
};

export const defaultSettings = {
  minHeight: 60,
  minHeightUnit: 'vh',
  height: '60vh',
  overlay: 0.4,
  textStyle: 'italic',
  textAlign: 'center',
  verticalAlign: 'center',
  parallax: true,
  paddingTop: 0,
  paddingBottom: 0,
  isVisible: true,
};

export const config = {
  name: 'באנר ציטוט',
  description: 'באנר עם ציטוט על רקע תמונה או וידאו',
  category: 'באנרים',
  icon: 'Quote',
};

