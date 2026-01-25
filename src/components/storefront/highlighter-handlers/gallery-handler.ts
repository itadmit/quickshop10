/**
 * Gallery Section - Live Update Handler
 * מטפל בעדכונים בזמן אמת לסקשן גלריה
 */

interface GalleryImage {
  id?: string;
  url: string;
  alt?: string;
  link?: string;
}

interface ContentUpdates {
  images?: GalleryImage[];
}

interface SettingsUpdates {
  columns?: number;
  mobileColumns?: number;
  gap?: number;
  backgroundColor?: string;
}

interface Updates {
  content?: ContentUpdates;
  settings?: SettingsUpdates;
}

/**
 * Create a new gallery item element for the DOM
 */
function createGalleryItemElement(index: number): HTMLElement {
  const newItem = document.createElement('div');
  newItem.className = 'relative aspect-square overflow-hidden rounded-lg group cursor-pointer';
  newItem.setAttribute('data-gallery-item-index', String(index));
  newItem.setAttribute('data-gallery-item-id', String(index));
  newItem.innerHTML = `
    <img src="" alt="" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-gallery-image />
    <div class="w-full h-full flex items-center justify-center bg-gray-100" data-gallery-placeholder>
      <span class="text-gray-400">תמונה</span>
    </div>
  `;
  return newItem;
}

/**
 * Update a single gallery item element
 */
function updateGalleryItemElement(itemEl: HTMLElement, image: GalleryImage): void {
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
  const desktopClass = colsMap[columns] || 'md:grid-cols-4';
  
  classList.add(mobileClass, desktopClass);
}

/**
 * Main handler for gallery section updates
 */
export function handleGalleryUpdate(element: HTMLElement, updates: Updates): void {
  // Handle content updates (images list)
  if (updates.content?.images) {
    const images = updates.content.images;
    const galleryGrid = element.querySelector('[data-gallery-grid]') as HTMLElement;
    let imageElements = element.querySelectorAll('[data-gallery-item-index]');
    
    // If we need more elements, create them
    if (galleryGrid && images.length > imageElements.length) {
      for (let i = imageElements.length; i < images.length; i++) {
        galleryGrid.appendChild(createGalleryItemElement(i));
      }
      imageElements = element.querySelectorAll('[data-gallery-item-index]');
    }
    
    // Update each image
    images.forEach((image, index) => {
      const itemEl = imageElements[index] as HTMLElement;
      if (itemEl) {
        updateGalleryItemElement(itemEl, image);
      }
    });
    
    // Hide extra elements
    imageElements.forEach((el, index) => {
      (el as HTMLElement).style.display = index < images.length ? '' : 'none';
    });
  }
  
  // Handle settings updates
  if (updates.settings) {
    const grid = element.querySelector('[data-gallery-grid]') as HTMLElement;
    
    // Update columns
    if (grid && (updates.settings.columns !== undefined || updates.settings.mobileColumns !== undefined)) {
      const columns = updates.settings.columns || 4;
      const mobileColumns = updates.settings.mobileColumns || 2;
      updateGridColumns(grid, columns, mobileColumns);
    }
    
    // Update background color
    if (updates.settings.backgroundColor !== undefined) {
      element.style.backgroundColor = updates.settings.backgroundColor || '';
    }
  }
}

