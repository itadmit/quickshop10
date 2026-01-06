/**
 * Mobile Notifications API
 * GET /api/mobile/notifications - List notifications
 * POST /api/mobile/notifications - Register push token
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications, mobileDevices } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireMobileAuthWithStore, getMobileAuth } from '@/lib/mobile-auth';

// GET /api/mobile/notifications - List notifications
export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [eq(notifications.storeId, auth.store.id)];
    
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }
    
    // Get notifications
    const notificationsData = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        resourceId: notifications.resourceId,
        resourceType: notifications.resourceType,
        isRead: notifications.isRead,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));
    
    // Get unread count
    const [{ unreadCount }] = await db
      .select({ unreadCount: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.storeId, auth.store.id),
        eq(notifications.isRead, false)
      ));
    
    return NextResponse.json({
      success: true,
      notifications: notificationsData,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
      unreadCount: Number(unreadCount),
    });
    
  } catch (error) {
    console.error('Mobile notifications list error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/notifications - Register push token
export async function POST(request: NextRequest) {
  try {
    const auth = await getMobileAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    if (!body.pushToken) {
      return NextResponse.json(
        { success: false, error: 'Push token is required' },
        { status: 400 }
      );
    }
    
    // Update push token for this device
    await db
      .update(mobileDevices)
      .set({
        pushToken: body.pushToken,
        notificationsEnabled: body.notificationsEnabled ?? true,
        notifyNewOrders: body.notifyNewOrders ?? true,
        notifyLowStock: body.notifyLowStock ?? true,
        notifyReturns: body.notifyReturns ?? true,
        updatedAt: new Date(),
      })
      .where(eq(mobileDevices.id, auth.device.id));
    
    return NextResponse.json({
      success: true,
      message: 'Push token registered successfully',
    });
    
  } catch (error) {
    console.error('Push token registration error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to register push token' },
      { status: 500 }
    );
  }
}

