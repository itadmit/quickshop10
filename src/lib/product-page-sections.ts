/**
 * Product Page Sections - Fully Editable Product Page Architecture
 * 
 * IMPORTANT: This is a COMPLETE REDESIGN of the product page.
 * The product page is now section-based, just like the home page.
 * 
 * Key features:
 * - Add/remove/reorder sections
 * - Dynamic content with {{product.xxx}} syntax
 * - Templates for quick setup
 * - Server-side rendering for maximum performance
 */

import { TypographySettings } from './product-page-settings';

// ============================================
// Section Types
// ============================================

export type ProductSectionType = 
  // Product-specific sections (contain product data)
  | 'product_gallery'       // Gallery with zoom, thumbnails, videos
  | 'product_info'          // Title, price, variants, add to cart
  | 'product_description'   // Full description (text or accordion)
  | 'product_reviews'       // Reviews section
  | 'product_related'       // Related products grid
  | 'product_upsells'       // Upsell products
  // Generic content sections (with dynamic content support)
  | 'text_block'            // Rich text with {{product.x}} support
  | 'accordion'             // Accordion items (specs, care, shipping)
  | 'tabs'                  // Tabbed content
  | 'features'              // Icon + text list
  | 'image_text'            // Image with text (left/right)
  | 'video'                 // Video embed
  | 'breadcrumb'            // Breadcrumb navigation
  | 'divider'               // Simple divider line
  | 'spacer';               // Empty space

// ============================================
// Section Interface
// ============================================

