/**
 * Mobile Notification Preferences API
 * GET /api/mobile/notifications/preferences - Get preferences
 * PUT /api/mobile/notifications/preferences - Update preferences
 * 
 * Manage push notification preferences for mobile app
 * Requires customer authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET: Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    // Get preferences from customer record
    const prefs = (customer.notificationPreferences as Record<string, boolean>) || {};
    
    return NextResponse.json({
      success: true,
      data: {
        orderUpdates: prefs.orderUpdates ?? true, // Default: enabled
        promotions: prefs.promotions ?? true,
        backInStock: prefs.backInStock ?? true,
      },
    });
    
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת הגדרות התראות' },
      { status: 500 }
    );
  }
}

// PUT: Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { orderUpdates, promotions, backInStock } = body;
    
    // Build preferences object
    const preferences = {
      orderUpdates: orderUpdates !== undefined ? Boolean(orderUpdates) : true,
      promotions: promotions !== undefined ? Boolean(promotions) : true,
      backInStock: backInStock !== undefined ? Boolean(backInStock) : true,
    };
    
    // Update customer preferences
    await db
      .update(customers)
      .set({
        notificationPreferences: preferences,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id));
    
    return NextResponse.json({
      success: true,
      message: 'הגדרות ההתראות עודכנו בהצלחה',
      data: preferences,
    });
    
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בעדכון הגדרות התראות' },
      { status: 500 }
    );
  }
}
