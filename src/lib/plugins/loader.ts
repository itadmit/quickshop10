/**
 * Plugin Loader
 * 
 * ⚡ Performance-first plugin loading:
 * - Lazy loading - תוספים נטענים רק כשצריך
 * - Server-side only - אין hydration מיותר
 * - Cached - תוצאות מאוחסנות ב-cache
 */

import { db } from '@/lib/db';
import { storePlugins, productStories, products, productImages, advisorQuizzes, pluginPricing } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { getPluginDefinition, pluginRegistry } from './registry';
import type { PluginWithStatus, StorePlugin } from './types';

/**
 * בדיקה האם תוסף מותקן ופעיל בחנות
 */
export async function isPluginActive(storeId: string, pluginSlug: string): Promise<boolean> {
  const [plugin] = await db
    .select({ isActive: storePlugins.isActive })
    .from(storePlugins)
    .where(
      and(
        eq(storePlugins.storeId, storeId),
        eq(storePlugins.pluginSlug, pluginSlug),
        eq(storePlugins.isActive, true)
      )
    )
    .limit(1);

  return !!plugin?.isActive;
}

/**
 * קבלת כל התוספים המותקנים והפעילים בחנות
 * מסנן תוספים מבוטלים (cancelled) או לא פעילים (isActive=false)
 */
export async function getActivePlugins(storeId: string): Promise<StorePlugin[]> {
  const plugins = await db
    .select()
    .from(storePlugins)
    .where(
      and(
        eq(storePlugins.storeId, storeId),
        eq(storePlugins.isActive, true)
      )
    );

  // Double-check: filter out cancelled plugins (extra safety)
  return (plugins as unknown as StorePlugin[]).filter(
    p => p.subscriptionStatus !== 'cancelled'
  );
}

/**
 * קבלת תוסף ספציפי עם ההגדרות שלו
 */
export async function getStorePlugin(storeId: string, pluginSlug: string): Promise<StorePlugin | null> {
  const [plugin] = await db
    .select()
    .from(storePlugins)
    .where(
      and(
        eq(storePlugins.storeId, storeId),
        eq(storePlugins.pluginSlug, pluginSlug)
      )
    )
    .limit(1);

  return plugin as unknown as StorePlugin || null;
}

/**
 * קבלת כל התוספים עם סטטוס התקנה לחנות ספציפית
 * מחירים נקראים מה-DB (pluginPricing) אם קיימים, אחרת מה-registry
 */
export async function getPluginsWithStatus(storeId: string): Promise<PluginWithStatus[]> {
  // קבלת כל התוספים המותקנים
  const installedPlugins = await db
    .select()
    .from(storePlugins)
    .where(eq(storePlugins.storeId, storeId));

  // קבלת מחירים מה-DB
  const dbPricing = await db.select().from(pluginPricing);
  const pricingMap = new Map(
    dbPricing.map(p => [p.pluginSlug, { 
      price: Number(p.monthlyPrice), 
      trialDays: p.trialDays || 14,
      isActive: p.isActive
    }])
  );

  const installedMap = new Map(
    installedPlugins.map(p => [p.pluginSlug, p])
  );

  // מיזוג עם ה-registry - מחירי DB עוקפים את ה-registry
  return pluginRegistry.map(definition => {
    const installed = installedMap.get(definition.slug);
    const dbPrice = pricingMap.get(definition.slug);
    
    // Plugin is considered installed only if:
    // 1. Record exists AND
    // 2. Not cancelled (subscription status is not 'cancelled' or null/active)
    const isCancelled = installed?.subscriptionStatus === 'cancelled';
    const isInstalled = !!installed && !isCancelled;
    
    // Use DB price if available, otherwise use registry default
    const price = dbPrice?.price ?? definition.price;
    const trialDays = dbPrice?.trialDays ?? definition.trialDays;
    
    return {
      ...definition,
      price,
      trialDays,
      isInstalled,
      isActive: isInstalled && (installed?.isActive ?? false),
      config: (installed?.config as Record<string, unknown>) || definition.defaultConfig,
      installedAt: installed?.installedAt,
      subscription: installed ? {
        status: installed.subscriptionStatus || 'active',
        expiresAt: installed.expiresAt || undefined,
        nextBillingDate: installed.nextBillingDate || undefined,
      } : undefined,
    };
  });
}

/**
 * התקנת תוסף
 */
