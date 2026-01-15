/**
 * Generic Payment Callback
 * POST /api/payments/callback?provider=payplus&store=store-slug
 * 
 * MODULAR DESIGN:
 * - This route handles ALL payment provider callbacks
 * - Each provider has its own logic in /lib/payments/providers/
 * - All business logic is in the thank-you page (single source of truth)
 * 
 * Adding a new provider:
 * 1. Create provider class in /lib/payments/providers/newprovider.ts
 * 2. Add to factory in /lib/payments/factory.ts
 * 3. That's it! This callback will handle it automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  stores, 
  pendingPayments, 
  paymentTransactions,
  paymentProviders,
  orders,
  orderItems,
  returnRequests,
  shipments,
  shippingProviders,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getConfiguredProvider } from '@/lib/payments';
import type { TransactionStatus, PaymentProviderType } from '@/lib/payments/types';
import { executePostPaymentActions, type CartItem } from '@/lib/orders/post-payment';
import { getConfiguredShippingProvider } from '@/lib/shipping/factory';
import type { ShipmentAddress } from '@/lib/shipping/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get provider and store from query params
    const providerName = request.nextUrl.searchParams.get('provider') as PaymentProviderType | null;
    const storeSlug = request.nextUrl.searchParams.get('store');
    
    if (!providerName) {
      console.error('Payment callback: Missing provider parameter');
      return NextResponse.json({ success: false, error: 'Missing provider' }, { status: 400 });
    }
    
    if (!storeSlug) {
      console.error('Payment callback: Missing store parameter');
      return NextResponse.json({ success: false, error: 'Missing store' }, { status: 400 });
    }
    
    console.log(`Payment callback [${providerName}]: Processing for store ${storeSlug}`);
    
    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);
    
    if (!store) {
      console.error(`Payment callback [${providerName}]: Store not found: ${storeSlug}`);
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }
    
    // Get configured provider
    const provider = await getConfiguredProvider(store.id, providerName);
    
    if (!provider) {
      console.error(`Payment callback [${providerName}]: Provider not configured for store: ${storeSlug}`);
      return NextResponse.json({ success: false, error: 'Provider not configured' }, { status: 400 });
    }
    
    // Parse request body (JSON or form data)
    let body: unknown;
    try {
      const bodyText = await request.text();
      
      try {
        body = JSON.parse(bodyText);
      } catch {
        // Try URL-encoded form data
        const formData = new URLSearchParams(bodyText);
        const bodyObj: Record<string, unknown> = {};
        formData.forEach((value, key) => {
          bodyObj[key] = value;
        });
        body = bodyObj;
      }
    } catch (error) {
      console.error(`Payment callback [${providerName}]: Failed to parse body`, error);
      return NextResponse.json({ success: false, error: 'Invalid body format' }, { status: 400 });
    }
    
    console.log(`Payment callback [${providerName}]: Body received`, JSON.stringify(body, null, 2));
    
    // Get headers for signature validation
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // SECURITY: Validate webhook signature
    const validation = provider.validateWebhook(body, headers);
    
    if (!validation.isValid) {
      console.error(`Payment callback [${providerName}]: Invalid signature - ${validation.error}`);
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
      console.warn(`Payment callback [${providerName}]: Skipping signature validation in development`);
    }
    
    // Parse callback data using provider's parser
    const parsed = provider.parseCallback(body);
    
    console.log(`Payment callback [${providerName}]: Parsed`, {
      status: parsed.status,
      success: parsed.success,
      transactionId: parsed.providerTransactionId,
      requestId: parsed.providerRequestId,
      orderReference: parsed.orderReference,
      amount: parsed.amount,
    });
    
    // ============================================
    // PELECARD: Fetch card details via GetTransaction
    // Pelecard doesn't send card info in callback, we need to fetch it
    // ============================================
    if (providerName === 'pelecard' && parsed.success && parsed.providerTransactionId && !parsed.cardLastFour) {
      try {
        console.log(`Payment callback [pelecard]: Fetching card details via GetTransaction`);
        const transactionDetails = await provider.getTransactionStatus({
          storeId: store.id,
          providerTransactionId: parsed.providerTransactionId,
        });
        
        if (transactionDetails.success) {
          // Enrich parsed data with card details
          parsed.cardLastFour = transactionDetails.cardLastFour;
          parsed.cardBrand = transactionDetails.cardBrand;
          // Also update amount if it was 0 (Pelecard doesn't send amount in callback)
          if (parsed.amount === 0 && transactionDetails.amount) {
            parsed.amount = transactionDetails.amount;
          }
          console.log(`Payment callback [pelecard]: Card details fetched`, {
            cardLastFour: parsed.cardLastFour,
            cardBrand: parsed.cardBrand,
            amount: parsed.amount,
          });
        } else {
          console.warn(`Payment callback [pelecard]: Failed to fetch card details:`, transactionDetails.errorMessage);
        }
      } catch (err) {
        // Non-blocking - we don't want to fail the callback if this fails
        console.error(`Payment callback [pelecard]: Error fetching card details:`, err);
      }
    }
    
    // Find pending payment by requestId or orderReference
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
      console.error(`Payment callback [${providerName}]: Pending payment not found`, {
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
        console.error(`Payment callback [${providerName}]: Amount mismatch! Expected ${calculatedTotal}, got ${parsed.amount}`);
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ 
            success: false, 
            error: 'Amount mismatch' 
          }, { status: 400 });
        }
      }
      
      // Save payment details to pendingPayment.orderData for thank-you page
      await db
        .update(pendingPayments)
        .set({
          orderData: {
            ...orderData,
            paymentConfirmed: true,
            paymentDetails: {
              provider: providerName,
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
            eq(paymentProviders.provider, providerName)
          )
        )
        .catch(err => console.error('Failed to update provider stats:', err));
      
      // ============================================
      // Handle POS orders (created before payment)
      // Update order to paid and run all post-payment actions
      // ============================================
      const posOrderId = (orderData as { orderId?: string })?.orderId;
      const isPosOrder = (orderData as { source?: string })?.source === 'pos';
      
      if (isPosOrder && posOrderId) {
        console.log(`Payment callback [${providerName}]: Processing POS order ${posOrderId}`);
        
        // Get the order
        const [posOrder] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, posOrderId))
          .limit(1);
        
        if (posOrder) {
          // Update order to paid
          await db
            .update(orders)
            .set({
              status: 'processing',
              financialStatus: 'paid',
              paidAt: new Date(),
              paymentMethod: 'credit_card',
              paymentDetails: {
                provider: providerName,
                transactionId: parsed.providerTransactionId,
                approvalNumber: parsed.approvalNumber,
              },
            })
            .where(eq(orders.id, posOrderId));
          
          // Get order items for post-payment actions
          const items = await db
            .select({
              productId: orderItems.productId,
              name: orderItems.name,
              quantity: orderItems.quantity,
              price: orderItems.price,
              imageUrl: orderItems.imageUrl,
            })
            .from(orderItems)
            .where(eq(orderItems.orderId, posOrderId));
          
          // Convert to CartItem format (filter out manual items without productId)
          const cartItems: CartItem[] = items
            .filter(item => item.productId) // Only items with productId for inventory
            .map(item => ({
              productId: item.productId!,
              name: item.name,
              quantity: item.quantity,
              price: parseFloat(item.price),
              imageUrl: item.imageUrl || undefined,
            }));
          
          // Execute all post-payment actions (inventory, emails, etc.)
          executePostPaymentActions({
            storeId: store.id,
            storeName: store.name,
            storeSlug: store.slug,
            order: {
              id: posOrder.id,
              orderNumber: posOrder.orderNumber,
              total: posOrder.total,
              customerEmail: posOrder.customerEmail,
              customerName: posOrder.customerName,
              customerId: posOrder.customerId,
            },
            cartItems,
            orderData: {
              paymentDetails: {
                transactionId: parsed.providerTransactionId,
                approvalNumber: parsed.approvalNumber,
                cardBrand: parsed.cardBrand,
                cardLastFour: parsed.cardLastFour,
              },
            },
            discountCode: posOrder.discountCode,
            discountAmount: parseFloat(posOrder.discountAmount || '0'),
            paymentInfo: {
              lastFour: parsed.cardLastFour,
              brand: parsed.cardBrand,
              approvalNum: parsed.approvalNumber,
            },
          }).catch(err => console.error(`[POS] Post-payment actions failed:`, err));
          
          console.log(`Payment callback [${providerName}]: POS order ${posOrderId} marked as paid, post-payment actions triggered`);
        }
      }
      
      // ============================================
      // Handle Exchange Difference Payments
      // Create shipments after payment is confirmed
      // ============================================
      const isExchangeDifference = (orderData as { type?: string })?.type === 'exchange_difference';
      const exchangeOrderId = (orderData as { orderId?: string })?.orderId;
      const returnRequestId = (orderData as { returnRequestId?: string })?.returnRequestId;
      
      if (isExchangeDifference && exchangeOrderId && returnRequestId) {
        console.log(`Payment callback [${providerName}]: Processing exchange difference for order ${exchangeOrderId}`);
        
        try {
          // Update order to paid
          await db
            .update(orders)
            .set({
              financialStatus: 'paid',
              paidAt: new Date(),
              paymentMethod: 'credit_card',
              paymentDetails: {
                provider: providerName,
                transactionId: parsed.providerTransactionId,
                approvalNumber: parsed.approvalNumber,
              },
            })
            .where(eq(orders.id, exchangeOrderId));
          
          // Get return request
          const [returnRequest] = await db
            .select()
            .from(returnRequests)
            .where(eq(returnRequests.id, returnRequestId))
            .limit(1);
          
          if (returnRequest) {
            // Update return request status to completed
            await db
              .update(returnRequests)
              .set({
                status: 'completed',
                updatedAt: new Date(),
              })
              .where(eq(returnRequests.id, returnRequestId));
            
            // Get exchange order
            const [exchangeOrder] = await db
              .select()
              .from(orders)
              .where(eq(orders.id, exchangeOrderId))
              .limit(1);
            
            // Get original order for customer address
            const [originalOrder] = await db
              .select()
              .from(orders)
              .where(eq(orders.id, returnRequest.orderId))
              .limit(1);
            
            if (exchangeOrder && originalOrder?.shippingAddress) {
              // Create shipments
              const shippingProvider = await getConfiguredShippingProvider(store.id);
              
              if (shippingProvider && 'createExchangeShipments' in shippingProvider && typeof shippingProvider.createExchangeShipments === 'function') {
                // Get provider config for sender address
                const [providerConfig] = await db
                  .select()
                  .from(shippingProviders)
                  .where(and(eq(shippingProviders.storeId, store.id), eq(shippingProviders.isActive, true)))
                  .limit(1);
                
                if (providerConfig) {
                  const settings = (providerConfig.settings || {}) as Record<string, string>;
                  const shippingAddr = originalOrder.shippingAddress as Record<string, string>;
                  
                  const customerAddress: ShipmentAddress = {
                    name: `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim() || originalOrder.customerName || '',
                    phone: shippingAddr.phone || originalOrder.customerPhone || '',
                    email: originalOrder.customerEmail || undefined,
                    street: shippingAddr.address || shippingAddr.street || '',
                    city: shippingAddr.city || '',
                    zipCode: shippingAddr.zipCode,
                    apartment: shippingAddr.apartment,
                    floor: shippingAddr.floor,
                    entrance: shippingAddr.entrance,
                  };
                  
                  const storeAddress: ShipmentAddress = {
                    name: settings.senderName || store.name,
                    phone: settings.senderPhone || '',
                    street: settings.senderStreet || '',
                    city: settings.senderCity || '',
                    zipCode: settings.senderZipCode || undefined,
                  };
                  
                  console.log(`[Exchange Callback] Creating shipments for return ${returnRequest.requestNumber}`);
                  
                  const shipmentResult = await shippingProvider.createExchangeShipments({
                    storeId: store.id,
                    returnRequestId: returnRequest.id,
                    returnRequestNumber: returnRequest.requestNumber,
                    exchangeOrderId: exchangeOrder.id,
                    exchangeOrderNumber: exchangeOrder.orderNumber,
                    customerAddress,
                    storeAddress,
                  });
                  
                  if (shipmentResult.success) {
                    // Save return shipment
                    if (shipmentResult.returnShipment) {
                      await db.insert(shipments).values({
                        storeId: store.id,
                        orderId: returnRequest.orderId,
                        provider: providerConfig.provider,
                        providerShipmentId: shipmentResult.returnShipment.providerShipmentId,
                        trackingNumber: shipmentResult.returnShipment.trackingNumber,
                        status: 'created',
                        statusDescription: 'משלוח איסוף להחזרה',
                        labelUrl: shipmentResult.returnShipment.labelUrl,
                        recipientName: storeAddress.name,
                        recipientPhone: storeAddress.phone,
                        recipientAddress: storeAddress,
                      });
                    }
                    
                    // Save delivery shipment
                    if (shipmentResult.deliveryShipment) {
                      await db.insert(shipments).values({
                        storeId: store.id,
                        orderId: exchangeOrder.id,
                        provider: providerConfig.provider,
                        providerShipmentId: shipmentResult.deliveryShipment.providerShipmentId,
                        trackingNumber: shipmentResult.deliveryShipment.trackingNumber,
                        status: 'created',
                        statusDescription: 'משלוח מוצר החלפה',
                        labelUrl: shipmentResult.deliveryShipment.labelUrl,
                        recipientName: customerAddress.name,
                        recipientPhone: customerAddress.phone,
                        recipientAddress: customerAddress,
                      });
                      
                      // Update exchange order fulfillment status
                      await db.update(orders)
                        .set({
                          fulfillmentStatus: 'fulfilled',
                          updatedAt: new Date(),
                        })
                        .where(eq(orders.id, exchangeOrder.id));
                    }
                    
                    console.log(`[Exchange Callback] Shipments created successfully`);
                  } else {
                    console.error(`[Exchange Callback] Failed to create shipments: ${shipmentResult.errorMessage}`);
                  }
                }
              }
            }
          }
          
          console.log(`Payment callback [${providerName}]: Exchange difference paid, shipments created for ${exchangeOrderId}`);
        } catch (err) {
          console.error(`[Exchange Callback] Error processing exchange:`, err);
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`Payment callback [${providerName}]: Success in ${duration}ms for ${pendingPayment.id}`);
      
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
      
      console.log(`Payment callback [${providerName}]: Payment failed - ${parsed.errorMessage}`);
      
      return NextResponse.json({
        success: true,
        message: 'Payment failure recorded',
      });
    }
    
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  const providerName = request.nextUrl.searchParams.get('provider') || 'generic';
  return NextResponse.json({ 
    status: 'ok', 
    provider: providerName,
    endpoint: 'generic-callback',
  });
}


