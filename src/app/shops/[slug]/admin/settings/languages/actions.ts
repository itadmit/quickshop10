'use server';

import { db } from '@/lib/db';
import { stores, storeTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { SupportedLocale, UITranslations } from '@/lib/translations/types';
import { getDefaultTranslations } from '@/lib/translations';

// ============================================
// Language Management Actions
// ============================================

/**
 * Add a new language to a store
 */
export async function addStoreLanguage(
  storeId: string,
  locale: SupportedLocale
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current store settings
    const [store] = await db
      .select({
        supportedLocales: stores.supportedLocales,
        defaultLocale: stores.defaultLocale,
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const currentLocales = (store.supportedLocales as string[]) || ['he'];
    
    // Check if locale already exists
    if (currentLocales.includes(locale)) {
      return { success: false, error: 'שפה זו כבר קיימת' };
    }

    // Add the new locale
    const newLocales = [...currentLocales, locale];

    await db
      .update(stores)
      .set({
        supportedLocales: newLocales,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    // Create empty translation record for the new locale
    // (will use defaults until customized)
    await db
      .insert(storeTranslations)
      .values({
        storeId,
        locale,
        uiStrings: {},
      })
      .onConflictDoNothing();

    revalidatePath('/shops/[slug]/admin/settings/languages', 'page');
    // Also revalidate storefront pages that use translations
    revalidatePath('/shops/[slug]', 'layout');

    return { success: true };
  } catch (error) {
    console.error('[Languages] Error adding language:', error);
    return { success: false, error: 'שגיאה בהוספת שפה' };
  }
}

/**
 * Remove a language from a store
 */
export async function removeStoreLanguage(
  storeId: string,
  locale: SupportedLocale
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current store settings
    const [store] = await db
      .select({
        supportedLocales: stores.supportedLocales,
        defaultLocale: stores.defaultLocale,
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    // Can't remove default locale
    if (store.defaultLocale === locale) {
      return { success: false, error: 'לא ניתן להסיר את שפת ברירת המחדל' };
    }

    const currentLocales = (store.supportedLocales as string[]) || ['he'];
    
    // Must have at least one locale
    if (currentLocales.length <= 1) {
      return { success: false, error: 'חייבת להיות לפחות שפה אחת' };
    }

    // Remove the locale
    const newLocales = currentLocales.filter(l => l !== locale);

    await db
      .update(stores)
      .set({
        supportedLocales: newLocales,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    // Delete translation record
    await db
      .delete(storeTranslations)
      .where(
        and(
          eq(storeTranslations.storeId, storeId),
          eq(storeTranslations.locale, locale)
        )
      );

    revalidatePath('/shops/[slug]/admin/settings/languages', 'page');
    revalidatePath('/shops/[slug]', 'layout');

    return { success: true };
  } catch (error) {
    console.error('[Languages] Error removing language:', error);
    return { success: false, error: 'שגיאה בהסרת שפה' };
  }
}

/**
 * Set the default language for a store
 */
export async function setDefaultLanguage(
  storeId: string,
  locale: SupportedLocale
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current store settings
    const [store] = await db
      .select({
        supportedLocales: stores.supportedLocales,
      })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const currentLocales = (store.supportedLocales as string[]) || ['he'];
    
    // Check if locale is supported
    if (!currentLocales.includes(locale)) {
      return { success: false, error: 'שפה זו לא נתמכת בחנות' };
    }

    await db
      .update(stores)
      .set({
        defaultLocale: locale,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/languages', 'page');
    revalidatePath('/shops/[slug]', 'layout');

    return { success: true };
  } catch (error) {
    console.error('[Languages] Error setting default language:', error);
    return { success: false, error: 'שגיאה בהגדרת שפת ברירת מחדל' };
  }
}

/**
 * Update custom translations for a store
 */
export async function updateStoreTranslations(
  storeId: string,
  locale: SupportedLocale,
  translations: Partial<UITranslations>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Upsert translation record
    await db
      .insert(storeTranslations)
      .values({
        storeId,
        locale,
        uiStrings: translations,
      })
      .onConflictDoUpdate({
        target: [storeTranslations.storeId, storeTranslations.locale],
        set: {
          uiStrings: translations,
          updatedAt: new Date(),
        },
      });

    // Mark store as having custom translations
    await db
      .update(stores)
      .set({
        hasCustomTranslations: true,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/languages', 'page');
    revalidatePath('/shops/[slug]', 'layout');

    return { success: true };
  } catch (error) {
    console.error('[Languages] Error updating translations:', error);
    return { success: false, error: 'שגיאה בעדכון תרגומים' };
  }
}

/**
 * Get store translations for editing
 */
export async function getStoreTranslations(
  storeId: string,
  locale: SupportedLocale
): Promise<{ defaults: UITranslations; custom: Partial<UITranslations> }> {
  try {
    // Get default translations for this locale
    const defaults = getDefaultTranslations(locale);

    // Get custom overrides
    const [override] = await db
      .select()
      .from(storeTranslations)
      .where(
        and(
          eq(storeTranslations.storeId, storeId),
          eq(storeTranslations.locale, locale)
        )
      )
      .limit(1);

    return {
      defaults,
      custom: (override?.uiStrings as Partial<UITranslations>) || {},
    };
  } catch (error) {
    console.error('[Languages] Error getting translations:', error);
    return {
      defaults: getDefaultTranslations(locale),
      custom: {},
    };
  }
}

/**
 * Toggle language switcher visibility in header
 */
export async function toggleLanguageSwitcher(
  storeId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current settings
    const [store] = await db
      .select({ settings: stores.settings })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};
    
    await db
      .update(stores)
      .set({
        settings: {
          ...currentSettings,
          headerShowLanguageSwitcher: enabled,
        },
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/languages', 'page');
    // Must also revalidate storefront to apply header changes
    revalidatePath('/shops/[slug]', 'layout');

    return { success: true };
  } catch (error) {
    console.error('[Languages] Error toggling language switcher:', error);
    return { success: false, error: 'שגיאה בעדכון הגדרות' };
  }
}

