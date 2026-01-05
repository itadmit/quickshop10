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

// Valid theme settings keys
const VALID_SETTINGS_KEYS = [
  // Header
  'headerLayout',
  'headerSticky',
  'headerTransparent',
  'headerShowSearch',
  'headerShowCart',
  'headerShowAccount',
  
  // Announcement bar
  'announcementEnabled',
  'announcementText',
  'announcementLink',
  'announcementBgColor',
  'announcementTextColor',
  
  // Footer
  'footerShowLogo',
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
];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const updates = await request.json();
    
    // Validate only known keys are being updated
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (VALID_SETTINGS_KEYS.includes(key)) {
        filteredUpdates[key] = value;
      }
    }
    
    if (Object.keys(filteredUpdates).length === 0) {
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
    
    // Merge with existing settings
    const currentSettings = (store.settings as Record<string, unknown>) || {};
    const updatedSettings = {
      ...currentSettings,
      ...filteredUpdates,
    };
    
    // Update store
    await db
      .update(stores)
      .set({ 
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id));
    
    return NextResponse.json({ 
      success: true, 
      settings: filteredUpdates,
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

