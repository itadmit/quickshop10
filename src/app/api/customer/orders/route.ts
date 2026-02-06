/**
 * Customer Orders History API
 * GET /api/customer/orders
 * 
 * Returns order history for authenticated customer
 * Requires customer authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated customer
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status'); // pending, processing, shipped, delivered, cancelled
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [
      eq(orders.customerId, customer.id),
      isNull(orders.archivedAt), // Don't show archived orders
    ];
    
    // Filter by status if provided
    if (status) {
      conditions.push(eq(orders.status, status as typeof orders.status.enumValues[number]));
    }
    
    // Get orders
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
        taxAmount: orders.taxAmount,
        creditUsed: orders.creditUsed,
        total: orders.total,
        currency: orders.currency,
        discountCode: orders.discountCode,
        discountDetails: orders.discountDetails,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions));
    
    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get order items count for each order (batch query)
    const orderIds = ordersData.map(o => o.id);
    const itemCounts = orderIds.length > 0
      ? await db
          .select({
            orderId: orderItems.orderId,
            itemCount: sql<number>`count(*)`.as('itemCount'),
            totalQuantity: sql<number>`sum(${orderItems.quantity})`.as('totalQuantity'),
          })
          .from(orderItems)
          .where(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(orderItems.orderId)
      : [];
    
    const itemCountMap = new Map(itemCounts.map(ic => [ic.orderId, { count: Number(ic.itemCount), quantity: Number(ic.totalQuantity) }]));
    
    // Format response
    const formattedOrders = ordersData.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      financialStatus: order.financialStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingAmount: Number(order.shippingAmount),
      taxAmount: Number(order.taxAmount),
      creditUsed: Number(order.creditUsed),
      total: Number(order.total),
      currency: order.currency,
      discountCode: order.discountCode,
      discountDetails: order.discountDetails,
      itemCount: itemCountMap.get(order.id)?.count || 0,
      totalQuantity: itemCountMap.get(order.id)?.quantity || 0,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
    
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת ההזמנות' },
      { status: 500 }
    );
  }
}
