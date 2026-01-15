import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, paymentProviders, orders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const PAYME_API_URL = {
  sandbox: 'https://sandbox.payme.io/api',
  production: 'https://ng.payme.io/api',
};

interface ChargeRequest {
  token: string;
  orderId: string;
  amount: number;
  currency?: string;
  cardMask?: string;
  cardType?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body: ChargeRequest = await request.json();

    const { token, orderId, amount, currency = 'ILS', cardMask, cardType } = body;

    // Build base URL from request or env
    // PayMe doesn't accept localhost URLs, so only include URLs in production
    const requestUrl = new URL(request.url);
    const isLocalhost = requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (isLocalhost ? null : `${requestUrl.protocol}//${requestUrl.host}`);
    
    console.log('=== Base URL for PayMe callbacks ===');
    console.log('Base URL:', baseUrl);
    console.log('Is localhost:', isLocalhost);
    console.log('=====================================');

    if (!token || !orderId || !amount) {
      return NextResponse.json(
        { error: 'חסרים פרטים נדרשים' },
        { status: 400 }
      );
    }

    // Get store and payment provider
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (!store) {
      return NextResponse.json(
        { error: 'חנות לא נמצאה' },
        { status: 404 }
      );
    }

    // Get Quick Payments provider config
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
        { error: 'ספק תשלום לא מוגדר' },
        { status: 400 }
      );
    }

    const credentials = provider.credentials as Record<string, string>;
    const testMode = provider.testMode ?? true;
    
    // Field names from provider-info.ts
    const sellerId = credentials.sellerPaymeId;
    const sellerSecret = credentials.sellerSecret;

    if (!sellerId) {
      return NextResponse.json(
        { error: 'הגדרות ספק תשלום חסרות' },
        { status: 400 }
      );
    }

    // Get order details
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        customerEmail: orders.customerEmail,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'הזמנה לא נמצאה' },
        { status: 404 }
      );
    }

    // Call PayMe generate-sale API
    const apiUrl = testMode ? PAYME_API_URL.sandbox : PAYME_API_URL.production;
    
    // Build the request payload - only include URLs if we have a valid base URL
    const salePayload: Record<string, unknown> = {
      seller_payme_id: sellerId,
      sale_price: Math.round(amount * 100), // Convert to agorot
      currency,
      product_name: `הזמנה #${order.orderNumber}`,
      transaction_id: orderId,
      installments: 1,
      buyer_key: token, // The token from tokenize
      buyer_email: order.customerEmail,
      buyer_name: order.customerName,
      buyer_phone: order.customerPhone,
      language: 'he',
    };
    
    // Only add callback URLs if we have a valid (non-localhost) base URL
    if (baseUrl) {
      salePayload.sale_callback_url = `${baseUrl}/api/shops/${slug}/payments/quick/callback`;
      salePayload.sale_return_url = `${baseUrl}/shops/${slug}/order/${orderId}`;
    }
    
    console.log('=== PayMe generate-sale request ===');
    console.log('Payload:', JSON.stringify(salePayload, null, 2));
    console.log('===================================');
    
    const saleResponse = await fetch(`${apiUrl}/generate-sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(salePayload),
    });

    const saleResult = await saleResponse.json();
    
    console.log('=== PayMe generate-sale response ===');
    console.log('HTTP Status:', saleResponse.status);
    console.log('Response:', JSON.stringify(saleResult, null, 2));
    console.log('Has payme_sale_id:', !!saleResult.payme_sale_id);
    console.log('===================================');

    // If we got a payme_sale_id, the payment was successful!
    // This is the most reliable indicator of success
    if (saleResult.payme_sale_id) {
      console.log('Payment successful! Sale ID:', saleResult.payme_sale_id);
      
      // Update order status
      await db
        .update(orders)
        .set({
          financialStatus: 'paid',
          status: 'processing',
        })
        .where(eq(orders.id, orderId));

      return NextResponse.json({
        success: true,
        transactionId: saleResult.payme_sale_id,
        orderId,
      });
    }

    // Check if 3D Secure is required (status_code: 5)
    if (saleResult.status_code === 5 && saleResult.redirect_url) {
      return NextResponse.json({
        success: false,
        requires3DS: true,
        redirectUrl: saleResult.redirect_url,
      });
    }

    // Check for errors
    if (saleResult.sale_status === 'failure' || saleResult.payme_sale_status === 'failure') {
      console.error('PayMe payment failed:', saleResult);
      const errorMessage = mapPayMeError(saleResult.status_error_code, saleResult.status_error_details);
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // If we reach here, we don't know what happened
    console.error('Unknown PayMe response - full details:', JSON.stringify(saleResult, null, 2));
    
    // Check if payment might still be processing
    if (saleResult.status_code === 0 || saleResult.payme_status === 'success') {
      // Update order status
      await db
        .update(orders)
        .set({
          financialStatus: 'paid',
          status: 'processing',
        })
        .where(eq(orders.id, orderId));

      return NextResponse.json({
        success: true,
        transactionId: saleResult.payme_sale_id,
        orderId,
      });
    }

    // Unknown status - return full PayMe response for debugging
    return NextResponse.json(
      { 
        error: 'סטטוס תשלום לא ידוע',
        debug: {
          status_code: saleResult.status_code,
          payme_status: saleResult.payme_status,
          sale_status: saleResult.sale_status,
          payme_sale_id: saleResult.payme_sale_id,
          sale_url: saleResult.sale_url,
          full_response: saleResult
        }
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Quick Payment charge error:', error);
    return NextResponse.json(
      { error: 'שגיאה בביצוע התשלום' },
      { status: 500 }
    );
  }
}

function mapPayMeError(code: number, details?: string): string {
  const errorMap: Record<number, string> = {
    1: 'שגיאה כללית בתשלום',
    2: 'כרטיס אשראי לא תקין',
    3: 'פג תוקף הכרטיס',
    4: 'כרטיס חסום',
    5: 'אין מספיק אשראי בכרטיס',
    6: 'קוד CVV שגוי',
    7: 'תעודת זהות לא תואמת',
    8: 'עסקה נדחתה על ידי חברת האשראי',
    10: 'נדרש אימות 3D Secure',
    11: 'אימות 3D Secure נכשל',
    100: 'שגיאת מערכת - נא לנסות שוב',
  };

  return errorMap[code] || details || 'שגיאה בביצוע התשלום';
}

