/**
 * Public API v1 - Orders
 * GET /api/v1/orders - List orders
 * POST /api/v1/orders - Create order
 * 
 * Requires: X-API-Key header
 * Scopes: orders:read, orders:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, and, desc, asc, sql, isNull, gte, lte, like, or } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest } from '@/lib/api-auth';

// GET /api/v1/orders
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Authenticate
  const result = await requireApiAuth(request, 'orders:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const status = searchParams.get('status');
    const fulfillmentStatus = searchParams.get('fulfillment_status');
    const financialStatus = searchParams.get('financial_status');
    const createdAtMin = searchParams.get('created_at_min');
    const createdAtMax = searchParams.get('created_at_max');
    const updatedAtMin = searchParams.get('updated_at_min');
    const customerId = searchParams.get('customer_id');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    
    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [
      eq(orders.storeId, auth.store.id),
      isNull(orders.archivedAt),
    ];
    
    if (status) {
      conditions.push(eq(orders.status, status as typeof orders.status.enumValues[number]));
    }
    if (fulfillmentStatus) {
      conditions.push(eq(orders.fulfillmentStatus, fulfillmentStatus as typeof orders.fulfillmentStatus.enumValues[number]));
    }
    if (financialStatus) {
      conditions.push(eq(orders.financialStatus, financialStatus as typeof orders.financialStatus.enumValues[number]));
    }
    if (createdAtMin) {
      conditions.push(gte(orders.createdAt, new Date(createdAtMin)));
    }
    if (createdAtMax) {
      conditions.push(lte(orders.createdAt, new Date(createdAtMax)));
    }
    if (updatedAtMin) {
      conditions.push(gte(orders.updatedAt, new Date(updatedAtMin)));
    }
    if (customerId) {
      conditions.push(eq(orders.customerId, customerId));
    }
    
    // Sort
    const orderColumn = sortBy === 'total' ? orders.total : 
                       sortBy === 'updated_at' ? orders.updatedAt : 
                       orders.createdAt;
    const orderDir = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);
    
    // Get orders
    const ordersData = await db
      .select({
        id: orders.id,
        order_number: orders.orderNumber,
        status: orders.status,
        financial_status: orders.financialStatus,
        fulfillment_status: orders.fulfillmentStatus,
        subtotal: orders.subtotal,
        discount_code: orders.discountCode,
        discount_amount: orders.discountAmount,
        shipping_amount: orders.shippingAmount,
        tax_amount: orders.taxAmount,
        total: orders.total,
        currency: orders.currency,
        customer_id: orders.customerId,
        customer_email: orders.customerEmail,
        customer_name: orders.customerName,
        customer_phone: orders.customerPhone,
        shipping_address: orders.shippingAddress,
        billing_address: orders.billingAddress,
        note: orders.note,
        created_at: orders.createdAt,
        updated_at: orders.updatedAt,
      })
      .from(orders)
      .where(and(...conditions))
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...conditions));
    
    // Format response
    const formattedOrders = ordersData.map(o => ({
      ...o,
      subtotal: Number(o.subtotal),
      discount_amount: Number(o.discount_amount),
      shipping_amount: Number(o.shipping_amount),
      tax_amount: Number(o.tax_amount),
      total: Number(o.total),
    }));
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess(formattedOrders, {
      pagination: {
        page,
        limit,
        total: Number(count),
        total_pages: Math.ceil(Number(count) / limit),
        has_next: page * limit < Number(count),
        has_prev: page > 1,
      },
    });
    
  } catch (error) {
    console.error('API v1 orders list error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch orders', 500);
  }
}

