/**
 * Mobile Token Refresh API
 * POST /api/mobile/auth/refresh
 * 
 * Refreshes an expired session token using a refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mobileDevices, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RefreshRequest {
  refreshToken: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RefreshRequest;
    
    if (!body.refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Find device by refresh token
    const [device] = await db
      .select()
      .from(mobileDevices)
      .where(eq(mobileDevices.refreshToken, body.refreshToken))
      .limit(1);
    
    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    // Generate new tokens
    const sessionToken = `qs_mobile_${nanoid(32)}`;
    const newRefreshToken = `qs_refresh_${nanoid(48)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    // Update device with new tokens
    await db
      .update(mobileDevices)
      .set({
        sessionToken,
        refreshToken: newRefreshToken,
        expiresAt,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mobileDevices.id, device.id));
    
    return NextResponse.json({
      success: true,
      token: sessionToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAt.toISOString(),
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

