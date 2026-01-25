/**
 * FAQ Section - Live Update Handler
 * מטפל בעדכונים בזמן אמת לסקשן שאלות נפוצות
 */

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

interface ContentUpdates {
  items?: FAQItem[];
}

interface SettingsUpdates {
  backgroundColor?: string;
}

interface Updates {
  content?: ContentUpdates;
  settings?: SettingsUpdates;
}

/**
 * Create a new FAQ item element for the DOM
 */
function createFAQItemElement(index: number): HTMLElement {
  const newItem = document.createElement('div');
  newItem.className = 'border border-gray-200 rounded-lg';
  newItem.setAttribute('data-faq-item-index', String(index));
  newItem.setAttribute('data-faq-item-id', String(index));
  newItem.innerHTML = `
    <button class="w-full px-4 py-4 flex items-center justify-between text-right hover:bg-gray-50">
      <span class="font-medium text-gray-900" data-faq-question>שאלה חדשה</span>
      <svg class="w-5 h-5 text-gray-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div class="px-4 pb-4 text-gray-600" data-faq-answer style="display: none;">תשובה חדשה</div>
  `;
  return newItem;
}

/**
 * Update a single FAQ item element
 */
function updateFAQItemElement(itemEl: HTMLElement, item: FAQItem): void {
  itemEl.style.display = '';
  
  const questionEl = itemEl.querySelector('[data-faq-question]') as HTMLElement;
  const answerEl = itemEl.querySelector('[data-faq-answer]') as HTMLElement;
  
  if (questionEl) questionEl.textContent = item.question || '';
  if (answerEl) answerEl.textContent = item.answer || '';
}

/**
 * Main handler for FAQ section updates
 */
export function handleFAQUpdate(element: HTMLElement, updates: Updates): void {
  // Handle content updates (items list)
  if (updates.content?.items && element.querySelector('[data-faq-items]')) {
    const items = updates.content.items;
    const faqContainer = element.querySelector('[data-faq-items]') as HTMLElement;
    let faqElements = element.querySelectorAll('[data-faq-item-index]');
    
    // If we need more elements, create them
    if (faqContainer && items.length > faqElements.length) {
      for (let i = faqElements.length; i < items.length; i++) {
        faqContainer.appendChild(createFAQItemElement(i));
      }
      faqElements = element.querySelectorAll('[data-faq-item-index]');
    }
    
    // Update each item
    items.forEach((item, index) => {
      const itemEl = faqElements[index] as HTMLElement;
      if (itemEl) {
        updateFAQItemElement(itemEl, item);
      }
    });
    
    // Hide extra elements
    faqElements.forEach((el, index) => {
      (el as HTMLElement).style.display = index < items.length ? '' : 'none';
    });
  }
  
  // Handle settings updates
  if (updates.settings) {
    // Update background color
    if (updates.settings.backgroundColor !== undefined) {
      element.style.backgroundColor = updates.settings.backgroundColor || '';
    }
  }
}

