'use server';

import { db } from '@/lib/db';
import { orders, stores, paymentTransactions, shippingProviders, shipments } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getConfiguredProvider } from '@/lib/payments';
import type { PaymentProviderType } from '@/lib/payments/types';
import { getConfiguredShippingProvider } from '@/lib/shipping/factory';
import type { CreateShipmentRequest, ShipmentAddress, ShipmentPackage } from '@/lib/shipping/types';

export async function fulfillOrder(orderId: string, storeSlug: string) {
  await db
    .update(orders)
    .set({ 
      fulfillmentStatus: 'fulfilled',
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/shops/${storeSlug}/admin/orders/${orderId}`);
  revalidatePath(`/shops/${storeSlug}/admin/orders`);
  
  return { success: true };
}

export async function updateOrderNote(orderId: string, note: string, storeSlug: string) {
  await db
    .update(orders)
    .set({ 
      internalNote: note,
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/shops/${storeSlug}/admin/orders/${orderId}`);
  
  return { success: true };
}

export async function cancelOrder(orderId: string, storeSlug: string) {
  await db
    .update(orders)
    .set({ 
      status: 'cancelled',
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/shops/${storeSlug}/admin/orders/${orderId}`);
  revalidatePath(`/shops/${storeSlug}/admin/orders`);
  
  return { success: true };
}

export async function markOrderAsRead(orderId: string, storeSlug: string) {
  await db
    .update(orders)
    .set({ 
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/shops/${storeSlug}/admin/orders/${orderId}`);
  revalidatePath(`/shops/${storeSlug}/admin/orders`);
  
  return { success: true };
}

/**
 * Get shipment info for an order (returns the most recent shipment)
 */
export async function getOrderShipment(orderId: string) {
  try {
    const [shipment] = await db
      .select({
        id: shipments.id,
        trackingNumber: shipments.trackingNumber,
        labelUrl: shipments.labelUrl,
        status: shipments.status,
        provider: shipments.provider,
        createdAt: shipments.createdAt,
      })
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .orderBy(desc(shipments.createdAt)) // Get most recent shipment
      .limit(1);
    
    return shipment || null;
  } catch {
    return null;
  }
}

export async function refundOrder(orderId: string, storeSlug: string) {
  // Get order details
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  
  if (!order) {
    return { success: false, error: 'Order not found' };
  }
  
  // Check if order can be refunded
  if (order.financialStatus !== 'paid' && order.financialStatus !== 'partially_refunded') {
    return { success: false, error: 'Order cannot be refunded' };
  }
  
  // Get store
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, storeSlug))
    .limit(1);
  
  if (!store) {
    return { success: false, error: 'Store not found' };
  }
  
  // Check if there's a successful payment transaction
  const [transaction] = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.orderId, orderId),
        eq(paymentTransactions.type, 'charge'),
        eq(paymentTransactions.status, 'success')
      )
    )
    .limit(1);
  
  // If there's a real payment, process refund through provider
  if (transaction && transaction.providerTransactionId) {
    const provider = await getConfiguredProvider(store.id, transaction.provider as PaymentProviderType);
    
    if (provider) {
      const refundResult = await provider.refund({
        storeId: store.id,
        transactionId: transaction.id,
        providerTransactionId: transaction.providerTransactionId,
        amount: Number(order.total),
        reason: 'Admin refund',
        orderId: orderId,
      });
      
      if (!refundResult.success) {
        return { success: false, error: refundResult.errorMessage || 'Refund failed' };
      }
      
      // Create refund transaction record
      await db.insert(paymentTransactions).values({
        storeId: store.id,
        orderId: orderId,
        customerId: order.customerId,
        provider: transaction.provider,
        type: 'refund',
        status: 'success',
        amount: String(order.total),
        currency: order.currency,
        providerTransactionId: refundResult.providerTransactionId,
        parentTransactionId: transaction.id,
        providerResponse: refundResult.providerResponse,
        processedAt: new Date(),
      });
    }
  }
  
  // Update order status
  await db
    .update(orders)
    .set({ 
      financialStatus: 'refunded',
      status: 'refunded',
      updatedAt: new Date()
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/shops/${storeSlug}/admin/orders/${orderId}`);
  revalidatePath(`/shops/${storeSlug}/admin/orders`);
  
  return { success: true };
}

/**
 * Send/Resend shipment to shipping provider
 */
export async function sendShipment(orderId: string, storeSlug: string) {
  try {
    // Get order details
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        storeId: orders.storeId,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    
    if (!order) {
      return { success: false, error: 'הזמנה לא נמצאה' };
    }
    
    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, order.storeId))
      .limit(1);
    
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }
    
    // Find default shipping provider
    const [providerConfig] = await db
      .select()
      .from(shippingProviders)
      .where(
        and(
          eq(shippingProviders.storeId, order.storeId),
          eq(shippingProviders.isActive, true),
          eq(shippingProviders.isDefault, true)
        )
      )
      .limit(1);
    
    if (!providerConfig) {
      return { success: false, error: 'לא מוגדר ספק משלוחים ברירת מחדל' };
    }
    
    const settings = providerConfig.settings as Record<string, unknown>;
    
    // Get provider instance
    const provider = await getConfiguredShippingProvider(order.storeId, providerConfig.provider);
    
    if (!provider) {
      return { success: false, error: `ספק ${providerConfig.provider} לא זמין` };
    }
    
    // Build recipient address
    const shippingAddr = (order.shippingAddress || {}) as Record<string, string>;
    const recipient: ShipmentAddress = {
      name: `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim() || order.customerName || '',
      phone: shippingAddr.phone || order.customerPhone || '',
      email: order.customerEmail || undefined,
      street: shippingAddr.address || shippingAddr.street || '',
      city: shippingAddr.city || '',
      zipCode: shippingAddr.zipCode,
      apartment: shippingAddr.apartment,
      floor: shippingAddr.floor,
      entrance: shippingAddr.entrance,
      notes: shippingAddr.notes,
    };
    
    // Build sender address from settings
    const sender: ShipmentAddress = {
      name: (settings.senderName as string) || store.name,
      phone: (settings.senderPhone as string) || '',
      street: (settings.senderStreet as string) || '',
      city: (settings.senderCity as string) || '',
      zipCode: (settings.senderZipCode as string) || undefined,
    };
    
    // Default package
    const pkg: ShipmentPackage = {
      weight: (settings.defaultWeight as number) || 1,
      width: (settings.defaultWidth as number) || 20,
      height: (settings.defaultHeight as number) || 20,
      length: (settings.defaultLength as number) || 20,
      quantity: 1,
    };
    
    // Build request
    const request: CreateShipmentRequest = {
      storeId: order.storeId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipient,
      sender,
      package: pkg,
    };
    
    console.log(`[SendShipment] Creating shipment for order ${order.orderNumber}`);
    
    // Create shipment via provider
    const response = await provider.createShipment(request);
    
    if (!response.success) {
      console.error(`[SendShipment] Failed - ${response.errorMessage}`);
      return {
        success: false,
        error: response.errorMessage || 'שגיאה ביצירת המשלוח',
      };
    }
    
    // Save shipment to database
    const [shipment] = await db.insert(shipments).values({
      storeId: order.storeId,
      orderId: order.id,
      provider: providerConfig.provider,
      providerShipmentId: response.providerShipmentId,
      trackingNumber: response.trackingNumber,
      status: 'created',
      statusDescription: 'נשלח ידנית',
      labelUrl: response.labelUrl,
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      recipientAddress: recipient,
      estimatedDelivery: response.estimatedDelivery,
      providerResponse: response.providerResponse,
    }).returning();
    
    // Update order fulfillment status and clear any previous error
    await db
      .update(orders)
      .set({
        fulfillmentStatus: 'fulfilled',
        shipmentError: null,
        shipmentErrorAt: null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    
    console.log(`[SendShipment] Success - ${response.trackingNumber}`);
    
    revalidatePath(`/shops/${storeSlug}/admin/orders/${orderId}`);
    revalidatePath(`/shops/${storeSlug}/admin/orders`);
    
    return {
      success: true,
      trackingNumber: response.trackingNumber,
      labelUrl: response.labelUrl,
      shipmentId: shipment.id,
    };
    
  } catch (error) {
    console.error('[SendShipment] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה לא צפויה',
    };
  }
}

