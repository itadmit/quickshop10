/**
 * Product Page Settings - Server-Side Configuration
 * All settings are read on the server - Zero client JS for layout!
 */

export interface ProductFeature {
  id: string;
  icon: string; // SVG icon name
  text: string;
  isVisible: boolean;
}

export interface ProductPageSection {
  id: string;
  type: 'breadcrumb' | 'gallery' | 'info' | 'features' | 'description' | 'reviews' | 'related';
  isVisible: boolean;
  sortOrder: number;
}

// Typography settings for each text element
export interface TypographySettings {
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontSizeUnit?: 'px' | 'rem';
  fontSizeMobile?: number;
  fontSizeMobileUnit?: 'px' | 'rem';
  fontWeight?: 'light' | 'normal' | 'medium' | 'bold' | 'extrabold';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  letterSpacingUnit?: 'px' | 'rem';
  lineHeight?: number;
  lineHeightUnit?: 'px' | 'rem';
}

// Default typography for each element type
export const defaultTypography: Record<string, TypographySettings> = {
  title: { fontSize: 32, fontSizeUnit: 'px', fontSizeMobile: 24, fontSizeMobileUnit: 'px', fontWeight: 'light', color: '#000000' },
  price: { fontSize: 24, fontSizeUnit: 'px', fontSizeMobile: 20, fontSizeMobileUnit: 'px', fontWeight: 'normal', color: '#000000' },
  comparePrice: { fontSize: 18, fontSizeUnit: 'px', fontSizeMobile: 16, fontSizeMobileUnit: 'px', fontWeight: 'normal', color: '#9CA3AF' },
  button: { fontSize: 16, fontSizeUnit: 'px', fontSizeMobile: 14, fontSizeMobileUnit: 'px', fontWeight: 'medium', color: '#FFFFFF' },
  inventory: { fontSize: 14, fontSizeUnit: 'px', fontSizeMobile: 12, fontSizeMobileUnit: 'px', fontWeight: 'normal', color: '#6B7280' },
  description: { fontSize: 16, fontSizeUnit: 'px', fontSizeMobile: 14, fontSizeMobileUnit: 'px', fontWeight: 'normal', color: '#4B5563', lineHeight: 1.6 },
};

export interface ProductPageSettings {
  // Section visibility and order
  sections: ProductPageSection[];
  
  // Gallery settings
  gallery: {
    layout: 'single' | 'grid' | 'carousel';
    thumbnailsPosition: 'bottom' | 'right' | 'left' | 'hidden';
    thumbnailsPositionMobile: 'bottom' | 'hidden'; // מיקום תמונות במובייל
    aspectRatio: '1:1' | '3:4' | '4:3' | '16:9';
    enableZoom: boolean;
    showArrows: boolean; // הצג חצים לניווט
    showDotsOnMobile: boolean; // הצג נקודות במובייל
  };
  
  // Typography settings for all text elements
  typography: {
    title: TypographySettings;
    price: TypographySettings;
    comparePrice: TypographySettings;
    button: TypographySettings;
    inventory: TypographySettings;
    description: TypographySettings;
  };
  
  // Price display settings
  price: {
    showComparePrice: boolean;
    showDiscount: boolean;
    discountStyle: 'badge' | 'text' | 'both';
  };
  
  // Inventory display settings
  inventory: {
    displayStyle: 'in_stock' | 'count' | 'low_stock' | 'hidden';
    lowStockThreshold: number; // Show "נותרו יחידות אחרונות" when stock is below this
  };
  
  // Description settings
  description: {
    showAsAccordion: boolean; // הצג תיאור באקורדיון
  };
  
  // Features (editable content!)
  features: ProductFeature[];
  
  // Related products
  related: {
    title: string;
    subtitle: string;
    count: number;
    showIfEmpty: boolean;
  };
  
  // Reviews
  reviews: {
    title: string;
    showRating: boolean;
    showCount: boolean;
  };
  
  // Legacy support - will be migrated
  title?: {
    fontSize: 'small' | 'medium' | 'large';
    fontWeight: 'light' | 'normal' | 'bold';
  };
}