export async function installPlugin(
  storeId: string,
  pluginSlug: string,
  config?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const definition = getPluginDefinition(pluginSlug);
  
  if (!definition) {
    return { success: false, error: 'תוסף לא נמצא' };
  }

  try {
    // בדיקה אם כבר מותקן
    const existing = await getStorePlugin(storeId, pluginSlug);
    
    if (existing) {
      // אם כבר קיים, הפעל אותו מחדש
      await db
        .update(storePlugins)
        .set({
          isActive: true,
          updatedAt: new Date(),
          cancelledAt: null,
        })
        .where(eq(storePlugins.id, existing.id));
    } else {
      // התקנה חדשה
      const now = new Date();
      const trialEndsAt = definition.trialDays
        ? new Date(now.getTime() + definition.trialDays * 24 * 60 * 60 * 1000)
        : null;

      await db.insert(storePlugins).values({
        storeId,
        pluginSlug,
        isActive: true,
        config: config || definition.defaultConfig,
        subscriptionStatus: definition.isFree ? 'active' : 'trial',
        trialEndsAt,
        installedAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error installing plugin:', error);
    return { success: false, error: 'שגיאה בהתקנת התוסף' };
  }
}

/**
 * הסרת/ביטול תוסף
 * 
 * ⚠️ התנהגות:
 * - תוסף חינמי: נמחק לחלוטין מה-DB
 * - תוסף בתשלום: מושבת מיידית (isActive=false) + סימון cancelled
 *   המשתמש מאבד את יתרת התקופה (אין החזר)
 *   הטוקן נשמר - ניתן להפעיל מחדש בעתיד
 */
export async function uninstallPlugin(
  storeId: string,
  pluginSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const plugin = await getStorePlugin(storeId, pluginSlug);
    
    if (!plugin) {
      return { success: false, error: 'התוסף לא מותקן' };
    }

    const definition = getPluginDefinition(pluginSlug);
    
    if (definition?.isFree) {
      // תוסף חינמי - מחיקה מלאה
      await db
        .delete(storePlugins)
        .where(eq(storePlugins.id, plugin.id));
    } else {
      // תוסף בתשלום - ביטול מיידי
      // isActive: false → לא מופיע בסיידבר ולא עובד
      // subscriptionStatus: 'cancelled' → לא יחויב שוב
      // הטוקן נשמר לשימוש עתידי
      await db
        .update(storePlugins)
        .set({
          isActive: false, // 🔑 כיבוי מיידי - לא מופיע בסיידבר
          subscriptionStatus: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(storePlugins.id, plugin.id));
    }

    return { success: true };
  } catch (error) {
    console.error('Error uninstalling plugin:', error);
    return { success: false, error: 'שגיאה בהסרת התוסף' };
  }
}

/**
 * עדכון הגדרות תוסף
 */
export async function updatePluginConfig(
  storeId: string,
  pluginSlug: string,
  config: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const plugin = await getStorePlugin(storeId, pluginSlug);
    
    if (!plugin) {
      return { success: false, error: 'התוסף לא מותקן' };
    }

    await db
      .update(storePlugins)
      .set({
        config,
        updatedAt: new Date(),
      })
      .where(eq(storePlugins.id, plugin.id));

    return { success: true };
  } catch (error) {
    console.error('Error updating plugin config:', error);
    return { success: false, error: 'שגיאה בעדכון ההגדרות' };
  }
}

/**
 * קבלת תפריט התוספים לסיידבר
 * מחזיר רק תוספים מותקנים ופעילים עם menuItem
 */
export async function getPluginMenuItems(storeId: string): Promise<{
  icon: string;
  label: string;
  href: string;
  section: string;
  badge?: string;
}[]> {
  const activePlugins = await getActivePlugins(storeId);
  
  const menuItems: {
    icon: string;
    label: string;
    href: string;
    section: string;
    badge?: string;
  }[] = [];

  for (const installed of activePlugins) {
    const definition = getPluginDefinition(installed.pluginSlug);
    if (definition?.metadata?.menuItem) {
      menuItems.push({
        icon: definition.metadata.menuItem.icon,
        label: definition.metadata.menuItem.label,
        href: definition.metadata.menuItem.href,
        section: definition.metadata.menuItem.section || 'addons',
        badge: definition.metadata.menuItem.badge,
      });
    }
  }

  return menuItems;
}

// ============================================
// Stories Plugin Specific Loaders
// ============================================

export interface StoryWithProduct {
  id: string;
  productId: string;
  position: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  // Custom media - overrides product image if set
  customMediaUrl: string | null;
  customMediaType: 'image' | 'video' | null;
  product: {
    id: string;
    title: string;
    handle: string;
    price: number;
    compareAtPrice: number | null;
    description: string | null;
    image: string | null;
  };
  isViewed?: boolean;
  isLiked?: boolean;
  variants?: unknown[];
}

/**
 * קבלת סטוריז עם מוצרים לחנות (לפרונט)
 */
export async function getStoriesWithProducts(
  storeId: string,
  visitorId?: string
): Promise<StoryWithProduct[]> {
  const stories = await db
    .select({
      id: productStories.id,
      productId: productStories.productId,
      position: productStories.position,
      viewsCount: productStories.viewsCount,
      likesCount: productStories.likesCount,
      commentsCount: productStories.commentsCount,
      customMediaUrl: productStories.customMediaUrl,
      customMediaType: productStories.customMediaType,
      productTitle: products.name,
      productHandle: products.slug,
      productPrice: products.price,
      productCompareAtPrice: products.comparePrice,
      productDescription: products.description,
    })
    .from(productStories)
    .innerJoin(products, eq(productStories.productId, products.id))
    .where(
      and(
        eq(productStories.storeId, storeId),
        eq(productStories.isActive, true)
      )
    )
    .orderBy(productStories.position);

  // קבלת תמונות
  const productIds = stories.map(s => s.productId);
  const images = productIds.length > 0 
    ? await db
        .select({
          productId: productImages.productId,
          url: productImages.url,
        })
        .from(productImages)
        .where(eq(productImages.isPrimary, true))
    : [];

  const imageMap = new Map(images.map(i => [i.productId, i.url]));

  return stories.map(story => ({
    id: story.id,
    productId: story.productId,
    position: story.position,
    viewsCount: story.viewsCount,
    likesCount: story.likesCount,
    commentsCount: story.commentsCount,
    customMediaUrl: story.customMediaUrl,
    customMediaType: story.customMediaType as 'image' | 'video' | null,
    product: {
      id: story.productId,
      title: story.productTitle,
      handle: story.productHandle,
      price: Number(story.productPrice),
      compareAtPrice: story.productCompareAtPrice ? Number(story.productCompareAtPrice) : null,
      description: story.productDescription,
      image: imageMap.get(story.productId) || null,
    },
    isViewed: false, // TODO: בדיקה מול visitorId
    isLiked: false,  // TODO: בדיקה מול visitorId
  }));
}

// ============================================
// Smart Advisor Plugin Specific Loaders
// ============================================

export interface AdvisorForFloating {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  primaryColor: string;
}

// Helper to check if slug is URL-safe (ASCII only)
function isSlugValid(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

// Helper to generate URL-safe slug
function generateSafeSlug(title: string): string {
  const randomId = Math.random().toString(36).substring(2, 10);
  const cleaned = title
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20);
  return cleaned ? `${cleaned}-${randomId}` : `quiz-${randomId}`;
}

/**
 * קבלת יועצים פעילים לכפתור הצף (server-side)
 * ⚡ Auto-fixes broken slugs with Hebrew characters
 */
export async function getActiveAdvisorsForFloating(storeId: string): Promise<AdvisorForFloating[]> {
  const advisors = await db
    .select({
      id: advisorQuizzes.id,
      title: advisorQuizzes.title,
      slug: advisorQuizzes.slug,
      description: advisorQuizzes.description,
      primaryColor: advisorQuizzes.primaryColor,
    })
    .from(advisorQuizzes)
    .where(
      and(
        eq(advisorQuizzes.storeId, storeId),
        eq(advisorQuizzes.isActive, true),
        eq(advisorQuizzes.showFloatingButton, true)
      )
    )
    .orderBy(asc(advisorQuizzes.position));

  // Auto-fix any slugs with non-ASCII characters
  const fixedAdvisors: AdvisorForFloating[] = [];
  
  for (const advisor of advisors) {
    let slug = advisor.slug;
    
    // If slug contains non-ASCII characters, fix it
    if (!isSlugValid(slug)) {
      const newSlug = generateSafeSlug(advisor.title);
      
      // Update in database (fire-and-forget)
      db.update(advisorQuizzes)
        .set({ slug: newSlug, updatedAt: new Date() })
        .where(eq(advisorQuizzes.id, advisor.id))
        .catch(err => console.error('Error fixing slug:', err));
      
      slug = newSlug;
    }
    
    fixedAdvisors.push({
      id: advisor.id,
      title: advisor.title,
      slug,
      description: advisor.description,
      primaryColor: advisor.primaryColor,
    });
  }

  return fixedAdvisors;
}

