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
  giftCards,
  giftCardTransactions,
  products,
  productVariants,
  discounts,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getConfiguredProvider } from '@/lib/payments';
import type { TransactionStatus } from '@/lib/payments/types';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { emitOrderCreated, emitLowStock } from '@/lib/events';

// Decrement inventory helper (same as in thank-you page)
async function decrementInventory(cartItems: Array<{
  productId: string;
  variantId?: string;
  quantity: number;
}>) {
  for (const item of cartItems) {
    // Skip if productId is missing
    if (!item.productId) {
      console.warn(`PayPlus callback: Skipping inventory decrement - missing productId`, item);
      continue;
    }
    
    try {
      if (item.variantId) {
        // Decrement variant inventory
        const [updated] = await db
          .update(productVariants)
          .set({
            inventory: sql`GREATEST(0, ${productVariants.inventory} - ${item.quantity})`,
          })
          .where(eq(productVariants.id, item.variantId))
          .returning({ id: productVariants.id, inventory: productVariants.inventory });
        
        console.log(`PayPlus callback: Decremented variant inventory`, {
          variantId: item.variantId,
          quantity: item.quantity,
          updated: updated ? { id: updated.id, inventory: updated.inventory } : null,
        });
      } else {
        // Decrement product inventory
        const [updated] = await db
          .update(products)
          .set({
            inventory: sql`GREATEST(0, ${products.inventory} - ${item.quantity})`,
          })
          .where(eq(products.id, item.productId))
          .returning({ id: products.id, name: products.name, inventory: products.inventory });
        
        console.log(`PayPlus callback: Decremented product inventory`, {
          productId: item.productId,
          productName: updated?.name,
          quantity: item.quantity,
          updated: updated ? { id: updated.id, name: updated.name, inventory: updated.inventory } : null,
        });
      }
    } catch (error) {
      console.error(`PayPlus callback: Failed to decrement inventory for item`, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Re-throw to ensure we know about failures
    }
  }
}

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
    imageUrl?: string; // Some items might have imageUrl instead of image
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
  
  // Get or create customer - ALWAYS create a customer record for orders
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
      // Update customer info if needed
      await db.update(customers)
        .set({
          lastOrderAt: new Date(),
          orderCount: sql`${customers.orderCount} + 1`,
          totalSpent: sql`${customers.totalSpent} + ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}`,
        })
        .where(eq(customers.id, existingCustomer.id));
    } else {
      // Create new customer from order info
      const orderDataTyped = orderData as {
        customer?: { name?: string; phone?: string };
        shippingAddress?: { firstName?: string; lastName?: string; address?: string; city?: string; zipCode?: string };
      };
      const customerName = orderDataTyped.customer?.name || 
        `${orderDataTyped.shippingAddress?.firstName || ''} ${orderDataTyped.shippingAddress?.lastName || ''}`.trim();
      
      const [newCustomer] = await db.insert(customers).values({
        storeId: pendingPayment.storeId,
        email: pendingPayment.customerEmail,
        firstName: orderDataTyped.shippingAddress?.firstName || customerName.split(' ')[0] || '',
        lastName: orderDataTyped.shippingAddress?.lastName || customerName.split(' ').slice(1).join(' ') || '',
        phone: orderDataTyped.customer?.phone || '',
        address: orderDataTyped.shippingAddress?.address || '',
        city: orderDataTyped.shippingAddress?.city || '',
        zipCode: orderDataTyped.shippingAddress?.zipCode || '',
        orderCount: 1,
        totalSpent: String(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)),
        lastOrderAt: new Date(),
      }).returning();
      
      customerId = newCustomer.id;
      console.log(`PayPlus callback: Created new customer ${customerId} for email ${pendingPayment.customerEmail}`);
    }
  }
  
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = (orderData.shipping as { cost?: number })?.cost || 0;
  const discountAmount = Number(pendingPayment.discountAmount) || 0;
  const creditUsed = Number((orderData as { creditUsed?: number })?.creditUsed) || 0;
  const giftCardCode = (orderData as { giftCardCode?: string })?.giftCardCode;
  const giftCardAmount = Number((orderData as { giftCardAmount?: number })?.giftCardAmount) || 0;
  // Note: giftCardAmount is already included in discountAmount, so we don't subtract it twice
  const totalAmount = subtotal + shippingCost - discountAmount - creditUsed;
  
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
    creditUsed: String(creditUsed),
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
  
  // Create order items and decrement inventory
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
            imageUrl: item.image || item.imageUrl || null,
      }))
    );
    
    // Increment discount usage count (for reports/influencers)
    if (pendingPayment.discountCode) {
      db.update(discounts)
        .set({ usageCount: sql`COALESCE(${discounts.usageCount}, 0) + 1` })
        .where(
          and(
            eq(discounts.storeId, pendingPayment.storeId),
            eq(discounts.code, pendingPayment.discountCode)
          )
        )
        .then(() => {
          console.log(`PayPlus callback: Incremented usage count for coupon ${pendingPayment.discountCode}`);
        })
        .catch(err => {
          console.error(`PayPlus callback: Failed to increment coupon usage:`, err);
        });
    }
    
    // Decrement inventory (non-blocking for speed - fire and forget)
    // Note: We don't await to keep response fast, but we log errors
    decrementInventory(cartItems).then(() => {
      console.log(`PayPlus callback: Inventory decremented for order ${orderNumber}`);
    }).catch(err => {
      console.error('PayPlus callback: Failed to decrement inventory:', err);
      // Don't fail the order creation, but log the error
    });
    
    // Check for low stock and emit events (non-blocking, fire-and-forget)
    // Note: We check inventory AFTER decrement, so we need to account for the decrement
    Promise.all(
      cartItems.map(async (item) => {
        try {
          if (item.variantId) {
            const [variant] = await db
              .select({ id: productVariants.id, inventory: productVariants.inventory })
              .from(productVariants)
              .where(eq(productVariants.id, item.variantId))
              .limit(1);
            
            if (variant && variant.inventory !== null) {
              const [product] = await db
                .select({ id: products.id, name: products.name })
                .from(products)
                .where(eq(products.id, item.productId))
                .limit(1);
              
              if (product) {
                emitLowStock(pendingPayment.storeId, product.id, product.name, variant.inventory);
              }
            }
          } else {
            const [product] = await db
              .select({ id: products.id, name: products.name, inventory: products.inventory })
              .from(products)
              .where(eq(products.id, item.productId))
              .limit(1);
            
            if (product && product.inventory !== null) {
              emitLowStock(pendingPayment.storeId, product.id, product.name, product.inventory);
            }
          }
        } catch (err) {
          console.error(`Failed to check low stock for item ${item.productId}:`, err);
        }
      })
    ).catch(err => console.error('Failed to check low stock:', err));
  }
  
  // Handle gift card if used
  if (giftCardCode && giftCardAmount > 0) {
    const [giftCard] = await db
      .select()
      .from(giftCards)
      .where(
        and(
          eq(giftCards.storeId, pendingPayment.storeId),
          eq(giftCards.code, giftCardCode),
          eq(giftCards.status, 'active')
        )
      )
      .limit(1);
    
    if (giftCard) {
      const currentBalance = Number(giftCard.currentBalance) || 0;
      const newBalance = Math.max(0, currentBalance - giftCardAmount);
      
      // Update gift card balance
      await db
        .update(giftCards)
        .set({
          currentBalance: newBalance.toFixed(2),
          lastUsedAt: new Date(),
          status: newBalance <= 0 ? 'used' : 'active',
        })
        .where(eq(giftCards.id, giftCard.id));
      
      // Create gift card transaction
      await db.insert(giftCardTransactions).values({
        giftCardId: giftCard.id,
        orderId: order.id,
        amount: (-giftCardAmount).toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        note: `הזמנה #${orderNumber}`,
      });
    }
  }
  
  // Send order confirmation email (fire-and-forget for speed)
  const customerName = (orderData.customer as { firstName?: string; lastName?: string }) 
    ? `${(orderData.customer as { firstName?: string }).firstName || ''} ${(orderData.customer as { lastName?: string }).lastName || ''}`.trim()
    : order.customerName || 'לקוח יקר';
  
  sendOrderConfirmationEmail({
    orderNumber,
    customerName,
    customerEmail: order.customerEmail || '',
    items: cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || undefined,
      variantTitle: item.variantTitle || undefined,
    })),
    subtotal,
    shippingAmount: shippingCost,
    discountAmount,
    creditUsed,
    total: totalAmount,
    shippingAddress: orderData.shippingAddress as { address?: string; city?: string; firstName?: string; lastName?: string; phone?: string; } || undefined,
    storeName: store.name,
    storeSlug: store.slug,
    paymentInfo: {
      lastFour: cardInfo.lastFour,
      brand: cardInfo.brand,
      approvalNum: approvalNumber,
    },
  }).catch(err => console.error('Failed to send order confirmation email:', err));
  
  // Emit order.created event (fire-and-forget, non-blocking)
  emitOrderCreated(
    pendingPayment.storeId,
    order.id,
    orderNumber,
    order.customerEmail || '',
    totalAmount,
    cartItems.length
  );
  
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
    // PayPlus might send JSON or form data, try both
    let body: unknown;
    let bodyText = '';
    
    try {
      bodyText = await request.text();
      
      // Try to parse as JSON first
      try {
        body = JSON.parse(bodyText);
      } catch {
        // If JSON parsing fails, try to parse as URL-encoded form data
        const formData = new URLSearchParams(bodyText);
        const bodyObj: Record<string, unknown> = {};
        formData.forEach((value, key) => {
          bodyObj[key] = value;
        });
        body = bodyObj;
        console.log('PayPlus callback: Parsed as form data instead of JSON');
      }
    } catch (error) {
      console.error('PayPlus callback: Failed to parse body', {
        error: error instanceof Error ? error.message : String(error),
        bodyPreview: bodyText.substring(0, 200),
        contentType: request.headers.get('content-type'),
      });
      return NextResponse.json({ success: false, error: 'Invalid body format' }, { status: 400 });
    }
    
    // Log raw body for debugging
    console.log('PayPlus callback raw body:', JSON.stringify(body, null, 2));
    
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
      rawBody: body,
    });
    
    // Find pending payment - try by requestId first, then by orderReference
    let pendingPayment = null;
    
    if (parsed.providerRequestId) {
      // Normal flow - find by requestId
      const [found] = await db
        .select()
        .from(pendingPayments)
        .where(
          and(
            eq(pendingPayments.storeId, store.id),
            eq(pendingPayments.providerRequestId, parsed.providerRequestId),
            eq(pendingPayments.status, 'pending')
          )
        )
        .limit(1);
      
      pendingPayment = found || null;
    }
    
    // Fallback: try to find by orderReference if requestId not found
    if (!pendingPayment && parsed.orderReference) {
      console.log(`PayPlus callback: No requestId, trying to find by orderReference: ${parsed.orderReference}`);
      
      const allPending = await db
        .select()
        .from(pendingPayments)
        .where(
          and(
            eq(pendingPayments.storeId, store.id),
            eq(pendingPayments.status, 'pending')
          )
        )
        .limit(100);
      
      // Try to match by orderReference in orderData
      const matchingPayment = allPending.find(p => {
        const orderData = p.orderData as Record<string, unknown>;
        const orderRef = (orderData as { orderReference?: string })?.orderReference;
        return orderRef === parsed.orderReference;
      });
      
      if (matchingPayment) {
        console.log(`PayPlus callback: Found pending payment by orderReference: ${matchingPayment.id}`);
        pendingPayment = matchingPayment;
      }
    }
    
    if (!pendingPayment) {
      console.error(`PayPlus callback: Pending payment not found`, {
        requestId: parsed.providerRequestId,
        orderReference: parsed.orderReference,
        storeId: store.id,
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
    
    // Handle successful payment
    if (parsed.success) {
      // Validate amount matches (security check)
      const orderData = pendingPayment.orderData as Record<string, unknown>;
      const cartItems = pendingPayment.cartItems as Array<{
        price: number;
        quantity: number;
      }>;
      const calculatedSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingCost = (orderData.shipping as { cost?: number })?.cost || 0;
      const discountAmount = Number(pendingPayment.discountAmount) || 0;
      const creditUsed = Number((orderData as { creditUsed?: number })?.creditUsed) || 0;
      const calculatedTotal = calculatedSubtotal + shippingCost - discountAmount - creditUsed;
      
      // SECURITY: Validate amount matches (critical for payment security)
      // Allow small rounding differences (0.01) for floating point precision
      const amountDifference = Math.abs(parsed.amount - calculatedTotal);
      if (amountDifference > 0.01) {
        console.error(`PayPlus callback: SECURITY WARNING - Amount mismatch! Expected ${calculatedTotal}, got ${parsed.amount}`);
        // In production, reject mismatched amounts to prevent fraud
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ 
            success: false, 
            error: 'Amount mismatch - payment rejected for security' 
          }, { status: 400 });
        }
        // In development, log but continue (for testing)
        console.warn('PayPlus callback: Continuing in development mode despite amount mismatch');
      }
      
      // SECURITY: Check if order already exists (idempotency - prevent duplicate orders)
      if (pendingPayment.orderId) {
        const existingOrder = await db
          .select()
          .from(orders)
          .where(eq(orders.id, pendingPayment.orderId))
          .limit(1);
        
        if (existingOrder.length > 0) {
          console.log(`PayPlus callback: Order already exists: ${pendingPayment.orderId}, returning existing order`);
          return NextResponse.json({
            success: true,
            orderId: existingOrder[0].id,
            orderNumber: existingOrder[0].orderNumber,
            alreadyExists: true,
          });
        }
      }
      
      // Create order (only after all security validations pass)
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
      if (requestIdToUse) {
        await db
          .update(paymentTransactions)
          .set({
            orderId: order.id,
          })
          .where(
            and(
              eq(paymentTransactions.storeId, store.id),
              eq(paymentTransactions.providerRequestId, requestIdToUse)
            )
          );
      }
      
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

