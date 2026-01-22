/**
 * PayPal Capture API
 * POST /api/payments/paypal/capture
 * 
 * Called after customer approves payment on PayPal.
 * PayPal flow:
 * 1. Create Order → Get approval URL
 * 2. Customer approves on PayPal
 * 3. Customer redirected back with token (order ID) and PayerID
 * 4. THIS ENDPOINT: Capture the order to complete payment
 * 
 * This is different from other providers that capture automatically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pendingPayments, paymentTransactions, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { PayPalProvider } from '@/lib/payments/providers/paypal';
import type { PaymentProviderConfig } from '@/lib/payments/types';

interface CaptureRequest {
  storeSlug: string;
  orderId: string; // PayPal order ID (token from redirect)
  payerId?: string; // PayPal payer ID (from redirect)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CaptureRequest;
    
    // Validate required fields
    if (!body.storeSlug) {
      return NextResponse.json(
        { success: false, error: 'Store slug is required' },
        { status: 400 }
      );
    }
    
    if (!body.orderId) {
      return NextResponse.json(
        { success: false, error: 'PayPal order ID is required' },
        { status: 400 }
      );
    }
    
    console.log('[PayPal Capture] Processing:', {
      storeSlug: body.storeSlug,
      orderId: body.orderId,
      payerId: body.payerId,
    });
    
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
    
    // Get PayPal provider config
    const [providerConfig] = await db
      .select()
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.provider, 'paypal'),
          eq(paymentProviders.isActive, true)
        )
      )
      .limit(1);
    
    if (!providerConfig) {
      return NextResponse.json(
        { success: false, error: 'PayPal not configured for this store' },
        { status: 400 }
      );
    }
    
    // Create PayPal provider instance
    const provider = new PayPalProvider();
    provider.configure({
      provider: 'paypal',
      credentials: providerConfig.credentials as Record<string, string>,
      settings: providerConfig.settings as Record<string, unknown>,
      isActive: providerConfig.isActive,
      testMode: providerConfig.testMode,
    });
    
    // First, check order status
    const orderDetails = await provider.getOrderDetails(body.orderId);
    
    if (!orderDetails) {
      return NextResponse.json(
        { success: false, error: 'PayPal order not found' },
        { status: 404 }
      );
    }
    
    console.log('[PayPal Capture] Order status:', orderDetails.status);
    
    // If already captured, return success
    if (orderDetails.status === 'COMPLETED') {
      console.log('[PayPal Capture] Order already captured');
      return NextResponse.json({
        success: true,
        alreadyCaptured: true,
        orderId: body.orderId,
        status: 'COMPLETED',
      });
    }
    
    // If not approved, customer needs to approve first
    if (orderDetails.status !== 'APPROVED') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Order not approved for capture. Status: ${orderDetails.status}`,
          status: orderDetails.status,
        },
        { status: 400 }
      );
    }
    
    // Capture the order
    const captureResult = await provider.captureOrder(body.orderId);
    
    console.log('[PayPal Capture] Capture result:', {
      success: captureResult.success,
      captureId: captureResult.captureId,
      status: captureResult.status,
      errorCode: captureResult.errorCode,
    });
    
    if (!captureResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: captureResult.errorMessage || 'Capture failed',
          errorCode: captureResult.errorCode,
        },
        { status: 400 }
      );
    }
    
    // Find pending payment by PayPal order ID (stored as providerRequestId)
    const [pendingPayment] = await db
      .select()
      .from(pendingPayments)
      .where(
        and(
          eq(pendingPayments.storeId, store.id),
          eq(pendingPayments.provider, 'paypal'),
          eq(pendingPayments.providerRequestId, body.orderId)
        )
      )
      .limit(1);
    
    if (pendingPayment) {
      // Update pending payment status
      // Note: pendingPayments doesn't have providerTransactionId, 
      // so we store capture details in orderData
      const updatedOrderData = {
        ...(pendingPayment.orderData as Record<string, unknown>),
        paypalCaptureId: captureResult.captureId,
        paypalTransactionId: captureResult.transactionId,
      };
      
      await db
        .update(pendingPayments)
        .set({
          status: 'captured',
          orderData: updatedOrderData,
        })
        .where(eq(pendingPayments.id, pendingPayment.id));
      
      console.log('[PayPal Capture] Updated pending payment:', pendingPayment.id);
    }
    
    // Log transaction
    await db.insert(paymentTransactions).values({
      storeId: store.id,
      provider: 'paypal',
      providerId: providerConfig.id,
      type: 'charge',
      status: 'success',
      amount: captureResult.amount?.toString() || '0',
      currency: captureResult.currency || 'ILS',
      providerTransactionId: captureResult.captureId,
      providerRequestId: body.orderId,
      metadata: {
        payerId: body.payerId,
        captureId: captureResult.captureId,
        pendingPaymentId: pendingPayment?.id,
      },
      processedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      orderId: body.orderId,
      captureId: captureResult.captureId,
      transactionId: captureResult.transactionId,
      amount: captureResult.amount,
      currency: captureResult.currency,
      status: captureResult.status,
    });
    
  } catch (error) {
    console.error('[PayPal Capture] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

