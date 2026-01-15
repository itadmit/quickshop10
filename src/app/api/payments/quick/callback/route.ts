/**
 * Quick Payments Callback API
 * POST /api/payments/quick/callback
 * 
 * Handles callbacks from PayMe after:
 * - 3DS challenge completion
 * - Sale completion notifications
 * - Refund notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, paymentTransactions, paymentProviders, pendingPayments, orders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { QuickPaymentsProvider } from '@/lib/payments/providers/quick-payments';
import type { PaymentProviderConfig } from '@/lib/payments/types';

// PayMe sends x-www-form-urlencoded POST
export async function POST(request: NextRequest) {
  try {
    // Parse body (PayMe sends form-urlencoded)
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown>;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Try JSON anyway
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        // Parse as query string
        body = Object.fromEntries(new URLSearchParams(text).entries());
      }
    }
    
    console.log('[Quick Payments Callback] Received:', JSON.stringify(body, null, 2));
    
    // Extract key fields
    const sellerPaymeId = body.seller_payme_id as string;
    const saleId = body.payme_sale_id as string;
    const notifyType = body.notify_type as string;
    const transactionId = body.transaction_id as string; // Our order reference
    
    if (!saleId) {
      console.error('[Quick Payments Callback] Missing payme_sale_id');
      return NextResponse.json({ success: false, error: 'Missing sale ID' }, { status: 400 });
    }
    
    // Find provider config by seller_payme_id
    let providerConfig;
    if (sellerPaymeId) {
      const configs = await db
        .select()
        .from(paymentProviders)
        .where(eq(paymentProviders.provider, 'quick_payments'));
      
      providerConfig = configs.find(c => {
        const creds = c.credentials as Record<string, string>;
        return creds.sellerPaymeId === sellerPaymeId;
      });
    }
    
    if (!providerConfig) {
      // Try to find by existing transaction
      const [existingTx] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.providerTransactionId, saleId))
        .limit(1);
      
      if (existingTx?.providerId) {
        const [config] = await db
          .select()
          .from(paymentProviders)
          .where(eq(paymentProviders.id, existingTx.providerId))
          .limit(1);
        providerConfig = config;
      }
    }
    
    if (!providerConfig) {
      console.error('[Quick Payments Callback] Provider config not found');
      // Still acknowledge receipt
      return NextResponse.json({ success: true, message: 'Acknowledged but no config found' });
    }
    
    // Create and configure provider for validation
    const provider = new QuickPaymentsProvider();
    const config: PaymentProviderConfig = {
      provider: 'quick_payments',
      credentials: providerConfig.credentials as Record<string, string>,
      settings: providerConfig.settings as Record<string, unknown>,
      isActive: providerConfig.isActive,
      testMode: providerConfig.testMode,
    };
    provider.configure(config);
    
    // Validate webhook
    const validation = provider.validateWebhook(body, Object.fromEntries(
      Array.from(request.headers.entries())
    ));
    
    if (!validation.isValid) {
      console.warn('[Quick Payments Callback] Validation failed:', validation.error);
      // Still process but log warning
    }
    
    // Parse callback data
    const parsed = provider.parseCallback(body);
    
    console.log('[Quick Payments Callback] Parsed:', {
      success: parsed.success,
      status: parsed.status,
      saleId: parsed.providerTransactionId,
      orderRef: parsed.orderReference,
    });
    
    // Find or update transaction record
    const [existingTransaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.providerTransactionId, saleId))
      .limit(1);
    
    if (existingTransaction) {
      // Update existing transaction
      await db
        .update(paymentTransactions)
        .set({
          status: parsed.status,
          providerApprovalNum: parsed.approvalNumber || existingTransaction.providerApprovalNum,
          providerResponse: body,
          processedAt: parsed.success ? new Date() : existingTransaction.processedAt,
          errorCode: parsed.errorCode,
          errorMessage: parsed.errorMessage,
        })
        .where(eq(paymentTransactions.id, existingTransaction.id));
      
      // Update provider stats on success
      if (parsed.success && existingTransaction.status !== 'success') {
        await db
          .update(paymentProviders)
          .set({
            totalTransactions: (providerConfig.totalTransactions || 0) + 1,
            totalVolume: String(
              Number(providerConfig.totalVolume || 0) + Number(existingTransaction.amount)
            ),
            updatedAt: new Date(),
          })
          .where(eq(paymentProviders.id, providerConfig.id));
      }
    } else {
      // Create new transaction record
      await db.insert(paymentTransactions).values({
        storeId: providerConfig.storeId,
        provider: 'quick_payments',
        providerId: providerConfig.id,
        type: notifyType === 'sale-refund' ? 'refund' : 'charge',
        status: parsed.status,
        amount: String(parsed.amount),
        currency: parsed.currency,
        providerTransactionId: saleId,
        providerApprovalNum: parsed.approvalNumber,
        providerResponse: body,
        metadata: {
          orderReference: transactionId || parsed.orderReference,
          notifyType,
        },
        processedAt: parsed.success ? new Date() : null,
        errorCode: parsed.errorCode,
        errorMessage: parsed.errorMessage,
      });
    }
    
    // Handle specific notification types
    switch (notifyType) {
      case 'sale-complete':
        console.log('[Quick Payments] Sale completed:', saleId);
        // Order creation should be handled by the checkout flow
        // This is just confirmation
        break;
        
      case 'sale-failure':
        console.log('[Quick Payments] Sale failed:', saleId);
        break;
        
      case 'sale-refund':
        console.log('[Quick Payments] Refund completed:', saleId);
        break;
        
      default:
        console.log('[Quick Payments] Unknown notify type:', notifyType);
    }
    
    // Return success to PayMe
    return NextResponse.json({ 
      success: true, 
      message: 'Callback processed successfully' 
    });
    
  } catch (error) {
    console.error('[Quick Payments Callback] Error:', error);
    // Still return 200 to prevent retries
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal error' 
    });
  }
}

// Also handle GET for 3DS redirect returns
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params = Object.fromEntries(searchParams.entries());
  
  console.log('[Quick Payments Callback GET] Params:', params);
  
  // This is typically a redirect after 3DS
  // The user should be redirected to the appropriate page
  
  const saleId = params.payme_sale_id || params.sale_id;
  const statusCode = params.status_code;
  const transactionId = params.transaction_id;
  
  if (statusCode === '0' || statusCode === '000') {
    // Success - redirect to thank you page
    // We need to find the order reference from the transaction
    if (transactionId) {
      return NextResponse.redirect(
        new URL(`/checkout/thank-you?ref=${transactionId}&sale=${saleId}`, request.url)
      );
    }
  }
  
  // Failure - redirect back to checkout with error
  return NextResponse.redirect(
    new URL(`/checkout?error=payment_failed&code=${statusCode}`, request.url)
  );
}

