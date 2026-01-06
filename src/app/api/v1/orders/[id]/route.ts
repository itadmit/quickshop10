/**
 * Public API v1 - Single Order
 * GET /api/v1/orders/{id} - Get order details
 * PATCH /api/v1/orders/{id} - Update order
 * 
 * Requires: X-API-Key header
 * Scopes: orders:read, orders:write
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireApiAuth, apiSuccess, apiError, logApiRequest, hasScope } from '@/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/orders/{id}
export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'orders:read');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { id } = await params;
    
    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, id),
        eq(orders.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!order) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Order not found', 404);
    }
    
    // Get order items
    const items = await db
      .select({
        id: orderItems.id,
        product_id: orderItems.productId,
        variant_id: orderItems.variantId,
        name: orderItems.name,
        variant_title: orderItems.variantTitle,
        sku: orderItems.sku,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        image_url: orderItems.imageUrl,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      financial_status: order.financialStatus,
      fulfillment_status: order.fulfillmentStatus,
      subtotal: Number(order.subtotal),
      discount_code: order.discountCode,
      discount_amount: Number(order.discountAmount),
      shipping_amount: Number(order.shippingAmount),
      tax_amount: Number(order.taxAmount),
      credit_used: Number(order.creditUsed),
      total: Number(order.total),
      currency: order.currency,
      customer_id: order.customerId,
      customer_email: order.customerEmail,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      shipping_address: order.shippingAddress,
      billing_address: order.billingAddress,
      shipping_method: order.shippingMethod,
      payment_method: order.paymentMethod,
      note: order.note,
      internal_note: order.internalNote,
      paid_at: order.paidAt,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      line_items: items.map(item => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
      })),
    });
    
  } catch (error) {
    console.error('API v1 order detail error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to fetch order', 500);
  }
}

// PATCH /api/v1/orders/{id}
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
  const result = await requireApiAuth(request, 'orders:write');
  if ('error' in result) return result.error;
  const { auth } = result;
  
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Verify order exists
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, id),
        eq(orders.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!existingOrder) {
      await logApiRequest(auth.apiKey.id, auth.store.id, request, 404, Date.now() - startTime);
      return apiError('not_found', 'Order not found', 404);
    }
    
    // Build update - only allow specific fields
    const allowedFields = ['status', 'fulfillment_status', 'note', 'internal_note'];
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.fulfillment_status !== undefined) {
      updateData.fulfillmentStatus = body.fulfillment_status;
    }
    if (body.note !== undefined) {
      updateData.note = body.note;
    }
    if (body.internal_note !== undefined) {
      updateData.internalNote = body.internal_note;
    }
    
    // Update order
    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 200, Date.now() - startTime);
    
    return apiSuccess({
      id: updated.id,
      order_number: updated.orderNumber,
      status: updated.status,
      fulfillment_status: updated.fulfillmentStatus,
      note: updated.note,
      internal_note: updated.internalNote,
      updated_at: updated.updatedAt,
    });
    
  } catch (error) {
    console.error('API v1 order update error:', error);
    await logApiRequest(auth.apiKey.id, auth.store.id, request, 500, Date.now() - startTime, String(error));
    return apiError('internal_error', 'Failed to update order', 500);
  }
}

