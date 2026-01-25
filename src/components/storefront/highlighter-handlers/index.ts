/**
 * Highlighter Handlers - Modular live update handlers
 * מטפלים מודולריים לעדכונים בזמן אמת
 */

export { handleReviewsUpdate } from './reviews-handler';
export { handleFeaturesUpdate } from './features-handler';
export { handleGalleryUpdate } from './gallery-handler';
export { handleLogosUpdate } from './logos-handler';
export { handleFAQUpdate } from './faq-handler';

// Types
export interface SectionUpdates {
  title?: string;
  subtitle?: string;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

// Common update functions
export function updateTitle(element: HTMLElement, title: string | undefined): void {
  if (title === undefined) return;
  const titleEl = element.querySelector('[data-section-title]') as HTMLElement;
  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.display = title ? '' : 'none';
    titleEl.classList.toggle('hidden', !title);
  }
}

export function updateSubtitle(element: HTMLElement, subtitle: string | undefined): void {
  if (subtitle === undefined) return;
  const subtitleEl = element.querySelector('[data-section-subtitle]') as HTMLElement;
  if (subtitleEl) {
    subtitleEl.textContent = subtitle;
    subtitleEl.style.display = subtitle ? '' : 'none';
    subtitleEl.classList.toggle('hidden', !subtitle);
  }
}

export function updateButton(element: HTMLElement, buttonText: string | undefined, buttonLink?: string): void {
  const btnEl = element.querySelector('[data-section-button]') as HTMLElement;
  if (!btnEl) return;
  
  if (buttonText !== undefined) {
    btnEl.textContent = buttonText;
    btnEl.style.display = buttonText ? '' : 'none';
    btnEl.classList.toggle('hidden', !buttonText);
  }
  
  if (buttonLink !== undefined && btnEl instanceof HTMLAnchorElement) {
    btnEl.href = buttonLink || '#';
  }
}

export function updateBackgroundColor(element: HTMLElement, backgroundColor: string | undefined): void {
  if (backgroundColor === undefined) return;
  element.style.backgroundColor = backgroundColor || '';
}

