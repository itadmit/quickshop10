/**
 * Mobile App Config API
 * 
 * GET  /api/storefront/[storeSlug]/app-config  — Public, no auth
 *   Returns the mobile app configuration (theme, sections, tabBar, etc.)
 * 
 * PUT  /api/storefront/[storeSlug]/app-config  — Admin/Owner auth required
 *   Saves the mobile app configuration as-is (single JSON object)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, storeMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ storeSlug: string }>;
}

// ─── GET — Public (no auth) ─────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { storeSlug } = await params;

    const [store] = await db
      .select({
        mobileAppConfig: stores.mobileAppConfig,
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

    // Return config or null if not set yet
    const response = NextResponse.json({
      success: true,
      data: store.mobileAppConfig || null,
    });

    // Cache for 60 seconds — config doesn't change frequently
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    return response;
  } catch (error) {
    console.error('GET app-config error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאת שרת' },
      { status: 500 }
    );
  }
}

// ─── PUT — Admin/Owner auth required ────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { storeSlug } = await params;

    // 2. Get store
    const [store] = await db
      .select({
        id: stores.id,
        ownerId: stores.ownerId,
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

    // 3. Verify ownership or team membership
    const isOwner = store.ownerId === session.user.id;

    if (!isOwner) {
      // Check if user is a team member
      const [member] = await db
        .select({ id: storeMembers.id })
        .from(storeMembers)
        .where(and(
          eq(storeMembers.storeId, store.id),
          eq(storeMembers.userId, session.user.id)
        ))
        .limit(1);

      if (!member) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // 4. Parse and save config as-is (no internal validation)
    const config = await request.json();

    await db
      .update(stores)
      .set({
        mobileAppConfig: config,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, store.id));

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('PUT app-config error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאת שרת' },
      { status: 500 }
    );
  }
}
