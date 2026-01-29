'use server';

import { db } from '@/lib/db';
import { returnRequests, orders, orderItems, customers, stores } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { cache } from 'react';

// Get return requests for a customer
export const getCustomerReturnRequests = cache(async (customerId: string, storeId: string) => {
  return db
    .select({
      id: returnRequests.id,
      requestNumber: returnRequests.requestNumber,
      type: returnRequests.type,
      status: returnRequests.status,
      reason: returnRequests.reason,
      requestedResolution: returnRequests.requestedResolution,
      finalResolution: returnRequests.finalResolution,
      totalValue: returnRequests.totalValue,
      refundAmount: returnRequests.refundAmount,
      creditIssued: returnRequests.creditIssued,
      items: returnRequests.items,
      customerNotes: returnRequests.customerNotes,
      createdAt: returnRequests.createdAt,
      updatedAt: returnRequests.updatedAt,
      orderNumber: orders.orderNumber,
      orderId: orders.id,
    })
    .from(returnRequests)
    .innerJoin(orders, eq(returnRequests.orderId, orders.id))
    .where(
      and(
        eq(returnRequests.customerId, customerId),
        eq(returnRequests.storeId, storeId)
      )
    )
    .orderBy(desc(returnRequests.createdAt));
});

// Get return requests for admin (all store requests)
export const getStoreReturnRequests = cache(async (storeId: string) => {
  return db
    .select({
      id: returnRequests.id,
      requestNumber: returnRequests.requestNumber,
      type: returnRequests.type,
      status: returnRequests.status,
      reason: returnRequests.reason,
      reasonDetails: returnRequests.reasonDetails,
      requestedResolution: returnRequests.requestedResolution,
      finalResolution: returnRequests.finalResolution,
      totalValue: returnRequests.totalValue,
      refundAmount: returnRequests.refundAmount,
      creditIssued: returnRequests.creditIssued,
      items: returnRequests.items,
      images: returnRequests.images,
      internalNotes: returnRequests.internalNotes,
      customerNotes: returnRequests.customerNotes,
      createdAt: returnRequests.createdAt,
      updatedAt: returnRequests.updatedAt,
      processedAt: returnRequests.processedAt,
      orderNumber: orders.orderNumber,
      orderId: orders.id,
      customerName: customers.firstName,
      customerLastName: customers.lastName,
      customerEmail: customers.email,
    })
    .from(returnRequests)
    .innerJoin(orders, eq(returnRequests.orderId, orders.id))
    .leftJoin(customers, eq(returnRequests.customerId, customers.id))
    .where(eq(returnRequests.storeId, storeId))
    .orderBy(desc(returnRequests.createdAt));
});

// Get single return request with full details
export const getReturnRequestById = cache(async (requestId: string, storeId: string) => {
  const [request] = await db
    .select({
      id: returnRequests.id,
      storeId: returnRequests.storeId,
      orderId: returnRequests.orderId,
      customerId: returnRequests.customerId,
      requestNumber: returnRequests.requestNumber,
      type: returnRequests.type,
      status: returnRequests.status,
      reason: returnRequests.reason,
      reasonDetails: returnRequests.reasonDetails,
      requestedResolution: returnRequests.requestedResolution,
      finalResolution: returnRequests.finalResolution,
      resolutionDetails: returnRequests.resolutionDetails,
      totalValue: returnRequests.totalValue,
      refundAmount: returnRequests.refundAmount,
      creditIssued: returnRequests.creditIssued,
      exchangeOrderId: returnRequests.exchangeOrderId,
      items: returnRequests.items,
      images: returnRequests.images,
      returnTrackingNumber: returnRequests.returnTrackingNumber,
      returnCarrier: returnRequests.returnCarrier,
      itemReceivedAt: returnRequests.itemReceivedAt,
      internalNotes: returnRequests.internalNotes,
      customerNotes: returnRequests.customerNotes,
      processedAt: returnRequests.processedAt,
      createdAt: returnRequests.createdAt,
      updatedAt: returnRequests.updatedAt,
      orderNumber: orders.orderNumber,
      orderTotal: orders.total,
      orderCreatedAt: orders.createdAt,
      customerName: customers.firstName,
      customerLastName: customers.lastName,
      customerEmail: customers.email,
      customerPhone: customers.phone,
    })
    .from(returnRequests)
    .innerJoin(orders, eq(returnRequests.orderId, orders.id))
    .leftJoin(customers, eq(returnRequests.customerId, customers.id))
    .where(
      and(
        eq(returnRequests.id, requestId),
        eq(returnRequests.storeId, storeId)
      )
    )
    .limit(1);

  if (!request) return null;

  // Get order items
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, request.orderId));

  return { ...request, orderItems: items };
});

// Generate unique request number
export async function generateReturnRequestNumber(storeId: string): Promise<string> {
  const [lastRequest] = await db
    .select({ requestNumber: returnRequests.requestNumber })
    .from(returnRequests)
    .where(eq(returnRequests.storeId, storeId))
    .orderBy(desc(returnRequests.createdAt))
    .limit(1);

  if (!lastRequest) {
    return 'R1001';
  }

  // Extract number from last request number (R1001 -> 1001)
  const match = lastRequest.requestNumber.match(/R(\d+)/);
  if (!match) {
    return 'R1001';
  }

  const lastNumber = parseInt(match[1], 10);
  return `R${lastNumber + 1}`;
}

// Check if order is eligible for return (within policy period)
export async function isOrderEligibleForReturn(orderId: string, storeId: string): Promise<{ eligible: boolean; reason?: string }> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
    .limit(1);

  if (!order) {
    return { eligible: false, reason: 'הזמנה לא נמצאה' };
  }

  // Check if order is delivered or shipped
  if (!['delivered', 'shipped', 'confirmed', 'processing'].includes(order.status)) {
    return { eligible: false, reason: 'לא ניתן להגיש בקשת החזרה להזמנה זו' };
  }

  // Get store settings for return policy days
  const [store] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  const settings = (store?.settings || {}) as Record<string, unknown>;
  const returnPolicyDays = (settings.returnPolicyDays as number) || 14; // Default 14 days

  // Check if within return window
  const orderDate = new Date(order.createdAt);
  const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceOrder > returnPolicyDays) {
    return { eligible: false, reason: `חלפו ${returnPolicyDays} ימים מאז ההזמנה. לא ניתן להגיש בקשת החזרה.` };
  }

  return { eligible: true };
}









