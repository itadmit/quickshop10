/**
 * Payment Initiation API
 * POST /api/payments/initiate
 * 
 * Initiates a payment with the store's configured provider
 * Creates a pending_payment record and returns the payment URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pendingPayments, paymentTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getConfiguredProvider, getDefaultProvider } from '@/lib/payments';
import type { InitiatePaymentRequest, PaymentProviderType } from '@/lib/payments/types';
import { nanoid } from 'nanoid';

interface InitiatePaymentBody {
  storeSlug: string;
  provider?: PaymentProviderType;
  
  // Order data
  amount: number;
  currency?: string;
  
  // Customer
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  
  // Cart items
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  
  // Shipping
  shipping?: {
    method: string;
    cost: number;
    address: string;
    city: string;
    postalCode?: string;
  };
  
  // Discount
  discountCode?: string;
  discountAmount?: number;
  
  // Influencer
  influencerId?: string;
  
  // Full order payload
  orderData: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as InitiatePaymentBody;
    
    // Validate required fields
    if (!body.storeSlug) {
      return NextResponse.json(
        { success: false, error: 'Store slug is required' },
        { status: 400 }
      );
    }
    
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }
    
    if (!body.customer?.email || !body.customer?.name) {
      return NextResponse.json(
        { success: false, error: 'Customer name and email are required' },
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
    
    // Get payment provider
    const provider = body.provider
      ? await getConfiguredProvider(store.id, body.provider)
      : await getDefaultProvider(store.id);
    
    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'No active payment provider configured' },
        { status: 400 }
      );
    }
    
    // Generate order reference
    const orderReference = `QS-${nanoid(10)}`;
    
    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/shops/${body.storeSlug}/checkout/thank-you?ref=${orderReference}`;
    const failureUrl = `${baseUrl}/shops/${body.storeSlug}/checkout?error=payment_failed`;
    const cancelUrl = `${baseUrl}/shops/${body.storeSlug}/checkout`;
    
    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Add shipping as item if exists
    const allItems = [...body.items];
    if (body.shipping && body.shipping.cost > 0) {
      allItems.push({
        name: `משלוח - ${body.shipping.method}`,
        quantity: 1,
        price: body.shipping.cost,
        isShipping: true,
      } as typeof body.items[0] & { isShipping: boolean });
    }
    
    // Calculate total amount from items (PayPlus requires amount = sum of items)
    // This ensures PayPlus validation passes: global-price-is-not-equal-to-total-items-sum
    const calculatedAmount = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Log for debugging
    console.log('[Payment Initiate] Amount calculation:', {
      clientAmount: body.amount,
      calculatedAmount,
      itemsCount: allItems.length,
      itemsTotal: allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      discountAmount: body.discountAmount,
      shippingCost: body.shipping?.cost || 0,
    });
    
    // Build payment request
    const paymentRequest: InitiatePaymentRequest = {
      storeId: store.id,
      storeSlug: body.storeSlug,
      orderReference,
      amount: calculatedAmount, // Use calculated amount (sum of items) for PayPlus validation
      currency: body.currency || 'ILS',
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        address: body.customer.address,
        city: body.customer.city,
        postalCode: body.customer.postalCode,
        countryIso: 'IL',
      },
      items: allItems.map(item => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl,
        isShipping: 'isShipping' in item ? (item as { isShipping: boolean }).isShipping : false,
      })),
      discountCode: body.discountCode,
      discountAmount: body.discountAmount,
      influencerId: body.influencerId,
      orderData: body.orderData,
      successUrl,
      failureUrl,
      cancelUrl,
      ipAddress,
      userAgent,
      language: 'he',
      sendEmailOnSuccess: true,
      sendEmailOnFailure: false,
    };
    
    // Initiate payment with provider
    const response = await provider.initiatePayment(paymentRequest);
    
    if (!response.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: response.errorMessage || 'Payment initiation failed',
          errorCode: response.errorCode,
        },
        { status: 400 }
      );
    }
    
    // Create pending payment record
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry
    
    // Add orderReference to orderData for fallback lookup
    const orderDataWithReference = {
      ...body.orderData,
      orderReference,
    };
    
    await db.insert(pendingPayments).values({
      storeId: store.id,
      provider: provider.providerType,
      providerRequestId: response.providerRequestId!,
      orderData: orderDataWithReference,
      cartItems: body.items,
      customerEmail: body.customer.email,
      amount: String(body.amount),
      currency: body.currency || 'ILS',
      status: 'pending',
      discountCode: body.discountCode,
      discountAmount: body.discountAmount ? String(body.discountAmount) : '0',
      influencerId: body.influencerId,
      expiresAt,
    });
    
    // Create initial transaction record
    await db.insert(paymentTransactions).values({
      storeId: store.id,
      provider: provider.providerType,
      type: 'charge',
      status: 'pending',
      amount: String(body.amount),
      currency: body.currency || 'ILS',
      providerRequestId: response.providerRequestId,
      metadata: {
        orderReference,
        customerEmail: body.customer.email,
      },
      ipAddress,
      userAgent,
    });
    
    return NextResponse.json({
      success: true,
      paymentUrl: response.paymentUrl,
      orderReference,
      providerRequestId: response.providerRequestId,
    });
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

