import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, orders, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

interface PayMeCallback {
  payme_sale_id: string;
  transaction_id: string; // Our order ID
  sale_status: string;
  sale_price: number;
  currency: string;
  buyer_card_mask?: string;
  buyer_card_type?: string;
  status_code: number;
  status_error_details?: string;
  seller_payme_id: string;
  notify_token?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body: PayMeCallback = await request.json();

    console.log('PayMe callback received:', { slug, ...body });

    const {
      payme_sale_id,
      transaction_id: orderId,
      sale_status,
      buyer_card_mask,
      buyer_card_type,
      status_code,
      status_error_details,
      seller_payme_id,
      notify_token,
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

    const credentials = provider.credentials as Record<string, string>;
    
    // Verify seller_payme_id matches (field name from provider-info.ts)
    if (seller_payme_id !== credentials.sellerPaymeId) {
      console.error('Seller ID mismatch:', { received: seller_payme_id, expected: credentials.paymeSellerId });
      return NextResponse.json(
        { error: 'Invalid seller' },
        { status: 403 }
      );
    }

    // Verify notify_token if provided (optional security)
    if (notify_token && credentials.sellerSecret) {
      // PayMe signs the callback with the seller secret
      // Implementation depends on PayMe's exact signature method
    }

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order based on status
    if (status_code === 0 && (sale_status === 'completed' || sale_status === 'success')) {
      // Payment successful
      await db
        .update(orders)
        .set({
          financialStatus: 'paid',
          status: 'processing',
          paidAt: new Date(), // 🔥 חשוב! לחיוב עמלות
        })
        .where(eq(orders.id, orderId));

      console.log('Order updated to paid:', orderId);
    } else {
      // Payment failed
      await db
        .update(orders)
        .set({
          financialStatus: 'pending', // Keep as pending, not failed
          status: 'cancelled',
        })
        .where(eq(orders.id, orderId));

      console.log('Order marked as failed:', orderId, status_error_details);
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

