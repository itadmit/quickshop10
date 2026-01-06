/**
 * Mobile Authentication Utilities
 * Helper functions for authenticating mobile API requests
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { mobileDevices, users, stores, storeMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface MobileAuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: 'admin' | 'merchant';
  };
  device: {
    id: string;
    deviceId: string;
    platform: 'ios' | 'android';
    storeId: string | null;
  };
  store: {
    id: string;
    slug: string;
    name: string;
    role: 'owner' | 'manager' | 'marketing' | 'developer' | 'influencer';
    permissions: Record<string, boolean>;
  } | null;
}

/**
 * Validates mobile auth token from request headers
 * Returns user and device info if valid, null otherwise
 */
export async function getMobileAuth(request: NextRequest): Promise<MobileAuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // Check if it's a mobile token
  if (!token.startsWith('qs_mobile_')) {
    return null;
  }
  
  // Find device by token
  const [device] = await db
    .select()
    .from(mobileDevices)
    .where(eq(mobileDevices.sessionToken, token))
    .limit(1);
  
  if (!device) {
    return null;
  }
  
  // Check if token is expired
  if (new Date(device.expiresAt) < new Date()) {
    return null;
  }
  
  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, device.userId))
    .limit(1);
  
  if (!user) {
    return null;
  }
  
  // Update last active
  await db
    .update(mobileDevices)
    .set({ lastActiveAt: new Date() })
    .where(eq(mobileDevices.id, device.id));
  
  // Get store info if storeId is set (from header or device)
  const storeId = request.headers.get('X-Store-Id') || device.storeId;
  let storeInfo: MobileAuthResult['store'] = null;
  
  if (storeId) {
    // Check if user owns the store
    const [ownedStore] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.ownerId, user.id)))
      .limit(1);
    
    if (ownedStore) {
      storeInfo = {
        id: ownedStore.id,
        slug: ownedStore.slug,
        name: ownedStore.name,
        role: 'owner',
        permissions: {},
      };
    } else {
      // Check if user is a member
      const [membership] = await db
        .select({
          store: stores,
          member: storeMembers,
        })
        .from(storeMembers)
        .innerJoin(stores, eq(stores.id, storeMembers.storeId))
        .where(and(
          eq(storeMembers.storeId, storeId),
          eq(storeMembers.userId, user.id)
        ))
        .limit(1);
      
      if (membership) {
        storeInfo = {
          id: membership.store.id,
          slug: membership.store.slug,
          name: membership.store.name,
          role: membership.member.role,
          permissions: membership.member.permissions as Record<string, boolean>,
        };
      }
    }
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    device: {
      id: device.id,
      deviceId: device.deviceId,
      platform: device.platform,
      storeId: device.storeId,
    },
    store: storeInfo,
  };
}

/**
 * Requires mobile auth - throws if not authenticated
 */
export async function requireMobileAuth(request: NextRequest): Promise<MobileAuthResult> {
  const auth = await getMobileAuth(request);
  
  if (!auth) {
    throw new Error('Unauthorized');
  }
  
  return auth;
}

/**
 * Requires mobile auth with store access
 */
export async function requireMobileAuthWithStore(request: NextRequest): Promise<MobileAuthResult & { store: NonNullable<MobileAuthResult['store']> }> {
  const auth = await requireMobileAuth(request);
  
  if (!auth.store) {
    throw new Error('Store access required');
  }
  
  return auth as MobileAuthResult & { store: NonNullable<MobileAuthResult['store']> };
}

/**
 * Check if user has permission for an action
 */
export function hasPermission(
  auth: MobileAuthResult,
  permission: string
): boolean {
  if (!auth.store) return false;
  
  // Owner has all permissions
  if (auth.store.role === 'owner') return true;
  
  // Admin users also have all permissions
  if (auth.user.role === 'admin') return true;
  
  // Check specific permission
  return auth.store.permissions[permission] === true;
}

