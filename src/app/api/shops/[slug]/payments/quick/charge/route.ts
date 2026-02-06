import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, paymentProviders, orders, orderItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { executePostPaymentActions, type CartItem, type OrderData } from '@/lib/orders/post-payment';

const PAYME_API_URL = {
  sandbox: 'https://sandbox.payme.io/api',
  production: 'https://live.payme.io/api',
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

    // PayMe minimum amount is 5.00 ILS (500 agorot)
    const PAYME_MIN_AMOUNT = 5;
    if (amount < PAYME_MIN_AMOUNT) {
      console.log(`[Quick Payment] Amount ${amount} is below minimum ${PAYME_MIN_AMOUNT}`);
      return NextResponse.json(
        { error: `סכום ההזמנה קטן מדי - מינימום לתשלום הוא ₪${PAYME_MIN_AMOUNT}` },
        { status: 400 }
      );
    }

    // Get store and payment provider
    const [store] = await db
      .select({ id: stores.id, name: stores.name, slug: stores.slug })
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
    
    // Platform-level PayMe keys from environment
    const clientKey = process.env.PAYME_CLIENT_KEY;

    if (!sellerId) {
      return NextResponse.json(
        { error: 'הגדרות ספק תשלום חסרות - חסר Seller ID' },
        { status: 400 }
      );
    }
    
    if (!clientKey) {
      console.error('[Quick Payment] Missing PAYME_CLIENT_KEY environment variable');
      return NextResponse.json(
        { error: 'הגדרות מערכת חסרות' },
        { status: 500 }
      );
    }

    // Get order details
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        shippingAmount: orders.shippingAmount,
        customerEmail: orders.customerEmail,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        customerId: orders.customerId,
        discountCode: orders.discountCode,
        discountDetails: orders.discountDetails,
        shippingAddress: orders.shippingAddress,
        creditUsed: orders.creditUsed,
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
    
    // Get order items for post-payment processing (including properties for addons)
    const items = await db
      .select({
        productId: orderItems.productId,
        variantTitle: orderItems.variantTitle,
        name: orderItems.name,
        quantity: orderItems.quantity,
        price: orderItems.price,
        sku: orderItems.sku,
        imageUrl: orderItems.imageUrl,
        properties: orderItems.properties,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    
    console.log('[Quick Payment] Order items fetched:', items.length, 'items');
    console.log('[Quick Payment] Customer email:', order.customerEmail);

    // 🧪 TEST MODE: Handle test tokens without calling PayMe API
    if (testMode && token.startsWith('test_token_')) {
      console.log('=== TEST MODE: Simulating successful payment ===');
      console.log('Test token:', token);
      console.log('Order ID:', orderId);
      console.log('Amount:', amount);
      
      const testTransactionId = `test_sale_${Date.now()}`;
      
      // Update order status to simulate successful payment
      const [updatedOrder] = await db
        .update(orders)
        .set({
          financialStatus: 'paid',
          status: 'processing',
          paidAt: new Date(),
          paymentMethod: 'credit_card',
          paymentDetails: {
            provider: 'quick_payments',
            transactionId: testTransactionId,
            testMode: true,
          },
        })
        .where(eq(orders.id, orderId))
        .returning();
      
      // 🔥 Execute post-payment actions even in test mode
      const cartItems: CartItem[] = items.map(item => {
        const props = item.properties as { addons?: Array<{addonId: string; name: string; value: string; displayValue: string; priceAdjustment: number}>; addonTotal?: number; bundleComponents?: Array<{name: string; variantTitle?: string; quantity: number}> } | null;
        return {
          productId: item.productId || '',
          variantTitle: item.variantTitle || undefined,
          name: item.name || '',
          quantity: item.quantity,
          price: Number(item.price),
          sku: item.sku || undefined,
          image: item.imageUrl || undefined,
          imageUrl: item.imageUrl || undefined,
          addons: props?.addons || undefined,
          addonTotal: props?.addonTotal || undefined,
          bundleComponents: props?.bundleComponents || undefined,
        };
      });
      
      const shippingAddress = order.shippingAddress as Record<string, unknown> | null;
      const orderData: OrderData = {
        shipping: {
          method: (shippingAddress?.method as string) || 'pickup',
          cost: Number(order.shippingAmount) || 0,
        },
        shippingAddress: shippingAddress ? {
          firstName: (shippingAddress.firstName as string) || '',
          lastName: (shippingAddress.lastName as string) || '',
          address: (shippingAddress.address as string) || '',
          city: (shippingAddress.city as string) || '',
          phone: (shippingAddress.phone as string) || '',
        } : undefined,
        creditUsed: Number(order.creditUsed) || 0,
      };
      
      executePostPaymentActions({
        storeId: store.id,
        storeName: store.name,
        storeSlug: store.slug,
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          total: updatedOrder.total,
          customerEmail: updatedOrder.customerEmail,
          customerName: updatedOrder.customerName,
          customerId: order.customerId,
          discountDetails: updatedOrder.discountDetails,
        },
        cartItems,
        orderData,
        discountCode: order.discountCode || undefined,
        discountAmount: Number(order.discountAmount) || 0,
      }).catch(err => console.error('[Quick Payment] Test mode post-payment actions failed:', err));

      return NextResponse.json({
        success: true,
        transactionId: testTransactionId,
        orderId,
        testMode: true,
      });
    }

    // Call PayMe generate-sale API
    const apiUrl = testMode ? PAYME_API_URL.sandbox : PAYME_API_URL.production;
    
    // Build the request payload - only include URLs if we have a valid base URL
    const salePayload: Record<string, unknown> = {
      payme_client_key: clientKey, // Platform/marketplace key
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
        'PayMe-Partner-Key': clientKey, // Platform/marketplace authentication
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
      const [updatedOrder] = await db
        .update(orders)
        .set({
          financialStatus: 'paid',
          status: 'processing',
          paidAt: new Date(), // 🔥 חשוב! לחיוב עמלות
          paymentMethod: 'credit_card',
          paymentDetails: {
            provider: 'quick_payments',
            transactionId: saleResult.payme_sale_id,
            approvalNumber: saleResult.transaction_cc_auth_number || saleResult.payme_transaction_auth_number,
            cardBrand: saleResult.payme_transaction_card_brand,
            cardLastFour: saleResult.buyer_card_mask?.slice(-4),
          },
        })
        .where(eq(orders.id, orderId))
        .returning();
      
      // 🔥 Execute post-payment actions (email, inventory, loyalty points, etc.)
      const cartItems: CartItem[] = items.map(item => {
        const props = item.properties as { addons?: Array<{addonId: string; name: string; value: string; displayValue: string; priceAdjustment: number}>; addonTotal?: number; bundleComponents?: Array<{name: string; variantTitle?: string; quantity: number}> } | null;
        return {
          productId: item.productId || '',
          variantTitle: item.variantTitle || undefined,
          name: item.name || '',
          quantity: item.quantity,
          price: Number(item.price),
          sku: item.sku || undefined,
          image: item.imageUrl || undefined,
          imageUrl: item.imageUrl || undefined,
          addons: props?.addons || undefined,
          addonTotal: props?.addonTotal || undefined,
          bundleComponents: props?.bundleComponents || undefined,
        };
      });
      
      const shippingAddress = order.shippingAddress as Record<string, unknown> | null;
      const orderData: OrderData = {
        shipping: {
          method: (shippingAddress?.method as string) || 'pickup',
          cost: Number(order.shippingAmount) || 0,
        },
        shippingAddress: shippingAddress ? {
          firstName: (shippingAddress.firstName as string) || '',
          lastName: (shippingAddress.lastName as string) || '',
          address: (shippingAddress.address as string) || '',
          city: (shippingAddress.city as string) || '',
          phone: (shippingAddress.phone as string) || '',
        } : undefined,
        creditUsed: Number(order.creditUsed) || 0,
      };
      
      // Fire and forget - don't block the response
      executePostPaymentActions({
        storeId: store.id,
        storeName: store.name,
        storeSlug: store.slug,
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          total: updatedOrder.total,
          customerEmail: updatedOrder.customerEmail,
          customerName: updatedOrder.customerName,
          customerId: order.customerId,
          discountDetails: updatedOrder.discountDetails,
        },
        cartItems,
        orderData,
        discountCode: order.discountCode || undefined,
        discountAmount: Number(order.discountAmount) || 0,
        paymentInfo: {
          lastFour: saleResult.buyer_card_mask?.slice(-4),
          brand: saleResult.payme_transaction_card_brand,
          approvalNum: saleResult.transaction_cc_auth_number || saleResult.payme_transaction_auth_number,
        },
      }).catch(err => console.error('[Quick Payment] Post-payment actions failed:', err));

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
      const [updatedOrder] = await db
        .update(orders)
        .set({
          financialStatus: 'paid',
          status: 'processing',
          paidAt: new Date(), // 🔥 חשוב! לחיוב עמלות
          paymentMethod: 'credit_card',
          paymentDetails: {
            provider: 'quick_payments',
            transactionId: saleResult.payme_sale_id,
            approvalNumber: saleResult.transaction_cc_auth_number || saleResult.payme_transaction_auth_number,
            cardBrand: saleResult.payme_transaction_card_brand,
            cardLastFour: saleResult.buyer_card_mask?.slice(-4),
          },
        })
        .where(eq(orders.id, orderId))
        .returning();
      
      // 🔥 Execute post-payment actions (fallback success case)
      const cartItems: CartItem[] = items.map(item => {
        const props = item.properties as { addons?: Array<{addonId: string; name: string; value: string; displayValue: string; priceAdjustment: number}>; addonTotal?: number; bundleComponents?: Array<{name: string; variantTitle?: string; quantity: number}> } | null;
        return {
          productId: item.productId || '',
          variantTitle: item.variantTitle || undefined,
          name: item.name || '',
          quantity: item.quantity,
          price: Number(item.price),
          sku: item.sku || undefined,
          image: item.imageUrl || undefined,
          imageUrl: item.imageUrl || undefined,
          addons: props?.addons || undefined,
          addonTotal: props?.addonTotal || undefined,
          bundleComponents: props?.bundleComponents || undefined,
        };
      });
      
      const shippingAddress = order.shippingAddress as Record<string, unknown> | null;
      const orderData: OrderData = {
        shipping: {
          method: (shippingAddress?.method as string) || 'pickup',
          cost: Number(order.shippingAmount) || 0,
        },
        shippingAddress: shippingAddress ? {
          firstName: (shippingAddress.firstName as string) || '',
          lastName: (shippingAddress.lastName as string) || '',
          address: (shippingAddress.address as string) || '',
          city: (shippingAddress.city as string) || '',
          phone: (shippingAddress.phone as string) || '',
        } : undefined,
        creditUsed: Number(order.creditUsed) || 0,
      };
      
      executePostPaymentActions({
        storeId: store.id,
        storeName: store.name,
        storeSlug: store.slug,
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          total: updatedOrder.total,
          customerEmail: updatedOrder.customerEmail,
          customerName: updatedOrder.customerName,
          customerId: order.customerId,
          discountDetails: updatedOrder.discountDetails,
        },
        cartItems,
        orderData,
        discountCode: order.discountCode || undefined,
        discountAmount: Number(order.discountAmount) || 0,
        paymentInfo: {
          lastFour: saleResult.buyer_card_mask?.slice(-4),
          brand: saleResult.payme_transaction_card_brand,
          approvalNum: saleResult.transaction_cc_auth_number || saleResult.payme_transaction_auth_number,
        },
      }).catch(err => console.error('[Quick Payment] Fallback post-payment actions failed:', err));

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
    352: 'סכום ההזמנה קטן מדי - מינימום לתשלום הוא ₪5',
  };

  return errorMap[code] || details || 'שגיאה בביצוע התשלום';
}

