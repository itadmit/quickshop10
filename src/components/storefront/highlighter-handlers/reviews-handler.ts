/**
 * Reviews Section - Live Update Handler
 * מטפל בעדכונים בזמן אמת לסקשן ביקורות
 */

interface Review {
  id?: string;
  author?: string;
  text: string;
  rating: number;
  date?: string;
  verified?: boolean;
}

interface ContentUpdates {
  reviews?: Review[];
}

interface SettingsUpdates {
  columns?: number;
  mobileColumns?: number;
  textAlign?: string;
  layout?: string;
  backgroundColor?: string;
}

interface Updates {
  content?: ContentUpdates;
  settings?: SettingsUpdates;
}

/**
 * Create a new review element for the DOM
 */
function createReviewElement(index: number): HTMLElement {
  const newReviewEl = document.createElement('div');
  newReviewEl.className = 'bg-white p-6 rounded-lg shadow-sm border border-gray-100';
  newReviewEl.setAttribute('data-review-index', String(index));
  newReviewEl.setAttribute('data-review-id', String(index));
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
  return newReviewEl;
}

/**
 * Update a single review element
 */
function updateReviewElement(reviewEl: HTMLElement, review: Review): void {
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

/**
 * Update grid columns classes
 */
function updateGridColumns(grid: HTMLElement, columns: number, mobileColumns: number): void {
  // Remove existing column classes
  const classList = grid.classList;
  Array.from(classList).forEach(cls => {
    if (cls.startsWith('grid-cols-') || cls.startsWith('md:grid-cols-')) {
      classList.remove(cls);
    }
  });
  
  // Add new column classes
  const mobileColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };
  const colsMap: Record<number, string> = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  };
  
  const mobileClass = mobileColsMap[mobileColumns] || 'grid-cols-1';
  const desktopClass = colsMap[columns] || 'md:grid-cols-3';
  
  classList.add(mobileClass, desktopClass);
}

/**
 * Update text alignment for review items
 */
function updateTextAlignment(element: HTMLElement, textAlign: string): void {
  // Map stored value to visual classes (RTL aware)
  const alignClass = textAlign === 'left' ? 'text-right' : textAlign === 'right' ? 'text-left' : 'text-center';
  const flexJustify = textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center';
  
  // Update each review item (not the header!)
  const reviewItems = element.querySelectorAll('[data-review-index]');
  reviewItems.forEach((item) => {
    const el = item as HTMLElement;
    // Remove old alignment classes
    el.classList.remove('text-left', 'text-center', 'text-right');
    // Add new alignment class
    el.classList.add(alignClass);
    
    // Update flex containers (stars, author line)
    const flexContainers = el.querySelectorAll('.flex');
    flexContainers.forEach((flex) => {
      const flexEl = flex as HTMLElement;
      flexEl.classList.remove('justify-start', 'justify-center', 'justify-end');
      flexEl.classList.add(flexJustify);
    });
  });
}

/**
 * Update layout (grid vs slider)
 */
function updateLayout(grid: HTMLElement, layout: string): void {
  if (layout === 'slider') {
    // Convert to slider layout
    grid.classList.remove('grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4');
    grid.classList.add('flex', 'overflow-x-auto', 'snap-x', 'snap-mandatory', 'scroll-smooth', 'pb-4');
    
    // Apply hide scrollbar styles
    (grid.style as unknown as Record<string, string>)['scrollbar-width'] = 'none';
    (grid.style as unknown as Record<string, string>)['-ms-overflow-style'] = 'none';
    (grid.style as unknown as Record<string, string>)['-webkit-overflow-scrolling'] = 'touch';
    
    // Update individual items for slider
    const items = grid.querySelectorAll('[data-review-index]');
    items.forEach((item) => {
      const el = item as HTMLElement;
      el.classList.add('flex-shrink-0', 'snap-start');
      el.style.width = '300px';
      el.style.minWidth = '300px';
    });
  } else {
    // Restore grid layout
    grid.classList.remove('flex', 'overflow-x-auto', 'snap-x', 'snap-mandatory', 'scroll-smooth');
    grid.classList.add('grid');
    
    // Remove slider styles
    grid.style.removeProperty('scrollbar-width');
    
    // Remove slider item styles
    const items = grid.querySelectorAll('[data-review-index]');
    items.forEach((item) => {
      const el = item as HTMLElement;
      el.classList.remove('flex-shrink-0', 'snap-start');
      el.style.width = '';
      el.style.minWidth = '';
    });
  }
}

/**
 * Main handler for reviews section updates
 */
export function handleReviewsUpdate(element: HTMLElement, updates: Updates): void {
  // Handle content updates (reviews list)
  if (updates.content?.reviews) {
    const reviews = updates.content.reviews;
    const reviewsGrid = element.querySelector('[data-reviews-grid]') as HTMLElement;
    let reviewElements = element.querySelectorAll('[data-review-index]');
    
    // If we need more review elements, create them
    if (reviewsGrid && reviews.length > reviewElements.length) {
      for (let i = reviewElements.length; i < reviews.length; i++) {
        reviewsGrid.appendChild(createReviewElement(i));
      }
      // Refresh the list
      reviewElements = element.querySelectorAll('[data-review-index]');
    }
    
    // Update each review
    reviews.forEach((review, index) => {
      const reviewEl = reviewElements[index] as HTMLElement;
      if (reviewEl) {
        updateReviewElement(reviewEl, review);
      }
    });
    
    // Hide extra review elements
    reviewElements.forEach((el, index) => {
      (el as HTMLElement).style.display = index < reviews.length ? '' : 'none';
    });
  }
  
  // Handle settings updates
  if (updates.settings) {
    const grid = element.querySelector('[data-reviews-grid]') as HTMLElement;
    
    // Update columns
    if (grid && (updates.settings.columns !== undefined || updates.settings.mobileColumns !== undefined)) {
      const columns = updates.settings.columns || 3;
      const mobileColumns = updates.settings.mobileColumns || 1;
      updateGridColumns(grid, columns, mobileColumns);
    }
    
    // Update text alignment
    if (updates.settings.textAlign !== undefined) {
      updateTextAlignment(element, updates.settings.textAlign);
    }
    
    // Update layout
    if (grid && updates.settings.layout !== undefined) {
      updateLayout(grid, updates.settings.layout);
    }
    
    // Update background color
    if (updates.settings.backgroundColor !== undefined) {
      element.style.backgroundColor = updates.settings.backgroundColor || '';
    }
  }
}

