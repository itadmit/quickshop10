/**
 * FeaturesHandler - DOM update logic for features section
 * לוגיקת עדכון DOM בזמן אמת לסקשן חוזקות
 */

import { Section } from '../types';

// Feature icon paths (SVG path data)
const ICON_PATHS: Record<string, string> = {
  truck: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  refresh: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  message: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  heart: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  sparkles: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  gift: 'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
};

interface Feature {
  id?: string;
  icon?: string;
  emoji?: string;
  title: string;
  description: string;
}

/**
 * Handle all real-time updates for features section
 */
export function handleFeaturesUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;

  // =====================================================
  // TITLE & SUBTITLE UPDATES
  // =====================================================
  
  if (updates.title !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.textContent = updates.title || '';
      titleEl.style.display = updates.title ? '' : 'none';
    }
  }

  if (updates.settings?.titleColor !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      titleEl.style.color = updates.settings.titleColor as string;
    }
  }

  if (updates.settings?.titleSize !== undefined || updates.settings?.titleSizeMobile !== undefined) {
    const titleEl = el.querySelector('[data-section-title]') as HTMLElement;
    if (titleEl) {
      const desktopSize = updates.settings?.titleSize as number | undefined;
      const mobileSize = updates.settings?.titleSizeMobile as number | undefined;
      
      if (typeof desktopSize === 'number') {
        titleEl.style.setProperty('--title-size-desktop', `${desktopSize}px`);
      }
      if (typeof mobileSize === 'number') {
        titleEl.style.setProperty('--title-size-mobile', `${mobileSize}px`);
      }
      
      const currentDesktop = titleEl.style.getPropertyValue('--title-size-desktop') || `${desktopSize || 30}px`;
      const currentMobile = titleEl.style.getPropertyValue('--title-size-mobile') || currentDesktop;
      const isMobile = window.innerWidth < 768;
      titleEl.style.fontSize = isMobile ? currentMobile : currentDesktop;
    }
  }

  if (updates.subtitle !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.textContent = updates.subtitle || '';
      subtitleEl.style.display = updates.subtitle ? '' : 'none';
    }
  }

  if (updates.settings?.subtitleColor !== undefined) {
    const subtitleEl = el.querySelector('[data-section-subtitle]') as HTMLElement;
    if (subtitleEl) {
      subtitleEl.style.color = updates.settings.subtitleColor as string;
    }
  }

  // =====================================================
  // FEATURES CONTENT UPDATES
  // =====================================================
  
  if (updates.content?.features !== undefined) {
    const features = updates.content.features as Feature[];
    const grid = el.querySelector('[data-features-grid]') as HTMLElement;
    
    if (grid && features) {
      const existingCards = grid.querySelectorAll('[data-feature-id]');
      
      features.forEach((feature, index) => {
        let card = grid.querySelector(`[data-feature-id="${feature.id || index}"]`) as HTMLElement;
        
        if (!card) {
          card = createFeatureCard(feature, index);
          grid.appendChild(card);
        } else {
          updateFeatureCard(card, feature);
        }
      });

      // Remove extra cards
      existingCards.forEach((card, index) => {
        if (index >= features.length) {
          card.remove();
        }
      });
    }
  }

  // =====================================================
  // INDIVIDUAL FEATURE UPDATES
  // =====================================================
  
  // Update specific feature icon
  if (updates.content && typeof updates.content === 'object') {
    const content = updates.content;
    Object.keys(content).forEach(key => {
      const match = key.match(/^features\[(\d+)\]\.(\w+)$/);
      if (match) {
        const [, indexStr, field] = match;
        const index = parseInt(indexStr);
        const cards = el.querySelectorAll('[data-feature-id]');
        const card = cards[index] as HTMLElement;
        if (card) {
          updateFeatureField(card, field, content[key] as string);
        }
      }
    });
  }

  // =====================================================
  // LAYOUT SETTINGS
  // =====================================================
  
  if (updates.settings?.columns !== undefined) {
    const grid = el.querySelector('[data-features-grid]') as HTMLElement;
    if (grid) {
      grid.classList.remove('md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5', 'md:grid-cols-6');
      grid.classList.add(`md:grid-cols-${updates.settings.columns}`);
    }
  }

  if (updates.settings?.gap !== undefined) {
    const grid = el.querySelector('[data-features-grid]') as HTMLElement;
    if (grid) {
      grid.style.gap = `${updates.settings.gap}px`;
    }
  }

  // =====================================================
  // ICON/TEXT STYLING
  // =====================================================
  
  if (updates.settings?.iconColor !== undefined) {
    const iconColor = updates.settings.iconColor as string;
    const icons = el.querySelectorAll('[data-feature-icon] svg');
    icons.forEach((icon) => {
      (icon as SVGElement).style.stroke = iconColor;
    });
  }

  if (updates.settings?.iconSize !== undefined) {
    const iconSize = updates.settings.iconSize as number;
    const icons = el.querySelectorAll('[data-feature-icon] svg');
    icons.forEach((icon) => {
      (icon as SVGElement).style.width = `${iconSize}px`;
      (icon as SVGElement).style.height = `${iconSize}px`;
    });
  }

  if (updates.settings?.featureTitleColor !== undefined) {
    const titleColor = updates.settings.featureTitleColor as string;
    const titles = el.querySelectorAll('[data-feature-title]');
    titles.forEach((title) => {
      (title as HTMLElement).style.color = titleColor;
    });
  }

  if (updates.settings?.featureDescriptionColor !== undefined) {
    const descColor = updates.settings.featureDescriptionColor as string;
    const descs = el.querySelectorAll('[data-feature-description]');
    descs.forEach((desc) => {
      (desc as HTMLElement).style.color = descColor;
    });
  }

  // =====================================================
  // SECTION STYLING
  // =====================================================
  
  if (updates.settings?.backgroundColor !== undefined) {
    el.style.backgroundColor = updates.settings.backgroundColor as string;
  }

  if (updates.settings?.paddingTop !== undefined) {
    el.style.paddingTop = `${updates.settings.paddingTop}px`;
  }

  if (updates.settings?.paddingBottom !== undefined) {
    el.style.paddingBottom = `${updates.settings.paddingBottom}px`;
  }

  if (updates.settings?.isVisible !== undefined) {
    el.style.display = updates.settings.isVisible ? '' : 'none';
  }
}

