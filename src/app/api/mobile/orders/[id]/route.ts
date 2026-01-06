/**
 * Mobile Order Detail API
 * GET /api/mobile/orders/[id]
 * PATCH /api/mobile/orders/[id] - Update order status
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, customers, paymentTransactions, products, productImages } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireMobileAuthWithStore, hasPermission } from '@/lib/mobile-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/mobile/orders/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireMobileAuthWithStore(request);
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
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Get order items with product images
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        name: orderItems.name,
        variantTitle: orderItems.variantTitle,
        sku: orderItems.sku,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        imageUrl: orderItems.imageUrl,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    
    // Get product images for items without imageUrl
    const itemsWithImages = await Promise.all(
      items.map(async (item) => {
        if (item.imageUrl || !item.productId) return item;
        
        const [image] = await db
          .select({ url: productImages.url })
          .from(productImages)
          .where(eq(productImages.productId, item.productId))
          .orderBy(productImages.sortOrder)
          .limit(1);
        
        return { ...item, imageUrl: image?.url || null };
      })
    );
    
    // Get customer if exists
    let customer = null;
    if (order.customerId) {
      const [c] = await db
        .select({
          id: customers.id,
          email: customers.email,
          firstName: customers.firstName,
          lastName: customers.lastName,
          phone: customers.phone,
          totalOrders: customers.totalOrders,
          totalSpent: customers.totalSpent,
          creditBalance: customers.creditBalance,
        })
        .from(customers)
        .where(eq(customers.id, order.customerId))
        .limit(1);
      customer = c || null;
    }
    
    // Get transactions
    const transactions = await db
      .select({
        id: paymentTransactions.id,
        type: paymentTransactions.type,
        status: paymentTransactions.status,
        amount: paymentTransactions.amount,
        provider: paymentTransactions.provider,
        createdAt: paymentTransactions.createdAt,
      })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.orderId, order.id))
      .orderBy(desc(paymentTransactions.createdAt));
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        financialStatus: order.financialStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        subtotal: Number(order.subtotal),
        discountCode: order.discountCode,
        discountAmount: Number(order.discountAmount),
        shippingAmount: Number(order.shippingAmount),
        taxAmount: Number(order.taxAmount),
        creditUsed: Number(order.creditUsed),
        total: Number(order.total),
        currency: order.currency,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        note: order.note,
        internalNote: order.internalNote,
        isRead: order.isRead,
        archivedAt: order.archivedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      items: itemsWithImages.map(item => ({
        ...item,
        price: Number(item.price),
        total: Number(item.total),
      })),
      customer: customer ? {
        ...customer,
        totalSpent: Number(customer.totalSpent),
        creditBalance: Number(customer.creditBalance),
      } : null,
      transactions: transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
      })),
    });
    
  } catch (error) {
    console.error('Mobile order detail error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/mobile/orders/[id] - Update order
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireMobileAuthWithStore(request);
    const { id } = await params;
    const body = await request.json();
    
    // Check permission
    if (!hasPermission(auth, 'orders.update')) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Verify order exists and belongs to store
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, id),
        eq(orders.storeId, auth.store.id)
      ))
      .limit(1);
    
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    
    if (body.fulfillmentStatus !== undefined) {
      updateData.fulfillmentStatus = body.fulfillmentStatus;
    }
    
    if (body.internalNote !== undefined) {
      updateData.internalNote = body.internalNote;
    }
    
    // Update order
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    // TODO: Send notification to customer if body.notifyCustomer is true
    
    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        fulfillmentStatus: updatedOrder.fulfillmentStatus,
        updatedAt: updatedOrder.updatedAt,
      },
    });
    
  } catch (error) {
    console.error('Mobile order update error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

