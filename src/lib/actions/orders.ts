'use server';

import { db } from '@/lib/db';
import { orders, stores, paymentTransactions, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getConfiguredProvider } from '@/lib/payments';
import type { PaymentProviderType } from '@/lib/payments/types';

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

