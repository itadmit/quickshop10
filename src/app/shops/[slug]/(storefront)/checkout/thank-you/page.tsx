import { headers } from 'next/headers';
/**
 * Thank You Page - SINGLE SOURCE OF TRUTH for Order Creation
 * SERVER COMPONENT for speed - handles redirects from payment gateways
 * 
 * MODULAR ARCHITECTURE:
 * - Payment providers (PayPlus, etc.) ONLY handle payment verification
 * - This page handles ALL business logic in one place:
 *   1. Order creation
 *   2. Customer creation/update
 *   3. Discount/coupon usage tracking
 *   4. Inventory decrement
 *   5. Gift card handling
 *   6. Email notifications
 *   7. Event emissions (webhooks, notifications)
 *   8. Cart clearing
 *   9. Loyalty points earning
 * 
 * This ensures consistent behavior regardless of payment provider.
 */

import { db } from '@/lib/db';
import { orders, orderItems, products, pendingPayments, stores, customers, productVariants, giftCards, giftCardTransactions, productImages, discounts, automaticDiscounts, influencerSales, influencers, customerCreditTransactions, inventoryLogs } from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, PackageIcon, CreditCardIcon, MapPinIcon, ArrowLeftIcon, TagIcon, GiftIcon } from '@/components/admin/icons';
import { nanoid } from 'nanoid';
import { TrackPurchase } from '@/components/tracking-events';
import { ClearCartOnLoad } from './clear-cart';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { emitOrderCreated, emitLowStock } from '@/lib/events';
import { ProductImage } from '@/components/product-image';
import { formatPrice } from '@/lib/format-price';
import { addPointsFromOrder } from '@/lib/actions/loyalty';
import { autoSendShipmentOnPayment } from '@/lib/shipping/auto-send';
import { parseRedirectParams, isSuccessfulRedirect } from '@/lib/payments/factory';
import { executePostPaymentActions, type CartItem, type OrderData } from '@/lib/orders/post-payment';
import { calculateItemDiscounts } from '@/lib/order-item-discount';
import { getUITranslations, detectLocaleWithGeo, getDirection } from '@/lib/translations';
import { hebrewTranslations } from '@/lib/translations/defaults/he';
import type { SupportedLocale, UITranslations } from '@/lib/translations/types';
import { cookies } from 'next/headers';

interface ThankYouPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// Decrement inventory for order items
async function decrementInventory(
  cartItems: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>,
  storeId: string,
  orderId?: string
) {
  for (const item of cartItems) {
    // Skip if productId is missing
    if (!item.productId) {
      console.warn(`Thank you page: Skipping inventory decrement - missing productId`, item);
      continue;
    }
    
    try {
      if (item.variantId) {
        // Get current inventory before decrement
        const [current] = await db
          .select({ inventory: productVariants.inventory })
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId))
          .limit(1);
        
        const previousQuantity = current?.inventory ?? 0;
        
        // Decrement variant inventory
        const [updated] = await db
          .update(productVariants)
          .set({
            inventory: sql`GREATEST(0, ${productVariants.inventory} - ${item.quantity})`,
          })
          .where(eq(productVariants.id, item.variantId))
          .returning({ id: productVariants.id, inventory: productVariants.inventory });
        
        // Log the inventory change
        if (updated) {
          await db.insert(inventoryLogs).values({
            storeId,
            productId: item.productId,
            variantId: item.variantId,
            previousQuantity,
            newQuantity: updated.inventory ?? 0,
            changeAmount: (updated.inventory ?? 0) - previousQuantity,
            reason: 'order',
            orderId: orderId || null,
            changedByName: 'הזמנה',
          });
        }
        
        console.log(`Thank you page: Decremented variant inventory`, {
          variantId: item.variantId,
          quantity: item.quantity,
          updated: updated ? { id: updated.id, inventory: updated.inventory } : null,
        });
      } else {
        // Get current inventory before decrement
        const [current] = await db
          .select({ inventory: products.inventory })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);
        
        const previousQuantity = current?.inventory ?? 0;
        
        // Decrement product inventory
        const [updated] = await db
          .update(products)
          .set({
            inventory: sql`GREATEST(0, ${products.inventory} - ${item.quantity})`,
          })
          .where(eq(products.id, item.productId))
          .returning({ id: products.id, name: products.name, inventory: products.inventory });
        
        // Log the inventory change
        if (updated) {
          await db.insert(inventoryLogs).values({
            storeId,
            productId: item.productId,
            variantId: null,
            previousQuantity,
            newQuantity: updated.inventory ?? 0,
            changeAmount: (updated.inventory ?? 0) - previousQuantity,
            reason: 'order',
            orderId: orderId || null,
            changedByName: 'הזמנה',
          });
        }
        
        console.log(`Thank you page: Decremented product inventory`, {
          productId: item.productId,
          productName: updated?.name,
          quantity: item.quantity,
          updated: updated ? { id: updated.id, name: updated.name, inventory: updated.inventory } : null,
        });
      }
    } catch (error) {
      console.error(`Thank you page: Failed to decrement inventory for item`, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Re-throw to ensure we know about failures
    }
  }
}

