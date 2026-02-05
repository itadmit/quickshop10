'use client';

import { useEffect, useState, useCallback } from 'react';
import { getHandler, hasHandler } from '@/components/sections/handlers';

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

  // Mark document as being in editor preview mode
  useEffect(() => {
    document.documentElement.setAttribute('data-editor-preview', 'true');
    
    // Add editor-specific styles for visibility
    const style = document.createElement('style');
    style.id = 'editor-visibility-styles';
    style.textContent = `
      /* In editor: show hidden sections with low opacity - only when view matches */
      
      /* Hide on Mobile/Tablet: show opacity only in mobile/tablet view (< 1024px) */
      @media (max-width: 1023px) {
        [data-editor-preview="true"] [data-hide-on-mobile="true"] {
          opacity: 0.5;
          outline: 2px dashed rgba(239, 68, 68, 0.6);
          outline-offset: -2px;
        }
      }
      
      /* Hide on Desktop: show opacity only in desktop view (>= 1024px) */
      @media (min-width: 1024px) {
        [data-editor-preview="true"] [data-hide-on-desktop="true"] {
          opacity: 0.5;
          outline: 2px dashed rgba(239, 68, 68, 0.6);
          outline-offset: -2px;
        }
      }
      
      /* Always show hidden sections in editor (don't actually hide) */
      [data-editor-preview="true"] [data-hide-on-mobile="true"],
      [data-editor-preview="true"] [data-hide-on-desktop="true"] {
        display: block !important;
      }
      
      /* Remove the Tailwind hiding classes effect in editor - but NOT for background images */
      [data-editor-preview="true"] .max-md\\:hidden:not([data-bg-desktop]):not([data-bg-mobile]),
      [data-editor-preview="true"] .md\\:hidden:not([data-bg-desktop]):not([data-bg-mobile]) {
        display: block !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.documentElement.removeAttribute('data-editor-preview');
      const existingStyle = document.getElementById('editor-visibility-styles');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  // Find all sections with data-section-id
  const getSectionElements = useCallback(() => {
    return document.querySelectorAll('[data-section-id]');
  }, []);

  // Helper: Get section type from element
  const getSectionTypeFromElement = (element: Element): string | null => {
    // Try data-section-type attribute
    const typeAttr = element.getAttribute('data-section-type');
    if (typeAttr) return typeAttr;
    
    // Try to infer from data-section-name (Hebrew names)
    const nameAttr = element.getAttribute('data-section-name');
    if (nameAttr) {
      const nameToType: Record<string, string> = {
        'בלוק טקסט': 'text_block',
        'באנר ראשי': 'hero',
        'ביקורות': 'reviews',
        'ביקורות לקוחות': 'reviews',
        'חוזקות': 'features',
        'גלריה': 'gallery',
        'לוגואים': 'logos',
        'שאלות נפוצות': 'faq',
        'ניוזלטר': 'newsletter',
        'יצירת קשר': 'contact',
        'תמונה + טקסט': 'image_text',
        'באנר וידאו': 'video_banner',
        'באנר מפוצל': 'split_banner',
        'באנר קטן': 'banner_small',
      };
      return nameToType[nameAttr] || null;
    }
    
    return null;
  };

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
        
        // Handle global fonts
        if (settings.headingFont !== undefined || settings.bodyFont !== undefined) {
          // Inject or update global font styles
          let fontStyleEl = document.getElementById('editor-global-fonts');
          if (!fontStyleEl) {
            fontStyleEl = document.createElement('style');
            fontStyleEl.id = 'editor-global-fonts';
            document.head.appendChild(fontStyleEl);
          }
          
          const headingFont = settings.headingFont || 'Noto Sans Hebrew';
          const bodyFont = settings.bodyFont || 'Assistant';
          
          // Load Google Fonts if not already loaded
          const fontsToLoad = [headingFont, bodyFont].filter((f, i, arr) => arr.indexOf(f) === i);
          fontsToLoad.forEach(font => {
            const fontId = `google-font-${font.replace(/\s+/g, '-')}`;
            if (!document.getElementById(fontId)) {
              const link = document.createElement('link');
              link.id = fontId;
              link.rel = 'stylesheet';
              link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap`;
              document.head.appendChild(link);
            }
          });
          
          fontStyleEl.textContent = `
            :root {
              --font-display: '${headingFont}', sans-serif !important;
              --font-sans: '${bodyFont}', sans-serif !important;
            }
            body {
              font-family: '${bodyFont}', sans-serif !important;
            }
            h1, h2, h3, h4, h5, h6, .font-display {
              font-family: '${headingFont}', sans-serif !important;
            }
          `;
        }
        
        // Also handled by PreviewSettingsProvider for header settings
      }
      if (event.data?.type === 'SECTION_CONTENT_UPDATE') {
        const { sectionId, updates, categories } = event.data;
        const element = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (!element) {
          // List all section IDs in DOM for debugging
          const allSections = document.querySelectorAll('[data-section-id]');
          return;
        }

        // =====================================================
        // NEW MODULAR ARCHITECTURE: Check for dedicated handler
        // =====================================================
        const currentSectionType = element.getAttribute('data-section-type') || 
                                   (element as HTMLElement).dataset.sectionType ||
                                   getSectionTypeFromElement(element);
        
        if (currentSectionType && hasHandler(currentSectionType)) {
          const dedicatedHandler = getHandler(currentSectionType);
          if (dedicatedHandler) {
            // Add categories to updates for handlers that need it
            const updatesWithCategories = {
              ...updates,
              _categories: categories || [],
            };
            dedicatedHandler(element, updatesWithCategories);
            return; // Handler took care of everything
          }
        }

        // =====================================================
        // LEGACY: Fall back to inline handling for sections not yet migrated
        // =====================================================

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
        // REVIEWS SECTION LIVE UPDATES
        // =====================================================
        if (updates.content?.reviews !== undefined) {
          const reviews = updates.content.reviews as Array<{ 
            id?: string;
            author?: string;
            text: string; 
            rating: number; 
            date?: string;
            verified?: boolean;
          }>;
          const reviewsGrid = element.querySelector('[data-reviews-grid]') as HTMLElement;
          let reviewElements = element.querySelectorAll('[data-review-index]');
          
          // If we need more review elements, create them
          if (reviewsGrid && reviews.length > reviewElements.length) {
            for (let i = reviewElements.length; i < reviews.length; i++) {
              const newReviewEl = document.createElement('div');
              newReviewEl.className = 'bg-white p-6 rounded-lg shadow-sm border border-gray-100';
              newReviewEl.setAttribute('data-review-index', String(i));
              newReviewEl.setAttribute('data-review-id', String(i));
              newReviewEl.innerHTML = `
                <div class="flex gap-0.5 mb-3" data-review-rating="5">
                  ${[1,2,3,4,5].map(j => `
                    <svg class="w-4 h-4 ${j <= 5 ? 'text-yellow-400' : 'text-gray-200'}" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  `).join('')}
                </div>
                <p class="text-gray-700 mb-4" data-review-text>"ביקורת חדשה"</p>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium" data-review-avatar>ל</div>
                  <div>
                    <div class="font-medium text-gray-900 flex items-center gap-2" data-review-author>לקוח חדש</div>
                    <div class="text-sm text-gray-500" data-review-date style="display: none"></div>
                  </div>
                </div>
              `;
              reviewsGrid.appendChild(newReviewEl);
            }
            // Refresh the list
            reviewElements = element.querySelectorAll('[data-review-index]');
          }
          
          reviews.forEach((review, index) => {
            const reviewEl = reviewElements[index] as HTMLElement;
            if (reviewEl) {
              // Show the element
              reviewEl.style.display = '';
              
              // Update text
              const textEl = reviewEl.querySelector('[data-review-text]') as HTMLElement;
              if (textEl) textEl.textContent = `"${review.text}"`;
              
              // Update author
              const authorEl = reviewEl.querySelector('[data-review-author]') as HTMLElement;
              const authorName = review.author || '';
              if (authorEl) {
                // Keep the verified badge if present
                const verifiedBadge = authorEl.querySelector('svg');
                if (verifiedBadge) {
                  authorEl.childNodes[0].textContent = authorName;
                } else {
                  authorEl.textContent = authorName;
                }
              }
              
              // Update avatar (first letter of author)
              const avatarEl = reviewEl.querySelector('[data-review-avatar]') as HTMLElement;
              if (avatarEl && authorName) {
                avatarEl.textContent = authorName.charAt(0);
              }
              
              // Update rating stars
              const ratingContainer = reviewEl.querySelector('[data-review-rating]') as HTMLElement;
              if (ratingContainer && review.rating !== undefined) {
                ratingContainer.dataset.reviewRating = String(review.rating);
                const stars = ratingContainer.querySelectorAll('svg');
                stars.forEach((star, i) => {
                  star.classList.toggle('text-yellow-400', i < review.rating);
                  star.classList.toggle('text-gray-200', i >= review.rating);
                });
              }
              
              // Update date
              const dateEl = reviewEl.querySelector('[data-review-date]') as HTMLElement;
              if (dateEl) {
                dateEl.textContent = review.date || '';
                dateEl.style.display = review.date ? '' : 'none';
              }
            }
          });
          
          // Hide extra review elements
          reviewElements.forEach((el, index) => {
            (el as HTMLElement).style.display = index < reviews.length ? '' : 'none';
          });
        }
        
        // =====================================================
        // GALLERY SECTION LIVE UPDATES
        // =====================================================
        if (updates.content?.images !== undefined) {
          const images = updates.content.images as Array<{ 
            id?: string;
            url: string; 
            alt?: string;
          }>;
          const galleryGrid = element.querySelector('[data-gallery-grid]') as HTMLElement;
          let imageElements = element.querySelectorAll('[data-gallery-item-index]');
          
          // If we need more elements, create them
          if (galleryGrid && images.length > imageElements.length) {
            for (let i = imageElements.length; i < images.length; i++) {
              const newItem = document.createElement('div');
              newItem.className = 'relative aspect-square overflow-hidden rounded-lg group cursor-pointer';
              newItem.setAttribute('data-gallery-item-index', String(i));
              newItem.setAttribute('data-gallery-item-id', String(i));
              newItem.innerHTML = `
                <img src="" alt="" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-gallery-image />
                <div class="w-full h-full flex items-center justify-center bg-gray-100" data-gallery-placeholder>
                  <span class="text-gray-400">תמונה</span>
                </div>
              `;
              galleryGrid.appendChild(newItem);
            }
            imageElements = element.querySelectorAll('[data-gallery-item-index]');
          }
          
          images.forEach((image, index) => {
            const itemEl = imageElements[index] as HTMLElement;
            if (itemEl) {
              itemEl.style.display = '';
              const imgEl = itemEl.querySelector('[data-gallery-image]') as HTMLImageElement;
              const placeholder = itemEl.querySelector('[data-gallery-placeholder]') as HTMLElement;
              if (imgEl) {
                imgEl.src = image.url || '';
                imgEl.alt = image.alt || '';
                imgEl.style.display = image.url ? '' : 'none';
              }
              if (placeholder) {
                placeholder.style.display = image.url ? 'none' : '';
              }
            }
          });
          
          // Hide extra elements
          imageElements.forEach((el, index) => {
            (el as HTMLElement).style.display = index < images.length ? '' : 'none';
          });
        }
        
        // =====================================================
        // LOGOS SECTION LIVE UPDATES
        // =====================================================
        if (updates.content?.logos !== undefined) {
          const logos = updates.content.logos as Array<{ 
            id?: string;
            url: string; 
            name?: string;
            link?: string;
          }>;
          const logosGrid = element.querySelector('[data-logos-grid]') as HTMLElement;
          let logoElements = element.querySelectorAll('[data-logo-index]');
          
          // If we need more elements, create them
          if (logosGrid && logos.length > logoElements.length) {
            for (let i = logoElements.length; i < logos.length; i++) {
              const newItem = document.createElement('div');
              newItem.className = 'flex items-center justify-center p-4 bg-white rounded-lg';
              newItem.setAttribute('data-logo-index', String(i));
              newItem.setAttribute('data-logo-id', String(i));
              newItem.innerHTML = `
                <img src="" alt="" class="max-h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all" data-logo-image />
                <div class="w-24 h-12 flex items-center justify-center" data-logo-placeholder>
                  <span class="text-gray-400 text-xs">לוגו</span>
                </div>
              `;
              logosGrid.appendChild(newItem);
            }
            logoElements = element.querySelectorAll('[data-logo-index]');
          }
          
          logos.forEach((logo, index) => {
            const itemEl = logoElements[index] as HTMLElement;
            if (itemEl) {
              itemEl.style.display = '';
              const imgEl = itemEl.querySelector('[data-logo-image]') as HTMLImageElement;
              const placeholder = itemEl.querySelector('[data-logo-placeholder]') as HTMLElement;
              if (imgEl) {
                imgEl.src = logo.url || '';
                imgEl.alt = logo.name || '';
                imgEl.style.display = logo.url ? '' : 'none';
              }
              if (placeholder) {
                placeholder.style.display = logo.url ? 'none' : '';
              }
            }
          });
          
          // Hide extra elements
          logoElements.forEach((el, index) => {
            (el as HTMLElement).style.display = index < logos.length ? '' : 'none';
          });
        }
        
        // =====================================================
        // FAQ SECTION LIVE UPDATES
        // =====================================================
        if (updates.content?.items !== undefined && element.querySelector('[data-faq-items]')) {
          const items = updates.content.items as Array<{ 
            id?: string;
            question: string; 
            answer: string;
          }>;
          const faqContainer = element.querySelector('[data-faq-items]') as HTMLElement;
          let faqElements = element.querySelectorAll('[data-faq-item-index]');
          
          // If we need more elements, create them
          if (faqContainer && items.length > faqElements.length) {
            for (let i = faqElements.length; i < items.length; i++) {
              const newItem = document.createElement('div');
              newItem.className = 'border border-gray-200 rounded-lg';
              newItem.setAttribute('data-faq-item-index', String(i));
              newItem.setAttribute('data-faq-item-id', String(i));
              newItem.innerHTML = `
                <button class="w-full px-4 py-4 flex items-center justify-between text-right hover:bg-gray-50">
                  <span class="font-medium text-gray-900" data-faq-question>שאלה חדשה</span>
                  <svg class="w-5 h-5 text-gray-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="px-4 pb-4 text-gray-600" data-faq-answer style="display: none;">תשובה חדשה</div>
              `;
              faqContainer.appendChild(newItem);
            }
            faqElements = element.querySelectorAll('[data-faq-item-index]');
          }
          
          items.forEach((item, index) => {
            const itemEl = faqElements[index] as HTMLElement;
            if (itemEl) {
              itemEl.style.display = '';
              const questionEl = itemEl.querySelector('[data-faq-question]') as HTMLElement;
              const answerEl = itemEl.querySelector('[data-faq-answer]') as HTMLElement;
              if (questionEl) questionEl.textContent = item.question || '';
              if (answerEl) answerEl.textContent = item.answer || '';
            }
          });
          
          // Hide extra elements
          faqElements.forEach((el, index) => {
            (el as HTMLElement).style.display = index < items.length ? '' : 'none';
          });
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
          let bgMobile = element.querySelector('[data-bg-mobile]') as HTMLElement;
          const bgDesktop = element.querySelector('[data-bg-desktop]') as HTMLElement;
          const sectionId = (element as HTMLElement).getAttribute('data-section-id');
          
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
            if (!bgMobile) {
              bgMobile = document.createElement('div');
              // Don't use md:hidden class - use style tag instead
              bgMobile.className = 'absolute inset-0 bg-cover bg-center bg-no-repeat';
              bgMobile.setAttribute('data-bg-mobile', '');
              bgMobile.setAttribute('data-bg-type', 'image');
              // Insert after desktop image or at beginning
              if (bgDesktop) {
                bgDesktop.insertAdjacentElement('afterend', bgMobile);
              } else {
                element.insertBefore(bgMobile, element.firstChild);
              }
            }
            bgMobile.style.backgroundImage = `url("${updates.content.mobileImageUrl}")`;
            bgMobile.style.display = '';
          } else {
            // Remove mobile image
            if (bgMobile) {
              bgMobile.style.display = 'none';
            }
            // Remove the mobile-hiding style for desktop image
            if (sectionId) {
              const styleEl = document.getElementById(`mobile-image-style-${sectionId}`);
              if (styleEl) styleEl.remove();
            }
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
          const align = updates.settings.textAlign as string;
          
          // Find possible content containers
          const contentContainer = element.querySelector('[data-content-container]') as HTMLElement 
            || element.querySelector('.relative.z-10') as HTMLElement;
          if (contentContainer) {
            // Remove all alignment classes
            contentContainer.classList.remove('items-start', 'items-center', 'items-end', 'text-left', 'text-center', 'text-right');
            // Add new alignment
            // Note: stored value 'left' = user selected ימין (visual RIGHT)
            //       stored value 'right' = user selected שמאל (visual LEFT)
            if (align === 'left') {
              // visual RIGHT
              contentContainer.classList.add('items-end', 'text-right');
            } else if (align === 'right') {
              // visual LEFT
              contentContainer.classList.add('items-start', 'text-left');
            } else {
              contentContainer.classList.add('items-center', 'text-center');
            }
            
            // If full width, update padding based on alignment
            const isFullWidth = contentContainer.classList.contains('w-full') || !contentContainer.classList.contains('container');
            if (isFullWidth) {
              if (align === 'left') {
                // visual RIGHT - more padding on right
                contentContainer.style.paddingRight = '20px';
                contentContainer.style.paddingLeft = '24px';
              } else if (align === 'right') {
                // visual LEFT - more padding on left
                contentContainer.style.paddingLeft = '20px';
                contentContainer.style.paddingRight = '24px';
              } else {
                contentContainer.style.paddingLeft = '20px';
                contentContainer.style.paddingRight = '20px';
              }
            }
          }
          
          // Update alignment for grid items (reviews, features, etc.)
          // Note: stored value 'left' = user selected ימין (visual RIGHT)
          //       stored value 'right' = user selected שמאל (visual LEFT)
          const gridItems = element.querySelectorAll('[data-review-index], [data-feature-id], [data-faq-item-index]');
          gridItems.forEach(item => {
            const el = item as HTMLElement;
            el.classList.remove('text-left', 'text-center', 'text-right');
            // 'left' stored = visual right = text-right
            el.classList.add(align === 'left' ? 'text-right' : align === 'right' ? 'text-left' : 'text-center');
            
            // Update flex containers inside (ratings, author section)
            // For RTL: justify-start = visual right, justify-end = visual left
            const flexContainers = el.querySelectorAll('[data-review-rating], [data-review-author]');
            flexContainers.forEach(container => {
              const parent = container.parentElement;
              if (parent && parent.classList.contains('flex')) {
                parent.classList.remove('justify-start', 'justify-center', 'justify-end');
                // 'left' stored = visual right = justify-start (RTL)
                parent.classList.add(align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center');
              }
            });
            
            // Update rating container directly if it has flex
            const ratingEl = el.querySelector('[data-review-rating]')?.parentElement as HTMLElement;
            if (ratingEl && ratingEl.classList.contains('flex')) {
              ratingEl.classList.remove('justify-start', 'justify-center', 'justify-end');
              ratingEl.classList.add(align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center');
            }
          });
          
          // Note: Section header (title/subtitle) stays centered, not affected by content alignment
          // Only grid items inside the section are affected
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
        
        // Layout setting (grid vs slider)
        if (updates.settings?.layout !== undefined) {
          const layout = updates.settings.layout as string;
          const cols = (updates.settings?.columns as number) || 3;
          const reviewsGrid = element.querySelector('[data-reviews-grid]') as HTMLElement;
          
          if (reviewsGrid) {
            if (layout === 'slider') {
              // Switch to slider mode
              reviewsGrid.className = 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory';
              reviewsGrid.style.setProperty('scrollbar-width', 'none');
              reviewsGrid.setAttribute('data-layout', 'slider');
              
              // Update children to be slider items
              const items = reviewsGrid.children;
              for (let i = 0; i < items.length; i++) {
                const item = items[i] as HTMLElement;
                item.classList.add('flex-shrink-0', 'snap-start');
                item.style.width = `calc((100% - ${(cols - 1) * 24}px) / ${cols})`;
                item.style.minWidth = '280px';
              }
            } else {
              // Switch to grid mode
              const mobileCols = (updates.settings?.mobileColumns as number) || 1;
              reviewsGrid.className = `grid grid-cols-${mobileCols} md:grid-cols-${cols} gap-6`;
              reviewsGrid.style.removeProperty('scrollbar-width');
              reviewsGrid.setAttribute('data-layout', 'grid');
              
              // Remove slider classes from children
              const items = reviewsGrid.children;
              for (let i = 0; i < items.length; i++) {
                const item = items[i] as HTMLElement;
                item.classList.remove('flex-shrink-0', 'snap-start');
                item.style.width = '';
                item.style.minWidth = '';
              }
            }
          }
        }
        
        // Columns settings - update all grid types
        if (updates.settings?.columns !== undefined || updates.settings?.mobileColumns !== undefined) {
          const cols = (updates.settings?.columns as number) || 3;
          const mobileCols = (updates.settings?.mobileColumns as number) || 1;
          
          // Find all possible grid containers
          const grids = [
            element.querySelector('[data-items-grid]'),
            element.querySelector('[data-reviews-grid]'),
            element.querySelector('[data-gallery-grid]'),
            element.querySelector('[data-logos-grid]'),
            element.querySelector('[data-features-grid]'),
            element.querySelector('[data-faq-items]'),
          ].filter(Boolean) as HTMLElement[];
          
          grids.forEach(grid => {
            const gridEl = grid as HTMLElement;
            const isSlider = gridEl.getAttribute('data-layout') === 'slider';
            
            if (isSlider) {
              // Update slider item widths
              const items = gridEl.children;
              for (let i = 0; i < items.length; i++) {
                const item = items[i] as HTMLElement;
                item.style.width = `calc((100% - ${(cols - 1) * 24}px) / ${cols})`;
              }
            } else {
              // Remove existing grid classes
              gridEl.className = gridEl.className
                .replace(/grid-cols-\d+/g, '')
                .replace(/md:grid-cols-\d+/g, '')
                .replace(/lg:grid-cols-\d+/g, '')
                .trim();
              // Add new grid classes
              gridEl.classList.add(`grid-cols-${mobileCols}`, `md:grid-cols-${cols}`, 'grid', 'gap-6');
            }
          });
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
        
        if (updates.settings?.titleSize !== undefined || updates.settings?.titleSizeMobile !== undefined) {
          const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
          if (titleEl) {
            const desktopSize = updates.settings?.titleSize;
            const mobileSize = updates.settings?.titleSizeMobile;
            
            // Handle numeric values (from typography popover)
            if (typeof desktopSize === 'number' || typeof mobileSize === 'number') {
              // Use CSS custom properties for responsive sizing
              if (typeof desktopSize === 'number') {
                titleEl.style.setProperty('--title-size-desktop', `${desktopSize}px`);
              }
              if (typeof mobileSize === 'number') {
                titleEl.style.setProperty('--title-size-mobile', `${mobileSize}px`);
              }
              // Apply responsive font size using CSS variables
              const currentDesktop = titleEl.style.getPropertyValue('--title-size-desktop') || `${desktopSize || 48}px`;
              const currentMobile = titleEl.style.getPropertyValue('--title-size-mobile') || currentDesktop;
              
              // Check if viewport is mobile-sized (less than 768px)
              const isMobile = window.innerWidth < 768;
              titleEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
            } else if (typeof desktopSize === 'string') {
              // Handle string size keys for backward compatibility
              titleEl.style.fontSize = ''; // Clear inline style
              titleEl.classList.remove('text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 
                'md:text-2xl', 'md:text-3xl', 'md:text-4xl', 'md:text-5xl');
              const sizeMap: Record<string, string[]> = {
                'sm': ['text-xl', 'md:text-2xl'],
                'md': ['text-2xl', 'md:text-3xl'],
                'lg': ['text-3xl', 'md:text-4xl'],
                'xl': ['text-4xl', 'md:text-5xl'],
              };
              const classes = sizeMap[desktopSize] || sizeMap['lg'];
              titleEl.classList.add(...classes);
            }
          }
        }
        
        if (updates.settings?.titleWeight !== undefined) {
          const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
          if (titleEl) {
            titleEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold');
            titleEl.classList.add(`font-${updates.settings.titleWeight}`);
          }
        }
        
        // Title font family override
        if (updates.settings?.titleFontFamily !== undefined) {
          const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
          if (titleEl) {
            const fontFamily = updates.settings.titleFontFamily as string;
            titleEl.style.fontFamily = fontFamily ? `'${fontFamily}', sans-serif` : '';
          }
        }
        
        // Subtitle styling
        if (updates.settings?.subtitleColor !== undefined) {
          const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
          if (subtitleEl) {
            subtitleEl.style.color = updates.settings.subtitleColor as string;
          }
        }
        
        if (updates.settings?.subtitleSize !== undefined || updates.settings?.subtitleSizeMobile !== undefined) {
          const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
          if (subtitleEl) {
            const desktopSize = updates.settings?.subtitleSize;
            const mobileSize = updates.settings?.subtitleSizeMobile;
            
            // Handle numeric values (from typography popover)
            if (typeof desktopSize === 'number' || typeof mobileSize === 'number') {
              if (typeof desktopSize === 'number') {
                subtitleEl.style.setProperty('--subtitle-size-desktop', `${desktopSize}px`);
              }
              if (typeof mobileSize === 'number') {
                subtitleEl.style.setProperty('--subtitle-size-mobile', `${mobileSize}px`);
              }
              const currentDesktop = subtitleEl.style.getPropertyValue('--subtitle-size-desktop') || `${desktopSize || 18}px`;
              const currentMobile = subtitleEl.style.getPropertyValue('--subtitle-size-mobile') || currentDesktop;
              
              const isMobile = window.innerWidth < 768;
              subtitleEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
            } else if (typeof desktopSize === 'string') {
              // Handle string size keys for backward compatibility
              subtitleEl.style.fontSize = ''; // Clear inline style
              subtitleEl.classList.remove('text-sm', 'text-base', 'text-lg');
              const sizeMap: Record<string, string> = { 'sm': 'text-sm', 'md': 'text-base', 'lg': 'text-lg' };
              subtitleEl.classList.add(sizeMap[desktopSize] || 'text-lg');
            }
          }
        }
        
        if (updates.settings?.subtitleWeight !== undefined) {
          const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
          if (subtitleEl) {
            subtitleEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold');
            subtitleEl.classList.add(`font-${updates.settings.subtitleWeight}`);
          }
        }
        
        // Subtitle font family override
        if (updates.settings?.subtitleFontFamily !== undefined) {
          const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
          if (subtitleEl) {
            const fontFamily = updates.settings.subtitleFontFamily as string;
            subtitleEl.style.fontFamily = fontFamily ? `'${fontFamily}', sans-serif` : '';
          }
        }
        
        // Content/Text styling
        if (updates.settings?.textColor !== undefined) {
          const textEl = element.querySelector('[data-content-text]') as HTMLElement;
          if (textEl) {
            textEl.style.color = updates.settings.textColor as string;
          }
        }
        
        if (updates.settings?.textSize !== undefined || updates.settings?.textSizeMobile !== undefined) {
          const textEl = element.querySelector('[data-content-text]') as HTMLElement;
          if (textEl) {
            const desktopSize = updates.settings?.textSize;
            const mobileSize = updates.settings?.textSizeMobile;
            
            // Handle numeric values (from typography popover)
            if (typeof desktopSize === 'number' || typeof mobileSize === 'number') {
              if (typeof desktopSize === 'number') {
                textEl.style.setProperty('--text-size-desktop', `${desktopSize}px`);
              }
              if (typeof mobileSize === 'number') {
                textEl.style.setProperty('--text-size-mobile', `${mobileSize}px`);
              }
              const currentDesktop = textEl.style.getPropertyValue('--text-size-desktop') || `${desktopSize || 16}px`;
              const currentMobile = textEl.style.getPropertyValue('--text-size-mobile') || currentDesktop;
              
              const isMobile = window.innerWidth < 768;
              textEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
            } else if (typeof desktopSize === 'string') {
              // Handle string size keys for backward compatibility
              textEl.style.fontSize = ''; // Clear inline style
              textEl.classList.remove('prose-sm', 'prose', 'prose-lg');
              const sizeMap: Record<string, string> = { 'sm': 'prose-sm', 'md': 'prose', 'lg': 'prose-lg' };
              textEl.classList.add(sizeMap[desktopSize] || 'prose-sm');
            }
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
        
        // Button border radius
        if (updates.settings?.buttonBorderRadius !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            btnEl.style.borderRadius = `${updates.settings.buttonBorderRadius}px`;
          }
        }
        
        // Button border width
        if (updates.settings?.buttonBorderWidth !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            btnEl.style.borderWidth = `${updates.settings.buttonBorderWidth}px`;
          }
        }
        
        // Button BgColor alias (some panels use buttonBgColor instead of buttonBackgroundColor)
        if (updates.settings?.buttonBgColor !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            const color = updates.settings.buttonBgColor as string;
            btnEl.style.backgroundColor = color === 'transparent' ? 'transparent' : color;
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
        
        // =====================================================
        // FAQ SECTION - Question & Answer colors
        // =====================================================
        if (updates.settings?.questionColor !== undefined) {
          const questionEls = element.querySelectorAll('[data-faq-question]');
          questionEls.forEach((el) => {
            (el as HTMLElement).style.color = updates.settings.questionColor as string;
          });
        }
        
        if (updates.settings?.answerColor !== undefined) {
          const answerEls = element.querySelectorAll('[data-faq-answer]');
          answerEls.forEach((el) => {
            (el as HTMLElement).style.color = updates.settings.answerColor as string;
          });
        }
        
        // =====================================================
        // LOGOS SECTION - Logo height & grayscale
        // =====================================================
        if (updates.settings?.logoHeight !== undefined) {
          const logoImages = element.querySelectorAll('[data-logo-image]');
          logoImages.forEach((img) => {
            (img as HTMLElement).style.height = `${updates.settings.logoHeight}px`;
          });
          // Also update placeholder heights
          const placeholders = element.querySelectorAll('[data-logo-placeholder]');
          placeholders.forEach((el) => {
            (el as HTMLElement).style.height = `${updates.settings.logoHeight}px`;
            (el as HTMLElement).style.width = `${(updates.settings.logoHeight as number) * 2}px`;
          });
        }
        
        if (updates.settings?.grayscale !== undefined) {
          const logoWrappers = element.querySelectorAll('[data-logo-id]');
          const isGrayscale = updates.settings.grayscale as boolean;
          logoWrappers.forEach((wrapper) => {
            const el = wrapper as HTMLElement;
            const img = el.querySelector('[data-logo-image]') as HTMLElement;
            if (img) {
              if (isGrayscale) {
                el.classList.add('opacity-60');
                img.classList.add('grayscale');
              } else {
                el.classList.remove('opacity-60');
                img.classList.remove('grayscale');
              }
            }
          });
        }
        
        // =====================================================
        // NEWSLETTER SECTION - Input border color
        // =====================================================
        if (updates.settings?.inputBorderColor !== undefined) {
          const inputEl = element.querySelector('[data-content-placeholder]') as HTMLElement;
          if (inputEl) {
            inputEl.style.borderColor = updates.settings.inputBorderColor as string;
          }
        }
        
        // =====================================================
        // FEATURES SECTION - Feature title/description styling
        // =====================================================
        if (updates.settings?.featureTitleColor !== undefined) {
          const featureTitles = element.querySelectorAll('[data-feature-title]');
          featureTitles.forEach((el) => {
            (el as HTMLElement).style.color = updates.settings.featureTitleColor as string;
          });
        }
        
        if (updates.settings?.featureTitleSize !== undefined) {
          const featureTitles = element.querySelectorAll('[data-feature-title]');
          const sizeMap: Record<string, string[]> = {
            'sm': ['text-base'],
            'md': ['text-lg'],
            'lg': ['text-xl'],
          };
          featureTitles.forEach((el) => {
            const titleEl = el as HTMLElement;
            titleEl.classList.remove('text-base', 'text-lg', 'text-xl');
            const classes = sizeMap[updates.settings.featureTitleSize as string] || sizeMap['lg'];
            titleEl.classList.add(...classes);
          });
        }
        
        if (updates.settings?.featureTitleWeight !== undefined) {
          const featureTitles = element.querySelectorAll('[data-feature-title]');
          featureTitles.forEach((el) => {
            const titleEl = el as HTMLElement;
            titleEl.classList.remove('font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold');
            titleEl.classList.add(`font-${updates.settings.featureTitleWeight}`);
          });
        }
        
        if (updates.settings?.featureDescColor !== undefined) {
          const featureDescs = element.querySelectorAll('[data-feature-description]');
          featureDescs.forEach((el) => {
            (el as HTMLElement).style.color = updates.settings.featureDescColor as string;
          });
        }
        
        // =====================================================
        // REVIEWS SECTION - Card style
        // =====================================================
        if (updates.settings?.cardStyle !== undefined) {
          const reviewCards = element.querySelectorAll('[data-review-id]');
          const newStyle = updates.settings.cardStyle as string;
          reviewCards.forEach((card) => {
            const el = card as HTMLElement;
            // Remove all style classes
            el.classList.remove('bg-white', 'p-6', 'rounded-lg', 'shadow-sm', 'border', 'border-gray-100', 
              'p-4', 'border-b', 'text-center');
            // Add new style classes
            if (newStyle === 'cards') {
              el.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-sm', 'border', 'border-gray-100');
            } else if (newStyle === 'minimal') {
              el.classList.add('p-4', 'border-b', 'border-gray-100');
            } else if (newStyle === 'quotes') {
              el.classList.add('p-6', 'text-center');
            }
          });
        }
        
        // =====================================================
        // BANNER_SMALL SECTION - Size & Button style
        // =====================================================
        if (updates.settings?.size !== undefined) {
          const el = element as HTMLElement;
          el.classList.remove('py-3', 'py-5', 'py-8');
          const sizeMap = { 'small': 'py-3', 'medium': 'py-5', 'large': 'py-8' };
          el.classList.add(sizeMap[updates.settings.size as keyof typeof sizeMap] || 'py-5');
        }
        
        if (updates.settings?.buttonStyle !== undefined) {
          const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
          if (btnEl) {
            const style = updates.settings.buttonStyle as string;
            if (style === 'none') {
              btnEl.style.display = 'none';
            } else {
              btnEl.style.display = '';
              if (style === 'filled') {
                btnEl.style.backgroundColor = updates.settings?.buttonBackgroundColor as string || '#ffffff';
              } else {
                btnEl.style.backgroundColor = 'transparent';
              }
            }
          }
        }
        
        // =====================================================
        // QUOTE_BANNER SECTION - Text style & Parallax
        // =====================================================
        if (updates.settings?.textStyle !== undefined) {
          const quoteEl = element.querySelector('[data-section-quote]') as HTMLElement;
          if (quoteEl) {
            const style = updates.settings.textStyle as string;
            quoteEl.classList.remove('font-serif', 'font-sans', 'italic');
            if (style === 'serif') {
              quoteEl.classList.add('font-serif');
            } else if (style === 'italic') {
              quoteEl.classList.add('font-serif', 'italic');
            } else {
              quoteEl.classList.add('font-sans');
            }
          }
        }
        
        if (updates.settings?.parallax !== undefined) {
          const bgDesktop = element.querySelector('[data-bg-desktop]') as HTMLElement;
          const bgMobile = element.querySelector('[data-bg-mobile]') as HTMLElement;
          const useParallax = updates.settings.parallax as boolean;
          if (bgDesktop) {
            bgDesktop.style.backgroundAttachment = useParallax ? 'fixed' : 'scroll';
          }
          // Mobile usually doesn't support parallax, keep it scroll
          if (bgMobile) {
            bgMobile.style.backgroundAttachment = 'scroll';
          }
        }
        
        // =====================================================
        // TEXT_BLOCK / FAQ SECTION - Max width & Padding Y
        // =====================================================
        if (updates.settings?.maxWidth !== undefined) {
          const el = element as HTMLElement;
          const inner = el.querySelector('.mx-auto') as HTMLElement;
          if (inner) {
            inner.classList.remove('max-w-sm', 'max-w-md', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-7xl');
            const maxWidthMap: Record<string, string> = {
              'sm': 'max-w-sm',
              'md': 'max-w-md',
              'lg': 'max-w-2xl',
              'xl': 'max-w-4xl',
              'full': 'max-w-7xl',
            };
            inner.classList.add(maxWidthMap[updates.settings.maxWidth as string] || 'max-w-2xl');
          }
        }
        
        if (updates.settings?.paddingY !== undefined) {
          const el = element as HTMLElement;
          el.classList.remove('py-8', 'py-16', 'py-24');
          const paddingMap: Record<string, string> = {
            'small': 'py-8',
            'medium': 'py-16',
            'large': 'py-24',
          };
          el.classList.add(paddingMap[updates.settings.paddingY as string] || 'py-16');
        }
        
        // =====================================================
        // GALLERY SECTION - Columns & Gap
        // =====================================================
        if (updates.settings?.gap !== undefined) {
          const grid = element.querySelector('[data-gallery-grid]') as HTMLElement;
          if (grid) {
            const gap = updates.settings.gap as number;
            const gapClasses = { 0: 'gap-0', 2: 'gap-2', 4: 'gap-4', 6: 'gap-6', 8: 'gap-8' };
            grid.classList.remove('gap-0', 'gap-2', 'gap-4', 'gap-6', 'gap-8');
            grid.classList.add(gapClasses[gap as keyof typeof gapClasses] || 'gap-4');
          }
        }
        
        if (updates.settings?.aspectRatio !== undefined) {
          const galleryItems = element.querySelectorAll('[data-gallery-item-id]');
          const aspectRatio = updates.settings.aspectRatio as string;
          galleryItems.forEach((item) => {
            const el = item as HTMLElement;
            el.classList.remove('aspect-square', 'aspect-[4/3]', 'aspect-video');
            if (aspectRatio === 'square') el.classList.add('aspect-square');
            else if (aspectRatio === '4:3') el.classList.add('aspect-[4/3]');
            else if (aspectRatio === '16:9') el.classList.add('aspect-video');
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
          
          // Get the grid container and existing items (try both data-items-grid and data-products-grid)
          const grid = (element.querySelector('[data-items-grid]') || element.querySelector('[data-products-grid]')) as HTMLElement;
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
              const isFeaturedItems = sectionName === 'פריטים מובילים' || sectionName === 'פריטים מובחרים' || element.querySelector('[data-products-grid]');
              
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
              } else if (isFeaturedItems) {
                // Create new featured items card
                const newCard = document.createElement('a');
                newCard.href = item.link || '#';
                newCard.className = 'group block';
                newCard.setAttribute('data-item-id', item.id);
                newCard.innerHTML = `
                  <div class="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                    ${item.imageUrl 
                      ? `<img src="${item.imageUrl}" alt="${item.name || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`
                      : `<svg class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>`
                    }
                  </div>
                  <h3 class="font-medium text-center text-gray-800" data-item-name>${item.name || 'פריט חדש'}</h3>
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
        // FEATURES SECTION UPDATES
        // =====================================================
        if (updates.content?.features !== undefined) {
          const features = updates.content.features as Array<{
            id?: string;
            icon?: string;
            title: string;
            description?: string;
          }>;
          
          // Icon paths map
          const iconPaths: Record<string, string> = {
            truck: 'M1 3h15v13H1zm15 5h4l3 3v5h-7m-13 0a2.5 2.5 0 105 0m8 0a2.5 2.5 0 105 0',
            refresh: 'M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16',
            shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
            check: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
            message: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
            sparkles: 'M12 3l-1.9 5.8a2 2 0 01-1.3 1.3L3 12l5.8 1.9a2 2 0 011.3 1.3L12 21l1.9-5.8a2 2 0 011.3-1.3L21 12l-5.8-1.9a2 2 0 01-1.3-1.3L12 3zM5 3v4M19 17v4M3 5h4M17 19h4',
            heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
            star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            gift: 'M20 12v10H4V12m16-5H4v5h16V7zm-8 15V7m0 0H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
            clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
            percent: 'M19 5L5 19M9 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM20 17.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
            award: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
            zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
          };
          
          const featuresGrid = element.querySelector('[data-features-grid]') as HTMLElement;
          if (featuresGrid) {
            let featureEls = featuresGrid.querySelectorAll('[data-feature-id]');
            
            // If we need more elements, create them
            if (features.length > featureEls.length) {
              for (let i = featureEls.length; i < features.length; i++) {
                const newFeature = document.createElement('div');
                newFeature.className = 'flex flex-col items-center text-center space-y-3';
                newFeature.setAttribute('data-feature-id', String(i));
                newFeature.innerHTML = `
                  <div data-feature-icon>
                    <div class="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center" style="background-color: rgba(0,0,0,0.05)">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="${iconPaths['truck']}" />
                      </svg>
                    </div>
                  </div>
                  <h3 class="font-medium text-sm md:text-base" data-feature-title>פיצ'ר חדש</h3>
                  <p class="text-xs md:text-sm text-gray-500" data-feature-description>תיאור</p>
                `;
                featuresGrid.appendChild(newFeature);
              }
              featureEls = featuresGrid.querySelectorAll('[data-feature-id]');
            }
            
            features.forEach((feature, index) => {
              const featureEl = featureEls[index] as HTMLElement;
              if (featureEl) {
                featureEl.style.display = '';
                
                // Update title
                const titleEl = featureEl.querySelector('[data-feature-title]') as HTMLElement;
                if (titleEl && feature.title !== undefined) {
                  titleEl.textContent = feature.title;
                }
                
                // Update description
                const descEl = featureEl.querySelector('[data-feature-description]') as HTMLElement;
                if (descEl) {
                  descEl.textContent = feature.description || '';
                  descEl.style.display = feature.description ? '' : 'none';
                }
                
                // Update icon
                if (feature.icon) {
                  const iconContainer = featureEl.querySelector('[data-feature-icon]') as HTMLElement;
                  if (iconContainer) {
                    const svgEl = iconContainer.querySelector('svg');
                    if (svgEl) {
                      // Update existing SVG path
                      const pathEl = svgEl.querySelector('path');
                      if (pathEl && iconPaths[feature.icon]) {
                        pathEl.setAttribute('d', iconPaths[feature.icon]);
                      }
                    } else if (iconPaths[feature.icon]) {
                      // Replace emoji/content with new SVG icon
                      iconContainer.innerHTML = `
                        <div class="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center" style="background-color: rgba(0,0,0,0.05)">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="${iconPaths[feature.icon]}" />
                          </svg>
                        </div>
                      `;
                    }
                  }
                }
              }
            });
            
            // Hide extra elements
            featureEls.forEach((el, index) => {
              (el as HTMLElement).style.display = index < features.length ? '' : 'none';
            });
          }
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
        // PRODUCT LIMIT UPDATES (תומך בשני השדות לתאימות)
        // =====================================================
          if (updates.content?.limit !== undefined || updates.content?.displayLimit !== undefined) {
            const limit = (updates.content?.limit || updates.content?.displayLimit) as number;
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
        const { sectionId, sectionType, title, subtitle, afterSectionId, content, settings } = event.data;
        console.log('[SECTION_ADD] Adding section:', sectionType, sectionId);
        
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
          content_slider: 'סליידר תוכן',
          quote_banner: 'באנר ציטוט',
          featured_items: 'פריטים מובילים',
        };
        placeholder.dataset.sectionName = sectionNames[sectionType] || sectionType;
        
        // Generate type-specific placeholder HTML
        let html = '';
        switch (sectionType) {
          case 'image_text': {
            const imgTextSettings = event.data.settings || {};
            const imagePosition = (imgTextSettings?.imagePosition as string) || 'right';
            const imageWidth = (imgTextSettings?.imageWidth as string) || '50%';
            const verticalAlign = (imgTextSettings?.verticalAlign as string) || 'center';
            const imgTextFlexDir = imagePosition === 'right' ? 'row' : 'row-reverse';
            const vertAlignClass = verticalAlign === 'top' ? 'items-start' : verticalAlign === 'bottom' ? 'items-end' : 'items-center';
            
            placeholder.className = 'py-12 md:py-0';
            // Store values in dataset for handler to read
            placeholder.dataset.imagePosition = imagePosition;
            placeholder.dataset.imageWidth = imageWidth;
            
            html = `
              <style data-handler-style>
                [data-section-id="${sectionId}"] [data-image-text-container] {
                  flex-direction: column;
                }
                @media (min-width: 768px) {
                  [data-section-id="${sectionId}"] [data-image-text-container] {
                    flex-direction: ${imgTextFlexDir};
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
              </style>
              <div class="flex flex-col min-h-[400px]" data-image-text-container>
                <div class="w-full relative overflow-hidden" style="min-height: 300px;" data-image-container>
                  <img src="${content?.imageUrl || ''}" alt="" class="w-full h-full object-cover absolute inset-0 ${content?.imageUrl ? '' : 'hidden'}" data-content-image />
                  <div class="w-full h-full bg-gray-100 flex items-center justify-center ${content?.imageUrl ? 'hidden' : ''}" data-image-placeholder>
                    <svg class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="w-full flex ${vertAlignClass} p-8 md:p-12 lg:p-16" data-text-container>
                  <div class="max-w-lg mx-auto">
                    <h2 class="text-3xl md:text-4xl font-light tracking-wide mb-4 ${title ? '' : 'hidden'}" style="color: ${imgTextSettings?.titleColor || '#000000'};" data-section-title>${title || ''}</h2>
                    <p class="text-lg mb-4 ${subtitle ? '' : 'hidden'}" style="color: ${imgTextSettings?.subtitleColor || '#6b7280'};" data-section-subtitle>${subtitle || ''}</p>
                    <div class="leading-relaxed mb-6 prose prose-sm" style="color: ${imgTextSettings?.textColor || '#4b5563'};" data-content-text>${content?.text || '<p>הקלידו טקסט כאן...</p>'}</div>
                    <a href="${content?.buttonLink || '#'}" class="inline-block px-8 py-3 border transition-colors text-sm tracking-wider uppercase ${content?.buttonText ? '' : 'hidden'}" style="color: #000; background-color: transparent; border-color: #000;" data-section-button>${content?.buttonText || ''}</a>
                  </div>
                </div>
              </div>
            `;
            break;
          }
          
          case 'video_banner':
            const videoUrl = (content?.videoUrl as string) || '';
            const hasVideoMedia = !!(videoUrl || content?.imageUrl);
            const videoOverlay = (event.data.settings?.overlay as number) ?? 0.4;
            const videoMinHeight = (event.data.settings?.minHeight as number) || 90;
            const videoMinHeightUnit = (event.data.settings?.minHeightUnit as string) || 'vh';
            const videoAutoplay = (event.data.settings?.autoplay as boolean) !== false;
            const videoMuted = (event.data.settings?.muted as boolean) !== false;
            const videoLoop = (event.data.settings?.loop as boolean) !== false;
            const videoControls = (event.data.settings?.controls as boolean) || false;
            
            placeholder.className = 'relative overflow-hidden';
            placeholder.style.minHeight = `${videoMinHeight}${videoMinHeightUnit}`;
            placeholder.style.backgroundColor = '#000';
            placeholder.style.marginTop = '0';
            placeholder.style.marginBottom = '0';
            html = `
              ${videoUrl ? `
              <video 
                src="${videoUrl}" 
                ${videoAutoplay ? 'autoplay' : ''} 
                ${videoMuted ? 'muted' : ''} 
                ${videoLoop ? 'loop' : ''} 
                ${videoControls ? 'controls' : ''} 
                playsinline 
                class="absolute inset-0 w-full h-full object-cover"
                data-content-video
              ></video>
              ` : ''}
              ${!videoUrl && content?.imageUrl ? `
              <img src="${content.imageUrl}" class="absolute inset-0 w-full h-full object-cover" data-content-image />
              ` : ''}
              <div class="absolute inset-0 flex flex-col justify-center items-center text-center" style="background-color: rgba(0,0,0,${videoOverlay});" data-overlay data-content-container>
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

          case 'banner':
            // באנר תמונה לחיץ - תמונה בלבד, גובה לפי התמונה
            const bannerImageUrl = content?.imageUrl || '';
            const bannerMobileImageUrl = content?.mobileImageUrl || '';
            const bannerLinkUrl = content?.linkUrl || '';
            const bannerAltText = content?.altText || 'באנר';
            placeholder.className = 'w-full';
            placeholder.style.backgroundColor = settings?.backgroundColor || 'transparent';
            
            if (!bannerImageUrl && !bannerMobileImageUrl) {
              // אין תמונה - מציג placeholder
              html = `
                <div class="w-full flex items-center justify-center py-20 bg-gray-100" data-banner-placeholder>
                  <p class="text-gray-400 text-sm">הוסף תמונה לבאנר</p>
                </div>
              `;
            } else {
              // יש תמונה - מציג את התמונה כ-img (לא רקע)
              const imgStyle = `width: 100%; height: auto; display: block;${settings?.borderRadius ? ` border-radius: ${settings.borderRadius}px;` : ''}`;
              const imgHtml = `
                <img 
                  src="${bannerImageUrl}" 
                  alt="${bannerAltText}" 
                  style="${imgStyle}"
                  data-banner-image
                />
              `;
              
              if (bannerLinkUrl) {
                html = `<a href="${bannerLinkUrl}" class="block w-full" data-banner-link>${imgHtml}</a>`;
              } else {
                html = imgHtml;
              }
            }
            break;

          case 'hero':
          case 'hero_premium':
          case 'content_block':
          case 'text_block':
            // All content block types use the same structure
            const hasContentBlockImage = !!(content?.imageUrl || content?.mobileImageUrl || content?.videoUrl);
            const contentBlockBgColor = hasContentBlockImage ? '#000' : '#ffffff';
            const textColor = hasContentBlockImage ? '#ffffff' : '#000000';
            placeholder.className = 'relative overflow-hidden flex flex-col';
            placeholder.style.minHeight = hasContentBlockImage ? '90vh' : '400px';
            placeholder.style.backgroundColor = contentBlockBgColor;
            html = `
              ${content?.imageUrl ? `<div class="absolute inset-0 bg-cover bg-center" data-bg-desktop data-bg-type="image" style="background-size: cover; background-position: center; background-image: url('${content.imageUrl}');"></div>` : ''}
              ${hasContentBlockImage ? `<div class="absolute inset-0" data-overlay style="background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);"></div>` : ''}
              <div class="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6" data-content-container>
                <div class="w-full" data-content-wrapper style="max-width: 1200px; margin: 0 auto;">
                  <h1 class="${hasContentBlockImage ? 'font-display text-6xl md:text-8xl font-extralight tracking-[0.3em] uppercase' : 'text-3xl md:text-4xl font-bold'} mb-4" data-section-title style="color: ${textColor}; ${title ? '' : 'display:none'}">${title || ''}</h1>
                  <p class="text-lg opacity-80 mb-6" data-section-subtitle style="color: ${textColor}; ${subtitle ? '' : 'display:none'}">${subtitle || ''}</p>
                  <div class="prose mx-auto mb-8" data-content-text style="color: ${textColor}; ${content?.text ? '' : 'display:none'}">${content?.text || ''}</div>
                  <a href="${content?.buttonLink || '#'}" class="inline-block px-8 py-3 ${hasContentBlockImage ? 'bg-white text-black' : 'border border-current'} uppercase tracking-wider text-sm transition-all" data-section-button style="${content?.buttonText ? '' : 'display:none'}">${content?.buttonText || ''}</a>
                </div>
              </div>
              ${hasContentBlockImage ? `
              <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" data-scroll-arrow>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1">
                  <path d="M12 5v14M19 12l-7 7-7-7"/>
                </svg>
              </div>
              ` : ''}
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
            placeholder.dataset.sectionName = 'חוזקות';
            // Use content features if provided, otherwise defaults
            const featuresData = content?.features || [
              { icon: 'truck', title: 'משלוח מהיר', description: 'עד 3 ימי עסקים' },
              { icon: 'refresh', title: 'החזרות חינם', description: 'עד 30 יום' },
              { icon: 'message', title: 'תמיכה 24/7', description: 'בכל שאלה' },
              { icon: 'sparkles', title: 'איכות מובטחת', description: '100% שביעות רצון' }
            ];
            // SVG icon paths
            const featureIconPaths: Record<string, string> = {
              truck: 'M1 3h15v13H1zm15 5h4l3 3v5h-7m-13 0a2.5 2.5 0 105 0m8 0a2.5 2.5 0 105 0',
              refresh: 'M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16',
              shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
              check: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
              message: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
              sparkles: 'M12 3l-1.9 5.8a2 2 0 01-1.3 1.3L3 12l5.8 1.9a2 2 0 011.3 1.3L12 21l1.9-5.8a2 2 0 011.3-1.3L21 12l-5.8-1.9a2 2 0 01-1.3-1.3L12 3zM5 3v4M19 17v4M3 5h4M17 19h4',
              heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
              star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
              gift: 'M20 12v10H4V12m16-5H4v5h16V7zm-8 15V7m0 0H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
              clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
            };
            html = `
              <div class="max-w-7xl mx-auto">
                <div class="text-center mb-10">
                  <h2 class="text-2xl md:text-3xl font-light tracking-wide mb-3 ${title ? '' : 'hidden'}" data-section-title>${title || ''}</h2>
                  <p class="text-sm md:text-base ${subtitle ? '' : 'hidden'}" style="color: #4b5563;" data-section-subtitle>${subtitle || ''}</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8" data-features-grid>
                  ${featuresData.map((f: { icon?: string; title: string; description?: string }, i: number) => `
                    <div class="py-6 px-4 text-center ${i < featuresData.length - 1 ? 'md:border-l md:border-gray-100' : ''}" data-feature-id="${i}">
                      <div class="mb-4 flex justify-center" data-feature-icon>
                        <div class="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center" style="background-color: rgba(0,0,0,0.05)">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="${featureIconPaths[f.icon || 'sparkles'] || featureIconPaths.sparkles}" />
                          </svg>
                        </div>
                      </div>
                      <h3 class="font-medium mb-1" style="color: #111827;" data-feature-title>${f.title}</h3>
                      <p class="text-sm" style="color: #6b7280;" data-feature-description>${f.description || ''}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;
          
          case 'products':
            const prodColumns = (event.data.settings?.columns as number) || 4;
            const prodMobileColumns = (event.data.settings?.mobileColumns as number) || 2;
            const prodGap = (event.data.settings?.gap as number) || 24;
            const prodDisplayLimit = (content?.displayLimit as number) || 8;
            const prodShowDivider = event.data.settings?.showDivider !== false;
            const prodDividerColor = (event.data.settings?.dividerColor as string) || '#C9A962';
            const prodDividerHeight = (event.data.settings?.dividerHeight as number) || 2;
            
            placeholder.className = 'py-16 bg-white';
            placeholder.dataset.sectionName = 'מוצרים';
            
            // Inject scoped CSS for responsive columns
            const prodStyleId = `products-placeholder-style-${sectionId}`;
            let prodStyleEl = document.getElementById(prodStyleId);
            if (!prodStyleEl) {
              prodStyleEl = document.createElement('style');
              prodStyleEl.id = prodStyleId;
              document.head.appendChild(prodStyleEl);
            }
            prodStyleEl.textContent = `
              [data-section-id="${sectionId}"] [data-products-grid] {
                grid-template-columns: repeat(${prodMobileColumns}, minmax(0, 1fr));
              }
              @media (min-width: 1024px) {
                [data-section-id="${sectionId}"] [data-products-grid] {
                  grid-template-columns: repeat(${prodColumns}, minmax(0, 1fr));
                }
              }
            `;
            
            html = `
              <div class="max-w-7xl mx-auto px-6" data-content-wrapper>
                <p class="text-center text-gray-400 text-xs tracking-[0.2em] uppercase mb-4 ${subtitle ? '' : 'hidden'}" data-section-subtitle>${subtitle || ''}</p>
                <h2 class="font-display text-2xl md:text-3xl text-center font-light tracking-[0.15em] uppercase ${title ? '' : 'hidden'}" data-section-title>${title || 'מוצרים'}</h2>
                <div class="w-16 mt-6 mb-8 mx-auto ${!title || !prodShowDivider ? 'hidden' : ''}" style="background-color: ${prodDividerColor}; height: ${prodDividerHeight}px" data-section-divider></div>
                <div class="grid mt-12" style="gap: ${prodGap}px" data-products-grid data-columns="${prodColumns}" data-mobile-columns="${prodMobileColumns}">
                  ${Array.from({length: Math.min(prodDisplayLimit, 8)}, (_, i) => `
                    <div class="group" data-product-index="${i}">
                      <div class="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p class="text-sm text-gray-800 text-center">שם מוצר</p>
                      <p class="font-medium text-center">₪99</p>
                    </div>
                  `).join('')}
                </div>
                <p class="text-center text-gray-400 text-sm mt-6">המוצרים יוצגו מהחנות לאחר שמירה</p>
              </div>
            `;
            break;
          
          case 'featured_items':
            const featColumns = (event.data.settings?.columns as number) || 4;
            const featMobileColumns = (event.data.settings?.mobileColumns as number) || 2;
            const featGap = (event.data.settings?.gap as number) || 24;
            const featItems = (content?.items as Array<{id: string; name: string; imageUrl?: string; link?: string}>) || [];
            
            placeholder.className = 'py-16 bg-white';
            placeholder.dataset.sectionName = 'פריטים מובילים';
            
            // Inject scoped CSS for responsive columns
            const featStyleId = `featured-items-placeholder-style-${sectionId}`;
            let featStyleEl = document.getElementById(featStyleId);
            if (!featStyleEl) {
              featStyleEl = document.createElement('style');
              featStyleEl.id = featStyleId;
              document.head.appendChild(featStyleEl);
            }
            featStyleEl.textContent = `
              [data-section-id="${sectionId}"] [data-products-grid] {
                grid-template-columns: repeat(${featMobileColumns}, minmax(0, 1fr));
              }
              @media (min-width: 1024px) {
                [data-section-id="${sectionId}"] [data-products-grid] {
                  grid-template-columns: repeat(${featColumns}, minmax(0, 1fr));
                }
              }
            `;
            
            // Generate items - use provided items or placeholders
            const itemsToShow = featItems.length > 0 
              ? featItems 
              : [
                  { id: '1', name: 'מוצר א׳', imageUrl: '' },
                  { id: '2', name: 'מוצר ב׳', imageUrl: '' },
                  { id: '3', name: 'מוצר ג׳', imageUrl: '' },
                  { id: '4', name: 'מוצר ד׳', imageUrl: '' },
                ];
            
            html = `
              <div class="max-w-[1200px] mx-auto px-4 md:px-10" data-content-wrapper>
                <div class="mb-12 text-center" style="${(title || subtitle) ? '' : 'display:none'}">
                  <h2 class="text-3xl md:text-4xl font-bold mb-3" style="${title ? '' : 'display:none'}" data-section-title>${title || ''}</h2>
                  <p class="text-gray-600" style="${subtitle ? '' : 'display:none'}" data-section-subtitle>${subtitle || ''}</p>
                </div>
                <div class="grid" style="gap: ${featGap}px" data-products-grid data-columns="${featColumns}" data-mobile-columns="${featMobileColumns}">
                  ${itemsToShow.map((item, i) => `
                    <a href="#" class="group block" data-item-id="${item.id}">
                      <div class="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                        ${item.imageUrl 
                          ? `<img src="${item.imageUrl}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`
                          : `<svg class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>`
                        }
                      </div>
                      <h3 class="font-medium text-center text-gray-800" data-item-name>${item.name}</h3>
                    </a>
                  `).join('')}
                </div>
              </div>
            `;
            break;
          
          case 'categories':
            const catCategories = (event.data.categories as Array<{id: string; name: string; slug: string; imageUrl?: string}>) || [];
            const catDisplayLimit = (content?.displayLimit as number) || 6;
            const catColumns = (event.data.settings?.columns as number) || 4;
            const catSelectionMode = (content?.selectionMode as string) || 'all';
            const catSelectedIds = (content?.categoryIds as string[]) || [];
            
            placeholder.className = 'py-16 bg-white';
            placeholder.dataset.sectionName = 'רשימת קטגוריות';
            placeholder.dataset.selectionMode = catSelectionMode;
            
            if (catCategories.length > 0) {
              // Render ALL categories, but hide/show based on selection mode and limit
              html = `
                <div class="max-w-7xl mx-auto px-6">
                  <h2 class="font-display text-2xl md:text-3xl text-center font-light tracking-[0.15em] uppercase mb-4 ${title ? '' : 'hidden'}" data-section-title>${title || ''}</h2>
                  <p class="text-center text-gray-400 text-xs tracking-[0.2em] uppercase ${subtitle ? 'mb-20' : 'hidden'}" data-section-subtitle>${subtitle || ''}</p>
                  <div class="grid grid-cols-2 md:grid-cols-${catColumns} gap-8" data-categories-grid>
                    ${catCategories.map((cat, i) => {
                      // Determine if category should be visible
                      let shouldShow = false;
                      if (catSelectionMode === 'manual' && catSelectedIds.length > 0) {
                        shouldShow = catSelectedIds.includes(cat.id);
                      } else {
                        shouldShow = i < catDisplayLimit;
                      }
                      const displayStyle = shouldShow ? '' : 'display: none;';
                      const orderStyle = catSelectionMode === 'manual' ? `order: ${catSelectedIds.indexOf(cat.id) >= 0 ? catSelectedIds.indexOf(cat.id) : 999};` : '';
                      
                      return `
                      <a href="#" class="group text-center animate-slide-up" style="animation-delay: ${i * 100}ms; ${displayStyle} ${orderStyle}" data-category-id="${cat.id}">
                        <div class="aspect-[3/4] bg-gray-100 mb-6 overflow-hidden" data-category-image-container data-original-image="${cat.imageUrl || ''}">
                          ${cat.imageUrl 
                            ? `<img src="${cat.imageUrl}" alt="${cat.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-category-image />`
                            : `<div class="w-full h-full bg-gradient-to-b from-gray-50 to-gray-200 group-hover:scale-105 transition-transform duration-700" data-category-placeholder></div>`
                          }
                        </div>
                        <span class="text-xs tracking-[0.25em] uppercase text-gray-800 group-hover:text-black transition-colors">${cat.name}</span>
                      </a>
                    `}).join('')}
                  </div>
                </div>
              `;
            } else {
              html = `
                <div class="container mx-auto px-4">
                  <h2 class="text-2xl md:text-3xl font-light tracking-wide text-center mb-8 ${title ? '' : 'hidden'}" data-section-title>${title || 'קטגוריות'}</h2>
                  <div class="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                    <p class="text-gray-400 text-sm">אין קטגוריות בחנות</p>
                  </div>
                </div>
              `;
            }
            break;
          
          case 'gallery':
            const galleryImages = (content?.images as Array<{ id?: string; url: string; alt?: string }>) || [];
            const galleryCols = (event.data.settings?.columns as number) || 4;
            const galleryMobileCols = (event.data.settings?.mobileColumns as number) || 2;
            placeholder.className = 'py-16 bg-white';
            placeholder.dataset.sectionName = 'גלריה';
            html = `
              <div class="max-w-7xl mx-auto px-4">
                <div class="text-center mb-12">
                  <h2 class="text-2xl md:text-3xl font-display font-light tracking-wide mb-3" data-section-title style="display: ${title ? '' : 'none'}">${title || ''}</h2>
                  <p class="text-gray-600 text-sm md:text-base max-w-2xl mx-auto" data-section-subtitle style="display: ${subtitle ? '' : 'none'}">${subtitle || ''}</p>
                </div>
                <div class="grid grid-cols-${galleryMobileCols} md:grid-cols-${galleryCols} gap-4" data-gallery-grid>
                  ${(galleryImages.length > 0 ? galleryImages : [{id:'1',url:'',alt:''},{id:'2',url:'',alt:''},{id:'3',url:'',alt:''},{id:'4',url:'',alt:''}]).map((image, index) => `
                    <div class="relative aspect-square overflow-hidden rounded-lg group cursor-pointer" data-gallery-item-index="${index}" data-gallery-item-id="${image.id || index}">
                      <img src="${image.url || ''}" alt="${image.alt || ''}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-gallery-image style="display: ${image.url ? '' : 'none'}" />
                      <div class="w-full h-full flex items-center justify-center bg-gray-100" data-gallery-placeholder style="display: ${image.url ? 'none' : ''}">
                        <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;

          case 'split_banner': {
            placeholder.className = 'grid md:grid-cols-2';
            const defaultRight = { title: 'נשים', imageUrl: 'https://3lwnd3ucppklouqs.public.blob.vercel-storage.com/quickshop/stores/noir-fashion/x0gDz-4TUp.webp', link: '/category/women' };
            const defaultLeft = { title: 'גברים', imageUrl: 'https://3lwnd3ucppklouqs.public.blob.vercel-storage.com/quickshop/stores/noir-fashion/r6Du0CcW_E.webp', link: '/category/men' };
            const splitRight = { ...defaultRight, ...(content?.right as { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string } || {}) };
            const splitLeft = { ...defaultLeft, ...(content?.left as { title?: string; imageUrl?: string; mobileImageUrl?: string; link?: string } || {}) };
            const splitSettings = event.data.settings || {};
            const splitMinHeight = (splitSettings?.minHeight as number) ?? 70;
            const splitMinHeightUnit = (splitSettings?.minHeightUnit as string) || 'vh';
            const splitVerticalAlign = (splitSettings?.verticalAlign as string) || 'bottom';
            const splitTextAlign = (splitSettings?.textAlign as string) || 'center';
            const splitOverlay = (splitSettings?.overlay as number) ?? 0.1;
            const splitTitleColor = (splitSettings?.titleColor as string) || '#fff';
            
            // Vertical alignment classes
            const vertAlignClass = splitVerticalAlign === 'top' ? 'items-start pt-16' 
              : splitVerticalAlign === 'center' ? 'items-center' 
              : 'items-end pb-16';
            
            // Text alignment classes - in RTL: right = start, left = end
            const txtAlignClass = splitTextAlign === 'right' ? 'text-right justify-start px-12' 
              : splitTextAlign === 'left' ? 'text-left justify-end px-12' 
              : 'text-center justify-center';
            
            html = `
              <a href="${splitRight.link}" class="relative overflow-hidden group" style="height: ${splitMinHeight}${splitMinHeightUnit};" data-side-index="0">
                ${splitRight.mobileImageUrl ? `<img src="${splitRight.mobileImageUrl}" alt="" class="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 md:hidden" data-side-mobile-image />` : ''}
                ${splitRight.imageUrl 
                  ? `<img src="${splitRight.imageUrl}" alt="" class="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 ${splitRight.mobileImageUrl ? 'hidden md:block' : ''}" data-side-image />`
                  : `<div class="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 ${splitRight.mobileImageUrl ? 'hidden md:block' : ''}" data-side-placeholder></div>`
                }
                <div class="absolute inset-0" style="background-color: rgba(0,0,0,${splitOverlay});" data-side-overlay></div>
                <div class="absolute inset-0 flex ${vertAlignClass} ${txtAlignClass}" data-side-content>
                  <span class="text-3xl md:text-4xl font-extralight tracking-[0.3em] uppercase" style="color: ${splitTitleColor};" data-side-title>${splitRight.title}</span>
                </div>
              </a>
              <a href="${splitLeft.link}" class="relative overflow-hidden group" style="height: ${splitMinHeight}${splitMinHeightUnit};" data-side-index="1">
                ${splitLeft.mobileImageUrl ? `<img src="${splitLeft.mobileImageUrl}" alt="" class="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 md:hidden" data-side-mobile-image />` : ''}
                ${splitLeft.imageUrl 
                  ? `<img src="${splitLeft.imageUrl}" alt="" class="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 ${splitLeft.mobileImageUrl ? 'hidden md:block' : ''}" data-side-image />`
                  : `<div class="w-full h-full bg-gradient-to-b from-gray-300 to-gray-400 ${splitLeft.mobileImageUrl ? 'hidden md:block' : ''}" data-side-placeholder></div>`
                }
                <div class="absolute inset-0" style="background-color: rgba(0,0,0,${splitOverlay});" data-side-overlay></div>
                <div class="absolute inset-0 flex ${vertAlignClass} ${txtAlignClass}" data-side-content>
                  <span class="text-3xl md:text-4xl font-extralight tracking-[0.3em] uppercase" style="color: ${splitTitleColor};" data-side-title>${splitLeft.title}</span>
                </div>
              </a>
            `;
            break;
          }

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

          case 'quote_banner': {
            const quoteSettings = event.data.settings || {};
            const quoteMinHeight = (quoteSettings?.minHeight as number) ?? 60;
            const quoteMinHeightUnit = (quoteSettings?.minHeightUnit as string) || 'vh';
            const quoteOverlay = (quoteSettings?.overlay as number) ?? 0.4;
            const quoteTextStyle = (quoteSettings?.textStyle as string) || 'italic';
            const quoteText = (content?.quote as string) || 'בפלטפורמה שלנו לא רק בונים חנויות - בפלטפורמה שלנו בונים עסקים מצליחים';
            const quoteAttribution = (content?.attribution as string) || 'יוגב אביטן, מנכ״ל קוויק שופ';
            const quoteImageUrl = (content?.imageUrl as string) || '';
            
            const quoteFontClass = quoteTextStyle === 'serif' 
              ? 'font-serif' 
              : quoteTextStyle === 'italic' 
                ? 'font-serif italic' 
                : 'font-sans';
            
            placeholder.className = 'w-full relative overflow-hidden';
            html = `
              <div 
                class="absolute inset-0 bg-cover bg-center"
                style="background-image: ${quoteImageUrl ? `url('${quoteImageUrl}')` : 'none'}; background-attachment: fixed;"
                data-bg-desktop
                data-bg-type="image"
              ></div>
              <div 
                class="absolute inset-0 bg-gray-900"
                style="display: ${quoteImageUrl ? 'none' : 'block'};"
                data-bg-fallback
              ></div>
              <div 
                class="absolute inset-0 bg-black"
                style="opacity: ${quoteOverlay};"
                data-overlay
              ></div>
              <div 
                class="relative flex items-center justify-center"
                style="height: ${quoteMinHeight}${quoteMinHeightUnit};"
                data-content-container
              >
                <div class="text-center text-white px-4 max-w-4xl mx-auto">
                  <h2 
                    class="text-3xl md:text-5xl ${quoteFontClass} mb-4"
                    data-section-quote
                  >"${quoteText}"</h2>
                  <p 
                    class="text-lg opacity-90"
                    style="display: ${quoteAttribution ? '' : 'none'};"
                    data-section-attribution
                  >${quoteAttribution}</p>
                </div>
              </div>
            `;
            break;
          }

          case 'faq':
            const faqItems = (content?.items as Array<{ id?: string; question: string; answer: string }>) || [
              { id: '1', question: 'מהם זמני המשלוח?', answer: 'משלוחים מגיעים תוך 3-5 ימי עסקים.' },
              { id: '2', question: 'מהי מדיניות ההחזרות?', answer: 'ניתן להחזיר מוצרים תוך 14 יום מרגע הקבלה.' },
            ];
            placeholder.className = 'py-16 bg-white';
            placeholder.dataset.sectionName = 'שאלות נפוצות';
            html = `
              <div class="max-w-3xl mx-auto px-4">
                <div class="text-center mb-12">
                  <h2 class="text-2xl md:text-3xl font-display font-light tracking-wide mb-3" data-section-title style="display: ${title ? '' : 'none'}">${title || 'שאלות נפוצות'}</h2>
                  <p class="text-gray-600 text-sm md:text-base max-w-2xl mx-auto" data-section-subtitle style="display: ${subtitle ? '' : 'none'}">${subtitle || ''}</p>
                </div>
                <div class="space-y-4" data-faq-items>
                  ${faqItems.map((item, index) => `
                    <div class="border border-gray-200 rounded-lg" data-faq-item-index="${index}" data-faq-item-id="${item.id || index}">
                      <button class="w-full px-4 py-4 flex items-center justify-between text-right hover:bg-gray-50">
                        <span class="font-medium text-gray-900" data-faq-question>${item.question}</span>
                        <svg class="w-5 h-5 text-gray-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div class="px-4 pb-4 text-gray-600" data-faq-answer style="display: none;">${item.answer}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;

          case 'reviews':
            const reviewsContent = (content?.reviews as Array<{ 
              author?: string;
              text: string; 
              rating: number;
              date?: string;
              verified?: boolean;
            }>) || [
              { author: 'שרה כ.', text: 'מוצר מעולה, ממליצה בחום!', rating: 5 },
              { author: 'דוד מ.', text: 'איכות גבוהה ומשלוח מהיר', rating: 5 },
              { author: 'רחל ל.', text: 'שירות לקוחות מצוין', rating: 4 },
            ];
            const reviewCardAlign = (event.data.settings?.cardTextAlign as string) || 'center';
            const reviewLayout = (event.data.settings?.layout as string) || 'grid';
            const reviewCardWidth = (event.data.settings?.cardWidth as number) || 320;
            const reviewCols = (event.data.settings?.columns as number) || 3;
            // RTL: 'right' = justify-start (ימין), 'left' = justify-end (שמאל)
            const reviewJustifyMap: Record<string, string> = { right: 'justify-start', center: 'justify-center', left: 'justify-end' };
            const reviewJustify = reviewJustifyMap[reviewCardAlign] || 'justify-center';
            placeholder.className = 'py-16 bg-gray-50';
            placeholder.dataset.sectionName = 'ביקורות';
            placeholder.setAttribute('data-layout', reviewLayout);
            
            const reviewGridClasses = reviewLayout === 'slider' 
              ? 'flex overflow-x-auto snap-x snap-mandatory gap-6 -mx-4 px-4'
              : `grid md:grid-cols-${reviewCols} gap-6`;
            const reviewCardClasses = reviewLayout === 'slider'
              ? `bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-${reviewCardAlign} flex-shrink-0 snap-center`
              : `bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-${reviewCardAlign}`;
            const reviewCardStyle = reviewLayout === 'slider' 
              ? `width: ${reviewCardWidth}px; min-width: ${reviewCardWidth}px;`
              : '';
              
            html = `
              <style>
                [data-section-id="${sectionId}"] [data-reviews-grid]::-webkit-scrollbar { display: none; }
                [data-section-id="${sectionId}"] [data-reviews-grid] { scrollbar-width: none; }
              </style>
              <div class="max-w-7xl mx-auto px-4">
                <div class="text-center mb-12">
                  <h2 class="text-2xl md:text-3xl font-display font-light tracking-wide mb-3 ${title ? '' : 'hidden'}" data-section-title style="display: ${title ? '' : 'none'}">${title || ''}</h2>
                  <p class="text-gray-600 text-sm md:text-base max-w-2xl mx-auto ${subtitle ? '' : 'hidden'}" data-section-subtitle style="display: ${subtitle ? '' : 'none'}">${subtitle || ''}</p>
                </div>
                <div class="${reviewGridClasses}" data-reviews-grid>
                  ${reviewsContent.map((review, index) => `
                    <div class="${reviewCardClasses}" style="${reviewCardStyle}" data-review-index="${index}" data-review-id="${index}">
                      <div class="flex gap-0.5 mb-3 ${reviewJustify}" data-review-rating="${review.rating}">
                        ${[1,2,3,4,5].map(i => `
                          <svg class="w-4 h-4 ${i <= review.rating ? 'text-yellow-400' : 'text-gray-200'}" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        `).join('')}
                      </div>
                      <p class="text-gray-700 mb-4" data-review-text>"${review.text}"</p>
                      <div class="flex items-center gap-3 ${reviewJustify}">
                        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium" data-review-avatar>
                          ${(review.author || '').charAt(0)}
                        </div>
                        <div>
                          <div class="font-medium text-gray-900 flex items-center gap-2" data-review-author>
                            ${review.author || 'לקוח'}
                            ${review.verified ? '<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>' : ''}
                          </div>
                          ${review.date ? `<div class="text-sm text-gray-500" data-review-date>${review.date}</div>` : '<div class="text-sm text-gray-500" data-review-date style="display: none"></div>'}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                ${reviewLayout === 'slider' ? `
                  <div class="flex justify-center gap-2 mt-4" data-slider-nav>
                    <button class="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" data-slider-prev>
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    <button class="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" data-slider-next>
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
            break;

          case 'google_reviews':
            const gIsConnected = !!(content?.googleAccountId);
            const gReviewsContent = (content?.reviews as Array<{ 
              id?: string;
              authorName: string;
              authorPhoto?: string;
              text: string; 
              rating: number;
              relativeTime?: string;
            }>) || [];
            const gBusinessName = (content?.businessName as string) || 'QuickShop';
            const gBusinessImage = (content?.businessImage as string) || '';
            const gAverageRating = (content?.averageRating as number) || 5;
            const gTotalReviews = (content?.totalReviews as number) || 127;
            const gGooglePlaceUrl = (content?.googlePlaceUrl as string) || '';
            const gBgColor = (event.data.settings?.backgroundColor as string) || '#fce7f3';
            const gCols = (event.data.settings?.columns as number) || 3;
            const gMinHeight = (event.data.settings?.minHeight as number) || 0;
            const gTextAlign = (event.data.settings?.textAlign as string) || 'center';
            const gTitleColor = (event.data.settings?.titleColor as string) || '#000000';
            const gTitleSize = (event.data.settings?.titleSize as number) || 30;
            const gTitleSizeMobile = (event.data.settings?.titleSizeMobile as number) || 24;
            
            placeholder.className = 'py-8 md:py-12 px-4 md:px-8';
            placeholder.style.backgroundColor = gBgColor;
            if (gMinHeight > 0) placeholder.style.minHeight = `${gMinHeight}px`;
            placeholder.dataset.sectionName = 'ביקורות גוגל';
            
            // Generate random avatar colors
            const gAvatarColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
            
            // Check if connected - show placeholder if not
            if (!gIsConnected || gReviewsContent.length === 0) {
              html = `
                <style>
                  [data-section-id="${sectionId}"] [data-section-title] { 
                    font-size: ${gTitleSizeMobile}px; 
                    color: ${gTitleColor};
                  }
                  @media (min-width: 768px) {
                    [data-section-id="${sectionId}"] [data-section-title] { font-size: ${gTitleSize}px; }
                  }
                </style>
                <div class="max-w-7xl mx-auto">
                  <div class="text-${gTextAlign} mb-8">
                    <h2 class="font-medium mb-2" data-section-title>${title || 'ביקורות בגוגל'}</h2>
                    <p class="text-gray-600" data-section-subtitle style="display: ${subtitle ? '' : 'none'}">${subtitle || ''}</p>
                  </div>
                  
                  <!-- Not Connected Placeholder -->
                  <div class="flex flex-col items-center justify-center py-12 px-4">
                    <div class="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
                      <svg width="40" height="40" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <h3 class="text-xl font-medium text-gray-800 mb-2">חבר את Google Business</h3>
                    <p class="text-gray-500 text-center max-w-md mb-6">
                      התחבר לחשבון Google Business שלך כדי להציג ביקורות אמיתיות מלקוחות
                    </p>
                    <div class="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow text-sm text-gray-600">
                      <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                      לחץ על הסקשן כדי להתחבר
                    </div>
                  </div>
                </div>
              `;
            } else {
              html = `
                <style>
                  [data-section-id="${sectionId}"] [data-section-title] { 
                    font-size: ${gTitleSizeMobile}px; 
                    color: ${gTitleColor};
                  }
                  @media (min-width: 768px) {
                    [data-section-id="${sectionId}"] [data-section-title] { font-size: ${gTitleSize}px; }
                  }
                </style>
                <div class="max-w-7xl mx-auto">
                  <div class="text-${gTextAlign} mb-8">
                    <h2 class="font-medium mb-2" data-section-title>${title || 'ביקורות בגוגל'}</h2>
                    <p class="text-gray-600" data-section-subtitle style="display: ${subtitle ? '' : 'none'}">${subtitle || ''}</p>
                  </div>
                  
                  <div class="flex flex-col lg:flex-row gap-6 items-start">
                    <!-- Business Card -->
                    <div class="flex-shrink-0 w-full lg:w-64 bg-white rounded-xl p-6 shadow-sm text-center">
                      ${gBusinessImage ? `<img src="${gBusinessImage}" alt="${gBusinessName}" class="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />` : ''}
                      <h3 class="font-medium text-gray-900 mb-2 text-lg">${gBusinessName}</h3>
                      <div class="flex justify-center mb-1">
                        ${[1,2,3,4,5].map(i => `<svg class="w-5 h-5 ${i <= Math.round(gAverageRating) ? 'text-yellow-400' : 'text-gray-200'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`).join('')}
                      </div>
                      <p class="text-sm text-gray-500 mb-4">Google ${gTotalReviews} ביקורות</p>
                      ${gGooglePlaceUrl ? `<a href="${gGooglePlaceUrl}" target="_blank" class="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800">כתוב ביקורת</a>` : ''}
                    </div>

                    <!-- Reviews Slider -->
                    <div class="flex-1 min-w-0">
                      <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-4" style="scrollbar-width: none;">
                        ${gReviewsContent.map((review, index) => {
                          const avatarColor = gAvatarColors[review.authorName.charCodeAt(0) % gAvatarColors.length];
                          return `
                            <div class="flex-shrink-0 snap-center w-[300px] min-h-[200px] p-5 rounded-xl bg-white shadow-sm border border-gray-100 flex flex-col" data-review-index="${index}">
                              <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-3">
                                  ${review.authorPhoto 
                                    ? `<img src="${review.authorPhoto}" alt="${review.authorName}" class="w-10 h-10 rounded-full object-cover" />`
                                    : `<div class="w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium text-lg">${review.authorName.charAt(0)}</div>`
                                  }
                                  <div>
                                    <div class="flex items-center gap-1.5">
                                      <span class="font-medium text-gray-900 text-sm">${review.authorName}</span>
                                      <svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    </div>
                                    <span class="text-xs text-gray-500">${review.relativeTime || ''}</span>
                                  </div>
                                </div>
                                <svg width="24" height="24" viewBox="0 0 24 24" class="flex-shrink-0">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              </div>
                              <div class="flex gap-0.5 mb-3">
                                ${[1,2,3,4,5].map(i => `<svg class="w-4 h-4 ${i <= review.rating ? 'text-yellow-400' : 'text-gray-200'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`).join('')}
                              </div>
                              <p class="text-gray-700 text-sm leading-relaxed flex-1">${review.text}</p>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }
            break;

          case 'logos':
            const logosList = (content?.logos as Array<{ id?: string; url: string; name?: string; link?: string }>) || [];
            const logosCols = (event.data.settings?.columns as number) || 5;
            const logosMobileCols = (event.data.settings?.mobileColumns as number) || 3;
            placeholder.className = 'py-12 bg-white';
            placeholder.dataset.sectionName = 'לוגואים';
            html = `
              <div class="max-w-7xl mx-auto px-4">
                <div class="text-center mb-8">
                  <h2 class="text-xl font-light tracking-wide text-gray-500" data-section-title style="display: ${title ? '' : 'none'}">${title || 'הם בחרו בנו'}</h2>
                  <p class="text-gray-500 text-sm mt-2" data-section-subtitle style="display: ${subtitle ? '' : 'none'}">${subtitle || ''}</p>
                </div>
                <div class="flex flex-wrap justify-center items-center gap-8" data-logos-grid>
                  ${(logosList.length > 0 ? logosList : [{id:'1',url:'',name:''},{id:'2',url:'',name:''},{id:'3',url:'',name:''},{id:'4',url:'',name:''},{id:'5',url:'',name:''}]).map((logo, index) => `
                    <div class="flex items-center justify-center p-4 bg-white rounded-lg" data-logo-index="${index}" data-logo-id="${logo.id || index}">
                      <img src="${logo.url || ''}" alt="${logo.name || ''}" class="max-h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all" data-logo-image style="display: ${logo.url ? '' : 'none'}" />
                      <div class="w-24 h-12 flex items-center justify-center bg-gray-100 rounded" data-logo-placeholder style="display: ${logo.url ? 'none' : ''}">
                        <span class="text-gray-400 text-xs">לוגו</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            break;

          case 'series_grid':
            // Use categories data if available (for category-based series)
            const seriesCategories = (event.data.categories as Array<{id: string; name: string; slug: string; imageUrl?: string}>) || [];
            const seriesSelectionMode = (content?.selectionMode as string) || 'all';
            const seriesSelectedIds = (content?.categoryIds as string[]) || [];
            const seriesDisplayLimit = (content?.displayLimit as number) || 4;
            
            // Build items from ALL categories (for real-time updates)
            let seriesItems: Array<{id: string; title: string; subtitle?: string; description?: string; imageUrl?: string; originalImageUrl?: string; shouldShow?: boolean; order?: number}> = [];
            
            if (seriesCategories.length > 0) {
              // Use ALL categories, but mark which should be shown
              seriesItems = seriesCategories.map((cat, index) => {
                let shouldShow = false;
                let order = index;
                if (seriesSelectionMode === 'manual' && seriesSelectedIds.length > 0) {
                  shouldShow = seriesSelectedIds.includes(cat.id);
                  order = seriesSelectedIds.indexOf(cat.id) >= 0 ? seriesSelectedIds.indexOf(cat.id) : 999;
                } else {
                  shouldShow = index < seriesDisplayLimit;
                }
                return {
                  id: cat.id,
                  title: cat.name,
                  imageUrl: cat.imageUrl || '',
                  originalImageUrl: cat.imageUrl || '',
                  shouldShow,
                  order,
                };
              });
            } else {
              // Fallback to content items or placeholder
              const fallbackItems = (content?.items as Array<{id: string; title: string; subtitle?: string; description?: string; imageUrl?: string}>) || [
                { id: '1', title: 'סדרה 1', description: 'תיאור קצר של הסדרה.' },
                { id: '2', title: 'סדרה 2', description: 'תיאור קצר של הסדרה.' },
                { id: '3', title: 'סדרה 3', description: 'תיאור קצר של הסדרה.' },
              ];
              seriesItems = fallbackItems.map((item, index) => ({
                ...item,
                originalImageUrl: item.imageUrl || '',
                shouldShow: index < seriesDisplayLimit,
                order: index,
              }));
            }
            
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
            
            placeholder.dataset.selectionMode = seriesSelectionMode;
            
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
                    ${seriesItems.map((item) => {
                      const displayStyle = item.shouldShow !== false ? '' : 'display: none;';
                      const orderStyle = item.order !== undefined ? `order: ${item.order};` : '';
                      return `
                      <a href="#" class="group relative rounded-2xl overflow-hidden" style="height: 320px; ${displayStyle} ${orderStyle}" data-item-id="${item.id}">
                        ${item.imageUrl 
                          ? `<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style="background-image: url('${item.imageUrl}');" data-item-bg data-original-image="${item.originalImageUrl || item.imageUrl || ''}"></div>`
                          : `<div class="absolute inset-0 bg-gray-300 flex items-center justify-center" data-item-bg data-original-image="${item.originalImageUrl || ''}">
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
                    `}).join('')}
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
                    ${seriesItems.map((item) => {
                      const displayStyle = item.shouldShow !== false ? '' : 'display: none;';
                      const orderStyle = item.order !== undefined ? `order: ${item.order};` : '';
                      return `
                      <div class="group rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all" style="background: #f9f7f4; ${displayStyle} ${orderStyle}" data-item-id="${item.id}">
                        <div class="overflow-hidden ${aspectClass}" style="${seriesAspectRatio === 'auto' ? `min-height: ${seriesMinHeight}` : ''}" data-image-container>
                          ${item.imageUrl 
                            ? `<div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style="background-image: url('${item.imageUrl}'); ${seriesAspectRatio === 'auto' ? `min-height: ${seriesMinHeight}` : ''}" data-item-bg data-original-image="${item.originalImageUrl || item.imageUrl || ''}"></div>`
                            : `<div class="w-full h-full bg-gray-200 flex items-center justify-center" style="${seriesAspectRatio === 'auto' ? `min-height: ${seriesMinHeight}` : ''}" data-item-bg data-original-image="${item.originalImageUrl || ''}">
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
                    `}).join('')}
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
          
          case 'contact':
            placeholder.className = 'py-16 px-4';
            placeholder.style.backgroundColor = '#f9fafb';
            // No default values - empty means hidden
            const contactEmail = content?.email || '';
            const contactPhone = content?.phone || '';
            const contactAddress = content?.address || '';
            const contactHours = content?.hours || '';
            const showForm = content?.showForm !== false; // Default true
            const submitButtonText = content?.submitButtonText || 'שליחה';
            html = `
              <div class="max-w-4xl mx-auto" data-content-wrapper>
                <h2 class="text-2xl md:text-3xl font-bold tracking-wide mb-4 text-center" data-section-title style="${title ? '' : 'display:none'}">${title || 'צור קשר'}</h2>
                <p class="text-lg opacity-80 mb-8 text-center" data-section-subtitle style="${subtitle ? '' : 'display:none'}">${subtitle || ''}</p>
                
                <div class="grid md:grid-cols-2 gap-12">
                  <!-- פרטי קשר -->
                  <div class="space-y-6" data-contact-info>
                    <div style="${contactEmail ? '' : 'display:none'}" data-contact-email-wrapper>
                      <p class="text-xs uppercase tracking-widest text-gray-500 mb-1">אימייל</p>
                      <a href="mailto:${contactEmail}" class="text-sm hover:underline" dir="ltr" data-contact-email>${contactEmail}</a>
                    </div>
                    
                    <div style="${contactPhone ? '' : 'display:none'}" data-contact-phone-wrapper>
                      <p class="text-xs uppercase tracking-widest text-gray-500 mb-1">טלפון</p>
                      <a href="tel:${contactPhone}" class="text-sm hover:underline" dir="ltr" data-contact-phone>${contactPhone}</a>
                    </div>
                    
                    <div style="${contactAddress ? '' : 'display:none'}" data-contact-address-wrapper>
                      <p class="text-xs uppercase tracking-widest text-gray-500 mb-1">כתובת</p>
                      <span class="text-sm" data-contact-address>${contactAddress}</span>
                    </div>
                    
                    <div style="${contactHours ? '' : 'display:none'}" data-contact-hours-wrapper>
                      <p class="text-xs uppercase tracking-widest text-gray-500 mb-1">שעות פעילות</p>
                      <span class="text-sm" data-contact-hours>${contactHours}</span>
                    </div>
                  </div>
                  
                  <!-- טופס יצירת קשר -->
                  <div class="bg-white p-6 rounded-lg shadow-sm" data-contact-form-container style="${showForm ? '' : 'display:none'}">
                    <form class="space-y-4" data-contact-form>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                        <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="השם שלך" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                        <input type="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="email@example.com" dir="ltr" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                        <input type="tel" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="05X-XXXXXXX" dir="ltr" />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">הודעה</label>
                        <textarea class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" rows="4" placeholder="כתוב את הודעתך כאן..."></textarea>
                      </div>
                      <button type="submit" class="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors" data-contact-button>${submitButtonText}</button>
                    </form>
                  </div>
                </div>
              </div>
            `;
            break;

          case 'hero_slider':
            // Slider with slides
            const sliderSlides = content?.slides || [{ id: '1', title: 'שקופית 1', subtitle: 'תיאור קצר' }];
            placeholder.className = 'relative overflow-hidden';
            placeholder.style.minHeight = '90vh';
            placeholder.style.backgroundColor = '#1f2937';
            html = `
              <style>
                [data-section-id="${sectionId}"] [data-slide-title] {
                  font-size: 36px;
                  font-weight: 200;
                  color: #ffffff;
                }
                @media (min-width: 768px) {
                  [data-section-id="${sectionId}"] [data-slide-title] {
                    font-size: 72px;
                  }
                }
                [data-section-id="${sectionId}"] [data-slide-subtitle] {
                  font-size: 14px;
                  color: rgba(255,255,255,0.9);
                }
                @media (min-width: 768px) {
                  [data-section-id="${sectionId}"] [data-slide-subtitle] {
                    font-size: 18px;
                  }
                }
              </style>
              <div class="overflow-hidden h-full">
                <div class="flex h-full" style="min-height: 90vh;">
                  ${(sliderSlides as Array<{id: string; title?: string; subtitle?: string; imageUrl?: string; buttonText?: string; buttonLink?: string}>).map((slide, index) => `
                    <div class="flex-shrink-0 w-full relative" style="min-height: 90vh;" data-slide-index="${index}" data-slide-id="${slide.id}">
                      ${slide.imageUrl ? `<img src="${slide.imageUrl}" alt="${slide.title || ''}" class="absolute inset-0 w-full h-full object-cover" data-slide-image-desktop />` : '<div class="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-700 to-gray-900"></div>'}
                      <div class="absolute inset-0 z-[1]" style="background-color: rgba(0,0,0,0.3);" data-slide-overlay></div>
                      <div class="absolute inset-0 z-[2]" style="background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, transparent 100%);" data-slide-gradient></div>
                      <div class="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
                        <div class="max-w-4xl w-full">
                          <h2 class="font-display tracking-[0.2em] uppercase mb-4 md:mb-6" data-slide-title style="${slide.title ? '' : 'display:none'}">${slide.title || ''}</h2>
                          <p class="opacity-90 mb-6 md:mb-8 max-w-2xl mx-auto" data-slide-subtitle style="${slide.subtitle ? '' : 'display:none'}">${slide.subtitle || ''}</p>
                          ${slide.buttonText ? `<a href="${slide.buttonLink || '#'}" class="inline-block px-8 py-3 bg-white text-black text-sm font-medium tracking-wider uppercase" data-slide-button>${slide.buttonText}</a>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div class="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                ${(sliderSlides as Array<{id: string}>).map((_, index) => `
                  <button class="w-2.5 h-2.5 rounded-full transition-all" style="background-color: ${index === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)'}"></button>
                `).join('')}
              </div>
              <button class="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full" aria-label="הקודם">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
              <button class="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full" aria-label="הבא">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            `;
            break;

          case 'content_slider':
            // Content slider with items
            const contentItems = content?.items || [
              { id: '1', title: 'פריט 1', subtitle: 'תיאור קצר', imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800' },
              { id: '2', title: 'פריט 2', subtitle: 'תיאור קצר', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
              { id: '3', title: 'פריט 3', subtitle: 'תיאור קצר', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
              { id: '4', title: 'פריט 4', subtitle: 'תיאור קצר', imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=800' },
              { id: '5', title: 'פריט 5', subtitle: 'תיאור קצר', imageUrl: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800' },
            ];
            const csColumns = (settings?.columns as number) || 4;
            const csMobileColumns = (settings?.mobileColumns as number) || 1;
            const csGap = (settings?.gap as number) || 16;
            const csBgColor = (settings?.backgroundColor as string) || '#ffffff';
            const csPaddingTop = (settings?.paddingTop as number) ?? 64;
            const csPaddingBottom = (settings?.paddingBottom as number) ?? 64;
            const csPaddingLeft = (settings?.paddingLeft as number) ?? 16;
            const csPaddingRight = (settings?.paddingRight as number) ?? 16;
            
            placeholder.className = 'relative';
            placeholder.style.backgroundColor = csBgColor;
            placeholder.style.paddingTop = `${csPaddingTop}px`;
            placeholder.style.paddingBottom = `${csPaddingBottom}px`;
            placeholder.style.paddingLeft = `${csPaddingLeft}px`;
            placeholder.style.paddingRight = `${csPaddingRight}px`;
            
            html = `
              <style>
                [data-section-id="${sectionId}"] [data-section-title] {
                  font-size: 24px;
                  color: #000000;
                }
                @media (min-width: 768px) {
                  [data-section-id="${sectionId}"] [data-section-title] {
                    font-size: 32px;
                  }
                }
                [data-section-id="${sectionId}"] .embla__slide {
                  flex: 0 0 ${100 / (csMobileColumns + 0.25)}%;
                  padding-left: ${csGap / 2}px;
                  padding-right: ${csGap / 2}px;
                }
                @media (min-width: 768px) {
                  [data-section-id="${sectionId}"] .embla__slide {
                    flex: 0 0 ${100 / (csColumns + 0.25)}%;
                  }
                }
              </style>
              <div class="w-full" data-content-wrapper>
                ${title ? `
                  <div class="mb-8 md:mb-12 px-4 text-center">
                    ${subtitle ? `<p class="tracking-[0.2em] uppercase mb-3 text-gray-500" style="font-size: 14px;" data-section-subtitle>${subtitle}</p>` : ''}
                    <h2 class="font-display tracking-[0.15em] uppercase font-light" data-section-title>${title}</h2>
                  </div>
                ` : ''}
                <div class="relative">
                  <div class="overflow-hidden" style="margin-left: -${csGap / 2}px; margin-right: -${csGap / 2}px;">
                    <div class="flex" data-slider-track>
                      ${(contentItems as Array<{id: string; title?: string; subtitle?: string; imageUrl?: string; mobileImageUrl?: string; videoUrl?: string; buttonText?: string; buttonLink?: string}>).map((item, index) => `
                        <div class="embla__slide min-w-0" data-item-index="${index}" data-item-id="${item.id}">
                          <div class="relative overflow-hidden h-full" style="border-radius: 0; aspect-ratio: 3 / 4;">
                            ${item.videoUrl 
                              ? `<video src="${item.videoUrl}" autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover" data-item-video></video>`
                              : item.imageUrl 
                                ? `<img src="${item.imageUrl}" alt="${item.title || ''}" class="absolute inset-0 w-full h-full object-cover ${item.mobileImageUrl ? 'hidden md:block' : ''}" data-item-image-desktop />${item.mobileImageUrl ? `<img src="${item.mobileImageUrl}" alt="${item.title || ''}" class="absolute inset-0 w-full h-full object-cover md:hidden" data-item-image-mobile />` : ''}`
                                : item.mobileImageUrl 
                                  ? `<img src="${item.mobileImageUrl}" alt="${item.title || ''}" class="absolute inset-0 w-full h-full object-cover" data-item-image-mobile />`
                                  : '<div class="absolute inset-0 w-full h-full bg-gray-200"></div>'
                            }
                            <div class="absolute inset-0 z-[1]" style="background-color: rgba(0,0,0,0.3);" data-item-overlay></div>
                            <div class="absolute inset-x-0 bottom-0 h-1/2 z-[2]" style="background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);"></div>
                            <div class="relative z-10 h-full flex flex-col justify-end p-4 md:p-6 text-center" data-item-content>
                              ${item.subtitle ? `<p class="text-xs tracking-wider uppercase mb-2" style="color: rgba(255,255,255,0.8);" data-item-subtitle>${item.subtitle}</p>` : ''}
                              ${item.title ? `<h3 class="font-medium mb-2" style="color: #ffffff; font-size: 20px;" data-item-title>${item.title}</h3>` : ''}
                              ${item.buttonText ? `<div><a href="${item.buttonLink || '#'}" class="inline-block px-6 py-2 bg-white text-black text-sm font-medium tracking-wider" data-item-button>${item.buttonText}</a></div>` : ''}
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                  <button class="absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white shadow-lg rounded-full hidden md:flex" style="right: -20px;" aria-label="הקודם" data-slider-prev>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                  <button class="absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white shadow-lg rounded-full hidden md:flex" style="left: -20px;" aria-label="הבא" data-slider-next>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                </div>
                <div class="flex justify-center gap-2 mt-6" data-slider-dots>
                  ${(contentItems as Array<{id: string}>).map((_, index) => `
                    <button class="transition-all rounded-full" style="background-color: ${index === 0 ? '#111827' : '#d1d5db'}; width: ${index === 0 ? '12px' : '8px'}; height: ${index === 0 ? '12px' : '8px'};" data-active="${index === 0}"></button>
                  `).join('')}
                </div>
              </div>
            `;
            break;
          
          case 'custom':
            const customHtml = (content?.html as string) || '';
            if (customHtml) {
              // If there's HTML content, show it
              placeholder.className = '';
              html = `<div data-custom-html>${customHtml}</div>`;
            } else {
              // Show placeholder if no content
              placeholder.className = 'py-16 bg-gradient-to-b from-blue-50 to-white border-2 border-dashed border-blue-300';
              html = `
                <div class="container mx-auto px-4 text-center">
                  <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h2 class="text-xl font-medium text-gray-900 mb-2">custom</h2>
                  <p class="text-gray-500">הוסף קוד HTML מותאם אישית</p>
                </div>
              `;
            }
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
            // For other pages (home, etc.) - always insert BEFORE footer
            // This ensures new sections go at the end of content, before footer
            const footer = document.querySelector('footer');
            
            if (footer) {
              // Insert right before the footer - this is the true "end" of content
              footer.insertAdjacentElement('beforebegin', placeholder);
            } else {
              // No footer found, append to main/body
              const main = document.querySelector('main') || document.body;
              main.appendChild(placeholder);
            }
          }
        }
        
        // Hide empty state if visible and reset main styling
        const emptyState = document.querySelector('[data-empty-state]');
        if (emptyState) {
          (emptyState as HTMLElement).style.display = 'none';
        }
        
        // Also remove the empty home styling from main
        const emptyHome = document.querySelector('[data-empty-home]');
        if (emptyHome) {
          // Remove ALL flex-related classes that prevent normal section display
          emptyHome.className = '';
          (emptyHome as HTMLElement).style.cssText = '';
        }
        
        console.log('[SECTION_ADD] Placeholder inserted, parent:', placeholder.parentElement?.tagName, 'classes:', placeholder.parentElement?.className);
        
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
      // SECTIONS_REORDER - Reorder sections in the DOM based on new order
      // This properly moves sections to their new positions
      // =====================================================
      if (event.data?.type === 'SECTIONS_REORDER') {
        const { sectionOrder, movedSectionId } = event.data as { sectionOrder: string[]; movedSectionId: string };
        
        // SIMPLE APPROACH: Only reorder sections, don't touch header/footer
        // Header stays at top, footer stays at bottom - they are fixed
        
        // Find all section elements (these are the draggable content sections)
        const allSections = document.querySelectorAll('[data-section-id]');
        if (allSections.length === 0) return;
        
        // Create a map of section ID to element
        const sectionMap = new Map<string, Element>();
        allSections.forEach(section => {
          const id = section.getAttribute('data-section-id');
          if (id) sectionMap.set(id, section);
        });
        
        // Get the moved element for animation
        const movedElement = sectionMap.get(movedSectionId) as HTMLElement;
        
        // Add animation to the moved element
        if (movedElement) {
          movedElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
          movedElement.style.opacity = '0.7';
          movedElement.style.transform = 'scale(0.98)';
        }
        
        // Reorder by inserting each section after the previous one in the new order
        requestAnimationFrame(() => {
          let previousElement: Element | null = null;
          
          sectionOrder.forEach((sectionId) => {
            const element = sectionMap.get(sectionId);
            if (element) {
              if (previousElement) {
                // Insert after the previous element in the new order
                previousElement.insertAdjacentElement('afterend', element);
              }
              previousElement = element;
            }
          });
          
          // Restore the moved element's style after animation
          if (movedElement) {
            setTimeout(() => {
              movedElement.style.opacity = '1';
              movedElement.style.transform = 'scale(1)';
              setTimeout(() => {
                movedElement.style.transition = '';
              }, 300);
            }, 50);
          }
        });
      }
      
      // =====================================================
      // SECTION_SWAP - Legacy support (deprecated, use SECTIONS_REORDER)
      // =====================================================
      if (event.data?.type === 'SECTION_SWAP') {
        // Redirect to new reorder method
        console.log('[Preview] SECTION_SWAP is deprecated, use SECTIONS_REORDER');
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
      const clickedElement = e.target as HTMLElement;
      
      // Allow clicks on interactive elements (slider arrows, buttons, etc.)
      const isInteractive = clickedElement.closest(
        'button, [data-slider-prev], [data-slider-next], [data-slider-dot], input, select, textarea, [role="button"]'
      );
      if (isInteractive) {
        // Don't intercept - let the button handle it
        return;
      }
      
      // Stop propagation to prevent parent sections from also being selected
      const target = clickedElement.closest('[data-section-id]') as HTMLElement;
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
      
      /* But allow clicks on buttons and interactive elements */
      button, [data-slider-prev], [data-slider-next], [data-slider-dot], [role="button"] {
        pointer-events: auto !important;
        cursor: pointer !important;
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