export interface ProductPageSection {
  id: string;
  type: ProductSectionType;
  title: string | null;        // Can contain {{product.xxx}}
  subtitle: string | null;     // Can contain {{product.xxx}}
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

// ============================================
// Section Content Types
// ============================================

// Gallery Section
export interface GallerySectionContent {
  // Content is dynamic - uses product images
}

export interface GallerySectionSettings {
  layout: 'carousel' | 'grid' | 'single';
  thumbnailsPosition: 'bottom' | 'right' | 'left' | 'hidden';
  thumbnailsPositionMobile: 'bottom' | 'hidden';
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9';
  enableZoom: boolean;
  showArrows: boolean;
  showDotsOnMobile: boolean;
}

// Info Section (Title, Price, Add to Cart)
export interface InfoSectionContent {
  // Content is dynamic - uses product data
}

export interface InfoSectionSettings {
  showComparePrice: boolean;
  showDiscount: boolean;
  discountStyle: 'badge' | 'text' | 'both';
  inventoryDisplay: 'in_stock' | 'count' | 'low_stock' | 'hidden';
  lowStockThreshold: number;
  typography?: {
    title?: TypographySettings;
    price?: TypographySettings;
    comparePrice?: TypographySettings;
    button?: TypographySettings;
    inventory?: TypographySettings;
  };
}

// Description Section
export interface DescriptionSectionContent {
  // Content is dynamic - uses product.description
}

export interface DescriptionSectionSettings {
  style: 'text' | 'accordion';
  accordionTitle?: string; // Title when in accordion mode (default: "תיאור מוצר")
  typography?: TypographySettings;
}

// Text Block Section (with dynamic content support)
export interface TextBlockSectionContent {
  text: string;              // Can contain {{product.xxx}} placeholders
  textAlign: 'right' | 'center' | 'left';
}

export interface TextBlockSectionSettings {
  backgroundColor?: string;
  textColor?: string;
  padding: 'none' | 'small' | 'medium' | 'large';
  typography?: TypographySettings;
}

// Accordion Section
export interface AccordionItem {
  id: string;
  title: string;             // Can contain {{product.xxx}}
  content: string;           // Can contain {{product.xxx}}
  isOpen: boolean;           // Default open state
  contentSource: 'static' | 'dynamic';  // Where content comes from
  dynamicField?: string;     // If dynamic: 'product.description' | 'product.custom.xxx'
}

export interface AccordionSectionContent {
  items: AccordionItem[];
}

export interface AccordionSectionSettings {
  allowMultiple: boolean;    // Allow multiple items open at once
  style: 'default' | 'bordered' | 'minimal';
}

// Tabs Section
export interface TabItem {
  id: string;
  title: string;             // Tab label
  content: string;           // Can contain {{product.xxx}}
  contentSource: 'static' | 'dynamic';
  dynamicField?: string;
}

export interface TabsSectionContent {
  items: TabItem[];
}

export interface TabsSectionSettings {
  style: 'default' | 'pills' | 'underline';
  alignment: 'right' | 'center' | 'left';
}

// Features Section
export interface FeatureItem {
  id: string;
  icon: string;              // Icon name (truck, shield, refresh, etc.)
  text: string;              // Can contain {{product.xxx}}
  isVisible: boolean;
}

export interface FeaturesSectionContent {
  items: FeatureItem[];
}

export interface FeaturesSectionSettings {
  layout: 'horizontal' | 'vertical' | 'grid';
  iconSize: 'small' | 'medium' | 'large';
  iconColor?: string;
}

// Related Products Section
export interface RelatedSectionContent {
  // Content is dynamic - auto-selected products
}

export interface RelatedSectionSettings {
  count: number;             // Number of products to show
  source: 'same_category' | 'manual' | 'bestsellers';
  showIfEmpty: boolean;
}

// Reviews Section
export interface ReviewsSectionContent {
  // Content is dynamic - fetched from reviews
}

export interface ReviewsSectionSettings {
  showRating: boolean;
  showCount: boolean;
  showPhotos: boolean;
  style: 'list' | 'grid';
}

// Image with Text Section
export interface ImageTextSectionContent {
  imageUrl: string;
  text: string;              // Can contain {{product.xxx}}
  buttonText?: string;
  buttonLink?: string;
}

export interface ImageTextSectionSettings {
  imagePosition: 'right' | 'left';
  imageWidth: '40%' | '50%' | '60%';
  verticalAlignment: 'top' | 'center' | 'bottom';
  backgroundColor?: string;
}

// Breadcrumb Section
export interface BreadcrumbSectionContent {
  // Content is dynamic - auto-generated from category path
}

export interface BreadcrumbSectionSettings {
  showHome: boolean;
  showCategory: boolean;
  separator: '/' | '>' | '→' | '•';
}

// ============================================
// Default Sections (Template: Clean)
// ============================================

export const defaultProductPageSections: ProductPageSection[] = [
  {
    id: 'breadcrumb',
    type: 'breadcrumb',
    title: null,
    subtitle: null,
    content: {},
    settings: {
      showHome: true,
      showCategory: true,
      separator: '/',
    } satisfies BreadcrumbSectionSettings as Record<string, unknown>,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'gallery',
    type: 'product_gallery',
    title: null,
    subtitle: null,
    content: {},
    settings: {
      layout: 'carousel',
      thumbnailsPosition: 'bottom',
      thumbnailsPositionMobile: 'bottom',
      aspectRatio: '3:4',
      enableZoom: true,
      showArrows: true,
      showDotsOnMobile: false,
    } satisfies GallerySectionSettings as Record<string, unknown>,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'info',
    type: 'product_info',
    title: null,
    subtitle: null,
    content: {},
    settings: {
      showComparePrice: true,
      showDiscount: true,
      discountStyle: 'badge',
      inventoryDisplay: 'count',
      lowStockThreshold: 5,
    } satisfies InfoSectionSettings as Record<string, unknown>,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'description',
    type: 'product_description',
    title: null,
    subtitle: null,
    content: {},
    settings: {
      style: 'text',
    } satisfies DescriptionSectionSettings as Record<string, unknown>,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'features',
    type: 'features',
    title: null,
    subtitle: null,
    content: {
      items: [
        { id: '1', icon: 'truck', text: 'משלוח חינם מעל ₪200', isVisible: true },
        { id: '2', icon: 'refresh', text: '14 יום להחזרה', isVisible: true },
        { id: '3', icon: 'shield', text: 'אחריות יצרן', isVisible: true },
      ],
    } satisfies FeaturesSectionContent as Record<string, unknown>,
    settings: {
      layout: 'horizontal',
      iconSize: 'small',
    } satisfies FeaturesSectionSettings as Record<string, unknown>,
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'reviews',
    type: 'product_reviews',
    title: 'ביקורות',
    subtitle: null,
    content: {},
    settings: {
      showRating: true,
      showCount: true,
      showPhotos: true,
      style: 'list',
    } satisfies ReviewsSectionSettings as Record<string, unknown>,
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'related',
    type: 'product_related',
    title: 'אולי יעניין אותך',
    subtitle: 'מוצרים נוספים שאהבו לקוחות',
    content: {},
    settings: {
      count: 4,
      source: 'same_category',
      showIfEmpty: false,
    } satisfies RelatedSectionSettings as Record<string, unknown>,
    sortOrder: 6,
    isActive: true,
  },
];

// ============================================
// Product Page Templates
// ============================================

export interface ProductPageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  sections: ProductPageSection[];
}

