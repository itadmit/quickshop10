/**
 * NewsletterHandler - DOM update logic for newsletter section
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

export function handleNewsletterUpdate(element: Element, updates: Partial<Section>): void {
  const el = element as HTMLElement;
  applyCommonUpdates(element, updates);

  // Newsletter-specific: placeholder text
  if (updates.content?.placeholder !== undefined) {
    const input = el.querySelector('[data-content-placeholder]') as HTMLInputElement;
    if (input) input.placeholder = updates.content.placeholder as string;
  }

  // Input border color
  if (updates.settings?.inputBorderColor !== undefined) {
    const input = el.querySelector('[data-content-placeholder]') as HTMLElement;
    if (input) input.style.borderColor = updates.settings.inputBorderColor as string;
  }
}

export const defaultContent = { placeholder: 'כתובת אימייל', buttonText: 'הרשמה' };
export const defaultSettings = {
  titleSize: 30, titleSizeMobile: 24, titleColor: '#000000',
  subtitleColor: '#6b7280', backgroundColor: '#f9fafb',
  paddingTop: 64, paddingBottom: 64, isVisible: true,
};

