/**
 * ContactHandler - DOM update logic for contact section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleContactUpdate(element: Element, updates: Partial<Section>): void {
  applyCommonUpdates(element, updates);
  
  // Contact-specific: info items
  const el = element as HTMLElement;
  
  if (updates.content?.email !== undefined) {
    const emailEl = el.querySelector('[data-contact-email]') as HTMLElement;
    if (emailEl) emailEl.textContent = updates.content.email as string;
  }
  
  if (updates.content?.phone !== undefined) {
    const phoneEl = el.querySelector('[data-contact-phone]') as HTMLElement;
    if (phoneEl) phoneEl.textContent = updates.content.phone as string;
  }
  
  if (updates.content?.address !== undefined) {
    const addressEl = el.querySelector('[data-contact-address]') as HTMLElement;
    if (addressEl) addressEl.textContent = updates.content.address as string;
  }
}

export const defaultContent = { email: 'info@example.com', phone: '03-1234567', address: 'תל אביב' };
export const defaultSettings = {
  titleSize: 30, titleSizeMobile: 24, titleColor: '#000000',
  backgroundColor: '#ffffff', paddingTop: 64, paddingBottom: 64, isVisible: true,
};

