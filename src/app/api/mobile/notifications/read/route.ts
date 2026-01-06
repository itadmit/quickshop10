/**
 * Mobile Notifications Mark as Read API
 * PATCH /api/mobile/notifications/read
 * 
 * Mark notifications as read (single or batch)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

interface MarkReadRequest {
  notificationIds?: string[];
  markAll?: boolean;
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const body = await request.json() as MarkReadRequest;
    
    const now = new Date();
    
    if (body.markAll) {
      // Mark all as read
      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: now,
        })
        .where(and(
          eq(notifications.storeId, auth.store.id),
          eq(notifications.isRead, false)
        ));
      
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }
    
    if (body.notificationIds && body.notificationIds.length > 0) {
      // Mark specific notifications as read
      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: now,
        })
        .where(and(
          eq(notifications.storeId, auth.store.id),
          inArray(notifications.id, body.notificationIds)
        ));
      
      return NextResponse.json({
        success: true,
        message: `${body.notificationIds.length} notification(s) marked as read`,
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'No notifications specified' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