/**
 * Create a new feature card element
 */
function createFeatureCard(feature: Feature, index: number): HTMLElement {
  const card = document.createElement('div');
  card.className = 'text-center';
  card.setAttribute('data-feature-id', feature.id || String(index));
  
  const iconPath = feature.icon && ICON_PATHS[feature.icon] ? ICON_PATHS[feature.icon] : ICON_PATHS.sparkles;
  
  card.innerHTML = `
    <div class="mb-4 flex justify-center" data-feature-icon>
      ${feature.emoji ? 
        `<span class="text-3xl" data-feature-emoji>${feature.emoji}</span>` :
        `<svg class="w-12 h-12 text-primary stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}" />
        </svg>`
      }
    </div>
    <h3 class="font-semibold text-gray-900 mb-2" data-feature-title>${feature.title}</h3>
    <p class="text-sm text-gray-600" data-feature-description>${feature.description}</p>
  `;
  
  return card;
}

/**
 * Update an existing feature card
 */
function updateFeatureCard(card: HTMLElement, feature: Feature): void {
  updateFeatureField(card, 'title', feature.title);
  updateFeatureField(card, 'description', feature.description);
  if (feature.icon) updateFeatureField(card, 'icon', feature.icon);
}

/**
 * Update a specific field in a feature card
 */
function updateFeatureField(card: HTMLElement, field: string, value: string): void {
  switch (field) {
    case 'title': {
      const titleEl = card.querySelector('[data-feature-title]') as HTMLElement;
      if (titleEl) titleEl.textContent = value;
      break;
    }
    case 'description': {
      const descEl = card.querySelector('[data-feature-description]') as HTMLElement;
      if (descEl) descEl.textContent = value;
      break;
    }
    case 'icon': {
      const iconContainer = card.querySelector('[data-feature-icon]') as HTMLElement;
      if (iconContainer) {
        const iconPath = ICON_PATHS[value] || ICON_PATHS.sparkles;
        const svg = iconContainer.querySelector('svg');
        if (svg) {
          const path = svg.querySelector('path');
          if (path) {
            path.setAttribute('d', iconPath);
          }
        }
      }
      break;
    }
  }
}

export const defaultContent = {
  features: [
    { icon: 'truck', title: 'משלוח מהיר', description: 'עד 3 ימי עסקים' },
    { icon: 'refresh', title: 'החזרות חינם', description: 'עד 30 יום' },
    { icon: 'shield', title: 'תשלום מאובטח', description: 'אבטחה מלאה' },
    { icon: 'message', title: 'תמיכה 24/7', description: 'בכל שאלה' },
  ],
};

export const defaultSettings = {
  titleSize: 30,
  titleSizeMobile: 24,
  titleColor: '#000000',
  subtitleSize: 16,
  subtitleSizeMobile: 14,
  subtitleColor: '#6b7280',
  columns: 4,
  mobileColumns: 2,
  gap: 32,
  iconColor: '#000000',
  iconSize: 48,
  featureTitleColor: '#111827',
  featureDescriptionColor: '#6b7280',
  backgroundColor: '#ffffff',
  paddingTop: 64,
  paddingBottom: 64,
  isVisible: true,
};

