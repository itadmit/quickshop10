/**
 * Quick Payments Charge API
 * POST /api/payments/quick/charge
 * 
 * Receives a token from frontend Hosted Fields tokenization
 * and executes the payment via PayMe generate-sale API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pendingPayments, paymentTransactions, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { QuickPaymentsProvider } from '@/lib/payments/providers/quick-payments';
import type { PaymentProviderConfig } from '@/lib/payments/types';

interface ChargeRequestBody {
  // Store context
  storeSlug: string;
  
  // Token from frontend tokenization
  token: string;
  
  // Payment details
  amount: number;
  currency?: string;
  installments?: number;
  
  // Order reference
  orderReference: string;
  
  // Customer info (for generate-sale)
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  
  // Callback URLs
  callbackUrl?: string;
  returnUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChargeRequestBody;
    
    // Validate required fields
    if (!body.storeSlug) {
      return NextResponse.json(
        { success: false, error: 'Store slug is required' },
        { status: 400 }
      );
    }
    
    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'Payment token is required' },
        { status: 400 }
      );
    }
    
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }
    
    if (!body.orderReference) {
      return NextResponse.json(
        { success: false, error: 'Order reference is required' },
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
    
    // Get Quick Payments provider config
    const [providerConfig] = await db
      .select()
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.provider, 'quick_payments'),
          eq(paymentProviders.isActive, true)
        )
      )
      .limit(1);
    
    if (!providerConfig) {
      return NextResponse.json(
        { success: false, error: 'Quick Payments provider not configured' },
        { status: 400 }
      );
    }
    
    // Create and configure provider
    const provider = new QuickPaymentsProvider();
    const config: PaymentProviderConfig = {
      provider: 'quick_payments',
      credentials: providerConfig.credentials as Record<string, string>,
      settings: providerConfig.settings as Record<string, unknown>,
      isActive: providerConfig.isActive,
      testMode: providerConfig.testMode,
    };
    provider.configure(config);
    
    // Build callback URL
    const baseUrl = request.headers.get('origin') || `https://${request.headers.get('host')}`;
    const callbackUrl = body.callbackUrl || `${baseUrl}/api/payments/quick/callback`;
    const returnUrl = body.returnUrl || `${baseUrl}/shops/${body.storeSlug}/checkout/thank-you?ref=${body.orderReference}`;
    
    // Execute payment with token
    const result = await provider.generateSale({
      storeId: store.id,
      buyerKey: body.token,
      amount: body.amount,
      currency: body.currency || 'ILS',
      productName: `הזמנה #${body.orderReference}`,
      transactionId: body.orderReference,
      installments: body.installments || 1,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      callbackUrl,
      returnUrl,
      sendNotification: false,
      language: 'he',
    });
    
    // Log transaction
    if (result.saleId) {
      await db.insert(paymentTransactions).values({
        storeId: store.id,
        provider: 'quick_payments',
        providerId: providerConfig.id,
        type: 'charge',
        status: result.requires3DS ? 'processing' : (result.success ? 'success' : 'failed'),
        amount: String(body.amount),
        currency: body.currency || 'ILS',
        providerTransactionId: result.saleId,
        providerApprovalNum: result.approvalNumber,
        providerResponse: result.providerResponse,
        metadata: {
          orderReference: body.orderReference,
          installments: body.installments || 1,
        },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        processedAt: result.success && !result.requires3DS ? new Date() : null,
      });
    }
    
    // Update provider stats
    if (result.success && !result.requires3DS) {
      await db
        .update(paymentProviders)
        .set({
          totalTransactions: (providerConfig.totalTransactions || 0) + 1,
          totalVolume: String(Number(providerConfig.totalVolume || 0) + body.amount),
          updatedAt: new Date(),
        })
        .where(eq(paymentProviders.id, providerConfig.id));
    }
    
    // Return response
    if (result.success) {
      if (result.requires3DS && result.redirectUrl) {
        return NextResponse.json({
          success: true,
          requires3DS: true,
          redirectUrl: result.redirectUrl,
          saleId: result.saleId,
        });
      } else {
        return NextResponse.json({
          success: true,
          saleId: result.saleId,
          approvalNumber: result.approvalNumber,
          status: result.status,
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: result.errorMessage || 'Payment failed',
        errorCode: result.errorCode,
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('[Quick Payments Charge] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

