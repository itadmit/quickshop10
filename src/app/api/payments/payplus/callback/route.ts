/**
 * PayPlus Webhook Callback
 * POST /api/payments/payplus/callback
 * 
 * MODULAR DESIGN - This route ONLY handles payment verification
 * All business logic (orders, customers, inventory, etc.) is in the thank-you page
 * 
 * This callback:
 * 1. Validates payment signature (security)
 * 2. Updates transaction status
 * 3. Saves payment details for later use
 * 4. Returns success to PayPlus quickly
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  stores, 
  pendingPayments, 
  paymentTransactions,
  paymentProviders,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getConfiguredProvider } from '@/lib/payments';
import type { TransactionStatus } from '@/lib/payments/types';

export async function POST(request: NextRequest) {
  try {
    // Get store from query param
    const storeSlug = request.nextUrl.searchParams.get('store');
    
    if (!storeSlug) {
      console.error('PayPlus callback: Missing store parameter');
      return NextResponse.json({ success: false, error: 'Missing store' }, { status: 400 });
    }
    
    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);
    
    if (!store) {
      console.error(`PayPlus callback: Store not found: ${storeSlug}`);
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }
    
    // Get provider
    const provider = await getConfiguredProvider(store.id, 'payplus');
    
    if (!provider) {
      console.error(`PayPlus callback: Provider not configured for store: ${storeSlug}`);
      return NextResponse.json({ success: false, error: 'Provider not configured' }, { status: 400 });
    }
    
    // Parse body (PayPlus might send JSON or form data)
    let body: unknown;
    let bodyText = '';
    
    try {
      bodyText = await request.text();
      
      try {
        body = JSON.parse(bodyText);
      } catch {
        // If JSON parsing fails, try URL-encoded form data
        const formData = new URLSearchParams(bodyText);
        const bodyObj: Record<string, unknown> = {};
        formData.forEach((value, key) => {
          bodyObj[key] = value;
        });
        body = bodyObj;
      }
    } catch (error) {
      console.error('PayPlus callback: Failed to parse body', error);
      return NextResponse.json({ success: false, error: 'Invalid body format' }, { status: 400 });
    }
    
    console.log('PayPlus callback received:', JSON.stringify(body, null, 2));
    
    // Get headers for validation
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // SECURITY: Validate webhook signature
    const validation = provider.validateWebhook(body, headers);
    
    if (!validation.isValid) {
      console.error(`PayPlus callback: Invalid signature - ${validation.error}`);
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
      console.warn('PayPlus callback: Skipping signature validation in development');
    }
    
    // Parse callback data
    const parsed = provider.parseCallback(body);
    
    console.log('PayPlus callback parsed:', {
      status: parsed.status,
      success: parsed.success,
      transactionId: parsed.providerTransactionId,
      requestId: parsed.providerRequestId,
      orderReference: parsed.orderReference,
      amount: parsed.amount,
    });
    
    // Find pending payment
    let pendingPayment = null;
    
    if (parsed.providerRequestId) {
      const [found] = await db
        .select()
        .from(pendingPayments)
        .where(
          and(
            eq(pendingPayments.storeId, store.id),
            eq(pendingPayments.providerRequestId, parsed.providerRequestId)
          )
        )
        .limit(1);
      
      pendingPayment = found || null;
    }
    
    // Fallback: try orderReference
    if (!pendingPayment && parsed.orderReference) {
      const allPending = await db
        .select()
        .from(pendingPayments)
        .where(eq(pendingPayments.storeId, store.id))
        .limit(100);
      
      const matchingPayment = allPending.find(p => {
        const orderData = p.orderData as Record<string, unknown>;
        return (orderData as { orderReference?: string })?.orderReference === parsed.orderReference;
      });
      
      if (matchingPayment) {
        pendingPayment = matchingPayment;
      }
    }
    
    if (!pendingPayment) {
      console.error(`PayPlus callback: Pending payment not found`, {
        requestId: parsed.providerRequestId,
        orderReference: parsed.orderReference,
      });
      return NextResponse.json({ success: false, error: 'Pending payment not found' }, { status: 404 });
    }
    
    // Update transaction record
    const transactionStatus: TransactionStatus = parsed.success ? 'success' : 'failed';
    const requestIdToUse = parsed.providerRequestId || pendingPayment.providerRequestId;
    
    if (requestIdToUse) {
      await db
        .update(paymentTransactions)
        .set({
          status: transactionStatus,
          providerTransactionId: parsed.providerTransactionId || undefined,
          providerApprovalNum: parsed.approvalNumber,
          providerResponse: parsed.rawData,
          errorCode: parsed.errorCode,
          errorMessage: parsed.errorMessage,
          processedAt: new Date(),
        })
        .where(
          and(
            eq(paymentTransactions.storeId, store.id),
            eq(paymentTransactions.providerRequestId, requestIdToUse)
          )
        );
    }
    
    if (parsed.success) {
      // SECURITY: Validate amount
      const orderData = pendingPayment.orderData as Record<string, unknown>;
      const cartItems = pendingPayment.cartItems as Array<{ price: number; quantity: number }>;
      const calculatedSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingCost = (orderData.shipping as { cost?: number })?.cost || 0;
      const discountAmount = Number(pendingPayment.discountAmount) || 0;
      const creditUsed = Number((orderData as { creditUsed?: number })?.creditUsed) || 0;
      const calculatedTotal = calculatedSubtotal + shippingCost - discountAmount - creditUsed;
      
      const amountDifference = Math.abs(parsed.amount - calculatedTotal);
      if (amountDifference > 0.01) {
        console.error(`PayPlus callback: Amount mismatch! Expected ${calculatedTotal}, got ${parsed.amount}`);
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ 
            success: false, 
            error: 'Amount mismatch' 
          }, { status: 400 });
        }
      }
      
      // Save payment details to pending payment (for thank-you page to use)
      // Note: We save the payment details but DON'T create the order here
      // Order creation happens in the thank-you page (single source of truth)
      // Save payment details to pendingPayment.orderData for thank-you page to use
      await db
        .update(pendingPayments)
        .set({
          // Store payment info in orderData (pendingPayments doesn't have providerTransactionId field)
          orderData: {
            ...orderData,
            paymentConfirmed: true,
            paymentDetails: {
              transactionId: parsed.providerTransactionId,
              approvalNumber: parsed.approvalNumber,
              cardBrand: parsed.cardBrand,
              cardLastFour: parsed.cardLastFour,
              confirmedAt: new Date().toISOString(),
            },
          },
        })
        .where(eq(pendingPayments.id, pendingPayment.id));
      
      // Update provider stats (non-blocking)
      db.update(paymentProviders)
        .set({
          totalTransactions: sql`${paymentProviders.totalTransactions} + 1`,
          totalVolume: sql`${paymentProviders.totalVolume} + ${parsed.amount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(paymentProviders.storeId, store.id),
            eq(paymentProviders.provider, 'payplus')
          )
        )
        .catch(err => console.error('Failed to update provider stats:', err));
      
      console.log(`PayPlus callback: Payment confirmed for pending payment ${pendingPayment.id}`);
      
      return NextResponse.json({
        success: true,
        message: 'Payment confirmed',
        pendingPaymentId: pendingPayment.id,
      });
      
    } else {
      // Handle failed payment
      await db
        .update(pendingPayments)
        .set({ status: 'failed' })
        .where(eq(pendingPayments.id, pendingPayment.id));
      
      console.log(`PayPlus callback: Payment failed - ${parsed.errorMessage}`);
      
      return NextResponse.json({
        success: true,
        message: 'Payment failure recorded',
      });
    }
    
  } catch (error) {
    console.error('PayPlus callback error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', provider: 'payplus' });
}
