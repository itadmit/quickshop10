/**
 * ReviewsHandler - DOM update logic for reviews section
 * לוגיקת עדכון DOM בזמן אמת לסקשן ביקורות
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

interface Review {
  id?: string;
  author: string;
  text: string;
  rating: number;
  date?: string;
  avatar?: string;
}

/**
 * Handle all real-time updates for reviews section
 */
export function handleReviewsUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // =====================================================
  // COMMON SETTINGS (background, visibility, spacing, animation, etc.)
  // =====================================================
  applyCommonUpdates(el, updates);

  // =====================================================
  // TITLE & SUBTITLE UPDATES
  // =====================================================
  
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
      titleEl.style.display = updates.title ? '' : 'none';
    }
  }

  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.style.color = updates.settings.titleColor as string;
    }
  }

  if (updates.settings?.titleSize !== undefined || updates.settings?.titleSizeMobile !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const desktopSize = updates.settings?.titleSize as number | undefined;
      const mobileSize = updates.settings?.titleSizeMobile as number | undefined;
      
      if (typeof desktopSize === 'number') {
        titleEl.style.setProperty('--title-size-desktop', `${desktopSize}px`);
      }
      if (typeof mobileSize === 'number') {
        titleEl.style.setProperty('--title-size-mobile', `${mobileSize}px`);
      }
      
      const currentDesktop = titleEl.style.getPropertyValue('--title-size-desktop') || `${desktopSize || 30}px`;
      const currentMobile = titleEl.style.getPropertyValue('--title-size-mobile') || currentDesktop;
      const isMobile = window.innerWidth < 768;
      titleEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
    }
  }

  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
      subtitleEl.style.display = updates.subtitle ? '' : 'none';
    }
  }

  if (updates.settings?.subtitleColor !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.style.color = updates.settings.subtitleColor as string;
    }
  }

  // =====================================================
  // REVIEWS CONTENT UPDATES
  // =====================================================
  
  if (updates.content?.reviews !== undefined) {
    const reviews = updates.content.reviews as Review[];
    const grid = el.querySelector('[data-reviews-grid]') as HTMLElement;
    
    if (grid && reviews) {
      // Get existing review cards
      const existingCards = grid.querySelectorAll('[data-review-index]');
      
      reviews.forEach((review, index) => {
        let card = grid.querySelector(`[data-review-index="${index}"]`) as HTMLElement;
        
        if (!card) {
          // Create new card if doesn't exist
          card = createReviewCard(review, index, el.getAttribute('data-section-id') || '');
          grid.appendChild(card);
        } else {
          // Update existing card
          updateReviewCard(card, review);
        }
      });

      // Remove extra cards
      existingCards.forEach((card, index) => {
        if (index >= reviews.length) {
          card.remove();
        }
      });
    }
  }

  // =====================================================
  // INDIVIDUAL REVIEW FIELD UPDATES
  // =====================================================
  
  // Update specific review author
  if (updates.content && typeof updates.content === 'object') {
    const content = updates.content;
    Object.keys(content).forEach(key => {
      const match = key.match(/^reviews\[(\d+)\]\.(\w+)$/);
      if (match) {
        const [, indexStr, field] = match;
        const index = parseInt(indexStr);
        const card = el.querySelector(`[data-review-index="${index}"]`) as HTMLElement;
        if (card) {
          updateReviewField(card, field, content[key] as string | number);
        }
      }
    });
  }

  // =====================================================
  // LAYOUT SETTINGS
  // =====================================================
  
  if (updates.settings?.layout !== undefined) {
    el.setAttribute('data-layout', updates.settings.layout as string);
    
    const grid = el.querySelector('[data-reviews-grid]') as HTMLElement;
    if (grid) {
      if (updates.settings.layout === 'slider') {
        grid.classList.add('flex', 'overflow-x-auto', 'snap-x', 'snap-mandatory');
        grid.classList.remove('grid');
      } else {
        grid.classList.remove('flex', 'overflow-x-auto', 'snap-x', 'snap-mandatory');
        grid.classList.add('grid');
      }
    }
  }

  if (updates.settings?.columns !== undefined) {
    const grid = el.querySelector('[data-reviews-grid]') as HTMLElement;
    if (grid) {
      grid.classList.remove('md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4');
      grid.classList.add(`md:grid-cols-${updates.settings.columns}`);
    }
  }

  if (updates.settings?.gap !== undefined) {
    const grid = el.querySelector('[data-reviews-grid]') as HTMLElement;
    if (grid) {
      grid.style.gap = `${updates.settings.gap}px`;
    }
  }

  if (updates.settings?.contentAlign !== undefined) {
    const align = updates.settings.contentAlign as string;
    const cards = el.querySelectorAll('[data-review-index]');
    cards.forEach((card) => {
      (card as HTMLElement).classList.remove('text-left', 'text-center', 'text-right');
      (card as HTMLElement).classList.add(`text-${align}`);
      
      // Update flex alignments within card
      const flexContainers = card.querySelectorAll('.flex');
      flexContainers.forEach((fc) => {
        (fc as HTMLElement).classList.remove('justify-start', 'justify-center', 'justify-end');
        const justifyMap: Record<string, string> = {
          'left': 'justify-end',   // RTL
          'center': 'justify-center',
          'right': 'justify-start', // RTL
        };
        (fc as HTMLElement).classList.add(justifyMap[align] || 'justify-center');
      });
    });
  }

  // =====================================================
  // CARD STYLING
  // =====================================================
  
  if (updates.settings?.cardBackground !== undefined) {
    const cardBg = updates.settings.cardBackground as string;
    const cards = el.querySelectorAll('[data-review-index]');
    cards.forEach((card) => {
      (card as HTMLElement).style.backgroundColor = cardBg;
    });
  }

  if (updates.settings?.starColor !== undefined) {
    const starColor = updates.settings.starColor as string;
    const stars = el.querySelectorAll('[data-review-rating] svg');
    stars.forEach((star) => {
      (star as SVGElement).style.fill = starColor;
    });
  }

  // =====================================================
  // SECTION STYLING
  // =====================================================
  
  if (updates.settings?.backgroundColor !== undefined) {
    el.style.backgroundColor = updates.settings.backgroundColor as string;
  }

  if (updates.settings?.paddingTop !== undefined) {
    el.style.paddingTop = `${updates.settings.paddingTop}px`;
  }

  if (updates.settings?.paddingBottom !== undefined) {
    el.style.paddingBottom = `${updates.settings.paddingBottom}px`;
  }

  if (updates.settings?.isVisible !== undefined) {
    el.style.display = updates.settings.isVisible ? '' : 'none';
  }
}

