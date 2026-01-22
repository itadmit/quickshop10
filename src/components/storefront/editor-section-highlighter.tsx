'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Editor Section Highlighter
 * 
 * ONLY loaded in preview mode (editor iframe).
 * Adds:
 * - Scroll to section on command from editor
 * - Hover outline on sections
 * - Click to select section
 * - LIVE content updates from editor
image.png * 
 * PERFORMANCE: Zero overhead in production (never loaded)
 */

export function EditorSectionHighlighter() {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Find all sections with data-section-id
  const getSectionElements = useCallback(() => {
    return document.querySelectorAll('[data-section-id]');
  }, []);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSelectedSection(sectionId);
    }
  }, []);

  // Handle messages from editor
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SCROLL_TO_SECTION') {
        scrollToSection(event.data.sectionId);
      }
      if (event.data?.type === 'HIGHLIGHT_SECTION') {
        setSelectedSection(event.data.sectionId);
      }
      if (event.data?.type === 'THEME_SETTINGS_UPDATE') {
        // Handle footer live updates directly in DOM
        const { settings } = event.data;
        const footer = document.querySelector('[data-footer]') as HTMLElement;
        
        if (footer) {
          // Update colors
          if (settings.footerBgColor !== undefined) {
            footer.style.backgroundColor = settings.footerBgColor;
          }
          if (settings.footerTextColor !== undefined) {
            footer.style.color = settings.footerTextColor;
          }
          
          // Toggle visibility of footer elements
          const logoEl = footer.querySelector('[data-footer-logo]') as HTMLElement;
          if (logoEl && settings.footerShowLogo !== undefined) {
            logoEl.style.display = settings.footerShowLogo ? '' : 'none';
          }
          
          const categoriesEl = footer.querySelector('[data-footer-categories]') as HTMLElement;
          if (categoriesEl && settings.footerShowCategories !== undefined) {
            categoriesEl.style.display = settings.footerShowCategories ? '' : 'none';
          }
          
          const menuEl = footer.querySelector('[data-footer-menu]') as HTMLElement;
          if (menuEl && settings.footerShowMenu !== undefined) {
            menuEl.style.display = settings.footerShowMenu ? '' : 'none';
          }
          
          const newsletterEl = footer.querySelector('[data-footer-newsletter]') as HTMLElement;
          if (newsletterEl && settings.footerShowNewsletter !== undefined) {
            newsletterEl.style.display = settings.footerShowNewsletter ? '' : 'none';
          }
          
          const socialEl = footer.querySelector('[data-footer-social]') as HTMLElement;
          if (socialEl && settings.footerShowSocial !== undefined) {
            socialEl.style.display = settings.footerShowSocial ? '' : 'none';
          }
          
          const paymentsEl = footer.querySelector('[data-footer-payments]') as HTMLElement;
          if (paymentsEl && settings.footerShowPayments !== undefined) {
            paymentsEl.style.display = settings.footerShowPayments ? '' : 'none';
          }
          
          // Update newsletter text
          const newsletterTitleEl = footer.querySelector('[data-footer-newsletter-title]') as HTMLElement;
          if (newsletterTitleEl && settings.footerNewsletterTitle !== undefined) {
            newsletterTitleEl.textContent = settings.footerNewsletterTitle;
          }
          
          const newsletterSubtitleEl = footer.querySelector('[data-footer-newsletter-subtitle]') as HTMLElement;
          if (newsletterSubtitleEl && settings.footerNewsletterSubtitle !== undefined) {
            newsletterSubtitleEl.textContent = settings.footerNewsletterSubtitle;
          }
          
          // Update copyright
          const copyrightEl = footer.querySelector('[data-footer-copyright]') as HTMLElement;
          if (copyrightEl && settings.footerCopyright !== undefined) {
            copyrightEl.textContent = settings.footerCopyright;
          }
        }
        
        // Also handled by PreviewSettingsProvider for header settings
      }
      if (event.data?.type === 'SECTION_CONTENT_UPDATE') {
        const { sectionId, updates } = event.data;
        const element = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (!element) {
          // List all section IDs in DOM for debugging
          const allSections = document.querySelectorAll('[data-section-id]');
          return;
        }

        // =====================================================
        // CLEANUP OLD PLACEHOLDER STRUCTURE
        // Fix old placeholders that have hardcoded bg classes
        // =====================================================
        const bgDesktopEl = element.querySelector('[data-bg-desktop]') as HTMLElement;
        if (bgDesktopEl) {
          // Remove hardcoded bg-gray classes
          bgDesktopEl.classList.remove('bg-gray-200', 'bg-gray-100', 'bg-gray-300', 'bg-gray-400');
        }
        
        // Find or create data-overlay element
        const existingOverlay = element.querySelector('[data-overlay]') as HTMLElement;
        if (!existingOverlay) {
          // Check for old overlay with bg-black/30 class
          const oldOverlay = element.querySelector('.bg-black\\/30, [class*="bg-black/"]') as HTMLElement;
          if (oldOverlay) {
            oldOverlay.setAttribute('data-overlay', '');
            oldOverlay.classList.remove('bg-black/30', 'bg-black/50', 'bg-black/40');
            oldOverlay.style.backgroundColor = 'rgba(0,0,0,0.3)';
          }
        }

        // =====================================================
        // BASIC TITLE/SUBTITLE UPDATES
        // =====================================================
          if (updates.title !== undefined) {
            const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
            if (titleEl) {
              titleEl.textContent = updates.title;
            // Support both hidden class and style.display approaches
            titleEl.style.display = updates.title ? '' : 'none';
            titleEl.classList.toggle('hidden', !updates.title);
          }
        }
          if (updates.subtitle !== undefined) {
            const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
            if (subtitleEl) {
              subtitleEl.textContent = updates.subtitle;
            // Support both hidden class and style.display approaches
            subtitleEl.style.display = updates.subtitle ? '' : 'none';
            subtitleEl.classList.toggle('hidden', !updates.subtitle);
          }
        }
          if (updates.content?.buttonText !== undefined) {
            const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
            if (btnEl) {
              btnEl.textContent = updates.content.buttonText;
              // Hide button if no text
              btnEl.style.display = updates.content.buttonText ? '' : 'none';
              btnEl.classList.toggle('hidden', !updates.content.buttonText);
            }
          }
          
        // =====================================================
        // HERO PREMIUM LIVE UPDATES
        // =====================================================
        if (updates.content?.eyebrow !== undefined) {
          const el = element.querySelector('[data-content-eyebrow]') as HTMLElement;
          if (el) {
            el.textContent = updates.content.eyebrow;
            el.style.display = updates.content.eyebrow ? '' : 'none';
          }
        }
        if (updates.content?.headline !== undefined) {
          const el = element.querySelector('[data-content-headline]') as HTMLElement;
          if (el) el.textContent = updates.content.headline;
        }
        if (updates.content?.headlineAccent !== undefined) {
          const el = element.querySelector('[data-content-headline-accent]') as HTMLElement;
          if (el) el.textContent = updates.content.headlineAccent;
        }
        if (updates.content?.description !== undefined) {
          const el = element.querySelector('[data-content-description]') as HTMLElement;
          if (el) {
            el.textContent = updates.content.description;
            el.style.display = updates.content.description ? '' : 'none';
          }
        }
        if (updates.content?.primaryButtonText !== undefined) {
          const el = element.querySelector('[data-content-primary-btn]') as HTMLElement;
          if (el) el.textContent = updates.content.primaryButtonText;
        }
        if (updates.content?.secondaryButtonText !== undefined) {
          const el = element.querySelector('[data-content-secondary-btn]') as HTMLElement;
          if (el) el.textContent = updates.content.secondaryButtonText;
        }
        
        // =====================================================
        // QUOTE BANNER LIVE UPDATES
        // =====================================================
        if (updates.content?.quote !== undefined) {
          const el = element.querySelector('[data-section-quote]') as HTMLElement;
          if (el) el.textContent = `"${updates.content.quote}"`;
        }
        if (updates.content?.attribution !== undefined) {
          const el = element.querySelector('[data-section-attribution]') as HTMLElement;
          if (el) {
            el.textContent = updates.content.attribution;
            el.style.display = updates.content.attribution ? '' : 'none';
          }
        }
        
        // =====================================================
        // TEXT BLOCK LIVE UPDATES
        // =====================================================
        if (updates.content?.text !== undefined) {
          const el = element.querySelector('[data-content-text]') as HTMLElement;
          if (el) {
            // Use innerHTML for rich text content
            el.innerHTML = updates.content.text || '';
          }
        }
        
        // =====================================================
        // NEWSLETTER LIVE UPDATES
        // =====================================================
        if (updates.content?.placeholder !== undefined) {
          const el = element.querySelector('[data-content-placeholder]') as HTMLInputElement;
          if (el) el.placeholder = updates.content.placeholder;
        }
        
        // =====================================================
        // IMAGE UPDATES (for image_text and similar sections)
        // =====================================================
        if (updates.content?.imageUrl !== undefined) {
          // Regular image element (image_text section)
          const imgEl = element.querySelector('[data-content-image]') as HTMLImageElement;
          if (imgEl) {
            imgEl.src = updates.content.imageUrl || '';
            imgEl.classList.toggle('hidden', !updates.content.imageUrl);
            // Show/hide placeholder
            const placeholder = element.querySelector('[data-image-placeholder]') as HTMLElement;
            if (placeholder) {
              placeholder.classList.toggle('hidden', !!updates.content.imageUrl);
            }
          }
          // Desktop background image
          const bgDesktop = element.querySelector('[data-bg-desktop]') as HTMLElement;
          if (bgDesktop) {
            bgDesktop.style.backgroundImage = updates.content.imageUrl 
              ? `url("${updates.content.imageUrl}")` 
              : 'none';
          }
          // Hide fallback if we have media
          const fallback = element.querySelector('[data-bg-fallback]') as HTMLElement;
          if (fallback) {
            fallback.style.display = updates.content.imageUrl ? 'none' : 'block';
          }
          
          // Update hasImage attribute and background color for hero sections
          const hasImage = !!(updates.content.imageUrl || updates.content.mobileImageUrl);
          (element as HTMLElement).dataset.hasImage = hasImage ? 'true' : 'false';
          if (hasImage) {
            (element as HTMLElement).style.backgroundColor = '';
          } else if (updates.settings?.backgroundColor) {
            (element as HTMLElement).style.backgroundColor = updates.settings.backgroundColor as string;
          }
        }
        
        // Mobile image updates
        if (updates.content?.mobileImageUrl !== undefined) {
          const bgMobile = element.querySelector('[data-bg-mobile]') as HTMLElement;
          if (bgMobile) {
            bgMobile.style.backgroundImage = updates.content.mobileImageUrl 
              ? `url("${updates.content.mobileImageUrl}")` 
              : 'none';
          }
          
          // Update hasImage attribute and background color
          const hasImage = !!(updates.content.imageUrl || updates.content.mobileImageUrl);
          (element as HTMLElement).dataset.hasImage = hasImage ? 'true' : 'false';
          if (hasImage) {
            (element as HTMLElement).style.backgroundColor = '';
          } else if (updates.settings?.backgroundColor) {
            (element as HTMLElement).style.backgroundColor = updates.settings.backgroundColor as string;
          }
        }
        
        // =====================================================
        // BUTTON LINK UPDATES
        // =====================================================
        if (updates.content?.buttonLink !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLAnchorElement;
          if (btnEl) {
            btnEl.href = updates.content.buttonLink || '#';
            // Hide button if no text (buttonText is more important than buttonLink)
            const hasText = btnEl.textContent && btnEl.textContent.trim().length > 0;
            btnEl.style.display = hasText ? '' : 'none';
            btnEl.classList.toggle('hidden', !hasText);
          }
        }
        
        // =====================================================
        // VIDEO URL UPDATES
        // =====================================================
        if (updates.content?.videoUrl !== undefined) {
          const videoDesktop = element.querySelector('[data-video-desktop]') as HTMLVideoElement;
          if (videoDesktop) {
            videoDesktop.src = updates.content.videoUrl || '';
            if (updates.content.videoUrl) {
              videoDesktop.load();
              videoDesktop.play().catch(() => {});
            }
          }
          // Also update mobile video if no specific mobile video
          const videoMobile = element.querySelector('[data-video-mobile]') as HTMLVideoElement;
          if (videoMobile && !updates.content.mobileVideoUrl) {
            videoMobile.src = updates.content.videoUrl || '';
            if (updates.content.videoUrl) {
              videoMobile.load();
              videoMobile.play().catch(() => {});
            }
          }
          // Hide fallback if we have media
          const fallback = element.querySelector('[data-bg-fallback]') as HTMLElement;
          if (fallback) {
            fallback.style.display = updates.content.videoUrl ? 'none' : 'block';
          }
        }
        if (updates.content?.mobileVideoUrl !== undefined) {
          const videoMobile = element.querySelector('[data-video-mobile]') as HTMLVideoElement;
          if (videoMobile) {
            const desktopSrc = (element.querySelector('[data-video-desktop]') as HTMLVideoElement)?.src || '';
            videoMobile.src = updates.content.mobileVideoUrl || desktopSrc;
            if (updates.content.mobileVideoUrl || desktopSrc) {
              videoMobile.load();
              videoMobile.play().catch(() => {});
            }
          }
        }
        
        // =====================================================
        // MEDIA TYPE SWITCHING (image <-> video)
        // =====================================================
        if (updates.content?.mediaType !== undefined) {
          const isVideo = updates.content.mediaType === 'video';
          // Update data attribute
          (element as HTMLElement).dataset.mediaType = updates.content.mediaType;
          
          // Show/hide image backgrounds
          const bgDesktop = element.querySelector('[data-bg-desktop]') as HTMLElement;
          const bgMobile = element.querySelector('[data-bg-mobile]') as HTMLElement;
          if (bgDesktop) bgDesktop.classList.toggle('hidden', isVideo);
          if (bgMobile) bgMobile.classList.toggle('hidden', isVideo);
          
          // Show/hide video backgrounds
          const videoDesktop = element.querySelector('[data-video-desktop]') as HTMLElement;
          const videoMobile = element.querySelector('[data-video-mobile]') as HTMLElement;
          if (videoDesktop) videoDesktop.classList.toggle('hidden', !isVideo);
          if (videoMobile) videoMobile.classList.toggle('hidden', !isVideo);
          
          // Play/pause videos based on type
          if (isVideo) {
            (videoDesktop as HTMLVideoElement)?.play().catch(() => {});
            (videoMobile as HTMLVideoElement)?.play().catch(() => {});
          } else {
            (videoDesktop as HTMLVideoElement)?.pause();
            (videoMobile as HTMLVideoElement)?.pause();
          }
        }
        
        // =====================================================
        // SETTINGS UPDATES - Colors, heights, etc.
        // =====================================================
        
        // Background color (only if no image for hero sections)
        if (updates.settings?.backgroundColor !== undefined) {
          const sectionEl = element as HTMLElement;
          const hasImage = sectionEl.dataset.hasImage === 'true';
          
          // Apply backgroundColor to section
          sectionEl.style.backgroundColor = updates.settings.backgroundColor as string;
          
          // Also hide/show the background div that might have bg-gray-200
          const bgDesktop = element.querySelector('[data-bg-desktop]') as HTMLElement;
          if (bgDesktop) {
            // Remove the gray background class and make it transparent when no image
            bgDesktop.classList.remove('bg-gray-200', 'bg-gray-100', 'bg-gray-300');
            if (!hasImage) {
              bgDesktop.style.backgroundColor = 'transparent';
            }
          }
        }
        if (updates.settings?.sectionBackground !== undefined) {
          (element as HTMLElement).style.backgroundColor = updates.settings.sectionBackground as string;
        }
        
        // Text color
        if (updates.settings?.textColor !== undefined) {
          const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
          const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
          if (titleEl) titleEl.style.color = updates.settings.textColor as string;
          if (subtitleEl) subtitleEl.style.color = updates.settings.textColor as string;
        }
        
        // Button colors (support both buttonColor and buttonBackground)
        if (updates.settings?.buttonColor !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            btnEl.style.backgroundColor = updates.settings.buttonColor as string;
            btnEl.style.borderColor = updates.settings.buttonColor as string;
          }
        }
        if (updates.settings?.buttonBackground !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            btnEl.style.backgroundColor = updates.settings.buttonBackground as string;
            btnEl.style.borderColor = updates.settings.buttonBackground as string;
          }
        }
        if (updates.settings?.buttonTextColor !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) btnEl.style.color = updates.settings.buttonTextColor as string;
        }
        
        // Container type (container vs full width)
        if (updates.settings?.containerType !== undefined) {
          // Find the content container inside the section
          const contentContainer = element.querySelector('[data-content-container]') as HTMLElement 
            || element.querySelector('.relative.z-10') as HTMLElement;
          if (contentContainer) {
            if (updates.settings.containerType === 'full') {
              // Remove container classes, add w-full
              contentContainer.classList.remove('container', 'mx-auto');
              contentContainer.classList.add('w-full');
              // Detect current text alignment from classes
              let textAlign = 'center';
              if (contentContainer.classList.contains('text-right') || contentContainer.classList.contains('items-end')) {
                textAlign = 'right';
              } else if (contentContainer.classList.contains('text-left') || contentContainer.classList.contains('items-start')) {
                textAlign = 'left';
              }
              // Also check if textAlign is in updates
              if (updates.settings.textAlign) {
                textAlign = updates.settings.textAlign as string;
              }
              // Apply 20px padding from the correct side
              if (textAlign === 'right') {
                contentContainer.style.paddingRight = '20px';
                contentContainer.style.paddingLeft = '24px';
              } else if (textAlign === 'left') {
                contentContainer.style.paddingLeft = '20px';
                contentContainer.style.paddingRight = '24px';
              } else {
                contentContainer.style.paddingLeft = '20px';
                contentContainer.style.paddingRight = '20px';
              }
            } else {
              // Add container classes and remove w-full and custom padding
              contentContainer.classList.remove('w-full');
              contentContainer.classList.add('container', 'mx-auto');
              contentContainer.style.paddingLeft = '';
              contentContainer.style.paddingRight = '';
            }
          }
        }
        
        // Custom class
        if (updates.settings?.customClass !== undefined) {
          const el = element as HTMLElement;
          // Get the previous custom class stored in data attribute
          const prevCustomClass = el.dataset.customClass || '';
          // Remove previous custom class if exists
          if (prevCustomClass) {
            prevCustomClass.split(' ').forEach(cls => {
              if (cls.trim()) el.classList.remove(cls.trim());
            });
          }
          // Add new custom class
          const newCustomClass = (updates.settings.customClass as string) || '';
          if (newCustomClass) {
            newCustomClass.split(' ').forEach(cls => {
              if (cls.trim()) el.classList.add(cls.trim());
            });
          }
          // Store the new custom class for future reference
          el.dataset.customClass = newCustomClass;
        }
        
        // Custom ID
        if (updates.settings?.customId !== undefined) {
          (element as HTMLElement).id = updates.settings.customId as string;
        }
        
        // Custom CSS
        if (updates.settings?.customCss !== undefined) {
          (element as HTMLElement).setAttribute('style', (element as HTMLElement).getAttribute('style') + '; ' + updates.settings.customCss);
        }
        
        // Text alignment for section content
        if (updates.settings?.textAlign !== undefined) {
          const contentContainer = element.querySelector('[data-content-container]') as HTMLElement 
            || element.querySelector('.relative.z-10') as HTMLElement;
          if (contentContainer) {
            // Remove all alignment classes
            contentContainer.classList.remove('items-start', 'items-center', 'items-end', 'text-left', 'text-center', 'text-right');
            // Add new alignment
            const align = updates.settings.textAlign as string;
            if (align === 'left') {
              contentContainer.classList.add('items-start', 'text-left');
            } else if (align === 'right') {
              contentContainer.classList.add('items-end', 'text-right');
            } else {
              contentContainer.classList.add('items-center', 'text-center');
            }
            
            // If full width, update padding based on alignment
            // Check if container has 'container' class or w-full to determine type
            const isFullWidth = contentContainer.classList.contains('w-full') || !contentContainer.classList.contains('container');
            if (isFullWidth) {
              if (align === 'right') {
                contentContainer.style.paddingRight = '20px';
                contentContainer.style.paddingLeft = '24px';
              } else if (align === 'left') {
                contentContainer.style.paddingLeft = '20px';
                contentContainer.style.paddingRight = '24px';
              } else {
                contentContainer.style.paddingLeft = '20px';
                contentContainer.style.paddingRight = '20px';
              }
            }
          }
        }
        
        // Text position (vertical alignment)
        if (updates.settings?.textPosition !== undefined) {
          const contentContainer = element.querySelector('[data-content-container]') as HTMLElement 
            || element.querySelector('.relative.z-10') as HTMLElement;
          if (contentContainer) {
            // Remove all position classes
            contentContainer.classList.remove('justify-start', 'justify-center', 'justify-end', 'pt-20', 'pb-20');
            // Add new position
            const position = updates.settings.textPosition as string;
            if (position === 'top') {
              contentContainer.classList.add('justify-start', 'pt-20');
            } else if (position === 'bottom') {
              contentContainer.classList.add('justify-end', 'pb-20');
            } else {
              contentContainer.classList.add('justify-center');
            }
          }
        }
        
        // Margin top/bottom (spacing for entire section)
        if (updates.settings?.paddingTop !== undefined) {
          (element as HTMLElement).style.marginTop = `${updates.settings.paddingTop}px`;
        }
        if (updates.settings?.paddingBottom !== undefined) {
          (element as HTMLElement).style.marginBottom = `${updates.settings.paddingBottom}px`;
        }
        
        // Accent color (for series grid, hero premium, etc.)
        if (updates.settings?.accentColor !== undefined) {
          const accentEls = element.querySelectorAll('[data-accent-color]');
          accentEls.forEach((el) => {
            (el as HTMLElement).style.color = updates.settings.accentColor as string;
          });
          // Also update accent-colored backgrounds (underlines, etc.)
          const accentBgEls = element.querySelectorAll('[data-accent-color-bg]');
          accentBgEls.forEach((el) => {
            (el as HTMLElement).style.backgroundColor = updates.settings.accentColor as string;
          });
        }
        
        // Card background (for series grid, featured items)
        if (updates.settings?.cardBackground !== undefined) {
          const cards = element.querySelectorAll('[data-item-id]');
          cards.forEach((card) => {
            (card as HTMLElement).style.backgroundColor = updates.settings.cardBackground as string;
          });
        }
        
        // Button text for cards (series_grid, featured_items)
        if (updates.settings?.buttonText !== undefined) {
          const btnEls = element.querySelectorAll('[data-card-button]');
          const btnText = updates.settings.buttonText as string;
          btnEls.forEach((btnEl) => {
            // For link buttons, only update text content (keep the arrow icon)
            const textNode = Array.from(btnEl.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) {
              textNode.textContent = btnText;
            } else if (btnEl.firstChild?.nodeType === Node.TEXT_NODE) {
              btnEl.firstChild.textContent = btnText;
            }
            // Hide/show button based on whether text is empty
            (btnEl as HTMLElement).style.display = btnText ? '' : 'none';
          });
        }
        
        // Section background (series_grid, etc.)
        if (updates.settings?.sectionBackground !== undefined) {
          (element as HTMLElement).style.backgroundColor = updates.settings.sectionBackground as string;
        }
        
        // Columns settings - requires page refresh for proper grid update
        if (updates.settings?.columns !== undefined || updates.settings?.mobileColumns !== undefined) {
          const grid = element.querySelector('[data-items-grid]') as HTMLElement;
          if (grid) {
            const cols = (updates.settings?.columns as number) || 3;
            const mobileCols = (updates.settings?.mobileColumns as number) || 1;
            // Remove existing grid classes
            grid.className = grid.className.replace(/grid-cols-\d+/g, '').replace(/md:grid-cols-\d+/g, '').replace(/lg:grid-cols-\d+/g, '').trim();
            // Add new grid classes
            grid.classList.add(`grid-cols-${mobileCols}`, `md:grid-cols-${cols}`, 'grid', 'gap-6');
          }
        }
        
        // Image aspect ratio for series_grid
        if (updates.settings?.imageAspectRatio !== undefined) {
          const imgContainers = element.querySelectorAll('[data-image-container]');
          const aspectRatio = updates.settings.imageAspectRatio as string;
          imgContainers.forEach((container) => {
            const el = container as HTMLElement;
            // Remove existing aspect classes
            el.classList.remove('aspect-square', 'aspect-[3/4]', 'aspect-video');
            // Add new aspect class or use min-height
            switch (aspectRatio) {
              case 'square': 
                el.classList.add('aspect-square');
                el.style.minHeight = '';
                break;
              case 'portrait': 
                el.classList.add('aspect-[3/4]');
                el.style.minHeight = '';
                break;
              case 'landscape': 
                el.classList.add('aspect-video');
                el.style.minHeight = '';
                break;
              default: // 'auto'
                el.style.minHeight = (updates.settings?.minImageHeight as string) || '200px';
            }
            // Update inner bg div too
            const bgDiv = el.querySelector('[data-item-bg]') as HTMLElement;
            if (bgDiv) {
              switch (aspectRatio) {
                case 'square':
                case 'portrait':
                case 'landscape':
                  bgDiv.style.minHeight = '';
                  break;
                default:
                  bgDiv.style.minHeight = (updates.settings?.minImageHeight as string) || '200px';
              }
            }
          });
        }
        
        // Style change (cards/overlay) - rebuild DOM for series_grid
        if (updates.settings?.style !== undefined) {
          const sectionName = (element as HTMLElement).dataset.sectionName;
          if (sectionName === 'גריד סדרות') {
            const newStyle = updates.settings.style as string;
            const grid = element.querySelector('[data-items-grid]');
            if (grid) {
              const existingItems = grid.querySelectorAll('[data-item-id]');
              const roundedClass = (element as HTMLElement).dataset.roundedCorners !== 'false' ? 'rounded-2xl' : 'rounded-none';
              
              existingItems.forEach((item) => {
                const itemEl = item as HTMLElement;
                const itemId = itemEl.dataset.itemId;
                const titleEl = itemEl.querySelector('[data-item-title]');
                const descEl = itemEl.querySelector('[data-item-description]');
                const bgEl = itemEl.querySelector('[data-item-bg]') as HTMLElement;
                const bgImage = bgEl?.style.backgroundImage || '';
                const title = titleEl?.textContent || '';
                const desc = descEl?.textContent || '';
                
                if (newStyle === 'overlay') {
                  // Convert to overlay style
                  itemEl.className = `group relative ${roundedClass} overflow-hidden`;
                  itemEl.style.height = '320px';
                  itemEl.style.background = '';
                  itemEl.innerHTML = `
                    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="${bgImage ? `background-image: ${bgImage}` : 'background: #d1d5db'}" data-item-bg></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div class="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <h3 class="text-xl font-bold mb-2" data-item-title>${title}</h3>
                      ${desc ? `<p class="text-sm opacity-90 mb-4" data-item-description>${desc}</p>` : ''}
                    </div>
                  `;
                } else {
                  // Convert to cards style
                  const cardBg = (element as HTMLElement).dataset.cardBackground || '#f9f7f4';
                  const minHeight = (element as HTMLElement).dataset.minImageHeight || '200px';
                  itemEl.className = `group ${roundedClass} overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300`;
                  itemEl.style.height = '';
                  itemEl.style.background = cardBg;
                  itemEl.innerHTML = `
                    <div class="overflow-hidden" style="min-height: ${minHeight}" data-image-container>
                      <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="${bgImage ? `background-image: ${bgImage};` : 'background: #d1d5db;'} min-height: ${minHeight}" data-item-bg></div>
                    </div>
                    <div class="p-5">
                      <h3 class="text-lg font-bold mt-1 mb-2" data-item-title>${title}</h3>
                      ${desc ? `<p class="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3" data-item-description>${desc}</p>` : ''}
                    </div>
                  `;
                }
              });
            }
            (element as HTMLElement).dataset.seriesStyle = newStyle;
          }
        }
        
        // Rounded corners for series_grid
        if (updates.settings?.roundedCorners !== undefined) {
          const cards = element.querySelectorAll('[data-item-id]');
          const isRounded = updates.settings.roundedCorners as boolean;
          cards.forEach((card) => {
            const el = card as HTMLElement;
            el.classList.remove('rounded-2xl', 'rounded-none');
            el.classList.add(isRounded ? 'rounded-2xl' : 'rounded-none');
          });
        }
        
        // Overlay opacity
        if (updates.settings?.overlay !== undefined) {
          let overlayEl = element.querySelector('[data-overlay]') as HTMLElement;
          
          // If no data-overlay, try to find overlay by class pattern (bg-black/XX)
          if (!overlayEl) {
            overlayEl = element.querySelector('.bg-black\\/30, .bg-black\\/50, [class*="bg-black"]') as HTMLElement;
          }
          
          // Also check for nested overlay in the absolute container
          if (!overlayEl) {
            const absoluteContainer = element.querySelector('.absolute.inset-0');
            if (absoluteContainer) {
              overlayEl = absoluteContainer.querySelector('.absolute.inset-0:last-child') as HTMLElement;
            }
          }
          
          if (overlayEl) {
            const overlayValue = updates.settings.overlay as number;
            // Ensure value is between 0 and 1
            const clampedValue = Math.max(0, Math.min(1, overlayValue));
            // Remove any bg-black classes that might override our style
            overlayEl.className = overlayEl.className.replace(/bg-black\/\d+/g, '').trim();
            overlayEl.style.backgroundColor = `rgba(0,0,0,${clampedValue})`;
          } else {
          }
        }
        
        // Height
        if (updates.settings?.height !== undefined) {
          const container = element.querySelector('[data-content-container]') as HTMLElement;
          if (container) container.style.height = updates.settings.height as string;
        }
        
        // Min image height (series grid, etc.)
        if (updates.settings?.minImageHeight !== undefined) {
          const imgContainers = element.querySelectorAll('[data-item-id] > div:first-child');
          imgContainers.forEach((container) => {
            (container as HTMLElement).style.minHeight = updates.settings.minImageHeight as string;
          });
        }
        
        // =====================================================
        // IMAGE_TEXT SECTION - Image Position & Width
        // =====================================================
        if (updates.settings?.imagePosition !== undefined) {
          const container = element.querySelector('[data-image-text-container]') as HTMLElement;
          if (container) {
            const isLeft = updates.settings.imagePosition === 'left';
            // For RTL: 'right' = flex-row, 'left' = flex-row-reverse
            container.style.flexDirection = isLeft ? 'row-reverse' : 'row';
            // Apply on desktop only (md and up)
            if (window.innerWidth >= 768) {
              container.style.flexDirection = isLeft ? 'row-reverse' : 'row';
            }
          }
        }
        
        if (updates.settings?.imageWidth !== undefined) {
          const imageContainer = element.querySelector('[data-image-container]') as HTMLElement;
          const textContainer = element.querySelector('[data-text-container]') as HTMLElement;
          if (imageContainer && textContainer) {
            const width = updates.settings.imageWidth as string;
            imageContainer.style.flexBasis = width;
            imageContainer.style.width = width; // Also set width for better cross-browser support
            textContainer.style.flexBasis = `calc(100% - ${width})`;
            textContainer.style.width = `calc(100% - ${width})`;
          }
        }
        
        // =====================================================
        // TYPOGRAPHY SETTINGS (for image_text, text_block, etc.)
        // =====================================================
        
        // Title styling
        if (updates.settings?.titleColor !== undefined) {
          const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
          if (titleEl) {
            titleEl.style.color = updates.settings.titleColor as string;
          }
        }
        
        if (updates.settings?.titleSize !== undefined) {
          const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
          if (titleEl) {
            // Remove existing size classes and add new one
            titleEl.classList.remove('text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 
              'md:text-2xl', 'md:text-3xl', 'md:text-4xl', 'md:text-5xl');
            const sizeMap: Record<string, string[]> = {
              'sm': ['text-xl', 'md:text-2xl'],
              'md': ['text-2xl', 'md:text-3xl'],
              'lg': ['text-3xl', 'md:text-4xl'],
              'xl': ['text-4xl', 'md:text-5xl'],
            };
            const classes = sizeMap[updates.settings.titleSize as string] || sizeMap['lg'];
            titleEl.classList.add(...classes);
          }
        }
        
        if (updates.settings?.titleWeight !== undefined) {
          const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
          if (titleEl) {
            titleEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold');
            titleEl.classList.add(`font-${updates.settings.titleWeight}`);
          }
        }
        
        // Subtitle styling
        if (updates.settings?.subtitleColor !== undefined) {
          const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
          if (subtitleEl) {
            subtitleEl.style.color = updates.settings.subtitleColor as string;
          }
        }
        
        if (updates.settings?.subtitleSize !== undefined) {
          const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
          if (subtitleEl) {
            subtitleEl.classList.remove('text-sm', 'text-base', 'text-lg');
            const sizeMap: Record<string, string> = { 'sm': 'text-sm', 'md': 'text-base', 'lg': 'text-lg' };
            subtitleEl.classList.add(sizeMap[updates.settings.subtitleSize as string] || 'text-lg');
          }
        }
        
        if (updates.settings?.subtitleWeight !== undefined) {
          const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
          if (subtitleEl) {
            subtitleEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold');
            subtitleEl.classList.add(`font-${updates.settings.subtitleWeight}`);
          }
        }
        
        // Content/Text styling
        if (updates.settings?.textColor !== undefined) {
          const textEl = element.querySelector('[data-content-text]') as HTMLElement;
          if (textEl) {
            textEl.style.color = updates.settings.textColor as string;
          }
        }
        
        if (updates.settings?.textSize !== undefined) {
          const textEl = element.querySelector('[data-content-text]') as HTMLElement;
          if (textEl) {
            textEl.classList.remove('prose-sm', 'prose', 'prose-lg');
            const sizeMap: Record<string, string> = { 'sm': 'prose-sm', 'md': 'prose', 'lg': 'prose-lg' };
            textEl.classList.add(sizeMap[updates.settings.textSize as string] || 'prose-sm');
          }
        }
        
        // Button styling (for non-hero sections)
        if (updates.settings?.buttonTextColor !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            btnEl.style.color = updates.settings.buttonTextColor as string;
          }
        }
        
        if (updates.settings?.buttonBackgroundColor !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            btnEl.style.backgroundColor = updates.settings.buttonBackgroundColor as string;
          }
        }
        
        if (updates.settings?.buttonBorderColor !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            btnEl.style.borderColor = updates.settings.buttonBorderColor as string;
          }
        }
        
        // Overlay for image sections (image_text)
        if (updates.settings?.overlay !== undefined) {
          const overlayEl = element.querySelector('[data-overlay]') as HTMLElement;
          if (overlayEl) {
            const opacity = updates.settings.overlay as number;
            overlayEl.style.backgroundColor = `rgba(0,0,0,${opacity})`;
          }
        }
        
        // Margin top/bottom (spacing between sections)
        if (updates.settings?.marginTop !== undefined) {
          (element as HTMLElement).style.marginTop = `${updates.settings.marginTop}px`;
        }
        
        if (updates.settings?.marginBottom !== undefined) {
          (element as HTMLElement).style.marginBottom = `${updates.settings.marginBottom}px`;
        }
        
        // Card height (series grid overlay style)
        if (updates.settings?.cardHeight !== undefined) {
          const contentDivs = element.querySelectorAll('[data-item-id] .relative.p-8');
          contentDivs.forEach((div) => {
            (div as HTMLElement).style.height = updates.settings.cardHeight as string;
          });
        }
        
        // =====================================================
        // SERIES GRID / FEATURED ITEMS UPDATES
        // =====================================================
        if (updates.content?.items !== undefined) {
          console.log('[EditorHighlighter] Received items update for section:', sectionId, updates.content.items);
          
          const items = updates.content.items as Array<{
            id: string;
            title?: string;
            name?: string;
            subtitle?: string;
            description?: string;
            imageUrl?: string;
            videoUrl?: string;
            link?: string;
          }>;
          
          // Get the grid container and existing items
          const grid = element.querySelector('[data-items-grid]') as HTMLElement;
          const existingItems = element.querySelectorAll('[data-item-id]');
          const existingIds = new Set(Array.from(existingItems).map(el => (el as HTMLElement).dataset.itemId));
          
          console.log('[EditorHighlighter] Found grid:', !!grid, 'existing items count:', existingItems.length);
          
          // Remove items that no longer exist
          existingItems.forEach((itemEl) => {
            const itemId = (itemEl as HTMLElement).dataset.itemId;
            if (!items.find(item => item.id === itemId)) {
              itemEl.remove();
            }
          });
          
          items.forEach((item, index) => {
            // Try to find item by id first, then by index
            let itemEl = element.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement;
            
            // If item doesn't exist and we have a grid, create a new card
            if (!itemEl && grid && !existingIds.has(item.id)) {
              const sectionName = (element as HTMLElement).dataset.sectionName || '';
              const isSeriesGrid = sectionName === 'גריד סדרות' || element.querySelector('[data-items-grid]');
              
              if (isSeriesGrid) {
                // Create new series grid card (cards style)
                const newCard = document.createElement('div');
                newCard.className = 'group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all';
                newCard.style.backgroundColor = '#f9f7f4';
                newCard.setAttribute('data-item-id', item.id);
                newCard.innerHTML = `
                  <div style="min-height: 200px;" class="overflow-hidden">
                    <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${item.imageUrl || ''}'); min-height: 200px;" data-item-bg></div>
                  </div>
                  <div class="p-6">
                    <span class="text-xs font-bold tracking-wider uppercase" style="color: var(--template-primary); display: ${item.subtitle ? '' : 'none'};" data-item-subtitle>${item.subtitle || ''}</span>
                    <h3 class="text-xl font-bold text-gray-900 mt-1 mb-3" data-item-title>${item.title || 'סדרה חדשה'}</h3>
                    <p class="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3" style="display: ${item.description ? '' : 'none'};" data-item-description>${item.description || ''}</p>
                  </div>
                `;
                grid.appendChild(newCard);
                itemEl = newCard;
              }
            }
            
            if (!itemEl) {
              const allItems = element.querySelectorAll('[data-item-id]');
              itemEl = allItems[index] as HTMLElement;
            }
            if (itemEl) {
              console.log('[EditorHighlighter] Updating item:', item.id, 'itemEl found:', !!itemEl);
              
              if (item.title !== undefined) {
                const titleEl = itemEl.querySelector('[data-item-title], h3') as HTMLElement;
                console.log('[EditorHighlighter] Title update:', item.title, 'element found:', !!titleEl);
                if (titleEl) titleEl.textContent = item.title;
              }
              if (item.name !== undefined) {
                const nameEl = itemEl.querySelector('[data-item-name]') as HTMLElement;
                if (nameEl) nameEl.textContent = item.name;
              }
              if (item.subtitle !== undefined) {
                const subEl = itemEl.querySelector('[data-item-subtitle]') as HTMLElement;
                console.log('[EditorHighlighter] Subtitle update:', item.subtitle, 'element found:', !!subEl);
                if (subEl) {
                  subEl.textContent = item.subtitle;
                  subEl.style.display = item.subtitle ? '' : 'none';
                }
              }
              if (item.description !== undefined) {
                const descEl = itemEl.querySelector('[data-item-description]') as HTMLElement;
                console.log('[EditorHighlighter] Description update:', item.description, 'element found:', !!descEl);
                if (descEl) {
                  descEl.textContent = item.description;
                  descEl.style.display = item.description ? '' : 'none';
                  
                  // Force show description container during editing (for slide-up effect)
                  const descContainer = descEl.parentElement;
                  if (descContainer && item.description) {
                    descContainer.style.maxHeight = '160px';
                    descContainer.style.opacity = '1';
                  } else if (descContainer && !item.description) {
                    descContainer.style.maxHeight = '';
                    descContainer.style.opacity = '';
                  }
                }
              }
              // Handle video/image updates for featured_items
              if (item.videoUrl !== undefined) {
                const videoEl = itemEl.querySelector('video') as HTMLVideoElement;
                const imgEl = itemEl.querySelector('img') as HTMLImageElement;
                if (item.videoUrl) {
                  // Show video, hide image
                  if (videoEl) {
                    videoEl.src = item.videoUrl;
                    videoEl.style.display = '';
                  } else {
                    // Create video element if doesn't exist
                    const mediaContainer = itemEl.querySelector('.overflow-hidden') || itemEl.querySelector('[class*="aspect"]');
                    if (mediaContainer && !mediaContainer.querySelector('video')) {
                      const newVideo = document.createElement('video');
                      newVideo.src = item.videoUrl;
                      newVideo.autoplay = true;
                      newVideo.muted = true;
                      newVideo.loop = true;
                      newVideo.playsInline = true;
                      newVideo.className = 'w-full h-full object-cover';
                      mediaContainer.insertBefore(newVideo, mediaContainer.firstChild);
                    }
                  }
                  if (imgEl) imgEl.style.display = 'none';
                } else {
                  // Hide video, show image
                  if (videoEl) videoEl.style.display = 'none';
                  if (imgEl) imgEl.style.display = '';
                }
              }
              if (item.imageUrl !== undefined) {
                const imgContainer = itemEl.querySelector('[data-item-bg], [style*="background-image"], .bg-cover') as HTMLElement;
                if (imgContainer) {
                  imgContainer.style.backgroundImage = item.imageUrl ? `url("${item.imageUrl}")` : 'none';
                }
                const imgEl = itemEl.querySelector('img') as HTMLImageElement;
                if (imgEl) imgEl.src = item.imageUrl || '';
              }
              if (item.link !== undefined) {
                const linkEl = itemEl.closest('a') || itemEl.querySelector('a');
                if (linkEl) (linkEl as HTMLAnchorElement).href = item.link;
              }
            }
          });
        }
        
        // =====================================================
        // CATEGORY VISIBILITY UPDATES
        // =====================================================
          if (updates.content?.categoryIds !== undefined) {
            const categoryIds = updates.content.categoryIds as string[] || [];
            const categoryElements = element.querySelectorAll('[data-category-id]');
            categoryElements.forEach((catEl) => {
              const catId = (catEl as HTMLElement).dataset.categoryId;
              if (categoryIds.length === 0 || (catId && categoryIds.includes(catId))) {
                catEl.classList.remove('hidden');
              } else {
                catEl.classList.add('hidden');
              }
            });
            (element as HTMLElement).dataset.selectedCategories = categoryIds.join(',');
          }
          
        // =====================================================
        // PRODUCT TYPE AND PRODUCTS UPDATES (LIVE PREVIEW)
        // =====================================================
        // ⚡ REAL-TIME: Render selected/category products directly!
        if (updates.content?.type !== undefined || updates.content?.selectedProducts !== undefined || updates.content?.productIds !== undefined || updates.content?.categoryProducts !== undefined || updates.content?.categoryId !== undefined) {
          const productType = updates.content.type as string | undefined;
          const selectedProducts = updates.content.selectedProducts as Array<{ 
            id: string; 
            name: string; 
            slug?: string;
            price?: string | number;
            comparePrice?: string | number | null;
            imageUrl?: string | null;
            image?: string | null;
          }> | undefined;
          const categoryProducts = updates.content.categoryProducts as Array<{ 
            id: string; 
            name: string; 
            slug?: string;
            price?: string | number;
            comparePrice?: string | number | null;
            imageUrl?: string | null;
          }> | undefined;
          
          // Store current type
          if (productType !== undefined) {
            (element as HTMLElement).dataset.productType = productType;
          }
          
          const grid = element.querySelector('[data-products-grid]') as HTMLElement;
          if (!grid) return;
          
          const currentType = productType || (element as HTMLElement).dataset.productType || 'all';
          
          // ⚡ STEP 1: Always clean up preview products first!
          grid.querySelectorAll('[data-preview-product]').forEach(el => el.remove());
          
          // ⚡ STEP 2: Get ONLY original products (those with data-product-index)
          const originalProductEls = grid.querySelectorAll('[data-product-index]');
          
          // Helper function to render product cards
          const renderProductCards = (productsToRender: Array<{ 
            id: string; 
            name: string; 
            slug?: string;
            price?: string | number;
            comparePrice?: string | number | null;
            imageUrl?: string | null;
            image?: string | null;
          }>) => {
            const basePath = window.location.pathname.split('/').slice(0, 3).join('/');
            
            productsToRender.forEach((product, index) => {
              const imageUrl = product.imageUrl || (product as { image?: string }).image || '/placeholder.svg';
              const price = product.price ? Number(product.price) : 0;
              const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
              const hasDiscount = comparePrice && comparePrice > price;
              const discountPercent = hasDiscount ? Math.round((1 - price / comparePrice) * 100) : 0;
              
              const productHtml = `
                <div 
                  class="animate-slide-up group"
                  style="animation-delay: ${index * 50}ms"
                  data-preview-product
                >
                  <a href="${basePath}/product/${product.slug || product.id}" class="block">
                    <div class="relative bg-gray-50 mb-3 overflow-hidden aspect-3/4">
                      <img 
                        src="${imageUrl}" 
                        alt="${product.name}"
                        class="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      ${hasDiscount ? `
                        <div class="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full tracking-wide">
                          ${discountPercent}%-
                        </div>
                      ` : ''}
                    </div>
                    <div class="text-center space-y-2">
                      <h3 class="font-display text-sm tracking-wide text-gray-900 line-clamp-1">${product.name}</h3>
                      <div class="flex items-center justify-center gap-2">
                        ${hasDiscount ? `<span class="text-xs text-gray-400 line-through">₪${comparePrice.toFixed(2)}</span>` : ''}
                        <span class="text-sm font-medium ${hasDiscount ? 'text-green-600' : 'text-gray-900'}">₪${price.toFixed(2)}</span>
                      </div>
                    </div>
                  </a>
                </div>
              `;
              
              grid.insertAdjacentHTML('beforeend', productHtml);
            });
          };
          
          // For "specific" mode: render the selected products directly
          if (currentType === 'specific') {
            // Hide original products
            originalProductEls.forEach(el => el.classList.add('hidden'));
            
            if (selectedProducts && selectedProducts.length > 0) {
              renderProductCards(selectedProducts);
              } else {
              // No products selected - show placeholder
              const emptyHtml = `
                <div data-preview-product class="col-span-full text-center py-12 text-gray-400">
                  <p>בחר מוצרים להצגה</p>
                </div>
              `;
              grid.insertAdjacentHTML('beforeend', emptyHtml);
            }
          } 
          // For "category" mode: render category products
          else if (currentType === 'category') {
            // Hide original products
            originalProductEls.forEach(el => el.classList.add('hidden'));
            
            if (categoryProducts && categoryProducts.length > 0) {
              renderProductCards(categoryProducts);
          } else {
              // No category selected or empty - show placeholder
              const emptyHtml = `
                <div data-preview-product class="col-span-full text-center py-12 text-gray-400">
                  <p>בחר קטגוריה להצגת מוצרים</p>
                </div>
              `;
              grid.insertAdjacentHTML('beforeend', emptyHtml);
            }
          } 
          else {
            // For other modes (all, featured): show original products
            originalProductEls.forEach(el => el.classList.remove('hidden'));
          }
        }
        
        // =====================================================
        // PRODUCT LIMIT UPDATES
        // =====================================================
          if (updates.content?.limit !== undefined) {
            const limit = updates.content.limit as number;
            const productElements = element.querySelectorAll('[data-product-index]');
            productElements.forEach((prodEl) => {
              const index = parseInt((prodEl as HTMLElement).dataset.productIndex || '0', 10);
              if (index < limit) {
                prodEl.classList.remove('hidden');
              } else {
                prodEl.classList.add('hidden');
              }
            });
            (element as HTMLElement).dataset.displayLimit = String(limit);
          }
        
        // =====================================================
        // SECTION-SPECIFIC SETTINGS
        // =====================================================
        if (updates.settings?.showDescriptionAlways !== undefined) {
          (element as HTMLElement).dataset.showDescriptionAlways = String(updates.settings.showDescriptionAlways);
        }
        if (updates.settings?.buttonText !== undefined) {
          const btns = element.querySelectorAll('[data-card-button]');
          btns.forEach(btn => {
            btn.textContent = updates.settings.buttonText as string;
          });
        }
        if (updates.settings?.showGradient !== undefined) {
          const gradientOverlay = element.querySelector('[data-gradient-overlay]') as HTMLElement;
          const bottomGradient = element.querySelector('[data-gradient-bottom]') as HTMLElement;
          if (gradientOverlay) {
            gradientOverlay.style.display = updates.settings.showGradient ? '' : 'none';
          }
          if (bottomGradient) {
            bottomGradient.style.display = updates.settings.showGradient ? '' : 'none';
          }
        }
        
        // =====================================================
        // PRODUCT PAGE SECTION LIVE UPDATES
        // =====================================================
        const sectionType = (element as HTMLElement).dataset.sectionType;
        
        // Product badges visibility
        if (sectionType === 'product_badges') {
          if (updates.settings?.showDiscount !== undefined) {
            const discountBadge = element.querySelector('[data-discount-badge]') as HTMLElement;
            if (discountBadge) discountBadge.style.display = updates.settings.showDiscount ? '' : 'none';
          }
          if (updates.settings?.showPromoLabels !== undefined) {
            const promoLabels = element.querySelectorAll('[data-promo-label]');
            promoLabels.forEach(el => (el as HTMLElement).style.display = updates.settings!.showPromoLabels ? '' : 'none');
          }
          if (updates.settings?.showFeatured !== undefined) {
            const featuredBadge = element.querySelector('[data-featured-badge]') as HTMLElement;
            if (featuredBadge) featuredBadge.style.display = updates.settings.showFeatured ? '' : 'none';
          }
        }
        
        // Product title styling - LIVE UPDATES
        if (sectionType === 'product_title') {
          const h1 = element.querySelector('h1') as HTMLElement || element as HTMLElement;
          
          // Font size (direct style)
          if (updates.settings?.fontSize !== undefined) {
            const unit = updates.settings?.fontSizeUnit || 'px';
            h1.style.fontSize = `${updates.settings.fontSize}${unit}`;
          }
          
          // Font weight (direct style)
          if (updates.settings?.fontWeight !== undefined) {
            const weightMap: Record<string, string> = {
              light: '300',
              normal: '400',
              medium: '500',
              semibold: '600',
              bold: '700',
              extrabold: '800',
            };
            h1.style.fontWeight = weightMap[updates.settings.fontWeight as string] || '300';
          }
          
          // Color
          if (updates.settings?.color !== undefined) {
            h1.style.color = updates.settings.color as string;
          }
          
          // Letter spacing
          if (updates.settings?.letterSpacing !== undefined) {
            const unit = updates.settings?.letterSpacingUnit || 'px';
            h1.style.letterSpacing = `${updates.settings.letterSpacing}${unit}`;
          }
          
          // Line height
          if (updates.settings?.lineHeight !== undefined) {
            const unit = updates.settings?.lineHeightUnit || 'rem';
            h1.style.lineHeight = `${updates.settings.lineHeight}${unit}`;
          }
        }
        
        // Product price styling - LIVE UPDATES
        if (sectionType === 'product_price') {
          // Show/hide compare price
          if (updates.settings?.showComparePrice !== undefined) {
            const compareEl = element.querySelector('[data-compare-price]') as HTMLElement;
            if (compareEl) compareEl.style.display = updates.settings.showComparePrice ? '' : 'none';
          }
          
          // Main price styling
          const priceEl = element.querySelector('[data-price]') as HTMLElement;
          if (priceEl) {
            if (updates.settings?.priceFontSize !== undefined) {
              const unit = updates.settings?.priceFontSizeUnit || 'px';
              priceEl.style.fontSize = `${updates.settings.priceFontSize}${unit}`;
            }
            if (updates.settings?.priceFontWeight !== undefined) {
              const weightMap: Record<string, string> = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' };
              priceEl.style.fontWeight = weightMap[updates.settings.priceFontWeight as string] || '500';
            }
            if (updates.settings?.priceColor !== undefined) {
              priceEl.style.color = updates.settings.priceColor as string;
            }
          }
          
          // Compare price styling
          const compareEl = element.querySelector('[data-compare-price]') as HTMLElement;
          if (compareEl) {
            if (updates.settings?.comparePriceFontSize !== undefined) {
              const unit = updates.settings?.comparePriceFontSizeUnit || 'px';
              compareEl.style.fontSize = `${updates.settings.comparePriceFontSize}${unit}`;
            }
            if (updates.settings?.comparePriceFontWeight !== undefined) {
              const weightMap: Record<string, string> = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' };
              compareEl.style.fontWeight = weightMap[updates.settings.comparePriceFontWeight as string] || '400';
            }
            if (updates.settings?.comparePriceColor !== undefined) {
              compareEl.style.color = updates.settings.comparePriceColor as string;
            }
          }
        }
        
        // Product inventory display
        if (sectionType === 'product_inventory') {
          if (updates.settings?.displayStyle !== undefined) {
            (element as HTMLElement).style.display = updates.settings.displayStyle === 'hidden' ? 'none' : '';
          }
        }
        
        // Product Add to Cart - LIVE UPDATES
        if (sectionType === 'product_add_to_cart') {
          const btn = element.querySelector('button[data-add-to-cart-button]') as HTMLButtonElement;
          if (btn) {
            const isOutOfStock = btn.dataset.outOfStock === 'true';
            const isAdded = btn.textContent?.includes('✓');
            
            // Button text
            if (!isAdded) {
              if (updates.settings?.buttonText !== undefined && !isOutOfStock) {
                btn.textContent = updates.settings.buttonText as string || 'הוסף לעגלה';
              }
              if (updates.settings?.outOfStockText !== undefined && isOutOfStock) {
                btn.textContent = updates.settings.outOfStockText as string || 'אזל מהמלאי';
              }
            }
            
            // Button style (filled/outline/minimal)
            if (updates.settings?.style !== undefined) {
              const style = updates.settings.style as string;
              btn.dataset.buttonStyle = style;
              
              // Reset all style classes
              btn.classList.remove(
                'bg-black', 'bg-white', 'bg-gray-100', 'bg-gray-800', 'bg-gray-200',
                'text-white', 'text-black', 'text-gray-400',
                'border', 'border-black', 'border-gray-200',
                'hover:bg-black', 'hover:bg-gray-800', 'hover:text-white', 'hover:no-underline',
                'underline'
              );
              
              // Apply new style classes
              if (!isOutOfStock && !isAdded) {
                if (style === 'filled') {
                  btn.classList.add('bg-black', 'text-white', 'hover:bg-gray-800');
                } else if (style === 'outline') {
                  btn.classList.add('bg-white', 'text-black', 'border', 'border-black', 'hover:bg-black', 'hover:text-white');
                } else if (style === 'minimal') {
                  btn.classList.add('text-black', 'underline', 'hover:no-underline');
                }
              } else if (isOutOfStock) {
                btn.classList.add('bg-gray-100', 'text-gray-400');
                if (style === 'outline') {
                  btn.classList.add('border', 'border-gray-200');
                }
              }
            }
            
            // Full width
            if (updates.settings?.fullWidth !== undefined) {
              const fullWidth = updates.settings.fullWidth as boolean;
              btn.dataset.fullWidth = fullWidth ? 'true' : 'false';
              if (fullWidth) {
                btn.classList.add('w-full');
              } else {
                btn.classList.remove('w-full');
              }
            }
            
            // Typography
            if (updates.settings?.textFontSize !== undefined) {
              const unit = updates.settings?.textFontSizeUnit || 'px';
              btn.style.fontSize = `${updates.settings.textFontSize}${unit}`;
            }
            if (updates.settings?.textFontWeight !== undefined) {
              const weightMap: Record<string, string> = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' };
              btn.style.fontWeight = weightMap[updates.settings.textFontWeight as string] || '500';
            }
            if (updates.settings?.textColor !== undefined) {
              btn.style.color = updates.settings.textColor as string;
            }
          }
          
          // Wishlist Button - LIVE UPDATES
          const wishlistBtn = element.querySelector('button[data-wishlist-button]') as HTMLButtonElement;
          if (wishlistBtn) {
            // Show/hide wishlist button
            if (updates.settings?.showWishlist !== undefined) {
              const wishlistContainer = wishlistBtn.closest('.mt-3') as HTMLElement;
              if (wishlistContainer) {
                wishlistContainer.style.display = updates.settings.showWishlist ? '' : 'none';
              }
            }
            
            // Wishlist button style
            if (updates.settings?.wishlistStyle !== undefined) {
              const style = updates.settings.wishlistStyle as string;
              wishlistBtn.dataset.buttonStyle = style;
              
              // Reset style classes
              wishlistBtn.classList.remove(
                'bg-red-500', 'bg-gray-100', 'bg-red-50', 'bg-white',
                'text-white', 'text-gray-600', 'text-red-600',
                'border', 'border-red-200', 'border-gray-200',
                'hover:bg-red-600', 'hover:bg-gray-200', 'hover:bg-red-100', 'hover:bg-gray-50',
                'hover:text-red-500'
              );
              
              const isActive = wishlistBtn.querySelector('svg')?.getAttribute('fill') === 'currentColor';
              
              if (style === 'filled') {
                if (isActive) {
                  wishlistBtn.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600');
                } else {
                  wishlistBtn.classList.add('bg-gray-100', 'text-gray-600', 'hover:bg-gray-200', 'hover:text-red-500');
                }
              } else if (style === 'minimal') {
                if (isActive) {
                  wishlistBtn.classList.add('text-red-600');
                } else {
                  wishlistBtn.classList.add('text-gray-600', 'hover:text-red-500');
                }
              } else {
                // outline (default)
                wishlistBtn.classList.add('border');
                if (isActive) {
                  wishlistBtn.classList.add('border-red-200', 'bg-red-50', 'text-red-600', 'hover:bg-red-100');
                } else {
                  wishlistBtn.classList.add('border-gray-200', 'bg-white', 'text-gray-600', 'hover:bg-gray-50', 'hover:text-red-500');
                }
              }
            }
            
            // Wishlist full width
            if (updates.settings?.wishlistFullWidth !== undefined) {
              const fullWidth = updates.settings.wishlistFullWidth as boolean;
              wishlistBtn.dataset.fullWidth = fullWidth ? 'true' : 'false';
              if (fullWidth) {
                wishlistBtn.classList.add('w-full');
              } else {
                wishlistBtn.classList.remove('w-full');
              }
            }
            
            // Wishlist button text
            if (updates.settings?.wishlistText !== undefined || updates.settings?.wishlistActiveText !== undefined) {
              const textSpan = wishlistBtn.querySelector('span') as HTMLElement;
              if (textSpan) {
                const isActive = wishlistBtn.querySelector('svg')?.getAttribute('fill') === 'currentColor';
                if (isActive && updates.settings?.wishlistActiveText !== undefined) {
                  textSpan.textContent = updates.settings.wishlistActiveText as string || 'ברשימת המשאלות';
                } else if (!isActive && updates.settings?.wishlistText !== undefined) {
                  textSpan.textContent = updates.settings.wishlistText as string || 'הוסף לרשימת משאלות';
                }
              }
            }
          }
        }
        
        // Product short description - LIVE UPDATES
        if (sectionType === 'product_short_desc') {
          const p = element.tagName === 'P' ? element as HTMLElement : element.querySelector('p') as HTMLElement;
          if (p) {
            if (updates.settings?.fontSize !== undefined) {
              const unit = updates.settings?.fontSizeUnit || 'px';
              p.style.fontSize = `${updates.settings.fontSize}${unit}`;
            }
            if (updates.settings?.fontWeight !== undefined) {
              const weightMap: Record<string, string> = { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' };
              p.style.fontWeight = weightMap[updates.settings.fontWeight as string] || '400';
            }
            if (updates.settings?.color !== undefined) {
              p.style.color = updates.settings.color as string;
            }
          }
        }
        
        // Section visibility (isActive)
        if (updates.isActive !== undefined) {
          (element as HTMLElement).style.display = updates.isActive ? '' : 'none';
        }
      }
      
      // =====================================================
      // PRODUCT PAGE SECTIONS UPDATE - Refresh for real-time preview
      // =====================================================
      if (event.data?.type === 'PRODUCT_PAGE_SECTIONS_UPDATE') {
        // For product page, we need to trigger a refresh of the page content
        // Since the product page is SSR, we dispatch a custom event that
        // client components can listen to for live updates
        const sectionsData = event.data.sections;
        
        // Store in window for immediate access by Live* components
        (window as unknown as { __productPageSections?: unknown[] }).__productPageSections = sectionsData;
        
        // Dispatch event for any listening components
        window.dispatchEvent(new CustomEvent('product-page-sections-updated', {
          detail: { sections: sectionsData }
        }));
      }
      
      // =====================================================
      // SECTION_ADD - Inject placeholder for new section
      // =====================================================
      if (event.data?.type === 'SECTION_ADD') {
        const { sectionId, sectionType, title, subtitle, afterSectionId, content } = event.data;
        
        // Create placeholder element with all data- attributes for live updates
        const placeholder = document.createElement('section');
        placeholder.dataset.sectionId = sectionId;
        placeholder.dataset.sectionType = sectionType;
        placeholder.dataset.previewPlaceholder = 'true';
        
        // Map section types to Hebrew names
        const sectionNames: Record<string, string> = {
          hero: 'באנר ראשי',
          banner: 'באנר',
          banner_small: 'באנר קטן',
          text_block: 'בלוק טקסט',
          image_text: 'תמונה + טקסט',
          video_banner: 'באנר וידאו',
          split_banner: 'באנר מפוצל',
          categories: 'קטגוריות',
          products: 'מוצרים',
          newsletter: 'ניוזלטר',
          features: 'יתרונות',
          gallery: 'גלריה',
          faq: 'שאלות נפוצות',
          reviews: 'ביקורות',
          logos: 'לוגואים',
          contact: 'צור קשר',
          custom: 'מותאם אישית',
          series_grid: 'גריד סדרות',
          hero_premium: 'באנר פרימיום',
          hero_slider: 'סליידר הירו',
          quote_banner: 'באנר ציטוט',
          featured_items: 'פריטים מובילים',
        };
        placeholder.dataset.sectionName = sectionNames[sectionType] || sectionType;
        
        // Generate type-specific placeholder HTML
        let html = '';
        switch (sectionType) {
          case 'image_text':
            placeholder.className = 'py-12 md:py-0';
            html = `
              <div class="flex flex-col md:flex-row min-h-[400px]" data-image-text-container style="flex-direction: row;">
                <div class="w-full md:w-1/2 relative overflow-hidden" style="min-height: 300px; flex-basis: 50%; width: 50%;" data-image-container>
                  <img src="${content?.imageUrl || ''}" alt="" class="w-full h-full object-cover absolute inset-0 ${content?.imageUrl ? '' : 'hidden'}" data-content-image />
                  <div class="absolute inset-0" style="background-color: transparent;" data-overlay></div>
                  <div class="w-full h-full bg-gray-100 flex items-center justify-center ${content?.imageUrl ? 'hidden' : ''}" data-image-placeholder>
                    <svg class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="w-full md:w-1/2 flex items-center p-8 md:p-12 lg:p-16" style="flex-basis: calc(100% - 50%); width: calc(100% - 50%);" data-text-container>
                  <div class="max-w-lg mx-auto">
                    <h2 class="text-3xl md:text-4xl font-light tracking-wide mb-4 ${title ? '' : 'hidden'}" data-section-title>${title || ''}</h2>
                    <p class="text-lg mb-4 ${subtitle ? '' : 'hidden'}" style="color: #4b5563;" data-section-subtitle>${subtitle || ''}</p>
                    <div class="leading-relaxed mb-6 prose prose-sm" style="color: #4b5563;" data-content-text>${content?.text || '<p>הקלידו טקסט כאן...</p>'}</div>
                    <a href="${content?.buttonLink || '#'}" class="inline-block px-8 py-3 border transition-colors text-sm tracking-wider uppercase ${content?.buttonText ? '' : 'hidden'}" style="color: #000; background-color: transparent; border-color: #000;" data-section-button>${content?.buttonText || ''}</a>
                  </div>
                </div>
              </div>
            `;
            break;
          
          case 'text_block':
            placeholder.className = 'py-16 px-4';
            html = `
              <div class="max-w-2xl mx-auto text-center">
                <h2 class="text-3xl md:text-4xl font-light tracking-wide mb-4 ${title ? '' : 'hidden'}" data-section-title style="color: inherit;">${title || ''}</h2>
                <p class="text-lg opacity-80 mb-6 ${subtitle ? '' : 'hidden'}" data-section-subtitle style="color: inherit;">${subtitle || ''}</p>
                <div class="prose prose mx-auto mb-8" data-content-text style="color: inherit;">${content?.text || '<p>הקלידו טקסט כאן...</p>'}</div>
                <a href="${content?.buttonLink || '#'}" class="inline-block px-8 py-3 border transition-colors text-sm tracking-wider uppercase ${content?.buttonText ? '' : 'hidden'}" style="color: #000; background-color: transparent; border-color: currentColor;" data-section-button>${content?.buttonText || ''}</a>
              </div>
            `;
            break;
          
          case 'video_banner':
            const hasVideoMedia = !!(content?.videoUrl || content?.imageUrl);
            placeholder.className = 'relative overflow-hidden';
            placeholder.style.height = '80vh';
            placeholder.style.backgroundColor = hasVideoMedia ? '#000' : '#1f2937';
            placeholder.style.marginTop = '0';
            placeholder.style.marginBottom = '0';
            html = `
              <div class="absolute inset-0 flex items-center justify-center" style="background-color: rgba(0,0,0,0.2);" data-overlay data-content-container>
                <div class="max-w-2xl px-6 text-center">
                  <p class="text-xs font-normal tracking-[0.4em] uppercase mb-6 ${subtitle ? '' : 'hidden'}" style="color: rgba(255,255,255,0.8);" data-section-subtitle>${subtitle || ''}</p>
                  <h2 class="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-[0.2em] uppercase mb-8 ${title ? '' : 'hidden'}" style="color: #fff;" data-section-title>${title || ''}</h2>
                  <a href="${content?.buttonLink || '#'}" class="inline-block px-8 py-3 border transition-colors text-sm tracking-wider uppercase ${content?.buttonText ? '' : 'hidden'}" style="color: #fff; background-color: transparent; border-color: #fff;" data-section-button>${content?.buttonText || ''}</a>
                </div>
              </div>
              ${!hasVideoMedia ? `
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg class="w-20 h-20 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              ` : ''}
            `;
            break;

          case 'hero':
          case 'banner':
            const hasHeroImage = !!(content?.imageUrl || content?.mobileImageUrl);
            const heroBgColor = hasHeroImage ? 'transparent' : '#6B7280'; // Gray fallback if no image
            // Match exact styling from HeroSection component
            placeholder.className = 'relative overflow-hidden';
            placeholder.style.height = '90vh';
            placeholder.dataset.hasImage = hasHeroImage ? 'true' : 'false';
            placeholder.style.backgroundColor = hasHeroImage ? '' : heroBgColor;
            html = `
              <div class="absolute inset-0">
                <div class="absolute inset-0 bg-cover bg-center" data-bg-desktop style="background-size: cover; background-position: center; ${content?.imageUrl ? `background-image: url('${content.imageUrl}')` : 'background-image: none;'}"></div>
                <div class="absolute inset-0" data-overlay style="background-color: rgba(0,0,0,0.3);"></div>
              </div>
              <div class="relative z-10 h-full flex flex-col justify-center items-center text-center container mx-auto px-6" data-content-container>
                <h1 class="font-display text-6xl md:text-8xl lg:text-9xl text-white font-extralight tracking-[0.3em] mb-6 uppercase" data-section-title style="${title ? '' : 'display:none'}">${title || ''}</h1>
                <p class="text-white/90 text-xs md:text-sm tracking-[0.4em] uppercase mb-12" data-section-subtitle style="${subtitle ? '' : 'display:none'}">${subtitle || ''}</p>
                <a href="${content?.buttonLink || '/products'}" class="inline-block px-8 py-3 bg-white text-black uppercase tracking-wider text-sm transition-all" data-section-button style="${content?.buttonText ? '' : 'display:none'}">${content?.buttonText || ''}</a>
              </div>
              <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1">
                  <path d="M12 5v14M19 12l-7 7-7-7"/>
                </svg>
              </div>
            `;
            break;
          
          case 'newsletter':
            placeholder.className = 'py-16 bg-gray-50';
            html = `
              <div class="container mx-auto px-4 text-center">
                <h2 class="text-2xl md:text-3xl font-light tracking-wide mb-4" data-section-title>${title || 'הירשמו לניוזלטר'}</h2>
                <p class="text-gray-600 mb-6 max-w-xl mx-auto" data-section-subtitle>${subtitle || 'קבלו עדכונים על מבצעים והנחות בלעדיות'}</p>
                <div class="flex gap-2 max-w-md mx-auto">
                  <input type="email" placeholder="${content?.placeholder || 'כתובת אימייל'}" class="flex-1 px-4 py-3 border border-gray-300 rounded" data-content-placeholder />
                  <button class="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors" data-section-button>${content?.buttonText || 'הרשמה'}</button>
                </div>
              </div>
            `;
            break;
          
          case 'features':
            placeholder.className = 'py-12 px-4';
            html = `
              <div class="max-w-7xl mx-auto">
                <div class="text-center mb-10">
                  <h2 class="text-2xl md:text-3xl font-light tracking-wide mb-3 ${title ? '' : 'hidden'}" data-section-title>${title || ''}</h2>
                  <p class="text-sm md:text-base ${subtitle ? '' : 'hidden'}" style="color: #4b5563;" data-section-subtitle>${subtitle || ''}</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                  <div class="py-6 px-4 text-center md:border-l md:border-gray-100">
                    <div class="mb-4 flex justify-center"><span class="text-3xl">🚚</span></div>
                    <h3 class="font-medium mb-1" style="color: #111827;">משלוח מהיר</h3>
                    <p class="text-sm" style="color: #6b7280;">עד 3 ימי עסקים</p>
                  </div>
                  <div class="py-6 px-4 text-center md:border-l md:border-gray-100">
                    <div class="mb-4 flex justify-center"><span class="text-3xl">🔄</span></div>
                    <h3 class="font-medium mb-1" style="color: #111827;">החזרות חינם</h3>
                    <p class="text-sm" style="color: #6b7280;">עד 30 יום</p>
                  </div>
                  <div class="py-6 px-4 text-center md:border-l md:border-gray-100">
                    <div class="mb-4 flex justify-center"><span class="text-3xl">💬</span></div>
                    <h3 class="font-medium mb-1" style="color: #111827;">תמיכה 24/7</h3>
                    <p class="text-sm" style="color: #6b7280;">בכל שאלה</p>
                  </div>
                  <div class="py-6 px-4 text-center">
                    <div class="mb-4 flex justify-center"><span class="text-3xl">✨</span></div>
                    <h3 class="font-medium mb-1" style="color: #111827;">איכות מובטחת</h3>
                    <p class="text-sm" style="color: #6b7280;">100% שביעות רצון</p>
                  </div>
                </div>
              </div>
            `;
            break;
          
          case 'products':
            placeholder.className = 'py-16 bg-white';
            html = `
              <div class="container mx-auto px-4">
                <h2 class="text-2xl md:text-3xl font-light tracking-wide text-center mb-8 ${title ? '' : 'hidden'}" data-section-title>${title || 'המוצרים שלנו'}</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4" data-products-grid>
                  ${[1,2,3,4].map(() => `
                    <div class="group">
                      <div class="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
                        <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p class="text-sm text-gray-600">שם מוצר</p>
                      <p class="font-medium">₪99</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;
          
          case 'categories':
            placeholder.className = 'py-16 bg-white';
            html = `
              <div class="container mx-auto px-4">
                <h2 class="text-2xl md:text-3xl font-light tracking-wide text-center mb-8 ${title ? '' : 'hidden'}" data-section-title>${title || 'קטגוריות'}</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  ${[1,2,3,4].map(() => `
                    <div class="aspect-square bg-gray-100 rounded flex items-center justify-center">
                      <span class="text-gray-400">קטגוריה</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;
          
          case 'gallery':
            placeholder.className = 'py-16 bg-white';
            html = `
              <div class="container mx-auto px-4">
                <h2 class="text-2xl md:text-3xl font-light tracking-wide text-center mb-8 ${title ? '' : 'hidden'}" data-section-title>${title || 'גלריה'}</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  ${[1,2,3,4].map(() => `
                    <div class="aspect-square bg-gray-100 rounded flex items-center justify-center">
                      <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;

          case 'split_banner':
            placeholder.className = 'grid md:grid-cols-2';
            html = `
              <div class="relative overflow-hidden group" style="height: 70vh;">
                <div class="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-300"></div>
                <div class="absolute inset-0" style="background-color: rgba(0,0,0,0.1);" data-overlay></div>
                <div class="absolute inset-0 flex items-end justify-center pb-16">
                  <span class="text-3xl md:text-4xl font-extralight tracking-[0.3em] uppercase" style="color: #fff;" data-section-title>נשים</span>
                </div>
              </div>
              <div class="relative overflow-hidden group" style="height: 70vh;">
                <div class="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-400"></div>
                <div class="absolute inset-0" style="background-color: rgba(0,0,0,0.1);" data-overlay></div>
                <div class="absolute inset-0 flex items-end justify-center pb-16">
                  <span class="text-3xl md:text-4xl font-extralight tracking-[0.3em] uppercase" style="color: #fff;" data-section-title>גברים</span>
                </div>
              </div>
            `;
            break;

          case 'banner_small':
            placeholder.className = 'py-5 px-4';
            placeholder.style.backgroundColor = '#000';
            html = `
              <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-right">
                <div class="flex flex-col sm:flex-row items-center gap-2">
                  <span class="text-base font-medium ${title ? '' : 'hidden'}" style="color: #fff;" data-section-title>${title || ''}</span>
                  <span class="text-base font-normal opacity-80 ${subtitle ? '' : 'hidden'}" style="color: #fff;" data-section-subtitle>${subtitle || ''}</span>
                </div>
                <a href="${content?.buttonLink || '#'}" class="px-4 py-1.5 text-sm font-medium border transition-colors ${content?.buttonText ? '' : 'hidden'}" style="color: #fff; border-color: #fff;" data-section-button>${content?.buttonText || ''}</a>
              </div>
            `;
            break;

          case 'faq':
            placeholder.className = 'py-16 bg-white';
            html = `
              <div class="container mx-auto px-4 max-w-3xl">
                <h2 class="text-2xl md:text-3xl font-light tracking-wide text-center mb-8 ${title ? '' : 'hidden'}" data-section-title>${title || 'שאלות נפוצות'}</h2>
                <div class="space-y-4">
                  ${[1,2,3].map(i => `
                    <div class="border border-gray-200 rounded-lg p-4">
                      <div class="flex justify-between items-center">
                        <span class="font-medium">שאלה ${i}</span>
                        <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;

          case 'reviews':
            placeholder.className = 'py-16 bg-gray-50';
            html = `
              <div class="container mx-auto px-4">
                <h2 class="text-2xl md:text-3xl font-light tracking-wide text-center mb-8 ${title ? '' : 'hidden'}" data-section-title>${title || 'ביקורות לקוחות'}</h2>
                <div class="grid md:grid-cols-3 gap-6">
                  ${[1,2,3].map(() => `
                    <div class="bg-white p-6 rounded-lg shadow-sm">
                      <div class="flex gap-1 mb-3">${'★'.repeat(5)}</div>
                      <p class="text-gray-600 mb-4">"ביקורת לדוגמה..."</p>
                      <p class="font-medium">לקוח מרוצה</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;

          case 'logos':
            placeholder.className = 'py-12 bg-white';
            html = `
              <div class="container mx-auto px-4">
                <h2 class="text-xl font-light tracking-wide text-center mb-8 text-gray-500 ${title ? '' : 'hidden'}" data-section-title>${title || 'הם בחרו בנו'}</h2>
                <div class="flex flex-wrap justify-center items-center gap-8">
                  ${[1,2,3,4,5].map(() => `
                    <div class="w-24 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <span class="text-gray-400 text-xs">לוגו</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;

          case 'series_grid':
            const seriesItems = (content?.items as Array<{id: string; title: string; subtitle?: string; description?: string; imageUrl?: string}>) || [
              { id: '1', title: 'סדרה 1', description: 'תיאור קצר של הסדרה.' },
              { id: '2', title: 'סדרה 2', description: 'תיאור קצר של הסדרה.' },
              { id: '3', title: 'סדרה 3', description: 'תיאור קצר של הסדרה.' },
            ];
            const seriesStyle = (event.data.settings?.style as string) || 'cards';
            const seriesCols = (event.data.settings?.columns as number) || 3;
            const seriesMobileCols = (event.data.settings?.mobileColumns as number) || 1;
            const seriesAspectRatio = (event.data.settings?.imageAspectRatio as string) || 'auto';
            const seriesMinHeight = (event.data.settings?.minImageHeight as string) || '200px';
            
            placeholder.className = 'py-16';
            placeholder.style.backgroundColor = '#ffffff';
            placeholder.dataset.sectionName = 'גריד סדרות';
            placeholder.dataset.seriesStyle = seriesStyle;
            
            // Get aspect ratio class
            const getAspectClass = (ratio: string) => {
              switch (ratio) {
                case 'square': return 'aspect-square';
                case 'portrait': return 'aspect-[3/4]';
                case 'landscape': return 'aspect-video';
                default: return '';
              }
            };
            const aspectClass = getAspectClass(seriesAspectRatio);
            
            if (seriesStyle === 'overlay') {
              // Overlay style
              html = `
                <div class="max-w-7xl mx-auto px-6">
                  <div class="text-center mb-12" data-section-header style="${(title || subtitle) ? '' : 'display:none'}">
                    <span class="text-sm font-bold tracking-wider uppercase" style="color: var(--template-primary, #d4af37); ${subtitle ? '' : 'display:none'}" data-section-subtitle>${subtitle || ''}</span>
                    <h2 class="text-3xl font-bold mt-2" data-section-title style="${title ? '' : 'display:none'}">${title || ''}</h2>
                    <div class="w-16 h-1 mx-auto mt-4" style="background: var(--template-primary, #d4af37);" data-accent-color-bg></div>
                  </div>
                  <div class="grid grid-cols-${seriesMobileCols} md:grid-cols-${seriesCols} gap-6" data-items-grid>
                    ${seriesItems.map((item) => `
                      <a href="#" class="group relative rounded-2xl overflow-hidden" style="height: 320px;" data-item-id="${item.id}">
                        ${item.imageUrl 
                          ? `<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${item.imageUrl}');" data-item-bg></div>`
                          : `<div class="absolute inset-0 bg-gray-300 flex items-center justify-center" data-item-bg>
                              <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>`
                        }
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        <div class="absolute inset-0 flex flex-col justify-end p-6 text-white">
                          <h3 class="text-xl font-bold mb-2" data-item-title>${item.title}</h3>
                          ${item.description ? `<p class="text-sm opacity-90 mb-4" data-item-description>${item.description}</p>` : ''}
                        </div>
                      </a>
                    `).join('')}
                  </div>
                </div>
              `;
            } else {
              // Cards style (default)
              html = `
                <div class="max-w-7xl mx-auto px-6">
                  <div class="text-center mb-12" data-section-header style="${(title || subtitle) ? '' : 'display:none'}">
                    <span class="text-sm font-bold tracking-wider uppercase" style="color: var(--template-primary, #d4af37); ${subtitle ? '' : 'display:none'}" data-section-subtitle>${subtitle || ''}</span>
                    <h2 class="text-3xl font-bold mt-2" data-section-title style="${title ? '' : 'display:none'}">${title || ''}</h2>
                    <div class="w-16 h-1 mx-auto mt-4" style="background: var(--template-primary, #d4af37);" data-accent-color-bg></div>
                  </div>
                  <div class="grid grid-cols-${seriesMobileCols} md:grid-cols-${seriesCols} gap-6" data-items-grid>
                    ${seriesItems.map((item) => `
                      <div class="group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all" style="background: #f9f7f4;" data-item-id="${item.id}">
                        <div class="overflow-hidden ${aspectClass}" style="${seriesAspectRatio === 'auto' ? `min-height: ${seriesMinHeight}` : ''}" data-image-container>
                          ${item.imageUrl 
                            ? `<div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${item.imageUrl}'); ${seriesAspectRatio === 'auto' ? `min-height: ${seriesMinHeight}` : ''}" data-item-bg></div>`
                            : `<div class="w-full h-full bg-gray-200 flex items-center justify-center" style="${seriesAspectRatio === 'auto' ? `min-height: ${seriesMinHeight}` : ''}" data-item-bg>
                                <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>`
                          }
                        </div>
                        <div class="p-5">
                          ${item.subtitle ? `<span class="text-xs font-bold tracking-wider uppercase" style="color: var(--template-primary, #d4af37);" data-item-subtitle>${item.subtitle}</span>` : ''}
                          <h3 class="text-lg font-bold mt-1 mb-2" data-item-title>${item.title}</h3>
                          ${item.description ? `<p class="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3" data-item-description>${item.description}</p>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }
            break;

          case 'accordion':
            placeholder.className = 'py-8 px-4';
            html = `
              <div class="max-w-4xl mx-auto">
                <div class="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  <details class="group">
                    <summary class="flex items-center justify-between cursor-pointer px-4 py-3 font-medium text-gray-900 hover:bg-gray-50">
                      <span>פריט אקורדיון 1</span>
                      <svg class="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div class="px-4 pb-4 text-gray-600 text-sm">תוכן הפריט יופיע כאן...</div>
                  </details>
                  <details class="group">
                    <summary class="flex items-center justify-between cursor-pointer px-4 py-3 font-medium text-gray-900 hover:bg-gray-50">
                      <span>פריט אקורדיון 2</span>
                      <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div class="px-4 pb-4 text-gray-600 text-sm hidden">תוכן הפריט...</div>
                  </details>
                </div>
              </div>
            `;
            break;

          case 'tabs':
            placeholder.className = 'py-8 px-4';
            html = `
              <div class="max-w-4xl mx-auto">
                <div class="flex border-b border-gray-200 mb-4 gap-4">
                  <button class="py-2 px-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600">לשונית 1</button>
                  <button class="py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">לשונית 2</button>
                  <button class="py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">לשונית 3</button>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-gray-600 text-sm">תוכן הלשונית יופיע כאן...</p>
                </div>
              </div>
            `;
            break;
          
          case 'custom':
            placeholder.className = 'py-16 bg-gradient-to-b from-blue-50 to-white border-2 border-dashed border-blue-300';
            html = `
              <div class="container mx-auto px-4 text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h2 class="text-xl font-medium text-gray-900 mb-2" data-section-title>${title || 'סקשן מותאם אישית'}</h2>
                <p class="text-gray-500">הוסף קוד HTML מותאם אישית</p>
              </div>
            `;
            break;
          
          default:
            // Generic placeholder for unknown types
            placeholder.className = 'py-16 bg-gradient-to-b from-gray-50 to-white border-2 border-dashed border-blue-300';
            html = `
              <div class="container mx-auto px-4">
                <div class="text-center max-w-3xl mx-auto">
                  <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3" data-section-title>${title || ''}</h2>
                  <p class="text-lg text-gray-600 mb-6 ${subtitle ? '' : 'hidden'}" data-section-subtitle>${subtitle || ''}</p>
                  <div class="prose prose-lg mx-auto mb-6" data-content-text>${content?.text || ''}</div>
                  <div class="flex items-center justify-center gap-3 py-8 bg-gray-100/50 rounded-xl border border-gray-200">
                    <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div class="text-right">
                      <span class="block text-lg font-medium text-gray-700">${title || sectionType}</span>
                      <span class="text-sm text-gray-400">שמור כדי לראות את הסקשן המלא</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
        }
        
        placeholder.innerHTML = html;
        
        // Find where to insert
        if (afterSectionId) {
          const afterEl = document.querySelector(`[data-section-id="${afterSectionId}"]`);
          if (afterEl) {
            afterEl.insertAdjacentElement('afterend', placeholder);
          } else {
            const main = document.querySelector('main') || document.body;
            main.appendChild(placeholder);
          }
        } else {
          // Smart insertion: avoid inserting after footer
          // Check if we're on a product page (has pp-info or pp-gallery)
          const isProductPage = document.querySelector('[data-section-id="pp-info"]') || 
                                document.querySelector('[data-section-id="pp-gallery"]');
          
          if (isProductPage) {
            // For product pages, insert before reviews or related products
            const reviewsSection = document.querySelector('[data-section-id="pp-reviews"]');
            const relatedSection = document.querySelector('[data-section-id="pp-related"]');
            const footer = document.querySelector('footer');
            
            // Priority: before reviews > before related > before footer > end of main content
            if (reviewsSection) {
              reviewsSection.insertAdjacentElement('beforebegin', placeholder);
            } else if (relatedSection) {
              relatedSection.insertAdjacentElement('beforebegin', placeholder);
            } else if (footer) {
              footer.insertAdjacentElement('beforebegin', placeholder);
            } else {
              const main = document.querySelector('main') || document.body;
              main.appendChild(placeholder);
            }
          } else {
            // For other pages, find last non-footer section
            const allSections = document.querySelectorAll('[data-section-id]:not([data-section-id="footer"])');
            const footer = document.querySelector('footer');
            
            if (allSections.length > 0) {
              const lastSection = allSections[allSections.length - 1];
              lastSection.insertAdjacentElement('afterend', placeholder);
            } else if (footer) {
              footer.insertAdjacentElement('beforebegin', placeholder);
            } else {
              const main = document.querySelector('main') || document.body;
              main.appendChild(placeholder);
            }
          }
        }
        
        // Scroll to the new section
        setTimeout(() => {
          placeholder.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      
      // =====================================================
      // SECTION_REMOVE - Hide/remove section from preview
      // =====================================================
      if (event.data?.type === 'SECTION_REMOVE') {
        const { sectionId } = event.data;
        const element = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (element) {
          // Add fade out animation then remove
          (element as HTMLElement).style.transition = 'opacity 0.3s, transform 0.3s';
          (element as HTMLElement).style.opacity = '0';
          (element as HTMLElement).style.transform = 'scale(0.95)';
          setTimeout(() => element.remove(), 300);
        }
      }
      
      // =====================================================
      // SECTION_SWAP - Swap two sections in the DOM
      // Simpler than full reorder - just swap positions of two elements
      // =====================================================
      if (event.data?.type === 'SECTION_SWAP') {
        const { fromId, toId } = event.data as { fromId: string; toId: string };
        
        const fromElement = document.querySelector(`[data-section-id="${fromId}"]`) as HTMLElement;
        const toElement = document.querySelector(`[data-section-id="${toId}"]`) as HTMLElement;
        
        if (fromElement && toElement) {
          // Get parents and positions
          const fromParent = fromElement.parentElement;
          const toParent = toElement.parentElement;
          
          // Only swap if both are in the same parent (same zone)
          if (fromParent && toParent && fromParent === toParent) {
            // Create placeholder for swap
            const placeholder = document.createElement('div');
            fromParent.insertBefore(placeholder, fromElement);
            
            // Swap positions
            toParent.insertBefore(fromElement, toElement);
            fromParent.insertBefore(toElement, placeholder);
            
            // Remove placeholder
            placeholder.remove();
          }
        }
      }
      
      // =====================================================
      // SECTION_REORDER - Visual feedback only (no DOM manipulation)
      // Actual reorder happens after save + page refresh
      // DOM manipulation was causing layout issues
      // =====================================================
      if (event.data?.type === 'SECTION_REORDER') {
        // Don't manipulate DOM - it causes layout issues with complex pages
        // The new order is saved and will be visible after refresh/save
        console.log('[Preview] Section reorder saved - refresh to see changes');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [scrollToSection]);

  // Add hover/click listeners to sections using event delegation
  // This works better with dynamically added sections
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      // Find closest section element
      const target = (e.target as HTMLElement).closest('[data-section-id]') as HTMLElement;
      if (target) {
        const sectionId = target.dataset.sectionId;
        if (sectionId && sectionId !== hoveredSection) {
          setHoveredSection(sectionId);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-section-id]') as HTMLElement;
      const relatedTarget = (e.relatedTarget as HTMLElement)?.closest('[data-section-id]') as HTMLElement;
      
      // Only clear if we're leaving all sections
      if (target && !relatedTarget) {
        setHoveredSection(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Stop propagation to prevent parent sections from also being selected
      const target = (e.target as HTMLElement).closest('[data-section-id]') as HTMLElement;
      if (target) {
        const sectionId = target.dataset.sectionId;
        if (sectionId) {
          e.stopPropagation();
          window.parent.postMessage({
            type: 'SECTION_CLICKED',
            sectionId,
          }, '*');
          setSelectedSection(sectionId);
        }
      }
    };

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, [hoveredSection]);

  // Inject styles for highlighted sections + disable links
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'editor-highlighter-styles';
    style.textContent = `
      /* Disable all links in preview mode */
      a {
        pointer-events: none !important;
        cursor: default !important;
      }
      
      /* But allow clicks on sections */
      [data-section-id] {
        position: relative;
        cursor: pointer !important;
        pointer-events: auto !important;
        transition: outline 0.15s ease;
      }
      [data-section-id]:hover {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: 2px;
      }
      [data-section-id].editor-selected {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
      }
      [data-section-id]::before {
        content: attr(data-section-name);
        position: absolute;
        top: 0;
        right: 0;
        background: #3b82f6;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        opacity: 0;
        transition: opacity 0.15s ease;
        pointer-events: none;
        z-index: 100;
        font-family: system-ui, sans-serif;
      }
      [data-section-id]:hover::before {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('editor-highlighter-styles');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  // Update selected class on sections
  useEffect(() => {
    const sections = getSectionElements();
    sections.forEach(section => {
      const sectionId = (section as HTMLElement).dataset.sectionId;
      if (sectionId === selectedSection) {
        section.classList.add('editor-selected');
      } else {
        section.classList.remove('editor-selected');
      }
    });
  }, [selectedSection, getSectionElements]);

  return null;
}

