/**
 * Mobile Device Registration API
 * POST /api/mobile/device/register
 * 
 * Register device for push notifications (Expo Push Notifications)
 * Requires customer authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { customerDevices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { deviceToken, platform, deviceId } = body;
    
    // Validate required fields
    if (!deviceToken || !platform || !deviceId) {
      return NextResponse.json(
        { success: false, error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }
    
    // Validate platform
    if (platform !== 'ios' && platform !== 'android') {
      return NextResponse.json(
        { success: false, error: 'פלטפורמה לא חוקית' },
        { status: 400 }
      );
    }
    
    // Check if device already exists
    const [existingDevice] = await db
      .select()
      .from(customerDevices)
      .where(eq(customerDevices.deviceId, deviceId))
      .limit(1);
    
    if (existingDevice) {
      // Update existing device
      await db
        .update(customerDevices)
        .set({
          customerId: customer.id, // Update customer (in case device changed hands)
          deviceToken,
          platform,
          isActive: true,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(customerDevices.deviceId, deviceId));
      
      return NextResponse.json({
        success: true,
        message: 'המכשיר עודכן בהצלחה',
      });
    }
    
    // Create new device
    await db
      .insert(customerDevices)
      .values({
        customerId: customer.id,
        deviceToken,
        platform,
        deviceId,
        isActive: true,
        lastSeenAt: new Date(),
      });
    
    return NextResponse.json({
      success: true,
      message: 'המכשיר נרשם בהצלחה',
    });
    
  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה ברישום המכשיר' },
      { status: 500 }
    );
  }
}

// DELETE: Unregister device (when user logs out or disables notifications)
export async function DELETE(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    
    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'חסר מזהה מכשיר' },
        { status: 400 }
      );
    }
    
    // Deactivate device (don't delete - keep for history)
    await db
      .update(customerDevices)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(
        eq(customerDevices.deviceId, deviceId),
        eq(customerDevices.customerId, customer.id)
      ));
    
    return NextResponse.json({
      success: true,
      message: 'המכשיר הוסר בהצלחה',
    });
    
  } catch (error) {
    console.error('Error unregistering device:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בהסרת המכשיר' },
      { status: 500 }
    );
  }
}
