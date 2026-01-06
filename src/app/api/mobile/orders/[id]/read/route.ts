/**
 * Mobile Order Mark as Read API
 * PATCH /api/mobile/orders/[id]/read
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { id } = await params;
    
    // Update order as read
    const [updated] = await db
      .update(orders)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(orders.id, id),
        eq(orders.storeId, auth.store.id)
      ))
      .returning({ id: orders.id, isRead: orders.isRead });
    
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      order: { id: updated.id, isRead: updated.isRead },
    });
    
  } catch (error) {
    console.error('Mark order as read error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to mark order as read' },
      { status: 500 }
    );
  }
}