/**
 * Create a new review card element
 */
function createReviewCard(review: Review, index: number, sectionId: string): HTMLElement {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl p-6 shadow-sm';
  card.setAttribute('data-review-index', String(index));
  card.setAttribute('data-review-id', review.id || `review-${index}`);
  
  card.innerHTML = `
    <div class="mb-3 flex justify-center" data-review-rating="${review.rating}">
      ${Array(5).fill(0).map((_, i) => `
        <svg class="w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      `).join('')}
    </div>
    <p class="text-gray-700 mb-4 leading-relaxed" data-review-text>${review.text}</p>
    <div class="flex items-center gap-3 justify-center">
      <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium" data-review-avatar>
        ${review.avatar ? `<img src="${review.avatar}" class="w-full h-full rounded-full object-cover" />` : (review.author?.[0] || '?')}
      </div>
      <div>
        <div class="font-medium text-gray-900" data-review-author>${review.author}</div>
        ${review.date ? `<div class="text-sm text-gray-500" data-review-date>${review.date}</div>` : ''}
      </div>
    </div>
  `;
  
  return card;
}

/**
 * Update an existing review card
 */
function updateReviewCard(card: HTMLElement, review: Review): void {
  updateReviewField(card, 'author', review.author);
  updateReviewField(card, 'text', review.text);
  updateReviewField(card, 'rating', review.rating);
  if (review.date) updateReviewField(card, 'date', review.date);
}

/**
 * Update a specific field in a review card
 */
function updateReviewField(card: HTMLElement, field: string, value: string | number): void {
  switch (field) {
    case 'author': {
      const authorEl = card.querySelector('[data-review-author]') as HTMLElement;
      if (authorEl) authorEl.textContent = value as string;
      break;
    }
    case 'text': {
      const textEl = card.querySelector('[data-review-text]') as HTMLElement;
      if (textEl) textEl.textContent = value as string;
      break;
    }
    case 'rating': {
      const ratingContainer = card.querySelector('[data-review-rating]') as HTMLElement;
      if (ratingContainer) {
        ratingContainer.setAttribute('data-review-rating', String(value));
        const stars = ratingContainer.querySelectorAll('svg');
        stars.forEach((star, i) => {
          if (i < (value as number)) {
            star.classList.add('text-yellow-400', 'fill-current');
            star.classList.remove('text-gray-300');
          } else {
            star.classList.remove('text-yellow-400', 'fill-current');
            star.classList.add('text-gray-300');
          }
        });
      }
      break;
    }
    case 'date': {
      const dateEl = card.querySelector('[data-review-date]') as HTMLElement;
      if (dateEl) dateEl.textContent = value as string;
      break;
    }
  }
}

export const defaultContent = {
  reviews: [
    { author: 'שרה כ.', text: 'מוצר מעולה, ממליצה בחום!', rating: 5 },
    { author: 'דוד מ.', text: 'איכות גבוהה ומשלוח מהיר', rating: 5 },
    { author: 'רחל ל.', text: 'שירות לקוחות מצוין', rating: 4 },
  ],
};

export const defaultSettings = {
  titleSize: 30,
  titleSizeMobile: 24,
  titleColor: '#000000',
  subtitleSize: 16,
  subtitleSizeMobile: 14,
  subtitleColor: '#6b7280',
  layout: 'grid',
  columns: 3,
  mobileColumns: 1,
  gap: 24,
  contentAlign: 'center',
  cardBackground: '#ffffff',
  starColor: '#facc15',
  backgroundColor: '#f9fafb',
  paddingTop: 64,
  paddingBottom: 64,
  isVisible: true,
};

