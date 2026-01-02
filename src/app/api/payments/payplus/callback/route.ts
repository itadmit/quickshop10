/**
 * PayPlus Webhook Callback
 * POST /api/payments/payplus/callback
 * 
 * Handles IPN (Instant Payment Notification) from PayPlus
 * Called after successful/failed payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  stores, 
  pendingPayments, 
  paymentTransactions,
  orders,
  orderItems,
  customers,
  paymentProviders,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getConfiguredProvider } from '@/lib/payments';
import type { TransactionStatus } from '@/lib/payments/types';

// Order creation helper
async function createOrderFromPendingPayment(
  pendingPayment: typeof pendingPayments.$inferSelect,
  transactionId: string,
  approvalNumber: string | undefined,
  cardInfo: { brand?: string; lastFour?: string }
) {
  const orderData = pendingPayment.orderData as Record<string, unknown>;
  const cartItems = pendingPayment.cartItems as Array<{
    productId: string;
    variantId?: string;
    variantTitle?: string;
    name: string;
    quantity: number;
    price: number;
    sku?: string;
    image?: string;
  }>;
  
  // Get store for order counter
  const [store] = await db.select().from(stores).where(eq(stores.id, pendingPayment.storeId)).limit(1);
  if (!store) {
    throw new Error('Store not found');
  }
  
  // Generate numeric order number from store counter (starts at 1000)
  const currentCounter = store.orderCounter ?? 1000;
  const orderNumber = String(currentCounter);
  
  // Increment the store's order counter
  await db.update(stores)
    .set({ orderCounter: currentCounter + 1 })
    .where(eq(stores.id, store.id));
  
  // Get or create customer
  let customerId = pendingPayment.customerId;
  
  if (!customerId && pendingPayment.customerEmail) {
    // Try to find existing customer
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.storeId, pendingPayment.storeId),
          eq(customers.email, pendingPayment.customerEmail)
        )
      )
      .limit(1);
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
    }
  }
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = (orderData.shipping as { cost?: number })?.cost || 0;
  const discountAmount = Number(pendingPayment.discountAmount) || 0;
  const totalAmount = subtotal + shippingCost - discountAmount;
  
  // Create order
  const [order] = await db.insert(orders).values({
    storeId: pendingPayment.storeId,
    customerId,
    orderNumber,
    status: 'confirmed',
    financialStatus: 'paid',
    fulfillmentStatus: 'unfulfilled',
    subtotal: String(subtotal),
    discountAmount: String(discountAmount),
    shippingAmount: String(shippingCost),
    taxAmount: '0',
    total: String(totalAmount),
    currency: pendingPayment.currency,
    
    // Customer info
    customerEmail: pendingPayment.customerEmail || '',
    customerName: (orderData.customer as { name?: string })?.name || '',
    customerPhone: (orderData.customer as { phone?: string })?.phone || '',
    
    // Shipping address
    shippingAddress: orderData.shippingAddress as Record<string, unknown> || {},
    billingAddress: orderData.billingAddress as Record<string, unknown> || orderData.shippingAddress as Record<string, unknown> || {},
    
    // Payment info
    paymentMethod: 'credit_card',
    paymentDetails: {
      provider: pendingPayment.provider,
      transactionId,
      approvalNumber,
      cardBrand: cardInfo.brand,
      cardLastFour: cardInfo.lastFour,
    },
    
    // Discount
    discountCode: pendingPayment.discountCode,
    
    // Notes
    note: orderData.notes as string || '',
    
    // Influencer
    influencerId: pendingPayment.influencerId,
    
    // Timestamps
    paidAt: new Date(),
  }).returning();
  
  // Create order items
  if (cartItems.length > 0) {
    await db.insert(orderItems).values(
      cartItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        name: item.name,
        variantTitle: item.variantTitle || null,
        sku: item.sku || '',
        price: String(item.price),
        quantity: item.quantity,
        total: String(item.price * item.quantity),
        imageUrl: item.image || null,
      }))
    );
  }
  
  return order;
}

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
    
    // Get raw body for hash validation
    const bodyText = await request.text();
    let body: unknown;
    
    try {
      body = JSON.parse(bodyText);
    } catch {
      console.error('PayPlus callback: Invalid JSON body');
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }
    
    // Get headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Validate webhook signature
    const validation = provider.validateWebhook(body, headers);
    
    if (!validation.isValid) {
      console.error(`PayPlus callback: Invalid signature - ${validation.error}`);
      // In development, log but continue
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
      console.warn('PayPlus callback: Skipping signature validation in development');
    }
    
    // Parse callback
    const parsed = provider.parseCallback(body);
    
    console.log('PayPlus callback received:', {
      status: parsed.status,
      success: parsed.success,
      transactionId: parsed.providerTransactionId,
      requestId: parsed.providerRequestId,
      orderReference: parsed.orderReference,
      amount: parsed.amount,
    });
    
    // Find pending payment
    const [pendingPayment] = await db
      .select()
      .from(pendingPayments)
      .where(
        and(
          eq(pendingPayments.storeId, store.id),
          eq(pendingPayments.providerRequestId, parsed.providerRequestId || ''),
          eq(pendingPayments.status, 'pending')
        )
      )
      .limit(1);
    
    if (!pendingPayment) {
      // Try to find by more_info (order reference)
      if (parsed.orderReference) {
        console.log(`PayPlus callback: Pending payment not found by requestId, trying orderReference: ${parsed.orderReference}`);
      }
      console.error(`PayPlus callback: Pending payment not found for requestId: ${parsed.providerRequestId}`);
      return NextResponse.json({ success: false, error: 'Pending payment not found' }, { status: 404 });
    }
    
    // Update transaction record
    const transactionStatus: TransactionStatus = parsed.success ? 'success' : 'failed';
    
    await db
      .update(paymentTransactions)
      .set({
        status: transactionStatus,
        providerTransactionId: parsed.providerTransactionId,
        providerApprovalNum: parsed.approvalNumber,
        providerResponse: parsed.rawData,
        errorCode: parsed.errorCode,
        errorMessage: parsed.errorMessage,
        processedAt: new Date(),
      })
      .where(
        and(
          eq(paymentTransactions.storeId, store.id),
          eq(paymentTransactions.providerRequestId, parsed.providerRequestId || '')
        )
      );
    
    // Handle successful payment
    if (parsed.success) {
      // Create order
      const order = await createOrderFromPendingPayment(
        pendingPayment,
        parsed.providerTransactionId,
        parsed.approvalNumber,
        { brand: parsed.cardBrand, lastFour: parsed.cardLastFour }
      );
      
      // Update pending payment
      await db
        .update(pendingPayments)
        .set({
          status: 'completed',
          orderId: order.id,
          completedAt: new Date(),
        })
        .where(eq(pendingPayments.id, pendingPayment.id));
      
      // Update transaction with order ID
      await db
        .update(paymentTransactions)
        .set({
          orderId: order.id,
        })
        .where(
          and(
            eq(paymentTransactions.storeId, store.id),
            eq(paymentTransactions.providerRequestId, parsed.providerRequestId || '')
          )
        );
      
      // Update provider stats
      await db
        .update(paymentProviders)
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
        );
      
      console.log(`PayPlus callback: Order created successfully: ${order.orderNumber}`);
      
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    } else {
      // Handle failed payment
      await db
        .update(pendingPayments)
        .set({
          status: 'failed',
        })
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

// PayPlus might also send GET request for redirect validation
export async function GET(request: NextRequest) {
  // Return simple success for health check
  return NextResponse.json({ status: 'ok', provider: 'payplus' });
}

