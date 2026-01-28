/**
 * GalleryHandler - DOM update logic for gallery section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

interface GalleryImage {
  id?: string;
  url: string;
  alt?: string;
}

export function handleGalleryUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);
  
  // Update images content
  if (updates.content?.images !== undefined) {
    const images = updates.content.images as GalleryImage[];
    const grid = el.querySelector('[data-gallery-grid]') as HTMLElement;
    
    if (grid && images) {
      const existingImages = grid.querySelectorAll('[data-gallery-item-index]');
      
      images.forEach((image, index) => {
        let imageEl = grid.querySelector(`[data-gallery-item-index="${index}"]`) as HTMLElement;
        
        if (!imageEl) {
          imageEl = createImageElement(image, index);
          grid.appendChild(imageEl);
        } else {
          updateImageElement(imageEl, image);
        }
      });

      existingImages.forEach((imgEl, index) => {
        if (index >= images.length) {
          imgEl.remove();
        }
      });
    }
  }

  // Columns update
  if (updates.settings?.columns !== undefined) {
    const grid = el.querySelector('[data-gallery-grid]') as HTMLElement;
    if (grid) {
      grid.classList.remove('md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5', 'md:grid-cols-6');
      grid.classList.add(`md:grid-cols-${updates.settings.columns}`);
    }
  }

  // Gap update
  if (updates.settings?.gap !== undefined) {
    const grid = el.querySelector('[data-gallery-grid]') as HTMLElement;
    if (grid) {
      grid.style.gap = `${updates.settings.gap}px`;
    }
  }
}

function createImageElement(image: GalleryImage, index: number): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative aspect-square overflow-hidden rounded-lg group cursor-pointer';
  wrapper.setAttribute('data-gallery-item-index', String(index));
  wrapper.setAttribute('data-gallery-item-id', image.id || `img-${index}`);
  
  if (image.url) {
    wrapper.innerHTML = `
      <img src="${image.url}" alt="${image.alt || ''}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-gallery-image />
      <div class="w-full h-full flex items-center justify-center bg-gray-100" data-gallery-placeholder style="display: none">
        <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    `;
  } else {
    wrapper.innerHTML = `
      <img src="" alt="" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" data-gallery-image style="display: none" />
      <div class="w-full h-full flex items-center justify-center bg-gray-100" data-gallery-placeholder>
        <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    `;
  }
  
  return wrapper;
}

function updateImageElement(el: HTMLElement, image: GalleryImage): void {
  const img = el.querySelector('[data-gallery-image]') as HTMLImageElement;
  const placeholder = el.querySelector('[data-gallery-placeholder]') as HTMLElement;
  
  if (image.url) {
    if (img) {
      img.src = image.url;
      img.alt = image.alt || '';
      img.style.display = '';
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  } else {
    if (img) {
      img.style.display = 'none';
    }
    if (placeholder) {
      placeholder.style.display = '';
    }
  }
}

export function handler(element: Element, updates: Record<string, unknown>) {
  handleGalleryUpdate(element, updates as Partial<Section>);
}

export const defaultContent = { 
  images: [
    { id: '1', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', alt: 'תמונה 1' },
    { id: '2', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600', alt: 'תמונה 2' },
    { id: '3', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600', alt: 'תמונה 3' },
    { id: '4', url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600', alt: 'תמונה 4' },
  ] 
};

export const defaultSettings = {
  titleSize: 30, titleSizeMobile: 24, titleColor: '#000000',
  columns: 4, mobileColumns: 2, gap: 16,
  backgroundColor: '#ffffff', paddingTop: 64, paddingBottom: 64, isVisible: true,
};

