/**
 * Mobile Authentication Utilities
 * Helper functions for authenticating mobile API requests
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { mobileDevices, users, stores, storeMembers } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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
 * OPTIMIZED: Uses JOINs to reduce DB roundtrips from 4-5 to 1-2
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
  
  // Single query: Get device + user in one roundtrip
  const [deviceWithUser] = await db
    .select({
      device: mobileDevices,
      user: users,
    })
    .from(mobileDevices)
    .innerJoin(users, eq(users.id, mobileDevices.userId))
    .where(eq(mobileDevices.sessionToken, token))
    .limit(1);
  
  if (!deviceWithUser) {
    return null;
  }
  
  const { device, user } = deviceWithUser;
  
  // Check if token is expired
  if (new Date(device.expiresAt) < new Date()) {
    return null;
  }
  
  // Get store info if storeId is set (from header or device)
  const storeId = request.headers.get('X-Store-Id') || device.storeId;
  let storeInfo: MobileAuthResult['store'] = null;
  
  if (storeId) {
    // Single query: Check both ownership and membership in one query
    const [storeAccess] = await db
      .select({
        store: stores,
        isOwner: sql<boolean>`${stores.ownerId} = ${user.id}`,
        memberRole: storeMembers.role,
        memberPermissions: storeMembers.permissions,
      })
      .from(stores)
      .leftJoin(storeMembers, and(
        eq(storeMembers.storeId, stores.id),
        eq(storeMembers.userId, user.id)
      ))
      .where(eq(stores.id, storeId))
      .limit(1);
    
    if (storeAccess) {
      if (storeAccess.isOwner) {
        storeInfo = {
          id: storeAccess.store.id,
          slug: storeAccess.store.slug,
          name: storeAccess.store.name,
          role: 'owner',
          permissions: {},
        };
      } else if (storeAccess.memberRole) {
        storeInfo = {
          id: storeAccess.store.id,
          slug: storeAccess.store.slug,
          name: storeAccess.store.name,
          role: storeAccess.memberRole,
          permissions: storeAccess.memberPermissions as Record<string, boolean>,
        };
      }
    }
  }
  
  // Update last active asynchronously (fire and forget - doesn't block response)
  db.update(mobileDevices)
    .set({ lastActiveAt: new Date() })
    .where(eq(mobileDevices.id, device.id))
    .execute()
    .catch(() => {}); // Silent fail - not critical
  
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

