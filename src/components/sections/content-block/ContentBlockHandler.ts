/**
 * ContentBlockHandler - Universal handler for content_block section
 * סקשן אחד - מה שריק פשוט לא מוצג
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

/**
 * Check if section should use img mode (image determines height)
 * When backgroundSize is 'width' or 'contain' AND minHeight is null/0/empty
 */
function shouldUseImgMode(el: HTMLElement, updates: Partial<Section>): boolean {
  const backgroundSize = (updates.settings?.backgroundSize as string) ?? 
                         el.dataset.backgroundSize ?? 'cover';
  
  // Check minHeight - supports updates, dataset ('0' = auto), or default (null = auto)
  let minHeight: number | null;
  if (updates.settings?.minHeight !== undefined) {
    minHeight = updates.settings.minHeight as number | null;
  } else if (el.dataset.minHeight) {
    const dsValue = Number(el.dataset.minHeight);
    minHeight = dsValue === 0 ? null : dsValue;
  } else {
    minHeight = null; // Default is auto
  }
  
  const isAutoHeight = minHeight === null || minHeight === 0;
  const isWidthMode = backgroundSize === 'width' || backgroundSize === 'contain';
  
  return isWidthMode && isAutoHeight;
}

/**
 * Get image URL from element (supports both img and div backgrounds)
 */
