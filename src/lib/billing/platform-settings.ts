/**
 * Platform Settings Service
 * ניהול הגדרות פלטפורמה - מחירים, עמלות וכו'
 * 
 * הערכים נשמרים ב-DB ונקראים דינמית
 * עם cache ב-memory לביצועים
 */

import { db } from '@/lib/db';
import { platformSettings, pluginPricing } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

// Cache for settings (refreshed every 5 minutes)
let settingsCache: Map<string, unknown> = new Map();
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Default values (fallback if DB is empty)
const DEFAULT_SETTINGS = {
  subscription_branding_price: 299,
  subscription_quickshop_price: 399,
  subscription_trial_days: 7,
  transaction_fee_rate: 0.005, // 0.5%
  vat_rate: 0.18, // 18%
} as const;

type SettingKey = keyof typeof DEFAULT_SETTINGS;

/**
 * Invalidate the settings cache
 */
export function invalidateSettingsCache(): void {
  settingsCache.clear();
  cacheTimestamp = 0;
}

/**
 * Load all settings from DB into cache
 */
async function loadSettings(): Promise<void> {
  const now = Date.now();
  
  // Check if cache is still valid
  if (cacheTimestamp && now - cacheTimestamp < CACHE_TTL && settingsCache.size > 0) {
    return;
  }

  try {
    const settings = await db.select().from(platformSettings);
    
    settingsCache.clear();
    for (const setting of settings) {
      settingsCache.set(setting.key, setting.value);
    }
    
    cacheTimestamp = now;
  } catch (error) {
    console.error('[Platform Settings] Error loading settings:', error);
    // On error, use defaults but don't cache
  }
}

/**
 * Get a setting value with fallback to default
 */
export async function getSetting<K extends SettingKey>(key: K): Promise<typeof DEFAULT_SETTINGS[K]> {
  await loadSettings();
  
  const cached = settingsCache.get(key);
  if (cached !== undefined) {
    // Parse numeric values
    const value = typeof cached === 'string' ? parseFloat(cached) : cached;
    return value as typeof DEFAULT_SETTINGS[K];
  }
  
  return DEFAULT_SETTINGS[key];
}

/**
 * Get subscription pricing
 */
export async function getSubscriptionPricing(): Promise<{
  branding: number;
  quickshop: number;
  trialDays: number;
}> {
  const [branding, quickshop, trialDays] = await Promise.all([
    getSetting('subscription_branding_price'),
    getSetting('subscription_quickshop_price'),
    getSetting('subscription_trial_days'),
  ]);

  return { branding, quickshop, trialDays };
}

/**
 * Get fee rates
 */
export async function getFeeRates(): Promise<{
  transactionFee: number;
  vatRate: number;
}> {
  const [transactionFee, vatRate] = await Promise.all([
    getSetting('transaction_fee_rate'),
    getSetting('vat_rate'),
  ]);

  return { transactionFee, vatRate };
}

/**
 * Update a setting value
 */
export async function updateSetting(
  key: string,
  value: unknown,
  userId?: string
): Promise<void> {
  const now = new Date();
  
  await db
    .insert(platformSettings)
    .values({
      key,
      value: value as unknown as Record<string, unknown>,
      updatedBy: userId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: {
        value: value as unknown as Record<string, unknown>,
        updatedBy: userId,
        updatedAt: now,
      },
    });

  // Invalidate cache
  invalidateSettingsCache();
}

/**
 * Get all settings for admin panel
 */
export async function getAllSettings(): Promise<{
  key: string;
  value: unknown;
  description: string | null;
  category: string;
  updatedAt: Date;
}[]> {
  const settings = await db.select().from(platformSettings);
  
  return settings.map(s => ({
    key: s.key,
    value: s.value,
    description: s.description,
    category: s.category,
    updatedAt: s.updatedAt,
  }));
}

/**
 * Get plugin pricing from DB
 */
export async function getPluginPrice(pluginSlug: string): Promise<{
  monthlyPrice: number;
  trialDays: number;
} | null> {
  const [pricing] = await db
    .select()
    .from(pluginPricing)
    .where(eq(pluginPricing.pluginSlug, pluginSlug));

  if (!pricing) return null;

  return {
    monthlyPrice: Number(pricing.monthlyPrice),
    trialDays: pricing.trialDays || 14,
  };
}

/**
 * Get all plugin prices
 */
export async function getAllPluginPrices(): Promise<Map<string, { monthlyPrice: number; trialDays: number }>> {
  const prices = await db.select().from(pluginPricing);
  
  const map = new Map<string, { monthlyPrice: number; trialDays: number }>();
  for (const p of prices) {
    map.set(p.pluginSlug, {
      monthlyPrice: Number(p.monthlyPrice),
      trialDays: p.trialDays || 14,
    });
  }
  
  return map;
}

/**
 * Update plugin pricing
 */
export async function updatePluginPrice(
  pluginSlug: string,
  monthlyPrice: number,
  trialDays: number = 14
): Promise<void> {
  await db
    .insert(pluginPricing)
    .values({
      pluginSlug,
      monthlyPrice: String(monthlyPrice),
      trialDays,
    })
    .onConflictDoUpdate({
      target: pluginPricing.pluginSlug,
      set: {
        monthlyPrice: String(monthlyPrice),
        trialDays,
        updatedAt: new Date(),
      },
    });
}

