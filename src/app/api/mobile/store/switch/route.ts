/**
 * Mobile Store Switch API
 * POST /api/mobile/store/switch
 * 
 * Switch the active store for the current mobile session
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mobileDevices, stores, storeMembers } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getMobileAuth } from '@/lib/mobile-auth';

interface SwitchStoreRequest {
  storeId: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getMobileAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json() as SwitchStoreRequest;
    
    if (!body.storeId) {
      return NextResponse.json(
        { success: false, error: 'Store ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user has access to the store
    const [ownedStore] = await db
      .select()
      .from(stores)
      .where(and(
        eq(stores.id, body.storeId),
        eq(stores.ownerId, auth.user.id)
      ))
      .limit(1);
    
    const [memberStore] = await db
      .select()
      .from(storeMembers)
      .where(and(
        eq(storeMembers.storeId, body.storeId),
        eq(storeMembers.userId, auth.user.id)
      ))
      .limit(1);
    
    if (!ownedStore && !memberStore) {
      return NextResponse.json(
        { success: false, error: 'No access to this store' },
        { status: 403 }
      );
    }
    
    // Update device's active store
    await db
      .update(mobileDevices)
      .set({
        storeId: body.storeId,
        updatedAt: new Date(),
      })
      .where(eq(mobileDevices.id, auth.device.id));
    
    // Get store info
    const [store] = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        logoUrl: stores.logoUrl,
      })
      .from(stores)
      .where(eq(stores.id, body.storeId))
      .limit(1);
    
    return NextResponse.json({
      success: true,
      store: {
        ...store,
        role: ownedStore ? 'owner' : memberStore?.role,
        permissions: memberStore?.permissions || {},
      },
    });
    
  } catch (error) {
    console.error('Store switch error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to switch store' },
      { status: 500 }
    );
  }
}

