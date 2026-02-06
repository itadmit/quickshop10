/**
 * Storefront Configuration API
 * GET /api/storefront/[storeSlug]/config
 * 
 * Returns store configuration for mobile app (logo, currency, theme, settings)
 * Public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ storeSlug: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { storeSlug } = await params;
    
    // Get store configuration
    const [store] = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        logoUrl: stores.logoUrl,
        faviconUrl: stores.faviconUrl,
        currency: stores.currency,
        timezone: stores.timezone,
        isPublished: stores.isPublished,
        settings: stores.settings,
        themeSettings: stores.themeSettings,
        defaultLocale: stores.defaultLocale,
        supportedLocales: stores.supportedLocales,
      })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'החנות לא נמצאה' },
        { status: 404 }
      );
    }
    
    // Parse settings from jsonb
    const settings = (store.settings as Record<string, unknown>) || {};
    const themeSettings = (store.themeSettings as Record<string, unknown>) || {};
    
    // Build response
    const config = {
      id: store.id,
      name: store.name,
      slug: store.slug,
      logoUrl: store.logoUrl,
      faviconUrl: store.faviconUrl,
      currency: store.currency,
      timezone: store.timezone,
      isPublished: store.isPublished,
      
      // Settings
      settings: {
        contactEmail: (settings.contactEmail as string) || null,
        contactPhone: (settings.contactPhone as string) || null,
        address: (settings.address as string) || null,
        showDecimalPrices: (settings.showDecimalPrices as boolean) ?? true,
        facebookUrl: (settings.facebookUrl as string) || null,
        instagramUrl: (settings.instagramUrl as string) || null,
        twitterUrl: (settings.twitterUrl as string) || null,
        returnPolicyDays: (settings.returnPolicyDays as number) || 14,
      },
      
      // Theme
      theme: {
        primaryColor: (themeSettings.primaryColor as string) || '#000000',
        secondaryColor: (themeSettings.secondaryColor as string) || '#666666',
        headerLayout: (themeSettings.headerLayout as string) || 'logo-center',
        headerSticky: (themeSettings.headerSticky as boolean) ?? true,
        announcementEnabled: (themeSettings.announcementEnabled as boolean) || false,
        announcementText: (themeSettings.announcementText as string) || null,
        announcementBgColor: (themeSettings.announcementBgColor as string) || '#000000',
        announcementTextColor: (themeSettings.announcementTextColor as string) || '#ffffff',
      },
      
      // Localization
      localization: {
        defaultLocale: store.defaultLocale,
        supportedLocales: store.supportedLocales || ['he'],
      },
    };
    
    return NextResponse.json({
      success: true,
      data: config,
    });
    
  } catch (error) {
    console.error('Error fetching store config:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת הגדרות החנות' },
      { status: 500 }
    );
  }
}
