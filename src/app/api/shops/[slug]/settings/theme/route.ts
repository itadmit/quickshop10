/**
 * API Route: Update Theme Settings
 * PUT /api/shops/[slug]/settings/theme
 * 
 * Updates store's theme settings (header, footer, announcement bar, etc.)
 * These settings affect the storefront appearance without redeploying.
 * 
 * PERFORMANCE: Settings are stored in the DB and loaded once per request
 * in Server Components. No client-side hydration needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Direct store fields (not in settings jsonb)
const STORE_DIRECT_FIELDS = ['logoUrl', 'faviconUrl'];

// Valid theme settings keys (stored in settings jsonb)
const VALID_SETTINGS_KEYS = [
  // Global Settings
  'headingFont',
  'bodyFont',
  'siteTitle',
  'siteDescription',
  
  // Header
  'headerLayout',
  'headerSticky',
  'headerTransparent',
  'headerShowSearch',
  'headerShowCart',
  'headerShowAccount',
  'headerShowWishlist',
  'headerShowLanguageSwitcher',
  'headerNavigationMode', // 'menu' = custom menus, 'categories' = show all categories
  
  // Mobile menu settings
  'mobileMenuShowImages',
  'mobileMenuImageStyle',
  'mobileMenuBgColor',
  'megaMenuBgColor',
  
  // Announcement bar
  'announcementEnabled',
  'announcementText',
  'announcementLink',
  'announcementCountdownEnabled',
  'announcementCountdownDate',
  'announcementCountdownTime',
  'announcementBgColor',
  'announcementTextColor',
  
  // Footer
  'footerShowLogo',
  'footerShowCategories',
  'footerShowMenu',
  'footerShowNewsletter',
  'footerNewsletterTitle',
  'footerNewsletterSubtitle',
  'footerShowSocial',
  'footerShowPayments',
  'footerCopyright',
  'footerBgColor',
  'footerTextColor',
  
  // Social links
  'socialFacebook',
  'socialInstagram',
  'socialTwitter',
  'socialTiktok',
  'socialYoutube',
  
  // Product page settings (object with all product page customization)
  'productPageSettings',
  
  // Category page settings (object with all category page customization)
  'categoryPageSettings',
];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const updates = await request.json();
    
    // Separate direct store fields from settings jsonb
    const directFieldUpdates: Record<string, unknown> = {};
    const settingsUpdates: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (STORE_DIRECT_FIELDS.includes(key)) {
        directFieldUpdates[key] = value;
      } else if (VALID_SETTINGS_KEYS.includes(key)) {
        settingsUpdates[key] = value;
      }
    }
    
    const hasDirectUpdates = Object.keys(directFieldUpdates).length > 0;
    const hasSettingsUpdates = Object.keys(settingsUpdates).length > 0;
    
    if (!hasDirectUpdates && !hasSettingsUpdates) {
      return NextResponse.json(
        { success: false, error: 'No valid settings to update' },
        { status: 400 }
      );
    }
    
    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    // Add direct field updates (logoUrl, faviconUrl)
    if (hasDirectUpdates) {
      if (directFieldUpdates.logoUrl !== undefined) {
        updateData.logoUrl = directFieldUpdates.logoUrl || null;
      }
      if (directFieldUpdates.faviconUrl !== undefined) {
        updateData.faviconUrl = directFieldUpdates.faviconUrl || null;
      }
    }
    
    // Merge settings jsonb updates
    if (hasSettingsUpdates) {
      const currentSettings = (store.settings as Record<string, unknown>) || {};
      updateData.settings = {
        ...currentSettings,
        ...settingsUpdates,
      };
    }
    
    // Update store
    await db
      .update(stores)
      .set(updateData)
      .where(eq(stores.id, store.id));
    
    return NextResponse.json({ 
      success: true, 
      settings: { ...directFieldUpdates, ...settingsUpdates },
    });
    
  } catch (error) {
    console.error('Failed to update theme settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET current theme settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const [store] = await db
      .select({ settings: stores.settings })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      settings: store.settings || {},
    });
    
  } catch (error) {
    console.error('Failed to get theme settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

