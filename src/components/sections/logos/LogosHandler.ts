/**
 * LogosHandler - DOM update logic for logos section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

interface Logo {
  id?: string;
  imageUrl: string;
  alt?: string;
  link?: string;
}

export function handleLogosUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  // Logo height
  if (updates.settings?.logoHeight !== undefined) {
    const height = updates.settings.logoHeight as number;
    const logos = el.querySelectorAll('[data-logo-image]');
    logos.forEach((img) => {
      (img as HTMLElement).style.height = `${height}px`;
    });
  }

  // Grayscale
  if (updates.settings?.grayscale !== undefined) {
    const isGray = updates.settings.grayscale as boolean;
    const logos = el.querySelectorAll('[data-logo-id]');
    logos.forEach((wrapper) => {
      const img = wrapper.querySelector('[data-logo-image]') as HTMLElement;
      if (img) {
        if (isGray) {
          (wrapper as HTMLElement).classList.add('opacity-60');
          img.classList.add('grayscale');
        } else {
          (wrapper as HTMLElement).classList.remove('opacity-60');
          img.classList.remove('grayscale');
        }
      }
    });
  }

  // Update logos content
  if (updates.content?.logos !== undefined) {
    const logos = updates.content.logos as Logo[];
    const grid = el.querySelector('[data-logos-grid]') as HTMLElement;
    
    if (grid && logos) {
      const existingLogos = grid.querySelectorAll('[data-logo-index]');
      
      logos.forEach((logo, index) => {
        let logoEl = grid.querySelector(`[data-logo-index="${index}"]`) as HTMLElement;
        
        if (!logoEl) {
          logoEl = createLogoElement(logo, index);
          grid.appendChild(logoEl);
        } else {
          updateLogoElement(logoEl, logo);
        }
      });

      existingLogos.forEach((logoEl, index) => {
        if (index >= logos.length) {
          logoEl.remove();
        }
      });
    }
  }
}

function createLogoElement(logo: Logo, index: number): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center justify-center p-4';
  wrapper.setAttribute('data-logo-index', String(index));
  wrapper.setAttribute('data-logo-id', logo.id || `logo-${index}`);
  
  if (logo.imageUrl) {
    if (logo.link) {
      wrapper.innerHTML = `<a href="${logo.link}" target="_blank" rel="noopener noreferrer"><img src="${logo.imageUrl}" alt="${logo.alt || ''}" class="h-12 object-contain" data-logo-image /></a>`;
    } else {
      wrapper.innerHTML = `<img src="${logo.imageUrl}" alt="${logo.alt || ''}" class="h-12 object-contain" data-logo-image />`;
    }
  } else {
    wrapper.innerHTML = `<div class="w-24 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">לוגו ${index + 1}</div>`;
  }
  
  return wrapper;
}

function updateLogoElement(el: HTMLElement, logo: Logo): void {
  const img = el.querySelector('[data-logo-image]') as HTMLImageElement;
  if (img && logo.imageUrl) {
    img.src = logo.imageUrl;
    img.alt = logo.alt || '';
  } else if (!logo.imageUrl) {
    const index = el.getAttribute('data-logo-index') || '0';
    el.innerHTML = `<div class="w-24 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">לוגו ${parseInt(index) + 1}</div>`;
  }
}

export function handler(element: Element, updates: Record<string, unknown>) {
  handleLogosUpdate(element, updates as Partial<Section>);
}

export const defaultContent = { 
  logos: [
    { id: '1', imageUrl: '', alt: 'לוגו 1' },
    { id: '2', imageUrl: '', alt: 'לוגו 2' },
    { id: '3', imageUrl: '', alt: 'לוגו 3' },
    { id: '4', imageUrl: '', alt: 'לוגו 4' },
    { id: '5', imageUrl: '', alt: 'לוגו 5' },
  ] 
};

export const defaultSettings = {
  titleSize: 30, titleSizeMobile: 24, titleColor: '#000000',
  logoHeight: 48, grayscale: false, backgroundColor: '#ffffff',
  paddingTop: 48, paddingBottom: 48, isVisible: true,
};

