/**
 * Mobile Login API
 * POST /api/mobile/auth/login
 * 
 * Authenticates a user and returns a session token for mobile app
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, stores, storeMembers, mobileDevices } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
  pushToken?: string;
  platform: 'ios' | 'android';
  appVersion?: string;
  osVersion?: string;
  deviceName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequest;
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'נא להזין אימייל וסיסמה' },
        { status: 400 }
      );
    }
    
    if (!body.deviceId || !body.platform) {
      return NextResponse.json(
        { success: false, error: 'פרטי מכשיר חסרים' },
        { status: 400 }
      );
    }
    
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email.toLowerCase().trim()))
      .limit(1);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }
    
    // Check password
    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'חשבון זה לא תומך בהתחברות עם סיסמה' },
        { status: 401 }
      );
    }
    
    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }
    
    // Get user's stores (owned + member of)
    const ownedStores = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        logoUrl: stores.logoUrl,
      })
      .from(stores)
      .where(eq(stores.ownerId, user.id));
    
    const memberStores = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        logoUrl: stores.logoUrl,
        role: storeMembers.role,
        permissions: storeMembers.permissions,
      })
      .from(storeMembers)
      .innerJoin(stores, eq(stores.id, storeMembers.storeId))
      .where(eq(storeMembers.userId, user.id));
    
    // Combine stores with roles
    const userStores = [
      ...ownedStores.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logoUrl: s.logoUrl,
        role: 'owner' as const,
        permissions: {},
      })),
      ...memberStores.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logoUrl: s.logoUrl,
        role: s.role,
        permissions: s.permissions as Record<string, boolean>,
      })),
    ];
    
    // Generate tokens
    const sessionToken = `qs_mobile_${nanoid(32)}`;
    const refreshToken = `qs_refresh_${nanoid(48)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // Default store (first available)
    const defaultStoreId = userStores.length > 0 ? userStores[0].id : null;
    
    // Upsert mobile device (update if same device, create if new)
    await db
      .insert(mobileDevices)
      .values({
        userId: user.id,
        storeId: defaultStoreId,
        deviceId: body.deviceId,
        pushToken: body.pushToken,
        platform: body.platform,
        appVersion: body.appVersion,
        osVersion: body.osVersion,
        deviceName: body.deviceName,
        sessionToken,
        refreshToken,
        expiresAt,
        lastActiveAt: new Date(),
        ipAddress,
        userAgent,
      })
      .onConflictDoUpdate({
        target: [mobileDevices.userId, mobileDevices.deviceId],
        set: {
          pushToken: body.pushToken,
          platform: body.platform,
          appVersion: body.appVersion,
          osVersion: body.osVersion,
          deviceName: body.deviceName,
          sessionToken,
          refreshToken,
          expiresAt,
          lastActiveAt: new Date(),
          ipAddress,
          userAgent,
          updatedAt: new Date(),
        },
      });
    
    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
    
    return NextResponse.json({
      success: true,
      token: sessionToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      stores: userStores,
    });
    
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}

