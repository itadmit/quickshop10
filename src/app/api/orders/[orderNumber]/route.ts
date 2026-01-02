/**
 * Get Order API
 * GET /api/orders/[orderNumber]?storeSlug=xxx
 * 
 * Retrieves order details (limited info for thank-you page)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    orderNumber: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderNumber } = await params;
    const storeSlug = request.nextUrl.searchParams.get('storeSlug');
    
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Order number required' },
        { status: 400 }
      );
    }
    
    // Build query conditions
    let storeId: string | null = null;
    
    if (storeSlug) {
      const [store] = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.slug, storeSlug))
        .limit(1);
      
      if (store) {
        storeId = store.id;
      }
    }
    
    // Get order
    const conditions = storeId
      ? and(eq(orders.orderNumber, orderNumber), eq(orders.storeId, storeId))
      : eq(orders.orderNumber, orderNumber);
    
    const [order] = await db
      .select()
      .from(orders)
      .where(conditions)
      .limit(1);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    
    // Return limited order info (safe for public display)
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        financialStatus: order.financialStatus,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        total: order.total,
        currency: order.currency,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        discountCode: order.discountCode,
        createdAt: order.createdAt,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          sku: item.sku,
          variantTitle: item.variantTitle,
          imageUrl: item.imageUrl,
        })),
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

