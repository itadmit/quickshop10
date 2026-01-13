/**
 * Dynamic Content System
 * 
 * Resolves {{variable.path}} placeholders with actual product data.
 * Runs on the SERVER - zero client JS!
 * 
 * Usage:
 *   resolveDynamicContent("המוצר {{product.title}} עשוי מ{{product.custom.material}}", context)
 *   → "המוצר חולצת כותנה עשוי מכותנה 100%"
 */

import { formatPrice } from './format-price';

// ============================================
// Context Types
// ============================================

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: string | number | null;
  comparePrice?: string | number | null;
  description?: string | null;
  shortDescription?: string | null;
  sku?: string | null;
  barcode?: string | null;
  inventory?: number | null;
  weight?: string | null;
  trackInventory?: boolean;
  hasVariants?: boolean;
  // Computed fields
  category?: string | null;
  categories?: string[];
  // Custom fields from metadata
  metadata?: {
    customFields?: Record<string, string>;
    [key: string]: unknown;
  };
}

export interface VariantData {
  id: string;
  title: string;
  price: string | number | null;
  comparePrice?: string | number | null;
  sku?: string | null;
  barcode?: string | null;
  inventory?: number | null;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
}

export interface StoreData {
  name: string;
  currency?: string;
  email?: string;
  phone?: string;
}

export interface DynamicContentContext {
  product: ProductData;
  variant?: VariantData | null;
  store: StoreData;
  // Price formatting options
  showDecimalPrices?: boolean;
}

// ============================================
// Available Variables (for UI picker)
// ============================================

export interface DynamicVariable {
  path: string;
  label: string;
  category: 'product' | 'variant' | 'store' | 'custom';
  description?: string;
}

export const dynamicVariables: DynamicVariable[] = [
  // Product variables
  { path: 'product.title', label: 'שם מוצר', category: 'product' },
  { path: 'product.price', label: 'מחיר', category: 'product' },
  { path: 'product.comparePrice', label: 'מחיר לפני הנחה', category: 'product' },
  { path: 'product.discount', label: 'אחוז הנחה', category: 'product' },
  { path: 'product.description', label: 'תיאור', category: 'product' },
  { path: 'product.shortDescription', label: 'תיאור קצר', category: 'product' },
  { path: 'product.sku', label: 'מק"ט', category: 'product' },
  { path: 'product.barcode', label: 'ברקוד', category: 'product' },
  { path: 'product.inventory', label: 'כמות במלאי', category: 'product' },
  { path: 'product.inventoryText', label: 'טקסט מלאי', category: 'product', description: '"X במלאי" או "אזל מהמלאי"' },
  { path: 'product.weight', label: 'משקל', category: 'product' },
  { path: 'product.category', label: 'קטגוריה ראשית', category: 'product' },
  { path: 'product.categories', label: 'כל הקטגוריות', category: 'product' },
  
  // Variant variables (when variant is selected)
  { path: 'variant.title', label: 'שם וריאנט', category: 'variant', description: 'לדוגמה: "M / אדום"' },
  { path: 'variant.price', label: 'מחיר וריאנט', category: 'variant' },
  { path: 'variant.comparePrice', label: 'מחיר לפני הנחה (וריאנט)', category: 'variant' },
  { path: 'variant.sku', label: 'מק"ט וריאנט', category: 'variant' },
  { path: 'variant.inventory', label: 'מלאי וריאנט', category: 'variant' },
  { path: 'variant.option1', label: 'אפשרות 1', category: 'variant', description: 'לדוגמה: מידה' },
  { path: 'variant.option2', label: 'אפשרות 2', category: 'variant', description: 'לדוגמה: צבע' },
  { path: 'variant.option3', label: 'אפשרות 3', category: 'variant' },
  
  // Store variables
  { path: 'store.name', label: 'שם החנות', category: 'store' },
  { path: 'store.currency', label: 'מטבע', category: 'store' },
  { path: 'store.email', label: 'אימייל חנות', category: 'store' },
  { path: 'store.phone', label: 'טלפון חנות', category: 'store' },
];

// ============================================
// Core Resolution Function
// ============================================

/**
 * Resolve all {{variable.path}} placeholders in a template string
 * 
 * @param template - String with {{variable.path}} placeholders
 * @param context - The data context (product, variant, store)
 * @returns Resolved string with actual values
 */
