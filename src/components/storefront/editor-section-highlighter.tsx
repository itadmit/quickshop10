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
        // Already handled by PreviewSettingsProvider
      }
      if (event.data?.type === 'SECTION_CONTENT_UPDATE') {
        const { sectionId, updates } = event.data;
        console.log('[EditorHighlighter] SECTION_CONTENT_UPDATE received:', { sectionId, updates });
        const element = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (!element) {
          console.warn('[EditorHighlighter] Element not found for sectionId:', sectionId);
          // List all section IDs in DOM for debugging
          const allSections = document.querySelectorAll('[data-section-id]');
          console.log('[EditorHighlighter] Available section IDs:', Array.from(allSections).map(el => el.getAttribute('data-section-id')));
          return;
        }
        console.log('[EditorHighlighter] Element found:', element);

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
        }
        
        // =====================================================
        // BUTTON LINK UPDATES
        // =====================================================
        if (updates.content?.buttonLink !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLAnchorElement;
          if (btnEl) {
            btnEl.href = updates.content.buttonLink || '#';
            btnEl.classList.toggle('hidden', !updates.content.buttonLink || !btnEl.textContent);
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
        
        // Generate type-specific placeholder HTML
        let html = '';
        switch (sectionType) {
          case 'image_text':
            placeholder.className = 'py-0';
            html = `
              <div class="flex flex-col md:flex-row min-h-[400px]">
                <div class="w-full md:w-1/2 relative overflow-hidden" style="min-height: 300px;" data-image-container>
                  <img src="${content?.imageUrl || ''}" alt="" class="w-full h-full object-cover absolute inset-0 ${content?.imageUrl ? '' : 'hidden'}" data-content-image />
                  <div class="w-full h-full bg-gray-100 flex items-center justify-center ${content?.imageUrl ? 'hidden' : ''}" data-image-placeholder>
                    <svg class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="w-full md:w-1/2 flex items-center p-8 md:p-12 lg:p-16">
                  <div class="max-w-lg mx-auto text-right">
                    <h2 class="text-2xl md:text-3xl lg:text-4xl font-light tracking-wide mb-4 ${title ? '' : 'hidden'}" data-section-title>${title || ''}</h2>
                    <p class="text-lg text-gray-600 mb-4 ${subtitle ? '' : 'hidden'}" data-section-subtitle>${subtitle || ''}</p>
                    <div class="text-gray-600 leading-relaxed mb-6 prose prose-sm" data-content-text>${content?.text || '<p>הקלידו טקסט כאן...</p>'}</div>
                    <a href="${content?.buttonLink || '#'}" class="inline-block px-8 py-3 border border-black text-black hover:bg-black hover:text-white transition-colors text-sm tracking-wider uppercase ${content?.buttonText ? '' : 'hidden'}" data-section-button>${content?.buttonText || ''}</a>
                  </div>
                </div>
              </div>
            `;
            break;
          
          case 'text_block':
            placeholder.className = 'py-16 bg-white';
            html = `
              <div class="container mx-auto px-4">
                <div class="text-center max-w-3xl mx-auto">
                  <h2 class="text-2xl md:text-3xl lg:text-4xl font-light tracking-wide mb-4 ${title ? '' : 'hidden'}" data-section-title>${title || ''}</h2>
                  <p class="text-lg text-gray-600 mb-6 ${subtitle ? '' : 'hidden'}" data-section-subtitle>${subtitle || ''}</p>
                  <div class="prose prose-lg mx-auto" data-content-text>${content?.text || '<p>הקלידו טקסט כאן...</p>'}</div>
                </div>
              </div>
            `;
            break;
          
          case 'hero':
          case 'banner':
            placeholder.className = 'relative min-h-[60vh] flex items-center justify-center';
            html = `
              <div class="absolute inset-0 bg-gray-200" data-bg-desktop style="background-size: cover; background-position: center; ${content?.imageUrl ? `background-image: url('${content.imageUrl}')` : ''}">
                <div class="absolute inset-0 bg-black/30"></div>
              </div>
              <div class="relative z-10 text-center text-white px-4">
                <h2 class="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide mb-4" data-section-title>${title || 'כותרת הבאנר'}</h2>
                <p class="text-xl md:text-2xl mb-8 opacity-90" data-section-subtitle>${subtitle || 'תת כותרת'}</p>
                <a href="${content?.buttonLink || '/products'}" class="inline-block px-8 py-3 bg-white text-black hover:bg-black hover:text-white transition-colors text-sm tracking-wider uppercase" data-section-button>${content?.buttonText || 'לחנות'}</a>
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
            placeholder.className = 'py-16 bg-white';
            html = `
              <div class="container mx-auto px-4">
                <h2 class="text-2xl md:text-3xl font-light tracking-wide text-center mb-12 ${title ? '' : 'hidden'}" data-section-title>${title || ''}</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div class="text-center p-6">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                    </div>
                    <h3 class="font-medium mb-2">משלוח חינם</h3>
                    <p class="text-gray-600 text-sm">בהזמנה מעל 200₪</p>
                  </div>
                  <div class="text-center p-6">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <h3 class="font-medium mb-2">תשלום מאובטח</h3>
                    <p class="text-gray-600 text-sm">SSL מאובטח</p>
                  </div>
                  <div class="text-center p-6">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    </div>
                    <h3 class="font-medium mb-2">החזרה קלה</h3>
                    <p class="text-gray-600 text-sm">14 ימי החזרה</p>
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
          const allSections = document.querySelectorAll('[data-section-id]');
          const lastSection = allSections[allSections.length - 1];
          if (lastSection) {
            lastSection.insertAdjacentElement('afterend', placeholder);
          } else {
            const main = document.querySelector('main') || document.body;
            main.appendChild(placeholder);
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
      // SECTION_REORDER - Visually reorder sections
      // =====================================================
      if (event.data?.type === 'SECTION_REORDER') {
        const { orderedIds } = event.data as { orderedIds: string[] };
        const main = document.querySelector('main') || document.body;
        
        // Get all sections and their parent
        const sections = orderedIds.map(id => 
          document.querySelector(`[data-section-id="${id}"]`)
        ).filter(Boolean) as HTMLElement[];
        
        // Reorder by re-appending in new order
        const container = sections[0]?.parentElement || main;
        sections.forEach(section => {
          container.appendChild(section);
        });
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
