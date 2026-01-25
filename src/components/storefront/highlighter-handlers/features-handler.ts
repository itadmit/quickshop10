/**
 * Features Section - Live Update Handler
 * מטפל בעדכונים בזמן אמת לסקשן חוזקות
 */

import { FEATURE_ICON_PATHS } from '@/lib/section-system/constants/icons';

interface Feature {
  id?: string;
  icon?: string;
  emoji?: string;
  title: string;
  description?: string;
}

interface ContentUpdates {
  features?: Feature[];
}

interface SettingsUpdates {
  columns?: number;
  mobileColumns?: number;
  textAlign?: string;
  backgroundColor?: string;
}

interface Updates {
  content?: ContentUpdates;
  settings?: SettingsUpdates;
}

/**
 * Get SVG path for an icon name
 */
function getIconPath(iconName: string): string {
  return FEATURE_ICON_PATHS[iconName] || FEATURE_ICON_PATHS.check;
}

/**
 * Create SVG element for an icon
 */
function createIconSVG(iconPath: string): string {
  return `
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${iconPath}" />
    </svg>
  `;
}

/**
 * Create a new feature element for the DOM
 */
function createFeatureElement(index: number): HTMLElement {
  const newFeatureEl = document.createElement('div');
  newFeatureEl.className = 'flex flex-col items-center text-center';
  newFeatureEl.setAttribute('data-feature-index', String(index));
  newFeatureEl.setAttribute('data-feature-id', `feature-${index}`);
  newFeatureEl.innerHTML = `
    <div class="w-16 h-16 flex items-center justify-center text-gray-700 mb-4" data-feature-icon="">
      ${createIconSVG(FEATURE_ICON_PATHS.check)}
    </div>
    <h3 class="font-medium text-gray-900 mb-2" data-feature-title>תכונה חדשה</h3>
    <p class="text-sm text-gray-600" data-feature-description>תיאור התכונה</p>
  `;
  return newFeatureEl;
}

/**
 * Update a feature element's icon
 */
function updateFeatureIcon(iconEl: HTMLElement, feature: Feature): void {
  // Get the icon path
  const iconName = feature.icon || 'check';
  const iconPath = getIconPath(iconName);
  
  // Check if there's already an SVG
  const existingSvg = iconEl.querySelector('svg');
  
  if (existingSvg) {
    // Update existing SVG path
    const pathEl = existingSvg.querySelector('path');
    if (pathEl) {
      pathEl.setAttribute('d', iconPath);
    }
  } else {
    // Replace content with new SVG (in case it was emoji)
    iconEl.innerHTML = createIconSVG(iconPath);
  }
}

/**
 * Update a single feature element
 */
function updateFeatureElement(featureEl: HTMLElement, feature: Feature): void {
  featureEl.style.display = '';
  
  // Update icon
  const iconEl = featureEl.querySelector('[data-feature-icon]') as HTMLElement;
  if (iconEl) {
    updateFeatureIcon(iconEl, feature);
  }
  
  // Update title
  const titleEl = featureEl.querySelector('[data-feature-title]') as HTMLElement;
  if (titleEl) {
    titleEl.textContent = feature.title || '';
  }
  
  // Update description
  const descEl = featureEl.querySelector('[data-feature-description]') as HTMLElement;
  if (descEl) {
    descEl.textContent = feature.description || '';
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
  
  const mobileClass = mobileColsMap[mobileColumns] || 'grid-cols-1';
  const desktopClass = colsMap[columns] || 'md:grid-cols-3';
  
  classList.add(mobileClass, desktopClass);
}

/**
 * Update text alignment for feature items
 */
function updateTextAlignment(element: HTMLElement, textAlign: string): void {
  const alignClass = textAlign === 'left' ? 'text-right' : textAlign === 'right' ? 'text-left' : 'text-center';
  const itemsAlign = textAlign === 'left' ? 'items-start' : textAlign === 'right' ? 'items-end' : 'items-center';
  
  const featureItems = element.querySelectorAll('[data-feature-index]');
  featureItems.forEach((item) => {
    const el = item as HTMLElement;
    // Remove old alignment classes
    el.classList.remove('text-left', 'text-center', 'text-right', 'items-start', 'items-center', 'items-end');
    // Add new alignment classes
    el.classList.add(alignClass, itemsAlign);
  });
}

/**
 * Main handler for features section updates
 */
export function handleFeaturesUpdate(element: HTMLElement, updates: Updates): void {
  // Handle content updates (features list)
  if (updates.content?.features) {
    const features = updates.content.features;
    const featuresGrid = element.querySelector('[data-features-grid]') as HTMLElement;
    let featureElements = element.querySelectorAll('[data-feature-index]');
    
    // If we need more feature elements, create them
    if (featuresGrid && features.length > featureElements.length) {
      for (let i = featureElements.length; i < features.length; i++) {
        featuresGrid.appendChild(createFeatureElement(i));
      }
      // Refresh the list
      featureElements = element.querySelectorAll('[data-feature-index]');
    }
    
    // Update each feature
    features.forEach((feature, index) => {
      const featureEl = featureElements[index] as HTMLElement;
      if (featureEl) {
        updateFeatureElement(featureEl, feature);
      }
    });
    
    // Hide extra feature elements
    featureElements.forEach((el, index) => {
      (el as HTMLElement).style.display = index < features.length ? '' : 'none';
    });
  }
  
  // Handle settings updates
  if (updates.settings) {
    const grid = element.querySelector('[data-features-grid]') as HTMLElement;
    
    // Update columns
    if (grid && (updates.settings.columns !== undefined || updates.settings.mobileColumns !== undefined)) {
      const columns = updates.settings.columns || 4;
      const mobileColumns = updates.settings.mobileColumns || 2;
      updateGridColumns(grid, columns, mobileColumns);
    }
    
    // Update text alignment
    if (updates.settings.textAlign !== undefined) {
      updateTextAlignment(element, updates.settings.textAlign);
    }
    
    // Update background color
    if (updates.settings.backgroundColor !== undefined) {
      element.style.backgroundColor = updates.settings.backgroundColor || '';
    }
  }
}

