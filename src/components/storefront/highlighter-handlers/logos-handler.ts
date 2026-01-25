/**
 * Logos Section - Live Update Handler
 * מטפל בעדכונים בזמן אמת לסקשן לוגואים
 */

interface Logo {
  id?: string;
  url: string;
  name?: string;
  link?: string;
}

interface ContentUpdates {
  logos?: Logo[];
}

interface SettingsUpdates {
  columns?: number;
  mobileColumns?: number;
  backgroundColor?: string;
}

interface Updates {
  content?: ContentUpdates;
  settings?: SettingsUpdates;
}

/**
 * Create a new logo element for the DOM
 */
function createLogoElement(index: number): HTMLElement {
  const newItem = document.createElement('div');
  newItem.className = 'flex items-center justify-center p-4 bg-white rounded-lg';
  newItem.setAttribute('data-logo-index', String(index));
  newItem.setAttribute('data-logo-id', String(index));
  newItem.innerHTML = `
    <img src="" alt="" class="max-h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all" data-logo-image />
    <div class="w-24 h-12 flex items-center justify-center" data-logo-placeholder>
      <span class="text-gray-400 text-xs">לוגו</span>
    </div>
  `;
  return newItem;
}

/**
 * Update a single logo element
 */
function updateLogoElement(itemEl: HTMLElement, logo: Logo): void {
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

/**
 * Update grid columns classes
 */
function updateGridColumns(grid: HTMLElement, columns: number, mobileColumns: number): void {
  const classList = grid.classList;
  Array.from(classList).forEach(cls => {
    if (cls.startsWith('grid-cols-') || cls.startsWith('md:grid-cols-')) {
      classList.remove(cls);
    }
  });
  
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
  
  const mobileClass = mobileColsMap[mobileColumns] || 'grid-cols-2';
  const desktopClass = colsMap[columns] || 'md:grid-cols-6';
  
  classList.add(mobileClass, desktopClass);
}

/**
 * Main handler for logos section updates
 */
export function handleLogosUpdate(element: HTMLElement, updates: Updates): void {
  // Handle content updates (logos list)
  if (updates.content?.logos) {
    const logos = updates.content.logos;
    const logosGrid = element.querySelector('[data-logos-grid]') as HTMLElement;
    let logoElements = element.querySelectorAll('[data-logo-index]');
    
    // If we need more elements, create them
    if (logosGrid && logos.length > logoElements.length) {
      for (let i = logoElements.length; i < logos.length; i++) {
        logosGrid.appendChild(createLogoElement(i));
      }
      logoElements = element.querySelectorAll('[data-logo-index]');
    }
    
    // Update each logo
    logos.forEach((logo, index) => {
      const itemEl = logoElements[index] as HTMLElement;
      if (itemEl) {
        updateLogoElement(itemEl, logo);
      }
    });
    
    // Hide extra elements
    logoElements.forEach((el, index) => {
      (el as HTMLElement).style.display = index < logos.length ? '' : 'none';
    });
  }
  
  // Handle settings updates
  if (updates.settings) {
    const grid = element.querySelector('[data-logos-grid]') as HTMLElement;
    
    // Update columns
    if (grid && (updates.settings.columns !== undefined || updates.settings.mobileColumns !== undefined)) {
      const columns = updates.settings.columns || 6;
      const mobileColumns = updates.settings.mobileColumns || 3;
      updateGridColumns(grid, columns, mobileColumns);
    }
    
    // Update background color
    if (updates.settings.backgroundColor !== undefined) {
      element.style.backgroundColor = updates.settings.backgroundColor || '';
    }
  }
}