export default async function ThankYouPage({ params, searchParams }: ThankYouPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  
  // Check for custom domain - compute basePath early for redirects
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // ========== PROVIDER-AGNOSTIC PAYMENT PARSING ==========
  // Parse redirect params using the appropriate provider (PayPlus or Pelecard)
  const paymentResult = parseRedirectParams(search);
  const isPaymentSuccessful = paymentResult?.success || isSuccessfulRedirect(search);
  
  console.log(`Thank you page: Payment result:`, {
    provider: paymentResult ? 'detected' : 'none',
    success: paymentResult?.success,
    statusCode: paymentResult?.statusCode,
    orderReference: paymentResult?.orderReference,
    isPaymentSuccessful,
  });
  
  // Get order reference from query params (fallback to parsed result)
  const orderReference = search.more_info || search.ref || paymentResult?.orderReference;
  // Note: For PayPal, search.token is the order ID which we store as providerRequestId
  const pageRequestUid = search.page_request_uid || search.token || paymentResult?.requestId;
  
  // Check payment status (for backwards compatibility with PayPlus)
  const paymentStatus = search.status;
  const statusCode = search.status_code || paymentResult?.statusCode;
  
  // If payment explicitly failed, redirect back to checkout
  // Only redirect if we have explicit failure indicators (not just missing success)
  if (paymentStatus === 'rejected' || paymentStatus === 'error') {
    redirect(`${basePath}/checkout?error=payment_failed`);
  }
  
  // For Pelecard, check PelecardStatusCode explicitly for failure
  if (search.PelecardStatusCode && search.PelecardStatusCode !== '000') {
    redirect(`${basePath}/checkout?error=payment_failed`);
  }
  
  // ========== PAYPAL SPECIAL HANDLING ==========
  // PayPal requires capture after customer approval (unlike other providers)
  // Check for PayPal params: token (order ID) and PayerID
  const paypalOrderId = search.token;
  const paypalPayerId = search.PayerID || search.payerId;
  let paypalCaptureResult: { success: boolean; captureId?: string; error?: string } | null = null;
  
  if (paypalOrderId && paypalPayerId) {
    console.log(`Thank you page: PayPal detected - capturing order ${paypalOrderId}`);
    
    try {
      // Call capture API
      const captureResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paypal/capture`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeSlug: slug,
            orderId: paypalOrderId,
            payerId: paypalPayerId,
          }),
        }
      );
      
      const captureData = await captureResponse.json();
      
      if (captureData.success || captureData.alreadyCaptured) {
        paypalCaptureResult = { 
          success: true, 
          captureId: captureData.captureId 
        };
        console.log(`Thank you page: PayPal capture successful - captureId: ${captureData.captureId}`);
      } else {
        paypalCaptureResult = { 
          success: false, 
          error: captureData.error || 'Capture failed' 
        };
        console.error(`Thank you page: PayPal capture failed - ${captureData.error}`);
        // Redirect to checkout with error
        redirect(`${basePath}/checkout?error=paypal_capture_failed`);
      }
    } catch (error) {
      console.error(`Thank you page: PayPal capture error`, error);
      redirect(`${basePath}/checkout?error=paypal_capture_failed`);
    }
  }
  
  // Get store
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);
  
  if (!store) {
    notFound();
  }
  
  // Get price display settings
  const storeSettings = (store.settings as Record<string, unknown>) || {};
  const showDecimalPrices = Boolean(storeSettings.showDecimalPrices);
  const format = (p: number | string | null | undefined) => formatPrice(p, { showDecimal: showDecimalPrices });
  
  // 🌍 Get translations with geo-detection (only loads from DB if needed)
  const supportedLocales = (store.supportedLocales as SupportedLocale[]) || ['he'];
  const defaultLocale = (store.defaultLocale as SupportedLocale) || 'he';
  const hasMultipleLocales = supportedLocales.length > 1;
  const hasCustomTranslations = Boolean(store.hasCustomTranslations);
  
  // ⚡ FAST: Detect locale using Vercel geo headers (zero latency)
  let locale: SupportedLocale = defaultLocale;
  if (hasMultipleLocales) {
    const headersList = await headers();
    const cookieStore = await cookies();
    
    locale = detectLocaleWithGeo({
      cookieLocale: cookieStore.get('preferred_locale')?.value,
      countryCode: headersList.get('x-vercel-ip-country'),
      acceptLanguage: headersList.get('accept-language') ?? undefined,
      supportedLocales,
      defaultLocale,
    });
  }
  
  let t: UITranslations = hebrewTranslations;
  if (hasMultipleLocales || hasCustomTranslations || locale !== 'he') {
    t = await getUITranslations(store.id, locale);
  }
  
  // Get direction (RTL/LTR) for current locale
  const direction = getDirection(locale);
  
  // First try to find existing order by reference (orderNumber)
  let order = null;
  let isNewOrder = false;
  let pendingPayment: typeof pendingPayments.$inferSelect | null = null;
  
  if (orderReference) {
    // Try to find order by orderNumber in the current store
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.storeId, store.id),
          eq(orders.orderNumber, orderReference)
        )
      )
      .limit(1);
    
    if (existingOrder) {
      console.log(`Thank you page: Found order ${existingOrder.orderNumber}, status: ${existingOrder.status}, financialStatus: ${existingOrder.financialStatus}`);
      
      // ========== KEY FIX: Update pending order to PAID if payment was successful ==========
      if (existingOrder.financialStatus === 'pending' && isPaymentSuccessful) {
        console.log(`Thank you page: Order ${existingOrder.orderNumber} is pending - updating to PAID`);
        
        // Find the pending payment for this order to get cart items and other data
        const [foundPendingPayment] = await db
          .select()
          .from(pendingPayments)
          .where(
            and(
              eq(pendingPayments.storeId, store.id),
              eq(pendingPayments.orderId, existingOrder.id),
              eq(pendingPayments.status, 'pending')
            )
          )
          .limit(1);
        
        if (foundPendingPayment) {
          pendingPayment = foundPendingPayment;
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
            imageUrl?: string;
            isGiftCard?: boolean;
            giftCardDetails?: {
              recipientName: string;
              recipientEmail: string;
              senderName?: string;
              message?: string;
            };
          }>;
          
          // Get payment details from callback (saved by callback route, especially for Pelecard)
          const savedPaymentDetails = (orderData.paymentDetails || {}) as {
            cardLastFour?: string;
            cardBrand?: string;
            transactionId?: string;
            approvalNumber?: string;
          };
          
          // UPDATE order to PAID!
          const [updatedOrder] = await db.update(orders)
            .set({
              status: 'confirmed',
              financialStatus: 'paid',
              paymentMethod: 'credit_card',
              paymentDetails: {
                provider: pendingPayment.provider,
                transactionId: paymentResult?.transactionId || search.transaction_uid || savedPaymentDetails.transactionId,
                approvalNumber: paymentResult?.approvalNumber || search.approval_num || search.ApprovalNo || savedPaymentDetails.approvalNumber,
                cardBrand: paymentResult?.cardBrand || search.brand_name || savedPaymentDetails.cardBrand,
                cardLastFour: paymentResult?.cardLastFour || search.four_digits || savedPaymentDetails.cardLastFour,
              },
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(orders.id, existingOrder.id))
            .returning();
          
          order = updatedOrder;
          isNewOrder = true; // Trigger post-payment logic
          
          console.log(`Thank you page: Updated order ${order.orderNumber} to PAID via direct order lookup`);
          
          // Update pending payment status to completed
          await db.update(pendingPayments)
            .set({ 
              status: 'completed',
              completedAt: new Date(),
            })
            .where(eq(pendingPayments.id, pendingPayment.id));
          
          // Update customer stats
          if (existingOrder.customerId) {
            const totalSpent = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            await db.update(customers)
              .set({
                updatedAt: new Date(),
                totalOrders: sql`COALESCE(${customers.totalOrders}, 0) + 1`,
                totalSpent: sql`COALESCE(${customers.totalSpent}, 0) + ${totalSpent}`,
              })
              .where(eq(customers.id, existingOrder.customerId));
          }
          
          // ========== POST-PAYMENT LOGIC (CENTRALIZED) ==========
          // All post-payment actions in one place - DRY principle
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
              customerId: existingOrder.customerId,
              discountDetails: updatedOrder.discountDetails,
            },
            cartItems: cartItems as CartItem[],
            orderData: orderData as OrderData,
            discountCode: pendingPayment.discountCode,
            discountAmount: Number(pendingPayment.discountAmount) || 0,
            paymentInfo: {
              lastFour: paymentResult?.cardLastFour || search.four_digits || savedPaymentDetails.cardLastFour,
              brand: paymentResult?.cardBrand || search.brand_name || savedPaymentDetails.cardBrand,
              approvalNum: paymentResult?.approvalNumber || search.approval_num || search.ApprovalNo || savedPaymentDetails.approvalNumber,
            },
          }).catch(err => console.error('Thank you page: Post-payment actions failed:', err));
        } else {
          // No pending payment found, but order is pending - just mark as paid without cart items
          console.log(`Thank you page: No pending payment found for order ${existingOrder.orderNumber}, marking as paid anyway`);
          
          const [updatedOrder] = await db.update(orders)
            .set({
              status: 'confirmed',
              financialStatus: 'paid',
              paymentMethod: 'credit_card',
              paymentDetails: {
                provider: paymentResult ? 'detected' : 'unknown',
                transactionId: paymentResult?.transactionId || search.transaction_uid || search.PelecardTransactionId,
                approvalNumber: paymentResult?.approvalNumber || search.approval_num || search.ApprovalNo,
              },
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(orders.id, existingOrder.id))
            .returning();
          
          order = updatedOrder;
          console.log(`Thank you page: Updated order ${order.orderNumber} to PAID (no pending payment)`);
          
          // 🔧 FIX: Auto-send shipment even when no pending payment found
          autoSendShipmentOnPayment(store.id, updatedOrder.id)
            .then(result => {
              if (result.success) {
                console.log(`Thank you page: Auto-sent shipment for order ${updatedOrder.orderNumber}, tracking: ${result.trackingNumber}`);
              } else if (result.error !== 'Auto-send is disabled' && result.error !== 'No default shipping provider') {
                console.error(`Thank you page: Failed to auto-send shipment: ${result.error}`);
              }
            })
            .catch(err => console.error('Thank you page: Auto-send error:', err));
        }
      } else if (existingOrder.financialStatus === 'paid') {
        // Order already paid - just show it
        console.log(`Thank you page: Order ${existingOrder.orderNumber} already paid, showing thank you`);
        order = existingOrder;
      } else {
        // Order exists but in other status - just show it
        order = existingOrder;
      }
    }
  }
  
  // If no order found by reference, check pending payments by pageRequestUid
  if (!order && pageRequestUid) {
    console.log(`Thank you page: Looking for pending payment with pageRequestUid=${pageRequestUid}, storeId=${store.id}`);
    
    // Find pending payment by provider request ID
    const [foundPendingPayment] = await db
      .select()
      .from(pendingPayments)
      .where(
        and(
          eq(pendingPayments.storeId, store.id),
          eq(pendingPayments.providerRequestId, pageRequestUid),
          eq(pendingPayments.status, 'pending')
        )
      )
      .limit(1);
    
    pendingPayment = foundPendingPayment;
    console.log(`Thank you page: Found pending payment: ${pendingPayment ? 'YES' : 'NO'}, orderId: ${pendingPayment?.orderId || 'none'}`);
    
    if (pendingPayment && isPaymentSuccessful) {
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
        imageUrl?: string;
        isGiftCard?: boolean;
        giftCardDetails?: {
          recipientName: string;
          recipientEmail: string;
          senderName?: string;
          message?: string;
        };
      }>;
      
      // ========== UPDATE EXISTING ORDER TO PAID ==========
      // Order was already created in /api/payments/initiate with pending status
      if (pendingPayment.orderId) {
        const [existingOrder] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, pendingPayment.orderId))
          .limit(1);
        
        if (existingOrder) {
          // Check if already paid (idempotency)
          if (existingOrder.financialStatus === 'paid') {
            console.log(`Thank you page: Order ${existingOrder.orderNumber} already paid, showing thank you`);
            order = existingOrder;
          } else {
            // UPDATE order to PAID!
            console.log(`Thank you page: Updating order ${existingOrder.orderNumber} to PAID`);
            
            const [updatedOrder] = await db.update(orders)
              .set({
                status: 'confirmed',
                financialStatus: 'paid',
                paymentMethod: 'credit_card',
                paymentDetails: {
                  provider: pendingPayment.provider,
                  transactionId: (orderData.paymentDetails as { transactionId?: string })?.transactionId || search.transaction_uid,
                  approvalNumber: (orderData.paymentDetails as { approvalNumber?: string })?.approvalNumber || search.approval_num,
                  cardBrand: (orderData.paymentDetails as { cardBrand?: string })?.cardBrand || search.brand_name,
                  cardLastFour: (orderData.paymentDetails as { cardLastFour?: string })?.cardLastFour || search.four_digits,
                },
                paidAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(orders.id, existingOrder.id))
              .returning();
            
            order = updatedOrder;
            isNewOrder = true; // Trigger post-payment logic (inventory, emails, etc.)
            
            // Update customer stats
            if (existingOrder.customerId) {
              const totalSpent = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              await db.update(customers)
                .set({
                  updatedAt: new Date(),
                  totalOrders: sql`COALESCE(${customers.totalOrders}, 0) + 1`,
                  totalSpent: sql`COALESCE(${customers.totalSpent}, 0) + ${totalSpent}`,
                })
                .where(eq(customers.id, existingOrder.customerId));
            }
            
            // ========== POST-PAYMENT LOGIC (CENTRALIZED) ==========
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
                customerId: existingOrder.customerId,
                discountDetails: updatedOrder.discountDetails,
              },
              cartItems: cartItems as CartItem[],
              orderData: orderData as OrderData,
              discountCode: pendingPayment.discountCode,
              discountAmount: Number(pendingPayment.discountAmount) || 0,
              paymentInfo: {
                lastFour: search.four_digits,
                brand: search.brand_name,
                approvalNum: search.approval_num,
              },
            }).catch(err => console.error('Thank you page: Post-payment actions failed:', err));
          }
          
          // Update pending payment status
          await db.update(pendingPayments)
            .set({
              status: 'completed',
              completedAt: new Date(),
            })
            .where(eq(pendingPayments.id, pendingPayment.id));
        }
      }
      
      // ========== FALLBACK: Create order if not linked (legacy flow) ==========
      if (!order) {
        console.log(`Thank you page: No linked order found, creating new order (legacy flow)`);
        
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
          const [existingCustomer] = await db
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.storeId, store.id),
                eq(customers.email, pendingPayment.customerEmail)
              )
            )
            .limit(1);
          
          if (existingCustomer) {
            customerId = existingCustomer.id;
            await db.update(customers)
              .set({
                updatedAt: new Date(),
                totalOrders: sql`COALESCE(${customers.totalOrders}, 0) + 1`,
                totalSpent: sql`COALESCE(${customers.totalSpent}, 0) + ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}`,
              })
              .where(eq(customers.id, existingCustomer.id));
          } else {
            const orderDataTyped = orderData as {
              customer?: { name?: string; phone?: string };
              shippingAddress?: { firstName?: string; lastName?: string; address?: string; city?: string; zipCode?: string };
            };
            const customerName = orderDataTyped.customer?.name || 
              `${orderDataTyped.shippingAddress?.firstName || ''} ${orderDataTyped.shippingAddress?.lastName || ''}`.trim();
            
            const [newCustomer] = await db.insert(customers).values({
              storeId: store.id,
              email: pendingPayment.customerEmail,
              firstName: orderDataTyped.shippingAddress?.firstName || customerName.split(' ')[0] || '',
              lastName: orderDataTyped.shippingAddress?.lastName || customerName.split(' ').slice(1).join(' ') || '',
              phone: orderDataTyped.customer?.phone || '',
              defaultAddress: {
                address: orderDataTyped.shippingAddress?.address || '',
                city: orderDataTyped.shippingAddress?.city || '',
                zipCode: orderDataTyped.shippingAddress?.zipCode || '',
              },
              totalOrders: 1,
              totalSpent: String(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)),
            }).returning();
            
            customerId = newCustomer.id;
          }
        }
        
        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = (orderData.shipping as { cost?: number })?.cost || 0;
        const discountAmount = Number(pendingPayment.discountAmount) || 0;
        const creditUsed = Number((orderData as { creditUsed?: number })?.creditUsed) || 0;
        const totalAmount = subtotal + shippingCost - discountAmount - creditUsed;
      
        // Create order (legacy fallback)
        const [newOrder] = await db.insert(orders).values({
          storeId: store.id,
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
          customerEmail: pendingPayment.customerEmail || search.customer_email || '',
          customerName: (orderData.customer as { name?: string })?.name || search.customer_name || '',
          customerPhone: (orderData.customer as { phone?: string })?.phone || '',
          shippingAddress: orderData.shippingAddress as Record<string, unknown> || {},
          billingAddress: orderData.billingAddress as Record<string, unknown> || orderData.shippingAddress as Record<string, unknown> || {},
          paymentMethod: 'credit_card',
          paymentDetails: {
            provider: pendingPayment.provider,
            transactionId: (orderData.paymentDetails as { transactionId?: string })?.transactionId || search.transaction_uid,
            approvalNumber: (orderData.paymentDetails as { approvalNumber?: string })?.approvalNumber || search.approval_num,
            cardBrand: (orderData.paymentDetails as { cardBrand?: string })?.cardBrand || search.brand_name,
            cardLastFour: (orderData.paymentDetails as { cardLastFour?: string })?.cardLastFour || search.four_digits,
          },
          discountCode: pendingPayment.discountCode,
          influencerId: pendingPayment.influencerId,
          paidAt: new Date(),
        }).returning();
        
        // Create order items (only for legacy flow - new flow already has items)
        if (cartItems.length > 0) {
          console.log(`Thank you page: Creating ${cartItems.length} order items for order ${newOrder.id}`);
          
          try {
            await db.insert(orderItems).values(
              cartItems.map(item => {
                // Calculate item total including addons
                const addonTotal = (item as { addonTotal?: number }).addonTotal || 0;
                const itemTotal = (item.price + addonTotal) * item.quantity;
                
                const typedItem = item as { 
                  addons?: Array<{addonId: string; name: string; value: string; displayValue: string; priceAdjustment: number}>;
                  isBundle?: boolean;
                  bundleComponents?: Array<{name: string; variantTitle?: string; quantity: number}>;
                };
                
                return {
                  orderId: newOrder.id,
                  productId: item.productId,
                  name: item.name,
                  variantTitle: item.variantTitle || null,
                  sku: item.sku || '',
                  price: String(item.price),
                  quantity: item.quantity,
                  total: String(itemTotal),
                  imageUrl: item.image || item.imageUrl || null,
                  // Store addons and bundle components in properties field
                  properties: {
                    addons: typedItem.addons || [],
                    addonTotal: addonTotal,
                    bundleComponents: typedItem.bundleComponents || [],
                  },
                };
              })
            );
            
            // Verify items were created
            const createdItemsCount = await db
              .select({ count: sql<number>`count(*)` })
              .from(orderItems)
              .where(eq(orderItems.orderId, newOrder.id));
            
            const count = Number(createdItemsCount[0]?.count) || 0;
            console.log(`Thank you page: Successfully created ${count} order items for order ${orderNumber}`);
            
            if (count === 0) {
              console.error(`Thank you page: CRITICAL - Order ${orderNumber} has 0 items after insert!`);
            }
          } catch (insertError) {
            console.error(`Thank you page: CRITICAL - Failed to insert order items for order ${orderNumber}:`, insertError);
            // Don't throw - order is already created, items can be recovered from pending_payments
          }
        } else {
          console.warn(`Thank you page: No cart items to create for order ${orderNumber}`);
        }
        
        // Increment discount usage count (for reports/influencers)
        const discountCodeForUpdate = pendingPayment.discountCode;
        if (discountCodeForUpdate) {
          db.update(discounts)
            .set({ usageCount: sql`COALESCE(${discounts.usageCount}, 0) + 1` })
            .where(
              and(
                eq(discounts.storeId, store.id),
                eq(discounts.code, discountCodeForUpdate)
              )
            )
            .then(() => {
              console.log(`Thank you page: Incremented usage count for coupon ${discountCodeForUpdate}`);
            })
            .catch(err => {
              console.error(`Thank you page: Failed to increment coupon usage:`, err);
            });
        }
        
        // Increment automatic discount usage counts (non-blocking)
        const legacyAutoDiscounts = (orderData as { autoDiscounts?: Array<{ id: string; name: string }> })?.autoDiscounts || [];
        if (legacyAutoDiscounts.length > 0) {
          const autoDiscountIds = legacyAutoDiscounts.map(d => d.id);
          db.update(automaticDiscounts)
            .set({ usageCount: sql`COALESCE(${automaticDiscounts.usageCount}, 0) + 1` })
            .where(inArray(automaticDiscounts.id, autoDiscountIds))
            .then(() => {
              console.log(`Thank you page: Incremented usage count for ${autoDiscountIds.length} automatic discounts`);
            })
            .catch(err => {
              console.error(`Thank you page: Failed to increment automatic discount usage:`, err);
            });
        }
        
        // Create influencer sale record if coupon is linked to an influencer (non-blocking for speed)
        if (discountCodeForUpdate) {
          // Find influencer linked to this coupon by checking influencers.discountId
          db.select({
            influencerId: influencers.id,
            commissionType: influencers.commissionType,
            commissionValue: influencers.commissionValue,
            discountId: discounts.id,
          })
            .from(discounts)
            .innerJoin(influencers, eq(influencers.discountId, discounts.id))
            .where(
              and(
                eq(discounts.storeId, store.id),
                eq(discounts.code, discountCodeForUpdate),
                eq(influencers.isActive, true)
              )
            )
            .limit(1)
            .then(async ([result]) => {
              if (!result) {
                console.log(`Thank you page: No influencer linked to coupon ${discountCodeForUpdate}`);
                return;
              }
              
              const commissionType = result.commissionType || 'percentage';
              const commissionValue = Number(result.commissionValue) || 0;
              
              // Calculate commission
              let commissionAmount = 0;
              if (commissionType === 'percentage') {
                commissionAmount = (totalAmount * commissionValue) / 100;
              } else {
                commissionAmount = commissionValue;
              }
              
              // Create influencer sale record
              await db.insert(influencerSales).values({
                influencerId: result.influencerId,
                orderId: newOrder.id,
                orderTotal: String(totalAmount),
                commissionAmount: String(commissionAmount),
                netCommission: String(commissionAmount),
                status: 'pending',
              });
              
              // Update influencer stats
              await db.update(influencers)
                .set({
                  totalSales: sql`COALESCE(${influencers.totalSales}, 0) + ${totalAmount}`,
                  totalCommission: sql`COALESCE(${influencers.totalCommission}, 0) + ${commissionAmount}`,
                  totalOrders: sql`COALESCE(${influencers.totalOrders}, 0) + 1`,
                  updatedAt: new Date(),
                })
                .where(eq(influencers.id, result.influencerId));
              
              console.log(`Thank you page: Created influencer sale for ${result.influencerId}, commission: ${commissionAmount}`);
            })
            .catch(err => {
              console.error(`Thank you page: Failed to create influencer sale:`, err);
            });
        }
        
        // Decrement inventory with logging (non-blocking for speed - fire and forget)
        decrementInventory(cartItems, store.id, newOrder.id).catch(err => {
          console.error('Failed to decrement inventory:', err);
        });
        
        // Handle gift card if used
        const giftCardCode = (orderData as { giftCardCode?: string })?.giftCardCode;
        const giftCardAmount = Number((orderData as { giftCardAmount?: number })?.giftCardAmount) || 0;
        if (giftCardCode && giftCardAmount > 0) {
          const [giftCard] = await db
            .select()
            .from(giftCards)
            .where(
              and(
                eq(giftCards.storeId, store.id),
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
              orderId: newOrder.id,
              amount: (-giftCardAmount).toFixed(2),
              balanceAfter: newBalance.toFixed(2),
              note: `הזמנה #${orderNumber}`,
            });
          }
        }
        
        // Deduct customer credit if used
        if (creditUsed > 0 && customerId) {
          const [currentCustomer] = await db
            .select({ creditBalance: customers.creditBalance })
            .from(customers)
            .where(eq(customers.id, customerId))
            .limit(1);
          
          if (currentCustomer) {
            const currentBalance = Number(currentCustomer.creditBalance) || 0;
            const newBalance = Math.max(0, currentBalance - creditUsed);
            
            // Update customer credit balance
            await db.update(customers)
              .set({ creditBalance: newBalance.toFixed(2) })
              .where(eq(customers.id, customerId));
            
            // Create credit transaction record
            await db.insert(customerCreditTransactions).values({
              customerId,
              storeId: store.id,
              type: 'debit',
              amount: (-creditUsed).toFixed(2),
              balanceAfter: newBalance.toFixed(2),
              reason: `שימוש בקרדיט בהזמנה #${orderNumber}`,
              orderId: newOrder.id,
            });
            
            console.log(`Thank you page (legacy flow): Deducted credit ${creditUsed} from customer ${customerId}, new balance: ${newBalance}`);
          }
        }
        
        // Update pending payment status
        await db
          .update(pendingPayments)
          .set({
            status: 'completed',
            orderId: newOrder.id,
            completedAt: new Date(),
          })
          .where(eq(pendingPayments.id, pendingPayment.id));
        
        // Send order confirmation email (don't await - fire and forget for speed)
        sendOrderConfirmationEmail({
          orderNumber,
          customerName: newOrder.customerName || search.customer_name || 'לקוח יקר',
          customerEmail: newOrder.customerEmail || '',
          items: cartItems.map(item => {
            const itemWithAddons = item as typeof item & { addons?: Array<{addonId: string; name: string; value: string; displayValue: string; priceAdjustment: number}>; addonTotal?: number };
            return {
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image || undefined,
            variantTitle: item.variantTitle || undefined,
              addons: itemWithAddons.addons?.map(a => ({
                name: a.name,
                displayValue: a.displayValue,
                priceAdjustment: a.priceAdjustment,
          })),
              addonTotal: itemWithAddons.addonTotal,
            };
          }),
          subtotal,
          shippingAmount: shippingCost,
          discountAmount,
          discountDetails: (newOrder.discountDetails as Array<{type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member'; code?: string; name: string; description?: string; amount: number}>) || undefined,
          creditUsed,
          total: totalAmount,
          shippingAddress: orderData.shippingAddress as { address?: string; city?: string; firstName?: string; lastName?: string; phone?: string; } || undefined,
          storeName: store.name,
          storeSlug: store.slug,
          paymentInfo: {
            lastFour: (orderData.paymentDetails as { cardLastFour?: string })?.cardLastFour || search.four_digits,
            brand: (orderData.paymentDetails as { cardBrand?: string })?.cardBrand || search.brand_name,
            approvalNum: (orderData.paymentDetails as { approvalNumber?: string })?.approvalNumber || search.approval_num,
          },
          freeShippingReason: shippingCost === 0 ? t.checkout.success.free : undefined,
        }).catch(err => console.error('Failed to send order confirmation email:', err));
        
        // Emit order.created event (triggers dashboard notification + mobile push)
        emitOrderCreated(
          store.id,
          store.name,
          newOrder.id,
          orderNumber,
          newOrder.customerEmail || '',
          totalAmount,
          cartItems.length,
          newOrder.customerName || search.customer_name || undefined,
          pendingPayment.discountCode || undefined
        );
        
        // Auto-send shipment if configured (non-blocking)
        autoSendShipmentOnPayment(store.id, newOrder.id)
          .then(result => {
            if (result.success) {
              console.log(`Thank you page (legacy): Auto-sent shipment for order ${orderNumber}, tracking: ${result.trackingNumber}`);
            } else if (result.error !== 'Auto-send is disabled' && result.error !== 'No default shipping provider') {
              console.error(`Thank you page (legacy): Failed to auto-send shipment: ${result.error}`);
            }
          })
          .catch(err => console.error('Thank you page (legacy): Auto-send error:', err));
        
        // Check for low stock and emit events (non-blocking, fire-and-forget)
        Promise.all(
          cartItems.map(async (item) => {
            if (!item.productId) return;
            try {
              const [product] = await db
                .select({ id: products.id, name: products.name, inventory: products.inventory })
                .from(products)
                .where(eq(products.id, item.productId))
                .limit(1);
              
              if (product && product.inventory !== null) {
                emitLowStock(store.id, product.id, product.name, product.inventory);
              }
            } catch (err) {
              console.error('Failed to check low stock:', err);
            }
          })
        ).catch(err => console.error('Failed to check low stock:', err));
        
        order = newOrder;
        isNewOrder = true;
      } // end if (!order) - legacy flow
    } // end if (pendingPayment)
  } // end if (!order && pageRequestUid...)
  
  // If still no order, redirect back to checkout with error
  if (!order) {
    console.error(`Thank you page: No order found for pageRequestUid=${pageRequestUid}, orderReference=${orderReference}`);
    redirect(`${basePath}/checkout?error=order_not_found`);
  }
  
  // Get order items
  const rawItems = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  
  // Fetch product images for items that don't have imageUrl (in parallel for speed)
  const productIdsNeedingImages = rawItems
    .filter(item => !item.imageUrl && item.productId)
    .map(item => item.productId!);
  
  let productImageMap = new Map<string, string>();
  
  if (productIdsNeedingImages.length > 0) {
    try {
      const images = await db
        .select({ 
          productId: productImages.productId,
          url: productImages.url 
        })
        .from(productImages)
        .where(
          and(
            eq(productImages.isPrimary, true),
            inArray(productImages.productId, productIdsNeedingImages)
          )
        );
      
      // Create map from fetched images
      productImageMap = new Map(
        images.map(img => [img.productId, img.url])
      );
    } catch (error) {
      console.error('Failed to fetch product images:', error);
      // Continue without images - not critical
    }
  }
  
  // Map items with images and properties (includes addons)
  const mappedItems = rawItems.map(item => ({
    id: item.id,
    productId: item.productId,
    name: item.name,
    variantTitle: item.variantTitle,
    sku: item.sku,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
    imageUrl: item.imageUrl || (item.productId ? productImageMap.get(item.productId) || null : null),
    properties: item.properties as Record<string, unknown> | null, // Include properties for addon display
  }));
  
  // Calculate per-item discounts (for showing strikethrough prices)
  const items = await calculateItemDiscounts(
    store.id,
    mappedItems,
    order.discountCode,
    order.discountDetails as Array<{type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member'; code?: string; name: string; description?: string; amount: number}> | null
  );

  // Payment info from query params or order
  const paymentDetails = (order.paymentDetails || {}) as Record<string, string>;
  const paymentInfo = {
    lastFour: search.four_digits || paymentDetails.cardLastFour || '',
    brand: search.brand_name || paymentDetails.cardBrand || '',
    approvalNum: search.approval_num || paymentDetails.approvalNumber || '',
    transactionId: search.transaction_uid || paymentDetails.transactionId || '',
  };
  
  // Shipping address
  const shippingAddr = (order.shippingAddress || {}) as Record<string, string>;

  // Prepare tracking data - full OrderData structure
  const trackingOrder = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    value: Number(order.total),
    currency: 'ILS',
    items: items.map(item => ({
      id: item.productId || '',
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    })),
    shippingCost: Number(order.shippingAmount) || undefined,
    discountAmount: Number(order.discountAmount) || undefined,
    couponCode: order.discountCode || undefined,
    paymentMethod: (order.paymentDetails as Record<string, unknown>)?.cardBrand as string || 'credit_card',
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      {/* Purchase Tracking - fires pixel events to all platforms */}
      <TrackPurchase order={trackingOrder} />
      
      {/* Clear cart on load */}
      <ClearCartOnLoad />
      
      {/* Success Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto py-12 px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="text-green-600" size={32} />
          </div>
          <h1 className="font-display text-3xl font-light tracking-wide mb-2">
            {t.checkout.success.thankYou}
          </h1>
          <p className="text-gray-600">
            {t.checkout.success.orderNumber} <span className="font-medium">{order.orderNumber}</span> {t.checkout.success.orderReceived}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t.checkout.success.emailSent} {order.customerEmail}
          </p>
        </div>
      </div>

      {/* Order Details */}
      <div className="max-w-2xl mx-auto py-8 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          
          {/* Items */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <PackageIcon size={20} />
              {t.checkout.success.itemsInOrder}
            </h2>
            <div className="space-y-4">
              {items.map((item) => {
                // Ensure image URL is absolute
                const imageUrl = item.imageUrl 
                  ? (item.imageUrl.startsWith('http') 
                      ? item.imageUrl 
                      : `${process.env.NEXT_PUBLIC_APP_URL || ''}${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`)
                  : null;
                
                return (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    <ProductImage 
                      src={imageUrl}
                      alt={item.name || ''}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    {item.variantTitle && (
                      <p className="text-sm text-gray-500">{item.variantTitle}</p>
                    )}
                    <p className="text-sm text-gray-500">{t.cart.quantity}: {item.quantity}</p>
                    
                    {/* Display addons if present */}
                    {(() => {
                      const props = item.properties as { addons?: Array<{name: string; displayValue: string; priceAdjustment: number}>; addonTotal?: number; bundleComponents?: Array<{name: string; variantTitle?: string; quantity: number}> } | null;
                      return (
                        <>
                          {props?.addons && props.addons.length > 0 && (
                            <div className="mt-1 space-y-0.5 text-xs text-gray-500 bg-gray-50 p-1.5 rounded">
                              {props.addons.map((addon, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span>{addon.name}: <span className="text-gray-700">{addon.displayValue}</span></span>
                                  {addon.priceAdjustment > 0 && (
                                    <span className="text-green-600">+{format(addon.priceAdjustment)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {props?.bundleComponents && props.bundleComponents.length > 0 && (
                            <div className="mt-1 text-xs bg-gray-50 border border-gray-200 p-1.5">
                              <span className="text-gray-700 font-medium">{t.general.includes}:</span>
                              {props.bundleComponents.map((comp, i) => (
                                <p key={i} className="text-gray-600">
                                  • {comp.name}{comp.variantTitle ? ` (${comp.variantTitle})` : ''}{comp.quantity > 1 ? ` ×${comp.quantity}` : ''}
                                </p>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    {/* Price with discount indication */}
                    {item.hasDiscount ? (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-gray-400 line-through">{format(item.total)}</span>
                        <span className="text-sm font-medium text-emerald-600">{format(item.discountedTotal || 0)}</span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">-{item.discountPercent}%</span>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {format(item.total)}
                      </p>
                    )}
                  </div>
                  <div className="text-left font-medium">
                    {item.hasDiscount ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-gray-400 line-through">{format(item.total)}</span>
                        <span className="text-emerald-600">{format(item.discountedTotal || 0)}</span>
                      </div>
                    ) : (
                      format(item.total)
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          {/* Payment Info */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <CreditCardIcon size={20} />
              {t.checkout.success.paymentDetails}
            </h2>
            <div className="space-y-2 text-sm">
              {paymentInfo.lastFour && (
                <p className="text-gray-600">
                  {t.checkout.success.card}: •••• {paymentInfo.lastFour}
                  {paymentInfo.brand && ` (${paymentInfo.brand})`}
                </p>
              )}
              {paymentInfo.approvalNum && (
                <p className="text-gray-600">
                  {t.checkout.success.approval}: {paymentInfo.approvalNum}
                </p>
              )}
              <p className="text-gray-900 font-medium">
                {t.checkout.success.totalPaid}: {format(order.total)}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          {Object.keys(shippingAddr).length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MapPinIcon size={20} />
                {t.checkout.success.shippingAddress}
              </h2>
              <div className="text-sm text-gray-600">
                <p>{shippingAddr.firstName} {shippingAddr.lastName}</p>
                <p>{shippingAddr.address}</p>
                <p>{shippingAddr.city}</p>
                {shippingAddr.phone && (
                  <p className="mt-2">{t.checkout.success.phone}: {shippingAddr.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-6 bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t.checkout.summary.subtotal}</span>
                <span>{format(order.subtotal)}</span>
              </div>
              
              {/* Detailed discount breakdown - each type in its own row */}
              {((order.discountDetails as Array<{type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member'; code?: string; name: string; description?: string; amount: number}>) || []).map((discount, idx) => (
                <div 
                  key={idx} 
                  className={`flex justify-between ${
                    discount.type === 'gift_card' ? 'text-purple-600' :
                    discount.type === 'credit' ? 'text-blue-600' :
                    'text-green-600'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {discount.type === 'gift_card' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                      </svg>
                    )}
                    {discount.type === 'coupon' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
                        <path d="M6 6h.008v.008H6V6z"/>
                      </svg>
                    )}
                    {discount.type === 'auto' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                      </svg>
                    )}
                    {discount.type === 'credit' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
                      </svg>
                    )}
                    {discount.type === 'coupon' ? `${t.checkout.success.coupon} ${discount.code}${discount.description ? ` (${discount.description})` : ''}` :
                     discount.type === 'gift_card' ? `${t.checkout.success.giftCard} ${discount.code}` :
                     discount.type === 'auto' ? `${t.checkout.success.automaticDiscount}: ${discount.name}` :
                     discount.type === 'member' ? t.checkout.success.memberDiscount :
                     discount.type === 'credit' ? t.checkout.payment.creditBalance : discount.name}
                  </span>
                  <span>-{format(discount.amount)}</span>
                </div>
              ))}
              
              {/* Fallback for old orders without discountDetails */}
              {!((order.discountDetails as unknown[])?.length) && Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t.checkout.success.discount} {order.discountCode && `(${order.discountCode})`}</span>
                  <span>-{format(order.discountAmount)}</span>
                </div>
              )}
              
              {/* Credit used - fallback if not already in discountDetails */}
              {Number(order.creditUsed) > 0 && !((order.discountDetails as Array<{type: string}>)?.some(d => d.type === 'credit')) && (
                <div className="flex justify-between text-blue-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
                    </svg>
                    {t.checkout.payment.creditBalance}
                  </span>
                  <span>-{format(order.creditUsed)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">{t.checkout.summary.shipping}</span>
                {Number(order.shippingAmount) > 0 ? (
                  <span>{format(order.shippingAmount)}</span>
                ) : (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    {t.checkout.success.free}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between font-medium text-lg pt-2 border-t border-gray-200">
                <span>{t.checkout.summary.total}</span>
                <span>{format(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 text-center">
          <Link
            href={basePath || '/'}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon size={16} />
            {t.checkout.success.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  );
}
