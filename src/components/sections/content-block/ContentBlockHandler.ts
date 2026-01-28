/**
 * ContentBlockHandler - Universal handler for content_block section
 * סקשן אחד - מה שריק פשוט לא מוצג
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleContentBlockUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // Apply common updates first (background, spacing, visibility, etc.)
  applyCommonUpdates(el, updates);

  // ====================================
  // Content Updates
  // ====================================
  
  // Title
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
      titleEl.style.display = updates.title ? '' : 'none';
    }
  }

  // Subtitle
  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
      subtitleEl.style.display = updates.subtitle ? '' : 'none';
    }
  }

  // Text content
  if (updates.content?.text !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) {
      textEl.innerHTML = (updates.content.text as string) || '';
      textEl.style.display = updates.content.text ? '' : 'none';
    }
  }

  // Button text
  if (updates.content?.buttonText !== undefined) {
    const buttonEl = el.querySelector('[data-section-button]') as HTMLElement;
    if (buttonEl) {
      buttonEl.textContent = (updates.content.buttonText as string) || '';
      buttonEl.style.display = updates.content.buttonText ? '' : 'none';
    }
  }

  // Button link
  if (updates.content?.buttonLink !== undefined) {
    const buttonEl = el.querySelector('[data-section-button]') as HTMLAnchorElement;
    if (buttonEl) {
      buttonEl.href = (updates.content.buttonLink as string) || '#';
    }
  }

  // Secondary button text
  if (updates.content?.secondaryButtonText !== undefined) {
    const buttonEl = el.querySelector('[data-section-button-secondary]') as HTMLElement;
    if (buttonEl) {
      buttonEl.textContent = (updates.content.secondaryButtonText as string) || '';
      buttonEl.style.display = updates.content.secondaryButtonText ? '' : 'none';
    }
  }

  // ====================================
  // Media Updates
  // ====================================

  // Desktop Image
  if (updates.content?.imageUrl !== undefined) {
    const imgEl = el.querySelector('[data-bg-desktop][data-bg-type="image"]') as HTMLElement;
    if (imgEl) {
      imgEl.style.backgroundImage = updates.content.imageUrl ? `url("${updates.content.imageUrl}")` : 'none';
    }
  }

  // Mobile Image
  if (updates.content?.mobileImageUrl !== undefined) {
    const imgEl = el.querySelector('[data-bg-mobile][data-bg-type="image"]') as HTMLElement;
    if (imgEl) {
      imgEl.style.backgroundImage = updates.content.mobileImageUrl ? `url("${updates.content.mobileImageUrl}")` : 'none';
    }
  }

  // Desktop Video
  if (updates.content?.videoUrl !== undefined) {
    let videoEl = el.querySelector('[data-video-desktop]') as HTMLVideoElement;
    if (updates.content.videoUrl) {
      if (!videoEl) {
        // Create video element if doesn't exist
        videoEl = document.createElement('video');
        videoEl.className = 'absolute inset-0 w-full h-full object-cover';
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.loop = true;
        videoEl.playsInline = true;
        videoEl.dataset.videoDesktop = '';
        videoEl.dataset.bgType = 'video';
        el.insertBefore(videoEl, el.firstChild);
      }
      videoEl.src = updates.content.videoUrl as string;
      videoEl.style.display = '';
      
      // Hide image when video is present
      const imgEl = el.querySelector('[data-bg-desktop][data-bg-type="image"]') as HTMLElement;
      if (imgEl) imgEl.style.display = 'none';
    } else if (videoEl) {
      videoEl.style.display = 'none';
      // Show image when video is removed
      const imgEl = el.querySelector('[data-bg-desktop][data-bg-type="image"]') as HTMLElement;
      if (imgEl) imgEl.style.display = '';
    }
  }

  // Mobile Video
  if (updates.content?.mobileVideoUrl !== undefined) {
    let videoEl = el.querySelector('[data-video-mobile]') as HTMLVideoElement;
    if (updates.content.mobileVideoUrl) {
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.className = 'absolute inset-0 w-full h-full object-cover md:hidden';
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.loop = true;
        videoEl.playsInline = true;
        videoEl.dataset.videoMobile = '';
        videoEl.dataset.bgType = 'video';
        el.insertBefore(videoEl, el.firstChild);
      }
      videoEl.src = updates.content.mobileVideoUrl as string;
      videoEl.style.display = '';
    } else if (videoEl) {
      videoEl.style.display = 'none';
    }
  }

  // ====================================
  // Typography Updates
  // ====================================
  
  // Title color
  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) titleEl.style.color = updates.settings.titleColor as string;
  }

  // Title size
  if (updates.settings?.titleSize !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) titleEl.style.fontSize = `${updates.settings.titleSize}px`;
  }

  // Title weight
  if (updates.settings?.titleWeight !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const weight = updates.settings.titleWeight as string;
      titleEl.style.fontWeight = weight === 'extralight' ? '200' : weight === 'light' ? '300' : weight === 'normal' ? '400' : weight === 'medium' ? '500' : weight === 'semibold' ? '600' : weight === 'bold' ? '700' : '800';
    }
  }

  // Subtitle color
  if (updates.settings?.subtitleColor !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) subtitleEl.style.color = updates.settings.subtitleColor as string;
  }

  // Subtitle size
  if (updates.settings?.subtitleSize !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) subtitleEl.style.fontSize = `${updates.settings.subtitleSize}px`;
  }

  // Text color
  if (updates.settings?.textColor !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) textEl.style.color = updates.settings.textColor as string;
  }

  // Text size
  if (updates.settings?.textSize !== undefined) {
    const textEl = el.querySelector('[data-content-text]') as HTMLElement;
    if (textEl) textEl.style.fontSize = `${updates.settings.textSize}px`;
  }

  // ====================================
  // Button Style Updates
  // ====================================
  
  const buttonEl = el.querySelector('[data-section-button]') as HTMLElement;
  if (buttonEl) {
    if (updates.settings?.buttonTextColor !== undefined) {
      buttonEl.style.color = updates.settings.buttonTextColor as string;
    }
    if (updates.settings?.buttonBackgroundColor !== undefined) {
      buttonEl.style.backgroundColor = updates.settings.buttonBackgroundColor as string;
    }
    if (updates.settings?.buttonBorderColor !== undefined) {
      buttonEl.style.borderColor = updates.settings.buttonBorderColor as string;
    }
    if (updates.settings?.buttonBorderWidth !== undefined) {
      buttonEl.style.borderWidth = `${updates.settings.buttonBorderWidth}px`;
      buttonEl.style.borderStyle = 'solid';
    }
    if (updates.settings?.buttonBorderRadius !== undefined) {
      buttonEl.style.borderRadius = `${updates.settings.buttonBorderRadius}px`;
    }
    if (updates.settings?.buttonStyle !== undefined) {
      const style = updates.settings.buttonStyle as string;
      if (style === 'filled') {
        buttonEl.style.borderWidth = '0';
        buttonEl.style.textDecoration = 'none';
      } else if (style === 'outline') {
        buttonEl.style.backgroundColor = 'transparent';
        buttonEl.style.textDecoration = 'none';
      } else if (style === 'underline') {
        buttonEl.style.backgroundColor = 'transparent';
        buttonEl.style.borderWidth = '0';
        buttonEl.style.textDecoration = 'underline';
      }
    }
  }

  // ====================================
  // Gradient Updates
  // ====================================
  
  if (updates.settings?.showGradient !== undefined || updates.settings?.gradientDirection !== undefined) {
    const overlayEl = el.querySelector('[data-overlay]') as HTMLElement;
    if (overlayEl) {
      const show = updates.settings?.showGradient ?? el.dataset.showGradient === 'true';
      const direction = (updates.settings?.gradientDirection || 'top') as string;
      
      if (show) {
        overlayEl.style.background = direction === 'top' 
          ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
          : direction === 'bottom'
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
          : direction === 'left'
          ? 'linear-gradient(to left, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
          : 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)';
        overlayEl.style.backgroundColor = 'transparent';
      } else {
        overlayEl.style.background = '';
      }
    }
  }

  // ====================================
  // Layout Updates
  // ====================================
  
  // Height
  if (updates.settings?.height !== undefined) {
    el.style.height = updates.settings.height as string;
  }

  // Vertical Align - handled by common-handler which now checks for data-content-container
  // No additional handling needed here

  // Text Align
  if (updates.settings?.textAlign !== undefined) {
    const contentContainer = el.querySelector('[data-content-container]') as HTMLElement;
    if (contentContainer) {
      const align = updates.settings.textAlign as string;
      contentContainer.classList.remove('text-left', 'text-center', 'text-right', 'items-start', 'items-center', 'items-end');
      if (align === 'right') {
        contentContainer.classList.add('text-right', 'items-start');
      } else if (align === 'left') {
        contentContainer.classList.add('text-left', 'items-end');
      } else {
        contentContainer.classList.add('text-center', 'items-center');
      }
    }
  }
}

/**
 * Apply variant-specific default styles
 */
