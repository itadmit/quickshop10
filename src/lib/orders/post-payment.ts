/**
 * Post-Payment Processing
 * SINGLE SOURCE OF TRUTH for all actions after successful payment
 * 
 * This module handles:
 * 1. Inventory decrement
 * 2. Discount/coupon usage tracking
 * 3. Influencer sales recording
 * 4. Automatic discount usage
 * 5. Gift card balance updates
 * 6. Customer credit deduction
 * 7. Email notifications
 * 8. Loyalty points
 * 9. Order created event (webhooks, notifications)
 * 10. Auto-send shipment
 * 11. Low stock alerts
 * 
 * Called from thank-you page after payment confirmation.
 * All operations are non-blocking for speed (fire-and-forget pattern).
 */

import { db } from '@/lib/db';
import {
  orders,
  products,
  productVariants,
  customers,
  discounts,
  automaticDiscounts,
  influencers,
  influencerSales,
  giftCards,
  giftCardTransactions,
  customerCreditTransactions,
  inventoryLogs,
} from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { emitOrderCreated, emitLowStock } from '@/lib/events';
import { addPointsFromOrder } from '@/lib/actions/loyalty';
import { autoSendShipmentOnPayment } from '@/lib/shipping/auto-send';

// ============ TYPES ============

export interface CartItem {
  productId: string;
  variantId?: string;
  variantTitle?: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  image?: string;
  imageUrl?: string;
  addons?: Array<{
    addonId: string;
    name: string;
    value: string;
    displayValue: string;
    priceAdjustment: number;
  }>;
  addonTotal?: number;
}