// Default settings
export const defaultProductPageSettings: ProductPageSettings = {
  sections: [
    { id: 'breadcrumb', type: 'breadcrumb', isVisible: true, sortOrder: 0 },
    { id: 'gallery', type: 'gallery', isVisible: true, sortOrder: 1 },
    { id: 'info', type: 'info', isVisible: true, sortOrder: 2 },
    { id: 'features', type: 'features', isVisible: true, sortOrder: 3 },
    { id: 'description', type: 'description', isVisible: true, sortOrder: 4 },
    { id: 'reviews', type: 'reviews', isVisible: true, sortOrder: 5 },
    { id: 'related', type: 'related', isVisible: true, sortOrder: 6 },
  ],
  
  gallery: {
    layout: 'carousel', // ברירת מחדל: קרוסלה עם תמונות ממוזערות
    thumbnailsPosition: 'bottom',
    thumbnailsPositionMobile: 'bottom', // במובייל תמיד למטה
    aspectRatio: '3:4',
    enableZoom: true,
    showArrows: true, // ברירת מחדל: פעיל
    showDotsOnMobile: false, // ברירת מחדל: מכובה
  },
  
  typography: {
    title: { ...defaultTypography.title },
    price: { ...defaultTypography.price },
    comparePrice: { ...defaultTypography.comparePrice },
    button: { ...defaultTypography.button },
    inventory: { ...defaultTypography.inventory },
    description: { ...defaultTypography.description },
  },
  
  price: {
    showComparePrice: true,
    showDiscount: true,
    discountStyle: 'badge',
  },
  
  inventory: {
    displayStyle: 'count',
    lowStockThreshold: 5,
  },
  
  description: {
    showAsAccordion: false, // ברירת מחדל: תיאור רגיל, לא באקורדיון
  },
  
  features: [
    { id: '1', icon: 'truck', text: 'משלוח חינם מעל ₪200', isVisible: true },
    { id: '2', icon: 'refresh', text: '14 יום להחזרה', isVisible: true },
    { id: '3', icon: 'shield', text: 'אחריות יצרן', isVisible: true },
  ],
  
  related: {
    title: 'אולי יעניין אותך',
    subtitle: 'מוצרים נוספים שאהבו לקוחות',
    count: 4,
    showIfEmpty: false,
  },
  
  reviews: {
    title: 'ביקורות',
    showRating: true,
    showCount: true,
  },
};

// Get product page settings from store settings
export function getProductPageSettings(storeSettings: Record<string, unknown>): ProductPageSettings {
  const saved = storeSettings.productPageSettings as Partial<ProductPageSettings> | undefined;
  
  if (!saved) {
    return defaultProductPageSettings;
  }
  
  // Merge with defaults (in case new fields were added)
  return {
    ...defaultProductPageSettings,
    ...saved,
    sections: saved.sections || defaultProductPageSettings.sections,
    gallery: { ...defaultProductPageSettings.gallery, ...saved.gallery },
    typography: {
      title: { ...defaultProductPageSettings.typography.title, ...saved.typography?.title },
      price: { ...defaultProductPageSettings.typography.price, ...saved.typography?.price },
      comparePrice: { ...defaultProductPageSettings.typography.comparePrice, ...saved.typography?.comparePrice },
      button: { ...defaultProductPageSettings.typography.button, ...saved.typography?.button },
      inventory: { ...defaultProductPageSettings.typography.inventory, ...saved.typography?.inventory },
      description: { ...defaultProductPageSettings.typography.description, ...saved.typography?.description },
    },
    price: { ...defaultProductPageSettings.price, ...saved.price },
    inventory: { ...defaultProductPageSettings.inventory, ...saved.inventory },
    description: { ...defaultProductPageSettings.description, ...saved.description },
    features: saved.features || defaultProductPageSettings.features,
    related: { ...defaultProductPageSettings.related, ...saved.related },
    reviews: { ...defaultProductPageSettings.reviews, ...saved.reviews },
  };
}

// Get visible sections sorted by order
export function getVisibleSections(settings: ProductPageSettings): ProductPageSection[] {
  return settings.sections
    .filter(s => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Icon SVGs for features (inline - zero external requests)
export const featureIcons: Record<string, string> = {
  truck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  refresh: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  heart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  star: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  gift: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  clock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  creditCard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  phone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mail: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  package: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
};

// Available icons for the editor
export const availableIcons = Object.keys(featureIcons).map(key => ({
  id: key,
  name: key.charAt(0).toUpperCase() + key.slice(1),
  svg: featureIcons[key],
}));

