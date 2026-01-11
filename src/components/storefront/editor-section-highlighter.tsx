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
 * 
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
        // Already handled by PreviewSettingsProvider
      }
      if (event.data?.type === 'SECTION_CONTENT_UPDATE') {
        const { sectionId, updates } = event.data;
        const element = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (!element) return;

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
            const btnEl = element.querySelector('[data-section-button]');
            if (btnEl) btnEl.textContent = updates.content.buttonText;
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
        // NEWSLETTER LIVE UPDATES
        // =====================================================
        if (updates.content?.placeholder !== undefined) {
          const el = element.querySelector('[data-content-placeholder]') as HTMLInputElement;
          if (el) el.placeholder = updates.content.placeholder;
        }
        
        // =====================================================
        // BACKGROUND IMAGE UPDATES
        // =====================================================
        if (updates.content?.imageUrl !== undefined) {
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
        }
        if (updates.content?.mobileImageUrl !== undefined) {
          const bgMobile = element.querySelector('[data-bg-mobile]') as HTMLElement;
          if (bgMobile) {
            const desktopUrl = (element.querySelector('[data-bg-desktop]') as HTMLElement)?.style.backgroundImage;
            bgMobile.style.backgroundImage = updates.content.mobileImageUrl 
              ? `url("${updates.content.mobileImageUrl}")` 
              : desktopUrl || 'none';
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
        // Background color (multiple property names)
        if (updates.settings?.backgroundColor !== undefined) {
          (element as HTMLElement).style.backgroundColor = updates.settings.backgroundColor as string;
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
        
        // Button colors
        if (updates.settings?.buttonColor !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) btnEl.style.backgroundColor = updates.settings.buttonColor as string;
        }
        if (updates.settings?.buttonTextColor !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) btnEl.style.color = updates.settings.buttonTextColor as string;
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
        
        // Overlay opacity
        if (updates.settings?.overlay !== undefined) {
          const overlayEl = element.querySelector('[data-overlay]') as HTMLElement;
          if (overlayEl) overlayEl.style.opacity = String(updates.settings.overlay);
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
        
        // Card height (series grid overlay style)
        if (updates.settings?.cardHeight !== undefined) {
          const contentDivs = element.querySelectorAll('[data-item-id] .relative.p-8');
          contentDivs.forEach((div) => {
            (div as HTMLElement).style.height = updates.settings.cardHeight as string;
          });
        }
        
        // =====================================================
        // SERIES GRID ITEMS UPDATES
        // =====================================================
        if (updates.content?.items !== undefined) {
          const items = updates.content.items as Array<{
            id: string;
            title?: string;
            name?: string;
            subtitle?: string;
            description?: string;
            imageUrl?: string;
            link?: string;
          }>;
          items.forEach((item, index) => {
            // Try to find item by id first, then by index
            let itemEl = element.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement;
            if (!itemEl) {
              const allItems = element.querySelectorAll('[data-item-id]');
              itemEl = allItems[index] as HTMLElement;
            }
            if (itemEl) {
              if (item.title !== undefined) {
                const titleEl = itemEl.querySelector('h3') as HTMLElement;
                if (titleEl) titleEl.textContent = item.title;
              }
              if (item.name !== undefined) {
                const nameEl = itemEl.querySelector('[data-item-name]') as HTMLElement;
                if (nameEl) nameEl.textContent = item.name;
              }
              if (item.subtitle !== undefined) {
                const subEl = itemEl.querySelector('span') as HTMLElement;
                if (subEl) subEl.textContent = item.subtitle;
              }
              if (item.description !== undefined) {
                const descEl = itemEl.querySelector('p') as HTMLElement;
                if (descEl) descEl.textContent = item.description;
              }
              if (item.imageUrl !== undefined) {
                const imgContainer = itemEl.querySelector('[style*="background-image"], .bg-cover') as HTMLElement;
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
        // ⚡ REAL-TIME: Render selected products directly!
        if (updates.content?.type !== undefined || updates.content?.selectedProducts !== undefined || updates.content?.productIds !== undefined) {
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
          
          // Store current type
          if (productType !== undefined) {
            (element as HTMLElement).dataset.productType = productType;
          }
          
          const grid = element.querySelector('[data-products-grid]') as HTMLElement;
          if (!grid) return;
          
          const allProductEls = grid.querySelectorAll('[data-product-id]');
          const currentType = productType || (element as HTMLElement).dataset.productType || 'all';
          
          // For "specific" mode: render the selected products directly
          if (currentType === 'specific') {
            if (selectedProducts && selectedProducts.length > 0) {
              // Hide all existing products
              allProductEls.forEach(el => el.classList.add('hidden'));
              
              // Create or update product cards for selected products
              const basePath = window.location.pathname.split('/').slice(0, 3).join('/');
              
              // Remove previously injected preview products
              grid.querySelectorAll('[data-preview-product]').forEach(el => el.remove());
              
              // Add selected products
              selectedProducts.forEach((product, index) => {
                const imageUrl = product.imageUrl || product.image || '/placeholder.svg';
                const price = product.price ? Number(product.price) : 0;
                const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
                const hasDiscount = comparePrice && comparePrice > price;
                const discountPercent = hasDiscount ? Math.round((1 - price / comparePrice) * 100) : 0;
                
                const productHtml = `
                  <div 
                    class="animate-slide-up group"
                    style="animation-delay: ${index * 50}ms"
                    data-preview-product
                    data-product-id="${product.id}"
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
            } else {
              // No products selected - show placeholder
              allProductEls.forEach(el => el.classList.add('hidden'));
              grid.querySelectorAll('[data-preview-product]').forEach(el => el.remove());
              
              // Add empty state placeholder
              const emptyHtml = `
                <div data-preview-product class="col-span-full text-center py-12 text-gray-400">
                  <p>בחר מוצרים להצגה</p>
                </div>
              `;
              grid.insertAdjacentHTML('beforeend', emptyHtml);
            }
          } else {
            // For other modes (all, featured, category): show existing products, remove preview ones
            grid.querySelectorAll('[data-preview-product]').forEach(el => el.remove());
            allProductEls.forEach(el => el.classList.remove('hidden'));
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
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [scrollToSection]);

  // Add hover/click listeners to sections
  useEffect(() => {
    const sections = getSectionElements();
    
    const handleMouseEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const sectionId = target.dataset.sectionId;
      if (sectionId) setHoveredSection(sectionId);
    };

    const handleMouseLeave = () => {
      setHoveredSection(null);
    };

    const handleClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const sectionId = target.dataset.sectionId;
      if (sectionId) {
        window.parent.postMessage({
          type: 'SECTION_CLICKED',
          sectionId,
        }, '*');
        setSelectedSection(sectionId);
      }
    };

    sections.forEach(section => {
      section.addEventListener('mouseenter', handleMouseEnter);
      section.addEventListener('mouseleave', handleMouseLeave);
      section.addEventListener('click', handleClick);
    });

    return () => {
      sections.forEach(section => {
        section.removeEventListener('mouseenter', handleMouseEnter);
        section.removeEventListener('mouseleave', handleMouseLeave);
        section.removeEventListener('click', handleClick);
      });
    };
  }, [getSectionElements]);

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
