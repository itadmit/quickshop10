/**
 * Translations Module
 * 
 * Provides UI translations for storefronts with performance-first approach:
 * 
 * 1. Hebrew-only stores (99%): Returns static object, NO database query
 * 2. Multi-language stores: Fetches from DB with 1-hour caching
 * 3. Customized Hebrew: Only when store explicitly customizes strings
 * 
 * Usage in Server Components:
 * ```tsx
 * const t = await getUITranslations(storeId, locale, hasMultipleLocales);
 * return <h1>{t.checkout.title}</h1>;
 * ```
 * 
 * Usage in Client Components (pass as prop from Server):
 * ```tsx
 * // Page (Server Component)
 * const t = await getUITranslations(storeId, locale, hasMultipleLocales);
 * return <CheckoutForm translations={t.checkout} />;
 * 
 * // Component (Client)
 * function CheckoutForm({ translations }: { translations?: CheckoutTranslations }) {
 *   return <h1>{translations?.title || "צ׳ק אאוט"}</h1>;
 * }
 * ```
 */

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { storeTranslations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hebrewTranslations } from './defaults/he';
import { englishTranslations } from './defaults/en';
import { arabicTranslations } from './defaults/ar';
import { russianTranslations } from './defaults/ru';
import { frenchTranslations } from './defaults/fr';
import { deepMerge } from './utils/deep-merge';
import type { UITranslations, SupportedLocale, DeepPartial } from './types';

// Re-export types for convenience
export * from './types';
export { deepMerge } from './utils/deep-merge';

// ============================================
// Default Translations by Locale
// ============================================

const defaultTranslations: Record<SupportedLocale, UITranslations> = {
  he: hebrewTranslations,
  en: englishTranslations,
  ar: arabicTranslations,
  ru: russianTranslations,
  fr: frenchTranslations,
};

// ============================================
// Main Translation Functions
// ============================================

/**
 * Get UI translations for a store
 * 
 * Performance optimizations:
 * 1. Hebrew-only stores without customization: Returns static object (no DB query)
 * 2. Other cases: Uses cached DB query (1 hour cache)
 * 
 * @param storeId - Store UUID
 * @param locale - Requested locale (default: 'he')
 * @param hasMultipleLocales - Whether store has more than one locale
 * @param hasCustomTranslations - Whether store has customized Hebrew strings
 */
export async function getUITranslations(
  storeId: string,
  locale: SupportedLocale = 'he',
  hasMultipleLocales: boolean = false,
  hasCustomTranslations: boolean = false
): Promise<UITranslations> {
  // 🔑 Performance optimization:
  // Single-locale stores without customization get static object - ZERO overhead!
  // Works for ANY locale (Hebrew, English, etc.) - not just Hebrew
  if (!hasMultipleLocales && !hasCustomTranslations) {
    return defaultTranslations[locale] || hebrewTranslations;
  }

  // For multi-locale or customized stores, use cached DB query
  return getCachedTranslations(storeId, locale);
}

/**
 * Cached translation fetcher
 * Uses Next.js unstable_cache for edge caching
 */
const getCachedTranslations = unstable_cache(
  async (storeId: string, locale: SupportedLocale): Promise<UITranslations> => {
    // Get default translations for this locale
    const defaults = defaultTranslations[locale] || hebrewTranslations;

    try {
      // Fetch store overrides from database
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

      // If no overrides exist, return defaults
      if (!override?.uiStrings || Object.keys(override.uiStrings).length === 0) {
        return defaults;
      }

      // Merge defaults with overrides
      return deepMerge(
        defaults as unknown as Record<string, unknown>, 
        override.uiStrings as Record<string, unknown>
      ) as unknown as UITranslations;
    } catch (error) {
      console.error('[Translations] Error fetching translations:', error);
      // On error, return defaults
      return defaults;
    }
  },
  ['ui-translations'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['translations'],
  }
);

// ============================================
// Translation Helpers
// ============================================

/**
 * Get default translations for a locale (without DB query)
 * Useful for admin preview or fallback
 */
export function getDefaultTranslations(locale: SupportedLocale = 'he'): UITranslations {
  return defaultTranslations[locale] || hebrewTranslations;
}

/**
 * Get a specific translation section
 * Type-safe accessor for translation sections
 */
export function getTranslationSection<K extends keyof UITranslations>(
  translations: UITranslations,
  section: K
): UITranslations[K] {
  return translations[section];
}

/**
 * Interpolate variables in translation strings
 * 
 * @example
 * interpolate("נותרו {{count}} יחידות", { count: 5 });
 * // Result: "נותרו 5 יחידות"
 */
export function interpolate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in variables ? String(variables[key]) : match;
  });
}

// ============================================
// Cache Invalidation
// ============================================

/**
 * Invalidate translations cache for a store
 * Call this from Server Actions when translations are updated
 * 
 * @example
 * // In server action:
 * await updateStoreTranslations(storeId, locale, newStrings);
 * revalidateTag('translations');
 */
export { revalidateTag } from 'next/cache';

// ============================================
// Locale Detection Helpers
// ============================================

/**
 * Country to preferred locale mapping
 * Based on common e-commerce patterns (similar to Zara/ASOS)
 * 
 * Note: Countries with multiple languages use the most common one
 * Users can always override via language switcher
 */
