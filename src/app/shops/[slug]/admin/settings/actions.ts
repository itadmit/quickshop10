'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface GeneralSettingsData {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  currency: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  // הגדרות עגלות נטושות
  abandonedCartMinutes: number;
  lowStockThreshold: number;
  // הגדרות החזרות
  returnPolicyDays: number;
}

export async function updateStoreSettings(storeId: string, data: GeneralSettingsData) {
  try {
    // Get current settings
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    // Merge new settings
    const newSettings = {
      ...currentSettings,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      address: data.address || undefined,
      facebookUrl: data.facebookUrl || undefined,
      instagramUrl: data.instagramUrl || undefined,
      twitterUrl: data.twitterUrl || undefined,
      // הגדרות עגלות נטושות
      abandonedCartMinutes: data.abandonedCartMinutes || 60,
      lowStockThreshold: data.lowStockThreshold || 5,
      // הגדרות החזרות
      returnPolicyDays: data.returnPolicyDays ?? 14,
    };

    // Update store
    await db
      .update(stores)
      .set({
        name: data.name,
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        currency: data.currency,
        timezone: data.timezone,
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating store settings:', error);
    return { error: 'אירעה שגיאה בשמירת ההגדרות' };
  }
}

interface TrackingSettingsData {
  // Facebook
  facebookPixelId: string;
  facebookPixelEnabled: boolean;
  facebookAccessToken: string;
  // Google
  googleAnalyticsId: string;
  googleAnalyticsEnabled: boolean;
  googleApiSecret: string;
  // GTM
  gtmContainerId: string;
  gtmEnabled: boolean;
  // TikTok
  tiktokPixelId: string;
  tiktokPixelEnabled: boolean;
  tiktokAccessToken: string;
}

export async function updateTrackingSettings(storeId: string, data: TrackingSettingsData) {
  try {
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    const newSettings = {
      ...currentSettings,
      // Facebook
      facebookPixelId: data.facebookPixelId || undefined,
      facebookPixelEnabled: data.facebookPixelEnabled,
      facebookAccessToken: data.facebookAccessToken || undefined,
      // Google
      googleAnalyticsId: data.googleAnalyticsId || undefined,
      googleAnalyticsEnabled: data.googleAnalyticsEnabled,
      googleApiSecret: data.googleApiSecret || undefined,
      // GTM
      gtmContainerId: data.gtmContainerId || undefined,
      gtmEnabled: data.gtmEnabled,
      // TikTok
      tiktokPixelId: data.tiktokPixelId || undefined,
      tiktokPixelEnabled: data.tiktokPixelEnabled,
      tiktokAccessToken: data.tiktokAccessToken || undefined,
    };

    await db
      .update(stores)
      .set({
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/tracking', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating tracking settings:', error);
    return { error: 'אירעה שגיאה בשמירת ההגדרות' };
  }
}

interface CheckoutSettingsData {
  requirePhone: boolean;
  requireCompany: boolean;
  allowNotes: boolean;
  termsRequired: boolean;
  successMessage: string;
}

export async function updateCheckoutSettings(storeId: string, data: CheckoutSettingsData) {
  try {
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    const newSettings = {
      ...currentSettings,
      checkout: {
        requirePhone: data.requirePhone,
        requireCompany: data.requireCompany,
        allowNotes: data.allowNotes,
        termsRequired: data.termsRequired,
        successMessage: data.successMessage || undefined,
      },
    };

    await db
      .update(stores)
      .set({
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/checkout', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating checkout settings:', error);
    return { error: 'אירעה שגיאה בשמירת ההגדרות' };
  }
}

interface NotificationSettingsData {
  emailOnOrder: boolean;
  emailOnLowStock: boolean;
  emailOnOutOfStock: boolean;
  lowStockThreshold: number;
  notificationEmail: string;
}

export async function updateNotificationSettings(storeId: string, data: NotificationSettingsData) {
  try {
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { error: 'חנות לא נמצאה' };
    }

    const currentSettings = (store.settings as Record<string, unknown>) || {};

    const newSettings = {
      ...currentSettings,
      notifications: {
        emailOnOrder: data.emailOnOrder,
        emailOnLowStock: data.emailOnLowStock,
        emailOnOutOfStock: data.emailOnOutOfStock,
        lowStockThreshold: data.lowStockThreshold,
        notificationEmail: data.notificationEmail || undefined,
      },
    };

    await db
      .update(stores)
      .set({
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath('/shops/[slug]/admin/settings/notifications', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return { error: 'אירעה שגיאה בשמירת ההגדרות' };
  }
}

