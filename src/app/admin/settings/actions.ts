'use server';

/**
 * Admin Settings Server Actions
 * פעולות שרת לניהול הגדרות פלטפורמה
 */

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { platformSettings, pluginPricing } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { invalidateSettingsCache } from '@/lib/billing/platform-settings';

/**
 * Verify user is super admin
 */
async function verifySuperAdmin(): Promise<string> {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    throw new Error('Unauthorized');
  }
  
  return session.user.id || '';
}

/**
 * Update platform settings
 */
export async function updatePlatformSettings(
  settings: Record<string, string | number>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await verifySuperAdmin();
    const now = new Date();

    for (const [key, value] of Object.entries(settings)) {
      await db
        .insert(platformSettings)
        .values({
          key,
          value: value as unknown as Record<string, unknown>,
          updatedBy: userId || undefined,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: {
            value: value as unknown as Record<string, unknown>,
            updatedBy: userId || undefined,
            updatedAt: now,
          },
        });
    }

    // Invalidate cache
    invalidateSettingsCache();
    
    revalidatePath('/admin/settings');
    revalidatePath('/admin/billing');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update plugin pricing
 */
export async function updatePluginPricing(
  plugins: { slug: string; monthlyPrice: number; trialDays: number; isActive: boolean }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifySuperAdmin();
    const now = new Date();

    for (const plugin of plugins) {
      await db
        .insert(pluginPricing)
        .values({
          pluginSlug: plugin.slug,
          monthlyPrice: String(plugin.monthlyPrice),
          trialDays: plugin.trialDays,
          isActive: plugin.isActive,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: pluginPricing.pluginSlug,
          set: {
            monthlyPrice: String(plugin.monthlyPrice),
            trialDays: plugin.trialDays,
            isActive: plugin.isActive,
            updatedAt: now,
          },
        });
    }

    revalidatePath('/admin/settings');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating plugin pricing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Add new plugin pricing
 */
export async function addPluginPricing(
  slug: string,
  monthlyPrice: number,
  trialDays: number = 14
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifySuperAdmin();

    await db.insert(pluginPricing).values({
      pluginSlug: slug,
      monthlyPrice: String(monthlyPrice),
      trialDays,
      isActive: true,
    });

    revalidatePath('/admin/settings');
    
    return { success: true };
  } catch (error) {
    console.error('Error adding plugin pricing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete plugin pricing
 */
export async function deletePluginPricing(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifySuperAdmin();

    await db
      .delete(pluginPricing)
      .where(eq(pluginPricing.pluginSlug, slug));

    revalidatePath('/admin/settings');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting plugin pricing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

