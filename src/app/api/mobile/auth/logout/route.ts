/**
 * Mobile Logout API
 * POST /api/mobile/auth/logout
 * 
 * Invalidates the mobile session
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mobileDevices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getMobileAuth } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getMobileAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Delete the device session
    await db
      .delete(mobileDevices)
      .where(eq(mobileDevices.id, auth.device.id));
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

