'use server';

/**
 * Catalog Mode Plugin Server Actions
 */

import { updatePluginConfig } from '@/lib/plugins/loader';
import { revalidatePath } from 'next/cache';

export interface CatalogModeConfig {
  enabled: boolean;
  mode: 'all' | 'categories';
  categoryIds: string[];
  hideCartButton: boolean;
  hideCartSidebar: boolean;
  hideAddToCart: boolean;
  blockCheckout: boolean;
  showContactButton: boolean;
  contactButtonText: string;
  contactButtonUrl: string;
}

export async function updateCatalogModeConfig(
  storeId: string,
  config: CatalogModeConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Clean and validate the config
    const cleanConfig: CatalogModeConfig = {
      enabled: Boolean(config.enabled),
      mode: config.mode === 'categories' ? 'categories' : 'all',
      categoryIds: Array.isArray(config.categoryIds) ? config.categoryIds : [],
      hideCartButton: Boolean(config.hideCartButton ?? true),
      hideCartSidebar: Boolean(config.hideCartSidebar ?? true),
      hideAddToCart: Boolean(config.hideAddToCart ?? true),
      blockCheckout: Boolean(config.blockCheckout ?? true),
      showContactButton: Boolean(config.showContactButton),
      contactButtonText: String(config.contactButtonText || 'צור קשר להזמנה').trim(),
      contactButtonUrl: String(config.contactButtonUrl || '').trim(),
    };

    // Validate categories mode
    if (cleanConfig.mode === 'categories' && cleanConfig.categoryIds.length === 0) {
      return { success: false, error: 'יש לבחור לפחות קטגוריה אחת במצב קטגוריות' };
    }

    const result = await updatePluginConfig(storeId, 'catalog-mode', cleanConfig as unknown as Record<string, unknown>);
    
    if (result.success) {
      // Revalidate the storefront
      revalidatePath(`/shops/[slug]`, 'layout');
    }

    return result;
  } catch (error) {
    console.error('Error updating catalog mode config:', error);
    return { success: false, error: 'שגיאה בשמירת ההגדרות' };
  }
}
