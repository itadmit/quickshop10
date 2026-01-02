/**
 * Payment Refund API
 * POST /api/payments/refund
 * 
 * Processes refunds through the original payment provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  stores, 
  orders, 
  paymentTransactions,
  refunds,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { getConfiguredProvider } from '@/lib/payments';
import type { PaymentProviderType } from '@/lib/payments/types';

interface RefundBody {
  storeSlug: string;
  orderId: string;
  amount: number;
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check auth - only store owners/managers can refund
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json() as RefundBody;
    
    // Validate
    if (!body.storeSlug || !body.orderId || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, body.storeSlug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, body.orderId),
          eq(orders.storeId, store.id)
        )
      )
      .limit(1);
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if order is paid
    if (order.financialStatus !== 'paid' && order.financialStatus !== 'partially_refunded') {
      return NextResponse.json(
        { success: false, error: 'Order is not in a refundable state' },
        { status: 400 }
      );
    }
    
    // Get payment details
    const paymentDetails = order.paymentDetails as {
      provider?: PaymentProviderType;
      transactionId?: string;
    } | null;
    
    if (!paymentDetails?.transactionId) {
      return NextResponse.json(
        { success: false, error: 'No transaction found for this order' },
        { status: 400 }
      );
    }
    
    // Get the original transaction
    const [originalTransaction] = await db
      .select()
      .from(paymentTransactions)
      .where(
        and(
          eq(paymentTransactions.orderId, order.id),
          eq(paymentTransactions.type, 'charge'),
          eq(paymentTransactions.status, 'success')
        )
      )
      .limit(1);
    
    if (!originalTransaction) {
      return NextResponse.json(
        { success: false, error: 'Original transaction not found' },
        { status: 400 }
      );
    }
    
    // Validate refund amount
    const maxRefundable = Number(order.total);
    if (body.amount > maxRefundable) {
      return NextResponse.json(
        { success: false, error: `Maximum refundable amount is ${maxRefundable}` },
        { status: 400 }
      );
    }
    
    // Get provider
    const providerType = paymentDetails.provider || originalTransaction.provider;
    const provider = await getConfiguredProvider(store.id, providerType);
    
    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Payment provider not configured' },
        { status: 400 }
      );
    }
    
    // Create refund transaction record (pending)
    const [refundTransaction] = await db.insert(paymentTransactions).values({
      storeId: store.id,
      orderId: order.id,
      customerId: order.customerId,
      provider: providerType,
      type: 'refund',
      status: 'processing',
      amount: String(body.amount),
      currency: order.currency,
      parentTransactionId: originalTransaction.id,
      metadata: {
        reason: body.reason,
        originalTransactionId: originalTransaction.providerTransactionId,
      },
    }).returning();
    
    // Process refund with provider
    const refundResponse = await provider.refund({
      storeId: store.id,
      transactionId: refundTransaction.id,
      providerTransactionId: originalTransaction.providerTransactionId!,
      amount: body.amount,
      reason: body.reason,
      orderId: order.id,
    });
    
    if (!refundResponse.success) {
      // Update transaction as failed
      await db
        .update(paymentTransactions)
        .set({
          status: 'failed',
          errorCode: refundResponse.errorCode,
          errorMessage: refundResponse.errorMessage,
          providerResponse: refundResponse.providerResponse,
          processedAt: new Date(),
        })
        .where(eq(paymentTransactions.id, refundTransaction.id));
      
      return NextResponse.json(
        { 
          success: false, 
          error: refundResponse.errorMessage || 'Refund failed',
          errorCode: refundResponse.errorCode,
        },
        { status: 400 }
      );
    }
    
    // Update transaction as successful
    await db
      .update(paymentTransactions)
      .set({
        status: 'success',
        providerTransactionId: refundResponse.providerTransactionId,
        providerResponse: refundResponse.providerResponse,
        processedAt: new Date(),
      })
      .where(eq(paymentTransactions.id, refundTransaction.id));
    
    // Create refund record
    const [refundRecord] = await db.insert(refunds).values({
      storeId: store.id,
      orderId: order.id,
      customerId: order.customerId,
      amount: String(body.amount),
      reason: body.reason || 'Customer request',
      status: 'completed',
      processedById: user.id,
      processedAt: new Date(),
    }).returning();
    
    // Update order financial status
    const totalRefunded = Number(order.total) - body.amount;
    const newFinancialStatus = body.amount >= Number(order.total) 
      ? 'refunded' 
      : 'partially_refunded';
    
    await db
      .update(orders)
      .set({
        financialStatus: newFinancialStatus,
        ...(newFinancialStatus === 'refunded' && { status: 'refunded' }),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
    
    return NextResponse.json({
      success: true,
      refundId: refundRecord.id,
      refundedAmount: body.amount,
      newFinancialStatus,
      providerTransactionId: refundResponse.providerTransactionId,
    });
    
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