export const productPageTemplates: ProductPageTemplate[] = [
  {
    id: 'clean',
    name: 'קלאסי נקי',
    description: 'עיצוב נקי ומינימליסטי - גלריה בצד, מידע בצד',
    thumbnail: '/templates/product/clean.png',
    sections: defaultProductPageSections,
  },
  {
    id: 'detailed',
    name: 'מפורט עם אקורדיון',
    description: 'עם אקורדיון למידע טכני, חומרים והוראות',
    thumbnail: '/templates/product/detailed.png',
    sections: [
      ...defaultProductPageSections.slice(0, 4), // breadcrumb, gallery, info, description
      {
        id: 'specs-accordion',
        type: 'accordion',
        title: null,
        subtitle: null,
        content: {
          items: [
            { id: '1', title: 'מפרט טכני', content: '{{product.custom.specs}}', isOpen: false, contentSource: 'dynamic', dynamicField: 'product.custom.specs' },
            { id: '2', title: 'חומרים', content: '{{product.custom.material}}', isOpen: false, contentSource: 'dynamic', dynamicField: 'product.custom.material' },
            { id: '3', title: 'הוראות טיפול', content: '{{product.custom.care}}', isOpen: false, contentSource: 'dynamic', dynamicField: 'product.custom.care' },
            { id: '4', title: 'משלוחים והחזרות', content: 'משלוח חינם מעל ₪200. ניתן להחזיר תוך 14 יום.', isOpen: false, contentSource: 'static' },
          ],
        } satisfies AccordionSectionContent as Record<string, unknown>,
        settings: {
          allowMultiple: false,
          style: 'bordered',
        } satisfies AccordionSectionSettings as Record<string, unknown>,
        sortOrder: 4,
        isActive: true,
      },
      ...defaultProductPageSections.slice(4), // features, reviews, related
    ].map((s, i) => ({ ...s, sortOrder: i })) as ProductPageSection[],
  },
  {
    id: 'fashion',
    name: 'אופנה',
    description: 'גלריה גדולה בסגנון לוקבוק',
    thumbnail: '/templates/product/fashion.png',
    sections: [
      {
        id: 'gallery',
        type: 'product_gallery',
        title: null,
        subtitle: null,
        content: {},
        settings: {
          layout: 'grid',
          thumbnailsPosition: 'hidden',
          thumbnailsPositionMobile: 'bottom',
          aspectRatio: '3:4',
          enableZoom: true,
          showArrows: false,
          showDotsOnMobile: false,
        } satisfies GallerySectionSettings as Record<string, unknown>,
        sortOrder: 0,
        isActive: true,
      },
      {
        id: 'info',
        type: 'product_info',
        title: null,
        subtitle: null,
        content: {},
        settings: {
          showComparePrice: true,
          showDiscount: true,
          discountStyle: 'text',
          inventoryDisplay: 'low_stock',
          lowStockThreshold: 3,
        } satisfies InfoSectionSettings as Record<string, unknown>,
        sortOrder: 1,
        isActive: true,
      },
      ...defaultProductPageSections.slice(3), // description onwards
    ].map((s, i) => ({ ...s, sortOrder: i })) as ProductPageSection[],
  },
  {
    id: 'tabs',
    name: 'עם לשוניות',
    description: 'מידע מוצר מאורגן בלשוניות',
    thumbnail: '/templates/product/tabs.png',
    sections: [
      ...defaultProductPageSections.slice(0, 4), // breadcrumb, gallery, info, description
      {
        id: 'product-tabs',
        type: 'tabs',
        title: null,
        subtitle: null,
        content: {
          items: [
            { id: '1', title: 'פרטים', content: '{{product.description}}', contentSource: 'dynamic', dynamicField: 'product.description' },
            { id: '2', title: 'מפרט', content: '{{product.custom.specs}}', contentSource: 'dynamic', dynamicField: 'product.custom.specs' },
            { id: '3', title: 'משלוח', content: 'משלוח תוך 3-5 ימי עסקים. משלוח חינם מעל ₪200.', contentSource: 'static' },
          ],
        } satisfies TabsSectionContent as Record<string, unknown>,
        settings: {
          style: 'underline',
          alignment: 'right',
        } satisfies TabsSectionSettings as Record<string, unknown>,
        sortOrder: 4,
        isActive: true,
      },
      ...defaultProductPageSections.slice(5), // reviews, related
    ].map((s, i) => ({ ...s, sortOrder: i })) as ProductPageSection[],
  },
];

