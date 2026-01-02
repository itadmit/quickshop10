/**
 * Thank You Page - Payment Gateway Redirect Handler
 * SERVER COMPONENT for speed - handles redirects from payment gateways
 * 
 * Features:
 * - Creates order from pending payment if needed
 * - Decrements inventory
 * - Fires purchase tracking events (via client component)
 * - Clears cart
 */

import { db } from '@/lib/db';
import { orders, orderItems, products, pendingPayments, stores, customers, productVariants, giftCards, giftCardTransactions, productImages } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, PackageIcon, CreditCardIcon, MapPinIcon, ArrowLeftIcon, TagIcon, GiftIcon } from '@/components/admin/icons';
import { nanoid } from 'nanoid';
import { PurchaseTracking } from '@/components/purchase-tracking';
import { ClearCartOnLoad } from './clear-cart';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { emitOrderCreated, emitLowStock } from '@/lib/events';

interface ThankYouPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ 
    ref?: string;
    more_info?: string;
    status?: string;
    status_code?: string;
    amount?: string;
    transaction_uid?: string;
    page_request_uid?: string;
    approval_num?: string;
    four_digits?: string;
    brand_name?: string;
    customer_name?: string;
    customer_email?: string;
  }>;
}

// Decrement inventory for order items
async function decrementInventory(cartItems: Array<{
  productId: string;
  variantId?: string;
  quantity: number;
}>) {
  for (const item of cartItems) {
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
        
        console.log(`Thank you page: Decremented variant inventory`, {
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
  
  // Get order reference from query params
  const orderReference = search.more_info || search.ref;
  const pageRequestUid = search.page_request_uid;
  
  // Check payment status from PayPlus
  const paymentStatus = search.status;
  const statusCode = search.status_code;
  
  // If payment failed or cancelled, redirect back to checkout
  if (paymentStatus === 'rejected' || paymentStatus === 'error' || (statusCode && statusCode !== '000')) {
    redirect(`/shops/${slug}/checkout?error=payment_failed`);
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
  
  // First try to find existing order by reference
  let order = null;
  let isNewOrder = false;
  
  if (orderReference) {
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderReference))
      .limit(1);
    order = existingOrder;
    
    if (order) {
      console.log(`Thank you page: Found existing order ${order.orderNumber}, skipping order creation`);
      // Check if inventory was decremented by checking order items
      const orderItemsCheck = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .limit(1);
      console.log(`Thank you page: Order has ${orderItemsCheck.length} items`);
    }
  }
  
  // If no order found, check pending payments and create order
  if (!order && pageRequestUid && statusCode === '000') {
    console.log(`Thank you page: Looking for pending payment with pageRequestUid=${pageRequestUid}, storeId=${store.id}`);
    
    // Find pending payment by provider request ID
    const [pendingPayment] = await db
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
    
    console.log(`Thank you page: Found pending payment: ${pendingPayment ? 'YES' : 'NO'}`);
    
    if (pendingPayment) {
      // Create the order from pending payment data
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
      
      // Generate numeric order number from store counter (starts at 1000)
      const currentCounter = store.orderCounter ?? 1000;
      const orderNumber = String(currentCounter);
      
      // Increment the store's order counter
      await db.update(stores)
        .set({ orderCounter: currentCounter + 1 })
        .where(eq(stores.id, store.id));
      
      // Get or find customer
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
        
        // Customer info
        customerEmail: pendingPayment.customerEmail || search.customer_email || '',
        customerName: (orderData.customer as { name?: string })?.name || search.customer_name || '',
        customerPhone: (orderData.customer as { phone?: string })?.phone || '',
        
        // Shipping address
        shippingAddress: orderData.shippingAddress as Record<string, unknown> || {},
        billingAddress: orderData.billingAddress as Record<string, unknown> || orderData.shippingAddress as Record<string, unknown> || {},
        
        // Payment info
        paymentMethod: 'credit_card',
        paymentDetails: {
          provider: pendingPayment.provider,
          transactionId: search.transaction_uid,
          approvalNumber: search.approval_num,
          cardBrand: search.brand_name,
          cardLastFour: search.four_digits,
        },
        
        // Discount
        discountCode: pendingPayment.discountCode,
        
        // Influencer
        influencerId: pendingPayment.influencerId,
        
        // Timestamps
        paidAt: new Date(),
      }).returning();
      
      // Create order items
      if (cartItems.length > 0) {
        await db.insert(orderItems).values(
          cartItems.map(item => ({
            orderId: newOrder.id,
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
        
        // Decrement inventory
        await decrementInventory(cartItems);
      }
      
      // Handle gift card if used
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
          lastFour: search.four_digits,
          brand: search.brand_name,
          approvalNum: search.approval_num,
        },
      }).catch(err => console.error('Failed to send order confirmation email:', err));
      
      // Emit order.created event (triggers notifications, webhooks, automations)
      emitOrderCreated(
        store.id,
        newOrder.id,
        orderNumber,
        newOrder.customerEmail || '',
        totalAmount,
        cartItems.length
      );
      
      // Check for low stock and emit events
      for (const item of cartItems) {
        // Get current inventory
        const [product] = await db
          .select({ id: products.id, name: products.name, inventory: products.inventory })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);
        
        if (product && product.inventory !== null) {
          emitLowStock(store.id, product.id, product.name, product.inventory);
        }
      }
      
      order = newOrder;
      isNewOrder = true;
    }
  }
  
  // If still no order, redirect back to checkout with error
  if (!order) {
    console.error(`Thank you page: No order found for pageRequestUid=${pageRequestUid}, orderReference=${orderReference}`);
    redirect(`/shops/${slug}/checkout?error=order_not_found`);
  }
  
  // Get order items with product images if missing
  const rawItems = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  
  // Fetch product images for items that don't have imageUrl
  const itemsWithImages = await Promise.all(
    rawItems.map(async (item) => {
      let imageUrl = item.imageUrl;
      
      // If no imageUrl, fetch from product
      if (!imageUrl && item.productId) {
        const [productImage] = await db
          .select({ url: productImages.url })
          .from(productImages)
          .where(
            and(
              eq(productImages.productId, item.productId),
              eq(productImages.isPrimary, true)
            )
          )
          .limit(1);
        
        imageUrl = productImage?.url || null;
      }
      
      return {
        id: item.id,
        productId: item.productId,
        name: item.name,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        imageUrl,
      };
    })
  );
  
  const items = itemsWithImages;

  const basePath = `/shops/${slug}`;

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

  // Prepare tracking data
  const trackingItems = items.map(item => ({
    productId: item.productId || '',
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Purchase Tracking - fires pixel events */}
      <PurchaseTracking
        orderNumber={order.orderNumber}
        total={Number(order.total)}
        currency="ILS"
        items={trackingItems}
      />
      
      {/* Clear cart on load */}
      <ClearCartOnLoad />
      
      {/* Success Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto py-12 px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="text-green-600" size={32} />
          </div>
          <h1 className="font-display text-3xl font-light tracking-wide mb-2">
            תודה על הזמנתך!
          </h1>
          <p className="text-gray-600">
            הזמנה מספר <span className="font-medium">{order.orderNumber}</span> התקבלה בהצלחה
          </p>
          <p className="text-sm text-gray-500 mt-2">
            אישור נשלח לכתובת {order.customerEmail}
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
              פריטים בהזמנה
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
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={item.name || ''} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center text-gray-400 text-2xl ${imageUrl ? 'hidden' : ''}`}>
                      📦
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    {item.variantTitle && (
                      <p className="text-sm text-gray-500">{item.variantTitle}</p>
                    )}
                    <p className="text-sm text-gray-500">כמות: {item.quantity}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      ₪{Number(item.total).toFixed(0)}
                    </p>
                  </div>
                  <div className="text-left font-medium">
                    ₪{Number(item.total).toFixed(0)}
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
              פרטי תשלום
            </h2>
            <div className="space-y-2 text-sm">
              {paymentInfo.lastFour && (
                <p className="text-gray-600">
                  כרטיס: •••• {paymentInfo.lastFour}
                  {paymentInfo.brand && ` (${paymentInfo.brand})`}
                </p>
              )}
              {paymentInfo.approvalNum && (
                <p className="text-gray-600">
                  אישור: {paymentInfo.approvalNum}
                </p>
              )}
              <p className="text-gray-900 font-medium">
                סה״כ שולם: ₪{Number(order.total).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          {Object.keys(shippingAddr).length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MapPinIcon size={20} />
                כתובת למשלוח
              </h2>
              <div className="text-sm text-gray-600">
                <p>{shippingAddr.firstName} {shippingAddr.lastName}</p>
                <p>{shippingAddr.address}</p>
                <p>{shippingAddr.city}</p>
                {shippingAddr.phone && (
                  <p className="mt-2">טלפון: {shippingAddr.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-6 bg-gray-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">סכום ביניים</span>
                <span>₪{Number(order.subtotal).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">משלוח</span>
                {Number(order.shippingAmount) > 0 ? (
                  <span>₪{Number(order.shippingAmount).toFixed(0)}</span>
                ) : (
                  <span className="text-green-600">חינם</span>
                )}
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>הנחה</span>
                  <span>-₪{Number(order.discountAmount).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg pt-2 border-t border-gray-200">
                <span>סה״כ</span>
                <span>₪{Number(order.total).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 text-center">
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon size={16} />
            המשך בקניות
          </Link>
        </div>
      </div>
    </div>
  );
}