export function resolveDynamicContent(
  template: string | null | undefined,
  context: DynamicContentContext
): string {
  if (!template) return '';
  
  const { product, variant, store, showDecimalPrices = false } = context;
  
  // Build flattened context for lookup
  const flatContext = buildFlatContext(product, variant, store, showDecimalPrices);
  
  // Replace all {{...}} placeholders
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path: string) => {
    const trimmedPath = path.trim();
    const value = flatContext[trimmedPath];
    
    // Return original placeholder if not found (for debugging)
    if (value === undefined || value === null) {
      return '';
    }
    
    return String(value);
  });
}

/**
 * Check if a string contains any dynamic content placeholders
 */
export function hasDynamicContent(text: string | null | undefined): boolean {
  if (!text) return false;
  return /\{\{[^}]+\}\}/.test(text);
}

/**
 * Extract all variable paths from a template
 */
export function extractVariablePaths(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.map(m => m.slice(2, -2).trim());
}

// ============================================
// Helper: Build Flat Context
// ============================================

function buildFlatContext(
  product: ProductData,
  variant: VariantData | null | undefined,
  store: StoreData,
  showDecimalPrices: boolean
): Record<string, string | number | null> {
  const format = (p: string | number | null | undefined) => 
    formatPrice(p, { showDecimal: showDecimalPrices });
  
  const context: Record<string, string | number | null> = {};
  
  // Product fields
  context['product.title'] = product.name;
  context['product.name'] = product.name; // Alias
  context['product.price'] = format(product.price);
  context['product.comparePrice'] = product.comparePrice ? format(product.comparePrice) : null;
  context['product.description'] = product.description || null;
  context['product.shortDescription'] = product.shortDescription || null;
  context['product.sku'] = product.sku || null;
  context['product.barcode'] = product.barcode || null;
  context['product.inventory'] = product.inventory ?? null;
  context['product.weight'] = product.weight || null;
  context['product.category'] = product.category || null;
  context['product.categories'] = product.categories?.join(', ') || null;
  
  // Computed fields
  if (product.price && product.comparePrice) {
    const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const compareNum = typeof product.comparePrice === 'string' ? parseFloat(product.comparePrice) : product.comparePrice;
    if (priceNum && compareNum && compareNum > priceNum) {
      const discount = Math.round((1 - priceNum / compareNum) * 100);
      context['product.discount'] = `${discount}%`;
    }
  }
  
  // Inventory text
  if (product.trackInventory !== false) {
    if (product.inventory === null || product.inventory === undefined) {
      context['product.inventoryText'] = 'במלאי';
    } else if (product.inventory <= 0) {
      context['product.inventoryText'] = 'אזל מהמלאי';
    } else {
      context['product.inventoryText'] = `${product.inventory} במלאי`;
    }
  } else {
    context['product.inventoryText'] = 'במלאי';
  }
  
  // Custom fields (metafields)
  const customFields = product.metadata?.customFields || {};
  for (const [key, value] of Object.entries(customFields)) {
    context[`product.custom.${key}`] = value;
  }
  
  // Variant fields (if selected)
  if (variant) {
    context['variant.title'] = variant.title;
    context['variant.price'] = format(variant.price);
    context['variant.comparePrice'] = variant.comparePrice ? format(variant.comparePrice) : null;
    context['variant.sku'] = variant.sku || null;
    context['variant.barcode'] = variant.barcode || null;
    context['variant.inventory'] = variant.inventory ?? null;
    context['variant.option1'] = variant.option1 || null;
    context['variant.option2'] = variant.option2 || null;
    context['variant.option3'] = variant.option3 || null;
  }
  
  // Store fields
  context['store.name'] = store.name;
  context['store.currency'] = store.currency || '₪';
  context['store.email'] = store.email || null;
  context['store.phone'] = store.phone || null;
  
  return context;
}

// ============================================
// Get Custom Fields from Store Metafields
// ============================================

export interface MetafieldDefinition {
  id: string;
  name: string;
  key: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'boolean';
  isActive: boolean;
  showOnProduct: boolean;
}

/**
 * Get dynamic variables for custom fields (metafields)
 * These are added to the variable picker based on store's metafield definitions
 */
export function getCustomFieldVariables(metafields: MetafieldDefinition[]): DynamicVariable[] {
  return metafields
    .filter(m => m.isActive && m.showOnProduct)
    .map(m => ({
      path: `product.custom.${m.key}`,
      label: m.name,
      category: 'custom' as const,
      description: `שדה מותאם: ${m.name}`,
    }));
}

/**
 * Get all available variables including custom fields
 */
export function getAllDynamicVariables(metafields: MetafieldDefinition[] = []): DynamicVariable[] {
  return [
    ...dynamicVariables,
    ...getCustomFieldVariables(metafields),
  ];
}