function getImageUrl(el: HTMLElement | null): string {
  if (!el) return '';
  // Try data-image-url first
  const dataUrl = el.getAttribute('data-image-url');
  if (dataUrl) return dataUrl;
  // Try img src
  if (el.tagName === 'IMG') return (el as HTMLImageElement).src || '';
  // Try background-image
  const bgImage = el.style.backgroundImage;
  if (bgImage) {
    const match = bgImage.match(/url\(["']?(.+?)["']?\)/);
    return match ? match[1] : '';
  }
  return '';
}

/**
 * Convert between div-background mode and img mode
 * img mode: image determines section height
 * div mode: section has fixed/min height, image as background
 */
function updateImageMode(el: HTMLElement, updates: Partial<Section>): void {
  const sectionId = el.getAttribute('data-section-id');
  const useImgMode = shouldUseImgMode(el, updates);
  const currentMode = el.dataset.imageMode || 'div';
  
  // Only proceed if mode changed or we have relevant updates
  const hasRelevantUpdate = updates.settings?.backgroundSize !== undefined || 
                            updates.settings?.minHeight !== undefined ||
                            updates.content?.imageUrl !== undefined ||
                            updates.content?.mobileImageUrl !== undefined;
  
  if (!hasRelevantUpdate && currentMode === (useImgMode ? 'img' : 'div')) {
    return;
  }
  
  // Get current image URLs
  const desktopEl = el.querySelector('[data-bg-desktop]') as HTMLElement;
  const mobileEl = el.querySelector('[data-bg-mobile]') as HTMLElement;
  const desktopImgUrl = (updates.content?.imageUrl as string) ?? getImageUrl(desktopEl);
  const mobileImgUrl = (updates.content?.mobileImageUrl as string) ?? getImageUrl(mobileEl);
  const hasMobileImage = !!mobileImgUrl;
  
  if (useImgMode && desktopImgUrl) {
    // Switch to IMG mode
    el.dataset.imageMode = 'img';
    
    // Remove old div elements
    const oldDesktopDiv = el.querySelector('[data-bg-desktop]:not(img)') as HTMLElement;
    const oldMobileDiv = el.querySelector('[data-bg-mobile]:not(img)') as HTMLElement;
    const oldWrapper = el.querySelector('[data-bg-desktop-wrapper]') as HTMLElement;
    if (oldDesktopDiv) oldDesktopDiv.remove();
    if (oldMobileDiv) oldMobileDiv.remove();
    if (oldWrapper) oldWrapper.remove();
    
    // Check if img elements already exist
    let desktopImg = el.querySelector('img[data-bg-desktop]') as HTMLImageElement;
    let mobileImg = el.querySelector('img[data-bg-mobile]') as HTMLImageElement;
    
    // Create desktop img if doesn't exist
    if (!desktopImg) {
      desktopImg = document.createElement('img');
      desktopImg.setAttribute('data-bg-desktop', '');
      desktopImg.setAttribute('data-bg-type', 'image');
      desktopImg.alt = '';
      el.insertBefore(desktopImg, el.firstChild);
    }
    
    // Style desktop img
    desktopImg.src = desktopImgUrl;
    desktopImg.setAttribute('data-image-url', desktopImgUrl);
    desktopImg.style.cssText = 'width: 100%; height: auto; display: block;';
    desktopImg.className = hasMobileImage ? 'hidden md:block' : 'block';
    
    // Handle mobile img
    if (hasMobileImage) {
      if (!mobileImg) {
        mobileImg = document.createElement('img');
        mobileImg.setAttribute('data-bg-mobile', '');
        mobileImg.setAttribute('data-bg-type', 'image');
        mobileImg.alt = '';
        desktopImg.insertAdjacentElement('afterend', mobileImg);
      }
      mobileImg.src = mobileImgUrl;
      mobileImg.setAttribute('data-image-url', mobileImgUrl);
      mobileImg.style.cssText = 'width: 100%; height: auto; display: block;';
      mobileImg.className = 'block md:hidden';
    } else if (mobileImg) {
      mobileImg.remove();
    }
    
    // Update section layout for img mode
    el.style.display = 'block';
    el.style.minHeight = '';
    el.style.flexDirection = '';
    el.style.paddingTop = '0';
    el.style.paddingBottom = '0';
    
    // Update content container to overlay on image
    const contentContainer = el.querySelector('[data-content-container]') as HTMLElement;
    if (contentContainer) {
      contentContainer.classList.add('absolute', 'inset-0');
      contentContainer.classList.remove('relative');
      contentContainer.style.position = 'absolute';
    }
    
    // Inject responsive style
    if (sectionId && hasMobileImage) {
      let styleEl = document.getElementById(`img-mode-style-${sectionId}`);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = `img-mode-style-${sectionId}`;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        @media (min-width: 768px) {
          [data-section-id="${sectionId}"] img[data-bg-mobile] { display: none !important; }
        }
        @media (max-width: 767px) {
          [data-section-id="${sectionId}"] img[data-bg-desktop] { display: none !important; }
        }
      `;
    }
  } else if (!useImgMode && currentMode === 'img') {
    // Switch back to DIV mode
    el.dataset.imageMode = 'div';
    
    // Remove img elements
    const desktopImg = el.querySelector('img[data-bg-desktop]') as HTMLImageElement;
    const mobileImg = el.querySelector('img[data-bg-mobile]') as HTMLImageElement;
    if (desktopImg) desktopImg.remove();
    if (mobileImg) mobileImg.remove();
    
    // Remove img-mode style
    if (sectionId) {
      const styleEl = document.getElementById(`img-mode-style-${sectionId}`);
      if (styleEl) styleEl.remove();
    }
    
    // Create desktop div background
    if (desktopImgUrl) {
      const bgDiv = document.createElement('div');
      bgDiv.className = `absolute inset-0 bg-cover bg-center bg-no-repeat ${hasMobileImage ? 'hidden md:block' : ''}`;
      bgDiv.setAttribute('data-bg-desktop', '');
      bgDiv.setAttribute('data-bg-type', 'image');
      bgDiv.setAttribute('data-image-url', desktopImgUrl);
      bgDiv.style.backgroundImage = `url("${desktopImgUrl}")`;
      el.insertBefore(bgDiv, el.firstChild);
    }
    
    // Create mobile div background
    if (hasMobileImage) {
      const mobileBgDiv = document.createElement('div');
      mobileBgDiv.className = 'absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden';
      mobileBgDiv.setAttribute('data-bg-mobile', '');
      mobileBgDiv.setAttribute('data-bg-type', 'image');
      mobileBgDiv.setAttribute('data-image-url', mobileImgUrl);
      mobileBgDiv.style.backgroundImage = `url("${mobileImgUrl}")`;
      el.insertBefore(mobileBgDiv, el.firstChild);
    }
    
    // Update content container back to relative
    const contentContainer = el.querySelector('[data-content-container]') as HTMLElement;
    if (contentContainer) {
      contentContainer.classList.remove('absolute', 'inset-0');
      contentContainer.classList.add('relative');
      contentContainer.style.position = '';
    }
  }
}

export function handleContentBlockUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;
  
  // Store backgroundSize in dataset BEFORE common updates (for mode detection)
  if (updates.settings?.backgroundSize !== undefined) {
    el.dataset.backgroundSize = updates.settings.backgroundSize as string;
  }

  // Apply common updates first (background, spacing, visibility, etc.)
  applyCommonUpdates(el, updates);
  
  // Store minHeight in dataset AFTER common updates (common-handler deletes it for null/0)
  // We need to track '0' specifically for img mode detection
  if (updates.settings?.minHeight !== undefined) {
    const minHeight = updates.settings.minHeight;
    if (minHeight === null || minHeight === 0) {
      el.dataset.minHeight = '0'; // Use '0' to indicate auto
    } else {
      el.dataset.minHeight = String(minHeight);
    }
  }
  
  // Handle image mode switching (img vs div background)
  updateImageMode(el, updates);

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
  // Media Updates (handled by updateImageMode for img mode)
  // For div mode, we handle here
  // ====================================
  
  const currentImageMode = el.dataset.imageMode || 'div';

  // Desktop Image - only handle in div mode (img mode handled by updateImageMode)
  if (updates.content?.imageUrl !== undefined && currentImageMode === 'div') {
    let imgEl = el.querySelector('[data-bg-desktop][data-bg-type="image"]:not(img)') as HTMLElement;
    const mobileImgEl = el.querySelector('[data-bg-mobile][data-bg-type="image"]') as HTMLElement;
    const sectionId = el.getAttribute('data-section-id');
    
    if (updates.content.imageUrl) {
      // Create desktop image element if doesn't exist
      if (!imgEl) {
        imgEl = document.createElement('div');
        imgEl.className = 'absolute inset-0 bg-cover bg-center bg-no-repeat';
        imgEl.setAttribute('data-bg-desktop', '');
        imgEl.setAttribute('data-bg-type', 'image');
        el.insertBefore(imgEl, el.firstChild);
        
        // If mobile image exists, inject style to hide desktop on mobile
        if (mobileImgEl && sectionId) {
          let styleEl = document.getElementById(`mobile-image-style-${sectionId}`);
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = `mobile-image-style-${sectionId}`;
            document.head.appendChild(styleEl);
          }
          styleEl.textContent = `
            @media (max-width: 767px) {
              [data-section-id="${sectionId}"] [data-bg-desktop] { display: none !important; }
            }
          `;
        }
      }
      imgEl.style.backgroundImage = `url("${updates.content.imageUrl}")`;
      imgEl.setAttribute('data-image-url', updates.content.imageUrl as string);
      imgEl.style.display = '';
    } else if (imgEl) {
      imgEl.style.display = 'none';
    }
  }

  // Mobile Image - only handle in div mode
  if (updates.content?.mobileImageUrl !== undefined && currentImageMode === 'div') {
    let imgEl = el.querySelector('[data-bg-mobile][data-bg-type="image"]:not(img)') as HTMLElement;
    const desktopImgEl = el.querySelector('[data-bg-desktop][data-bg-type="image"]') as HTMLElement;
    const sectionId = el.getAttribute('data-section-id');
    
    if (updates.content.mobileImageUrl) {
      // First, inject the style tag BEFORE creating the element
      // This ensures no flash occurs
      if (sectionId) {
        let styleEl = document.getElementById(`mobile-image-style-${sectionId}`);
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = `mobile-image-style-${sectionId}`;
          document.head.appendChild(styleEl);
        }
        // Hide mobile image on desktop (>=768px), hide desktop image on mobile (<768px)
        styleEl.textContent = `
          @media (min-width: 768px) {
            [data-section-id="${sectionId}"] [data-bg-mobile] { display: none !important; }
          }
          @media (max-width: 767px) {
            [data-section-id="${sectionId}"] [data-bg-desktop] { display: none !important; }
          }
        `;
      }
      
      // Create mobile image element if doesn't exist
      if (!imgEl) {
        imgEl = document.createElement('div');
        // Don't use md:hidden class - use style tag instead
        imgEl.className = 'absolute inset-0 bg-cover bg-center bg-no-repeat';
        imgEl.setAttribute('data-bg-mobile', '');
        imgEl.setAttribute('data-bg-type', 'image');
        // Insert after desktop image or at beginning
        if (desktopImgEl) {
          desktopImgEl.insertAdjacentElement('afterend', imgEl);
        } else {
          el.insertBefore(imgEl, el.firstChild);
        }
      }
      imgEl.style.backgroundImage = `url("${updates.content.mobileImageUrl}")`;
      imgEl.setAttribute('data-image-url', updates.content.mobileImageUrl as string);
      imgEl.style.display = '';
    } else {
      // Remove mobile image
      if (imgEl) {
        imgEl.style.display = 'none';
      }
      // Remove the mobile-hiding style for desktop image
      if (sectionId) {
        const styleEl = document.getElementById(`mobile-image-style-${sectionId}`);
        if (styleEl) styleEl.remove();
      }
    }
  }
  
  // Handle image updates in img mode
  if (currentImageMode === 'img') {
    if (updates.content?.imageUrl !== undefined) {
      const desktopImg = el.querySelector('img[data-bg-desktop]') as HTMLImageElement;
      if (desktopImg && updates.content.imageUrl) {
        desktopImg.src = updates.content.imageUrl as string;
        desktopImg.setAttribute('data-image-url', updates.content.imageUrl as string);
      }
    }
    if (updates.content?.mobileImageUrl !== undefined) {
      const mobileImg = el.querySelector('img[data-bg-mobile]') as HTMLImageElement;
      if (mobileImg && updates.content.mobileImageUrl) {
        mobileImg.src = updates.content.mobileImageUrl as string;
        mobileImg.setAttribute('data-image-url', updates.content.mobileImageUrl as string);
      }
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