// ====================================
// Default Content & Settings
// ====================================

export const defaultContent = {
  text: '',
  buttonText: '',
  buttonLink: '',
  secondaryButtonText: '',
  secondaryButtonLink: '',
  imageUrl: '',
  mobileImageUrl: '',
  videoUrl: '',
  mobileVideoUrl: '',
};

export const defaultSettings = {
  // Layout
  height: 'auto',
  minHeight: 400,
  minHeightUnit: 'px',
  sectionWidth: 'full',
  contentWidth: 1200,
  textAlign: 'center',
  verticalAlign: 'center',
  // Background
  backgroundColor: '#ffffff',
  overlay: 0,
  showGradient: false,
  gradientDirection: 'top',
  // Typography
  titleColor: '#000000',
  titleSize: 36,
  titleSizeMobile: 28,
  titleWeight: 'bold',
  subtitleColor: '#6b7280',
  subtitleSize: 18,
  subtitleSizeMobile: 16,
  subtitleWeight: 'normal',
  textColor: '#374151',
  textSize: 16,
  textSizeMobile: 14,
  // Button
  buttonStyle: 'outline',
  buttonTextColor: '#000000',
  buttonBackgroundColor: 'transparent',
  buttonBorderColor: '#000000',
  buttonBorderWidth: 2,
  buttonBorderRadius: 0,
  // Spacing
  paddingTop: 64,
  paddingBottom: 64,
  paddingLeft: 24,
  paddingRight: 24,
};

export const config = {
  type: 'content_block',
  name: 'בלוק תוכן',
  icon: 'Square',
};