// ============================================
// Helpers
// ============================================

/**
 * Get product page sections from store settings
 * Falls back to default if not set
 */
export function getProductPageSections(storeSettings: Record<string, unknown>): ProductPageSection[] {
  const saved = storeSettings.productPageSections as ProductPageSection[] | undefined;
  
  if (!saved || !Array.isArray(saved) || saved.length === 0) {
    return defaultProductPageSections;
  }
  
  return saved;
}

/**
 * Get visible sections sorted by order
 */
export function getVisibleProductSections(sections: ProductPageSection[]): ProductPageSection[] {
  return sections
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get template by ID
 */
export function getProductPageTemplate(templateId: string): ProductPageTemplate | undefined {
  return productPageTemplates.find(t => t.id === templateId);
}

/**
 * Apply template to store (returns new sections array)
 */
export function applyProductPageTemplate(templateId: string): ProductPageSection[] {
  const template = getProductPageTemplate(templateId);
  if (!template) {
    return defaultProductPageSections;
  }
  
  // Generate new IDs for sections (to avoid conflicts)
  return template.sections.map(s => ({
    ...s,
    id: `${s.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }));
}

// ============================================
// Section Type Labels (for editor UI)
// ============================================

export const sectionTypeLabels: Record<ProductSectionType, string> = {
  product_gallery: 'גלריית מוצר',
  product_info: 'מידע מוצר',
  product_description: 'תיאור מוצר',
  product_reviews: 'ביקורות',
  product_related: 'מוצרים דומים',
  product_upsells: 'מוצרי אפסייל',
  text_block: 'בלוק טקסט',
  accordion: 'אקורדיון',
  tabs: 'לשוניות',
  features: 'חוזקות/יתרונות',
  image_text: 'תמונה + טקסט',
  video: 'וידאו',
  breadcrumb: 'ניווט (Breadcrumb)',
  divider: 'קו מפריד',
  spacer: 'רווח',
};

// Section types available to add (not all are addable)
export const addableSectionTypes: { type: ProductSectionType; label: string; icon: string; category: string }[] = [
  // Content
  { type: 'text_block', label: 'בלוק טקסט', icon: 'text', category: 'תוכן' },
  { type: 'accordion', label: 'אקורדיון', icon: 'accordion', category: 'תוכן' },
  { type: 'tabs', label: 'לשוניות', icon: 'tabs', category: 'תוכן' },
  { type: 'features', label: 'חוזקות', icon: 'features', category: 'תוכן' },
  { type: 'image_text', label: 'תמונה + טקסט', icon: 'image', category: 'תוכן' },
  { type: 'video', label: 'וידאו', icon: 'video', category: 'תוכן' },
  // Product
  { type: 'product_description', label: 'תיאור מוצר', icon: 'description', category: 'מוצר' },
  { type: 'product_reviews', label: 'ביקורות', icon: 'reviews', category: 'מוצר' },
  { type: 'product_related', label: 'מוצרים דומים', icon: 'related', category: 'מוצר' },
  { type: 'product_upsells', label: 'מוצרי אפסייל', icon: 'upsell', category: 'מוצר' },
  // Layout
  { type: 'breadcrumb', label: 'ניווט', icon: 'breadcrumb', category: 'פריסה' },
  { type: 'divider', label: 'קו מפריד', icon: 'divider', category: 'פריסה' },
  { type: 'spacer', label: 'רווח', icon: 'spacer', category: 'פריסה' },
];

// Icon SVGs for feature icons
export { featureIcons, availableIcons } from './product-page-settings';