const COUNTRY_TO_LOCALE: Record<string, SupportedLocale> = {
  // Hebrew speakers
  IL: 'he', // Israel
  
  // English speakers (primary)
  US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IE: 'en', 
  ZA: 'en', SG: 'en', HK: 'en', PH: 'en', MY: 'en', IN: 'en',
  
  // Arabic speakers (Gulf + Middle East + North Africa)
  SA: 'ar', AE: 'ar', EG: 'ar', JO: 'ar', LB: 'ar', KW: 'ar',
  QA: 'ar', BH: 'ar', OM: 'ar', IQ: 'ar', SY: 'ar', PS: 'ar',
  MA: 'ar', DZ: 'ar', TN: 'ar', LY: 'ar', SD: 'ar', YE: 'ar',
  
  // Russian speakers (CIS countries)
  RU: 'ru', BY: 'ru', KZ: 'ru', UA: 'ru', UZ: 'ru', KG: 'ru',
  TJ: 'ru', TM: 'ru', MD: 'ru', AM: 'ru', AZ: 'ru', GE: 'ru',
  
  // French speakers (Europe + Africa)
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', 
  SN: 'fr', CI: 'fr', CM: 'fr', CD: 'fr', MG: 'fr', HT: 'fr',
};

/**
 * Detect locale from request headers
 * 
 * Priority (performance-optimized):
 * 1. Cookie (user's explicit choice) - fastest
 * 2. URL param (direct link)
 * 3. Geo-location via Vercel headers (x-vercel-ip-country) - no latency
 * 4. Accept-Language header
 * 5. Store default
 * 
 * @param options Detection options
 */
export function detectLocale(
  urlLocale?: string,
  cookieLocale?: string,
  acceptLanguage?: string,
  supportedLocales: SupportedLocale[] = ['he'],
  defaultLocale: SupportedLocale = 'he'
): SupportedLocale {
  // 1. Cookie (user's saved preference - highest priority)
  if (cookieLocale && supportedLocales.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale;
  }

  // 2. URL parameter
  if (urlLocale && supportedLocales.includes(urlLocale as SupportedLocale)) {
    return urlLocale as SupportedLocale;
  }

  // 3. Accept-Language header (browser setting)
  if (acceptLanguage) {
    const browserLocales = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().substring(0, 2).toLowerCase());

    for (const browserLocale of browserLocales) {
      if (supportedLocales.includes(browserLocale as SupportedLocale)) {
        return browserLocale as SupportedLocale;
      }
    }
  }

  // 4. Default locale
  return defaultLocale;
}

/**
 * Detect locale from geo-location (Vercel headers)
 * 
 * ⚡ PERFORMANCE: Uses Vercel's edge headers - zero latency!
 * Vercel automatically adds x-vercel-ip-country based on client IP.
 * 
 * @param countryCode - 2-letter country code from Vercel headers
 * @param supportedLocales - Locales the store supports
 * @param defaultLocale - Fallback locale
 */
export function detectLocaleFromGeo(
  countryCode: string | null,
  supportedLocales: SupportedLocale[] = ['he'],
  defaultLocale: SupportedLocale = 'he'
): SupportedLocale | null {
  if (!countryCode) return null;
  
  const geoLocale = COUNTRY_TO_LOCALE[countryCode.toUpperCase()];
  
  // Only return if the store supports this locale
  if (geoLocale && supportedLocales.includes(geoLocale)) {
    return geoLocale;
  }
  
  return null;
}

/**
 * Full locale detection with geo-location support
 * 
 * Priority:
 * 1. Cookie (explicit user choice)
 * 2. URL param
 * 3. Geo-location (Vercel x-vercel-ip-country)
 * 4. Accept-Language
 * 5. Store default
 * 
 * ⚡ PERFORMANCE: All detection happens server-side with no API calls
 */
export function detectLocaleWithGeo({
  cookieLocale,
  urlLocale,
  countryCode,
  acceptLanguage,
  supportedLocales = ['he'],
  defaultLocale = 'he',
}: {
  cookieLocale?: string;
  urlLocale?: string;
  countryCode?: string | null;
  acceptLanguage?: string;
  supportedLocales?: SupportedLocale[];
  defaultLocale?: SupportedLocale;
}): SupportedLocale {
  // 1. Cookie (user's explicit choice - highest priority)
  if (cookieLocale && supportedLocales.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale;
  }

  // 2. URL parameter
  if (urlLocale && supportedLocales.includes(urlLocale as SupportedLocale)) {
    return urlLocale as SupportedLocale;
  }

  // 3. Geo-location (Vercel headers - ZERO latency)
  const geoLocale = detectLocaleFromGeo(countryCode ?? null, supportedLocales, defaultLocale);
  if (geoLocale) {
    return geoLocale;
  }

  // 4. Accept-Language header
  if (acceptLanguage) {
    const browserLocales = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().substring(0, 2).toLowerCase());

    for (const browserLocale of browserLocales) {
      if (supportedLocales.includes(browserLocale as SupportedLocale)) {
        return browserLocale as SupportedLocale;
      }
    }
  }

  // 5. Store default
  return defaultLocale;
}

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: SupportedLocale): boolean {
  return locale === 'he' || locale === 'ar';
}

/**
 * Get direction for a locale
 */
export function getDirection(locale: SupportedLocale): 'rtl' | 'ltr' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