export interface OrderData {
  shippingAddress?: {
    address?: string;
    city?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  shipping?: { cost?: number; method?: string };
  autoDiscounts?: Array<{ id: string; name: string }>;
  giftCardCode?: string;
  giftCardAmount?: number;
  creditUsed?: number;
  paymentDetails?: {
    transactionId?: string;
    approvalNumber?: string;
    cardBrand?: string;
    cardLastFour?: string;
  };
}

export interface PostPaymentParams {
  storeId: string;
  storeName: string;
  storeSlug: string;
  order: {
    id: string;
    orderNumber: string;
    total: string | number;
    customerEmail?: string | null;
    customerName?: string | null;
    customerId?: string | null;
    discountDetails?: unknown;
  };
  cartItems: CartItem[];
  orderData: OrderData;
  discountCode?: string | null;
  discountAmount?: number;
  paymentInfo?: {
    lastFour?: string;
    brand?: string;
    approvalNum?: string;
  };
}

// ============ MAIN FUNCTION ============

/**
 * Execute all post-payment actions
 * Non-blocking - fires all actions concurrently for speed
 */
export async function executePostPaymentActions(params: PostPaymentParams): Promise<void> {
  const { storeId, storeName, storeSlug, order, cartItems, orderData, discountCode, discountAmount, paymentInfo } = params;
  
  console.log(`[PostPayment] Starting for order ${order.orderNumber}`);
  
  // All operations run in parallel (non-blocking)
  const operations: Promise<void>[] = [];
  
  // 1. Decrement inventory
  operations.push(
    decrementInventory(cartItems, storeId, order.id)
      .catch(err => console.error('[PostPayment] Inventory decrement failed:', err))
  );
  
  // 2. Update discount/coupon usage
  if (discountCode) {
    operations.push(
      updateDiscountUsage(storeId, discountCode, order)
        .catch(err => console.error('[PostPayment] Discount usage update failed:', err))
    );
  }
  
  // 3. Update automatic discounts usage
  const autoDiscounts = orderData.autoDiscounts || [];
  if (autoDiscounts.length > 0) {
    operations.push(
      updateAutoDiscountUsage(autoDiscounts.map(d => d.id))
        .catch(err => console.error('[PostPayment] Auto discount usage update failed:', err))
    );
  }
  
  // 4. Update gift card balance
  if (orderData.giftCardCode && orderData.giftCardAmount && orderData.giftCardAmount > 0) {
    operations.push(
      updateGiftCardBalance(storeId, orderData.giftCardCode, orderData.giftCardAmount, order)
        .catch(err => console.error('[PostPayment] Gift card update failed:', err))
    );
  }
  
  // 5. Deduct customer credit
  if (orderData.creditUsed && orderData.creditUsed > 0 && order.customerId) {
    operations.push(
      deductCustomerCredit(storeId, order.customerId, orderData.creditUsed, order)
        .catch(err => console.error('[PostPayment] Credit deduction failed:', err))
    );
  }
  
  // 6. Send order confirmation email
  operations.push(
    sendConfirmationEmail(params)
      .catch(err => console.error('[PostPayment] Email send failed:', err))
  );
  
  // 7. Add loyalty points
  if (order.customerId) {
    operations.push(
      addLoyaltyPoints(storeId, order.customerId, order.id, Number(order.total))
        .catch(err => console.error('[PostPayment] Loyalty points failed:', err))
    );
  }
  
  // 8. Emit order.created event (triggers webhooks, dashboard notification, mobile push)
  operations.push(
    Promise.resolve().then(() => {
      emitOrderCreated(
        storeId,
        storeName,
        order.id,
        order.orderNumber,
        order.customerEmail || '',
        Number(order.total),
        cartItems.length,
        order.customerName || undefined,
        discountCode || undefined
      );
    }).catch(err => console.error('[PostPayment] Event emit failed:', err))
  );
  
  // 9. Auto-send shipment if configured
  operations.push(
    autoSendShipmentOnPayment(storeId, order.id)
      .then(result => {
        if (result.success) {
          console.log(`[PostPayment] Auto-sent shipment for order ${order.orderNumber}, tracking: ${result.trackingNumber}`);
        }
      })
      .catch(err => console.error('[PostPayment] Auto-send shipment failed:', err))
  );
  
  // 10. Check and emit low stock alerts
  operations.push(
    checkLowStock(storeId, cartItems)
      .catch(err => console.error('[PostPayment] Low stock check failed:', err))
  );
  
  // Wait for all operations (but don't block - they're already fire-and-forget)
  await Promise.allSettled(operations);
  
  console.log(`[PostPayment] Completed for order ${order.orderNumber}`);
}

// ============ HELPER FUNCTIONS ============

/**
 * Decrement inventory for order items
 */
async function decrementInventory(
  cartItems: CartItem[],
  storeId: string,
  orderId: string
): Promise<void> {
  for (const item of cartItems) {
    if (!item.productId) continue;
    
    if (item.variantId) {
      // Get current inventory
      const [current] = await db
        .select({ inventory: productVariants.inventory })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      
      const previousQuantity = current?.inventory ?? 0;
      
      // Decrement variant inventory
      const [updated] = await db
        .update(productVariants)
        .set({ inventory: sql`GREATEST(0, ${productVariants.inventory} - ${item.quantity})` })
        .where(eq(productVariants.id, item.variantId))
        .returning({ id: productVariants.id, inventory: productVariants.inventory });
      
      // Log the change
      if (updated) {
        await db.insert(inventoryLogs).values({
          storeId,
          productId: item.productId,
          variantId: item.variantId,
          previousQuantity,
          newQuantity: updated.inventory ?? 0,
          changeAmount: (updated.inventory ?? 0) - previousQuantity,
          reason: 'order',
          orderId,
          changedByName: 'הזמנה',
        });
      }
    } else {
      // Get current inventory
      const [current] = await db
        .select({ inventory: products.inventory })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      
      const previousQuantity = current?.inventory ?? 0;
      
      // Decrement product inventory
      const [updated] = await db
        .update(products)
        .set({ inventory: sql`GREATEST(0, ${products.inventory} - ${item.quantity})` })
        .where(eq(products.id, item.productId))
        .returning({ id: products.id, inventory: products.inventory });
      
      // Log the change
      if (updated) {
        await db.insert(inventoryLogs).values({
          storeId,
          productId: item.productId,
          variantId: null,
          previousQuantity,
          newQuantity: updated.inventory ?? 0,
          changeAmount: (updated.inventory ?? 0) - previousQuantity,
          reason: 'order',
          orderId,
          changedByName: 'הזמנה',
        });
      }
    }
  }
}

/**
 * Update discount/coupon usage and create influencer sale if applicable
 */
async function updateDiscountUsage(
  storeId: string,
  discountCode: string,
  order: { id: string; orderNumber: string; total: string | number }
): Promise<void> {
  // Increment usage count
  await db
    .update(discounts)
    .set({ usageCount: sql`COALESCE(${discounts.usageCount}, 0) + 1` })
    .where(and(eq(discounts.storeId, storeId), eq(discounts.code, discountCode)));
  
  // Get discount ID first
  const [discount] = await db
    .select({ id: discounts.id })
    .from(discounts)
    .where(and(eq(discounts.storeId, storeId), eq(discounts.code, discountCode)))
    .limit(1);

  if (!discount) return;

  // Check if coupon is linked to influencer (check discountIds array)
  const [result] = await db
    .select({
      influencerId: influencers.id,
      commissionType: influencers.commissionType,
      commissionValue: influencers.commissionValue,
    })
    .from(influencers)
    .where(
      and(
        eq(influencers.storeId, storeId),
        eq(influencers.isActive, true),
        sql`${influencers.discountIds}::jsonb @> ${JSON.stringify([discount.id])}::jsonb`
      )
    )
    .limit(1);
  
  if (result) {
    const totalAmount = Number(order.total);
    const commissionType = result.commissionType || 'percentage';
    const commissionValue = Number(result.commissionValue) || 0;
    
    let commissionAmount = 0;
    if (commissionType === 'percentage') {
      commissionAmount = (totalAmount * commissionValue) / 100;
    } else {
      commissionAmount = commissionValue;
    }
    
    // Create influencer sale record
    await db.insert(influencerSales).values({
      influencerId: result.influencerId,
      orderId: order.id,
      orderTotal: String(totalAmount),
      commissionAmount: String(commissionAmount),
      netCommission: String(commissionAmount),
      status: 'pending',
    });
    
    // Update influencer stats
    await db
      .update(influencers)
      .set({
        totalSales: sql`COALESCE(${influencers.totalSales}, 0) + ${totalAmount}`,
        totalCommission: sql`COALESCE(${influencers.totalCommission}, 0) + ${commissionAmount}`,
        totalOrders: sql`COALESCE(${influencers.totalOrders}, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(eq(influencers.id, result.influencerId));
    
    console.log(`[PostPayment] Created influencer sale for ${result.influencerId}`);
  }
}

/**
 * Update automatic discount usage counts
 */
async function updateAutoDiscountUsage(discountIds: string[]): Promise<void> {
  if (discountIds.length === 0) return;
  
  await db
    .update(automaticDiscounts)
    .set({ usageCount: sql`COALESCE(${automaticDiscounts.usageCount}, 0) + 1` })
    .where(inArray(automaticDiscounts.id, discountIds));
  
  console.log(`[PostPayment] Updated ${discountIds.length} automatic discounts`);
}

/**
 * Update gift card balance and create transaction
 */
async function updateGiftCardBalance(
  storeId: string,
  giftCardCode: string,
  amount: number,
  order: { id: string; orderNumber: string }
): Promise<void> {
  const [giftCard] = await db
    .select()
    .from(giftCards)
    .where(
      and(
        eq(giftCards.storeId, storeId),
        eq(giftCards.code, giftCardCode),
        eq(giftCards.status, 'active')
      )
    )
    .limit(1);
  
  if (!giftCard) return;
  
  const currentBalance = Number(giftCard.currentBalance) || 0;
  const newBalance = Math.max(0, currentBalance - amount);
  
  // Update gift card balance
  await db
    .update(giftCards)
    .set({
      currentBalance: newBalance.toFixed(2),
      lastUsedAt: new Date(),
      status: newBalance <= 0 ? 'used' : 'active',
    })
    .where(eq(giftCards.id, giftCard.id));
  
  // Create transaction record
  await db.insert(giftCardTransactions).values({
    giftCardId: giftCard.id,
    orderId: order.id,
    amount: (-amount).toFixed(2),
    balanceAfter: newBalance.toFixed(2),
    note: `הזמנה #${order.orderNumber}`,
  });
  
  console.log(`[PostPayment] Updated gift card ${giftCardCode}: ${currentBalance} → ${newBalance}`);
}

/**
 * Deduct customer credit and create transaction
 */
async function deductCustomerCredit(
  storeId: string,
  customerId: string,
  amount: number,
  order: { id: string; orderNumber: string }
): Promise<void> {
  const [customer] = await db
    .select({ creditBalance: customers.creditBalance })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  
  if (!customer) return;
  
  const currentBalance = Number(customer.creditBalance) || 0;
  const newBalance = Math.max(0, currentBalance - amount);
  
  // Update customer credit
  await db
    .update(customers)
    .set({ creditBalance: newBalance.toFixed(2) })
    .where(eq(customers.id, customerId));
  
  // Create transaction record
  await db.insert(customerCreditTransactions).values({
    customerId,
    storeId,
    type: 'debit',
    amount: (-amount).toFixed(2),
    balanceAfter: newBalance.toFixed(2),
    reason: `שימוש בקרדיט בהזמנה #${order.orderNumber}`,
    orderId: order.id,
  });
  
  console.log(`[PostPayment] Deducted credit ${amount} from customer ${customerId}`);
}

/**
 * Send order confirmation email
 */
async function sendConfirmationEmail(params: PostPaymentParams): Promise<void> {
  const { storeSlug, storeName, order, cartItems, orderData, discountAmount, paymentInfo } = params;
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = orderData.shipping?.cost || 0;
  const creditUsed = orderData.creditUsed || 0;
  
  await sendOrderConfirmationEmail({
    orderNumber: order.orderNumber,
    customerName: order.customerName || 'לקוח יקר',
    customerEmail: order.customerEmail || '',
    items: cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || undefined,
      variantTitle: item.variantTitle || undefined,
      addons: item.addons?.map(a => ({
        name: a.name,
        displayValue: a.displayValue,
        priceAdjustment: a.priceAdjustment,
      })),
      addonTotal: item.addonTotal,
    })),
    subtotal,
    shippingAmount: shippingCost,
    discountAmount: discountAmount || 0,
    discountDetails: order.discountDetails as Array<{
      type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member';
      code?: string;
      name: string;
      description?: string;
      amount: number;
    }> | undefined,
    creditUsed,
    total: Number(order.total),
    shippingAddress: orderData.shippingAddress,
    storeName,
    storeSlug,
    paymentInfo,
    freeShippingReason: shippingCost === 0 ? 'משלוח חינם' : undefined,
  });
  
  console.log(`[PostPayment] Sent confirmation email for order ${order.orderNumber}`);
}

/**
 * Add loyalty points for purchase
 */
async function addLoyaltyPoints(
  storeId: string,
  customerId: string,
  orderId: string,
  total: number
): Promise<void> {
  const result = await addPointsFromOrder(storeId, customerId, orderId, total);
  
  if (result.success && result.points && result.points > 0) {
    console.log(`[PostPayment] Added ${result.points} loyalty points`);
  }
}

/**
 * Check and emit low stock alerts
 */
async function checkLowStock(storeId: string, cartItems: CartItem[]): Promise<void> {
  for (const item of cartItems) {
    if (!item.productId) continue;
    
    const [product] = await db
      .select({ id: products.id, name: products.name, inventory: products.inventory })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);
    
    if (product && product.inventory !== null) {
      emitLowStock(storeId, product.id, product.name, product.inventory);
    }
  }
}

