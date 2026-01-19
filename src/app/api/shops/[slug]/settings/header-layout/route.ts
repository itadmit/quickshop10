/**
 * API Route: Update Header Layout
 * PUT /api/shops/[slug]/settings/header-layout
 * 
 * Updates the store's header layout setting
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { headerLayout } = await request.json();
    
    // Validate header layout
    const validLayouts = ['logo-right', 'logo-left', 'logo-center'];
    if (!validLayouts.includes(headerLayout)) {
      return NextResponse.json(
        { success: false, error: 'Invalid header layout' },
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
    
    // Update store settings with new header layout
    const currentSettings = (store.settings as Record<string, unknown>) || {};
    const updatedSettings = {
      ...currentSettings,
      headerLayout,
    };
    
    await db
      .update(stores)
      .set({ 
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id));
    
    return NextResponse.json({ 
      success: true, 
      headerLayout,
    });
    
  } catch (error) {
    console.error('Failed to update header layout:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



