/**
 * Customer Single Order Details API
 * GET /api/customer/orders/[orderNumber]
 * 
 * Returns full order details for authenticated customer
 * Authorization: Customer can only access their own orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, shipments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentCustomer } from '@/lib/customer-auth';

interface RouteParams {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Get authenticated customer
    const customer = await getCurrentCustomer();
    
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'נדרש אימות' },
        { status: 401 }
      );
    }
    
    const { orderNumber } = await params;
    
    // Get order - ensure it belongs to the authenticated customer
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        financialStatus: orders.financialStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        subtotal: orders.subtotal,
        discountCode: orders.discountCode,
        discountAmount: orders.discountAmount,
        discountDetails: orders.discountDetails,
        creditUsed: orders.creditUsed,
        shippingAmount: orders.shippingAmount,
        taxAmount: orders.taxAmount,
        total: orders.total,
        currency: orders.currency,
        customerEmail: orders.customerEmail,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        shippingMethod: orders.shippingMethod,
        paymentMethod: orders.paymentMethod,
        note: orders.note,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(
        eq(orders.orderNumber, orderNumber),
        eq(orders.customerId, customer.id) // Authorization: only customer's own orders
      ))
      .limit(1);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'ההזמנה לא נמצאה' },
        { status: 404 }
      );
    }
    
    // Get order items
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
        properties: orderItems.properties,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    
    // Get shipment info (tracking) from shipments table
    const [shipment] = await db
      .select({
        trackingNumber: shipments.trackingNumber,
        status: shipments.status,
        labelUrl: shipments.labelUrl,
        estimatedDelivery: shipments.estimatedDelivery,
        actualDelivery: shipments.actualDelivery,
        pickedUpAt: shipments.pickedUpAt,
      })
      .from(shipments)
      .where(eq(shipments.orderId, order.id))
      .orderBy(desc(shipments.createdAt))
      .limit(1);
    
    // Format response
    const response = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      financialStatus: order.financialStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      
      // Pricing
      subtotal: Number(order.subtotal),
      discountCode: order.discountCode,
      discountAmount: Number(order.discountAmount),
      discountDetails: order.discountDetails,
      creditUsed: Number(order.creditUsed),
      shippingAmount: Number(order.shippingAmount),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
      currency: order.currency,
      
      // Customer info
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      
      // Addresses
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      
      // Shipping & Payment
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
      
      // Tracking info (from shipments table)
      tracking: shipment ? {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        labelUrl: shipment.labelUrl,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
        pickedUpAt: shipment.pickedUpAt,
      } : null,
      
      // Note
      note: order.note,
      
      // Timestamps
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      
      // Items
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        variantTitle: item.variantTitle,
        sku: item.sku,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
        imageUrl: item.imageUrl,
        properties: item.properties, // Addons, customizations
      })),
    };
    
    return NextResponse.json({
      success: true,
      data: response,
    });
    
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת פרטי ההזמנה' },
      { status: 500 }
    );
  }
}
