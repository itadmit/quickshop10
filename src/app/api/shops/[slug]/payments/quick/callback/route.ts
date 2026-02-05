import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, orders, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

interface PayMeCallback {
  payme_sale_id: string;
  transaction_id: string; // Our order ID
  sale_status: string; // 'completed' | 'success' | 'failure'
  sale_price: string | number; // Form data sends as string
  currency: string;
  buyer_card_mask?: string;
  buyer_card_type?: string;
  status_code: string | number; // Form data sends as string! '0' = success
  status_error_details?: string;
  seller_payme_id?: string; // PayMe doesn't always send this in callbacks
  notify_token?: string;
  notify_type?: string; // 'sale-complete' etc.
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // PayMe sends callbacks as x-www-form-urlencoded, not JSON
    const contentType = request.headers.get('content-type') || '';
    let body: PayMeCallback;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as unknown as PayMeCallback;
    } else if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Try to parse as form data first, fallback to text parsing
      const text = await request.text();
      console.log('[PayMe Callback] Raw body:', text);
      
      // Parse URL-encoded format: key1=value1&key2=value2
      const parsed = new URLSearchParams(text);
      body = Object.fromEntries(parsed.entries()) as unknown as PayMeCallback;
    }

    console.log('[PayMe Callback] Received:', { slug, ...body });

    const {
      payme_sale_id,
      transaction_id: orderId,
      sale_status,
      status_code,
      status_error_details,
    } = body;

    if (!orderId || !payme_sale_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get store
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get provider to verify seller_payme_id
    const [provider] = await db
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

    if (!provider) {
      return NextResponse.json(
        { error: 'Payment provider not found' },
        { status: 400 }
      );
    }

    // Note: PayMe doesn't send seller_payme_id in callbacks, so we verify by:
    // 1. The callback URL is store-specific (/api/shops/[slug]/payments/quick/callback)
    // 2. The transaction_id (order) belongs to this store (verified below)
    // 3. Optional: payme_signature verification (if implemented)
    
    console.log('[PayMe Callback] Store verified:', store.id);

    // Get order and verify it belongs to this store
    const [order] = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.storeId, store.id) // Security: verify order belongs to this store
      ))
      .limit(1);

    if (!order) {
      console.error('[PayMe Callback] Order not found or does not belong to store:', { orderId, storeId: store.id });
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    console.log('[PayMe Callback] Order verified:', order.id, 'Sale status:', sale_status, 'Status code:', status_code);

    // Convert status_code to number (form data sends strings)
    const statusCodeNum = Number(status_code);
    const isSuccess = statusCodeNum === 0 && (sale_status === 'completed' || sale_status === 'success');
    
    console.log('[PayMe Callback] Payment result:', { statusCodeNum, sale_status, isSuccess });

    // Update order based on status
    if (isSuccess) {
      // Payment successful - order should already be paid from charge endpoint
      // This is a backup/confirmation
      if (order.financialStatus !== 'paid') {
        await db
          .update(orders)
          .set({
            financialStatus: 'paid',
            status: 'processing',
            paidAt: new Date(),
          })
          .where(eq(orders.id, orderId));
        console.log('[PayMe Callback] Order updated to paid:', orderId);
      } else {
        console.log('[PayMe Callback] Order already paid, skipping update:', orderId);
      }
    } else {
      // Payment failed - only update if not already paid
      if (order.financialStatus !== 'paid') {
        await db
          .update(orders)
          .set({
            financialStatus: 'pending',
            status: 'cancelled',
          })
          .where(eq(orders.id, orderId));
        console.log('[PayMe Callback] Order marked as failed:', orderId, status_error_details);
      } else {
        console.log('[PayMe Callback] Order already paid, ignoring failure callback:', orderId);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PayMe callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also handle GET for 3DS return
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    const transactionId = searchParams.get('transaction_id');
    const saleId = searchParams.get('payme_sale_id');
    const status = searchParams.get('sale_status');
    const statusCode = searchParams.get('status_code');

    if (!transactionId) {
      // Redirect to checkout with error
      return NextResponse.redirect(
        new URL(`/shops/${slug}/checkout?error=missing_transaction`, request.url)
      );
    }

    // Check if payment was successful
    if (statusCode === '0' && (status === 'completed' || status === 'success')) {
      // Update order and redirect to success page
      await db
        .update(orders)
        .set({
          financialStatus: 'paid',
          status: 'processing',
          paidAt: new Date(), // 🔥 חשוב! לחיוב עמלות
        })
        .where(eq(orders.id, transactionId));

      return NextResponse.redirect(
        new URL(`/shops/${slug}/order/${transactionId}`, request.url)
      );
    } else {
      // Payment failed - redirect back to checkout with error
      return NextResponse.redirect(
        new URL(`/shops/${slug}/checkout?step=payment&error=payment_failed`, request.url)
      );
    }

  } catch (error) {
    console.error('PayMe 3DS return error:', error);
    const { slug } = await params;
    return NextResponse.redirect(
      new URL(`/shops/${slug}/checkout?error=unknown`, request.url)
    );
  }
}

