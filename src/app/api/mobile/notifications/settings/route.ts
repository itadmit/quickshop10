/**
 * Mobile Notification Settings API
 * GET /api/mobile/notifications/settings - Get settings
 * PATCH /api/mobile/notifications/settings - Update settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mobileDevices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getMobileAuth } from '@/lib/mobile-auth';

// GET /api/mobile/notifications/settings
export async function GET(request: NextRequest) {
  try {
    const auth = await getMobileAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get device settings
    const [device] = await db
      .select({
        notificationsEnabled: mobileDevices.notificationsEnabled,
        notifyNewOrders: mobileDevices.notifyNewOrders,
        notifyLowStock: mobileDevices.notifyLowStock,
        notifyReturns: mobileDevices.notifyReturns,
        pushToken: mobileDevices.pushToken,
      })
      .from(mobileDevices)
      .where(eq(mobileDevices.id, auth.device.id))
      .limit(1);
    
    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      settings: {
        notificationsEnabled: device.notificationsEnabled,
        notifyNewOrders: device.notifyNewOrders,
        notifyLowStock: device.notifyLowStock,
        notifyReturns: device.notifyReturns,
        hasPushToken: !!device.pushToken,
      },
    });
    
  } catch (error) {
    console.error('Get notification settings error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/mobile/notifications/settings
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getMobileAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (body.notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = body.notificationsEnabled;
    }
    if (body.notifyNewOrders !== undefined) {
      updateData.notifyNewOrders = body.notifyNewOrders;
    }
    if (body.notifyLowStock !== undefined) {
      updateData.notifyLowStock = body.notifyLowStock;
    }
    if (body.notifyReturns !== undefined) {
      updateData.notifyReturns = body.notifyReturns;
    }
    
    // Update settings
    await db
      .update(mobileDevices)
      .set(updateData)
      .where(eq(mobileDevices.id, auth.device.id));
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
    
  } catch (error) {
    console.error('Update notification settings error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

