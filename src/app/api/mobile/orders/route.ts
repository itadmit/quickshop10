/**
 * Mobile Orders List API
 * GET /api/mobile/orders
 * 
 * Returns paginated list of orders for the store
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { eq, and, desc, asc, like, or, sql, isNull, isNotNull } from 'drizzle-orm';
import { requireMobileAuthWithStore } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const status = searchParams.get('status');
    const fulfillmentStatus = searchParams.get('fulfillmentStatus');
    const search = searchParams.get('search');
    const archived = searchParams.get('archived') === 'true';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [eq(orders.storeId, auth.store.id)];
    
    // Archive filter
    if (archived) {
      conditions.push(isNotNull(orders.archivedAt));
    } else {
      conditions.push(isNull(orders.archivedAt));
    }
    
    // Status filters
    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status as typeof orders.status.enumValues[number]));
    }
    
    if (fulfillmentStatus && fulfillmentStatus !== 'all') {
      conditions.push(eq(orders.fulfillmentStatus, fulfillmentStatus as typeof orders.fulfillmentStatus.enumValues[number]));
    }
    
    // Search
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.customerEmail, `%${search}%`),
          like(orders.customerName, `%${search}%`),
          like(orders.customerPhone, `%${search}%`)
        )!
      );
    }
    
    // Date filters
    if (dateFrom) {
      conditions.push(sql`${orders.createdAt} >= ${new Date(dateFrom)}`);
    }
    if (dateTo) {
      conditions.push(sql`${orders.createdAt} <= ${new Date(dateTo)}`);
    }
    
    // Sort
    const orderByColumn = sortBy === 'total' ? orders.total : orders.createdAt;
    const orderDirection = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);
    
    // Get orders with item count
    const ordersData = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        financialStatus: orders.financialStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        shippingAmount: orders.shippingAmount,
        total: orders.total,
        currency: orders.currency,
        customerEmail: orders.customerEmail,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        isRead: orders.isRead,
        createdAt: orders.createdAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`,
      })
      .from(orders)
      .where(and(...conditions))
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions));
    
    // Get stats
    const [stats] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')`,
        processing: sql<number>`count(*) filter (where ${orders.status} = 'processing')`,
        shipped: sql<number>`count(*) filter (where ${orders.fulfillmentStatus} = 'fulfilled')`,
        delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')`,
        cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')`,
        unread: sql<number>`count(*) filter (where ${orders.isRead} = false)`,
      })
      .from(orders)
      .where(and(eq(orders.storeId, auth.store.id), isNull(orders.archivedAt)));
    
    return NextResponse.json({
      success: true,
      orders: ordersData.map(o => ({
        ...o,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount),
        shippingAmount: Number(o.shippingAmount),
        total: Number(o.total),
        itemCount: Number(o.itemCount),
      })),
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
      stats: {
        pending: Number(stats?.pending || 0),
        processing: Number(stats?.processing || 0),
        shipped: Number(stats?.shipped || 0),
        delivered: Number(stats?.delivered || 0),
        cancelled: Number(stats?.cancelled || 0),
        unread: Number(stats?.unread || 0),
      },
    });
    
  } catch (error) {
    console.error('Mobile orders list error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message === 'Store access required') {
      return NextResponse.json(
        { success: false, error: 'Store access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

