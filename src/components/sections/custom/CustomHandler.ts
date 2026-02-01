/**
 * CustomHandler - Real-time updates for custom HTML section
 */

import { applyCommonUpdates } from '../handlers/common-handler';

export function handler(element: Element, updates: Record<string, unknown>) {
  const el = element as HTMLElement;
  
  // Apply common updates (background, spacing, visibility, animation, etc.)
  applyCommonUpdates(element, updates);
  
  const content = (updates.content || {}) as Record<string, unknown>;
  
  // Update HTML content
  if (content.html !== undefined) {
    const htmlContainer = el.querySelector('[data-custom-html]') as HTMLElement;
    if (htmlContainer) {
      htmlContainer.innerHTML = content.html as string || '';
    } else {
      // Create container if it doesn't exist
      const container = document.createElement('div');
      container.setAttribute('data-custom-html', '');
      container.innerHTML = content.html as string || '';
      
      // Clear placeholder content and add new container
      el.innerHTML = '';
      el.appendChild(container);
      el.className = ''; // Remove placeholder styling
    }
  }
}

export const defaultContent = {
  html: '',
};

export const defaultSettings = {
  // Spacing
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
};

export const config = {
  name: 'HTML מותאם אישית',
  description: 'הזנת קוד HTML מותאם אישית',
  category: 'מתקדם',
  icon: 'Code',
};






