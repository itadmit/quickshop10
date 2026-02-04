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
  productBundles,
  bundleComponents,
} from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { sendOrderConfirmationEmail, sendGiftCardEmail } from '@/lib/email';
import { emitOrderCreated, emitLowStock } from '@/lib/events';
import { addPointsFromOrder } from '@/lib/actions/loyalty';
import { autoSendShipmentOnPayment } from '@/lib/shipping/auto-send';
import { calculateItemDiscounts } from '@/lib/order-item-discount';

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
  // 🎁 Gift card virtual product
  isGiftCard?: boolean;
  giftCardDetails?: {
    recipientName: string;
    recipientEmail: string;
    senderName?: string;
    message?: string;
  };
  // 📦 Bundle support
  isBundle?: boolean;
  bundleComponents?: Array<{
    name: string;
    variantTitle?: string;
    quantity: number;
  }>;
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
  
  // 11. Create and send gift cards for virtual gift card items
  const giftCardItems = cartItems.filter(item => item.isGiftCard && item.giftCardDetails);
  if (giftCardItems.length > 0) {
    operations.push(
      createAndSendGiftCards(storeId, storeName, storeSlug, order, giftCardItems)
        .catch(err => console.error('[PostPayment] Gift card creation failed:', err))
    );
  }
  
  // Wait for all operations (but don't block - they're already fire-and-forget)
  await Promise.allSettled(operations);
  
  console.log(`[PostPayment] Completed for order ${order.orderNumber}`);
}

// ============ HELPER FUNCTIONS ============

/**
 * Decrement inventory for order items
 * Handles both regular products and bundles (deducts from bundle components)
 */
async function decrementInventory(
  cartItems: CartItem[],
  storeId: string,
  orderId: string
): Promise<void> {
  for (const item of cartItems) {
    if (!item.productId) continue;
    
    // Check if this product is a bundle
    const [product] = await db
      .select({ id: products.id, isBundle: products.isBundle })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);
    
    if (product?.isBundle) {
      // Handle bundle - deduct from components
      await decrementBundleInventory(item.productId, item.quantity, storeId, orderId);
    } else if (item.variantId) {
      // Regular variant
      const [current] = await db
        .select({ inventory: productVariants.inventory })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      
      const previousQuantity = current?.inventory ?? 0;
      
      const [updated] = await db
        .update(productVariants)
        .set({ inventory: sql`GREATEST(0, ${productVariants.inventory} - ${item.quantity})` })
        .where(eq(productVariants.id, item.variantId))
        .returning({ id: productVariants.id, inventory: productVariants.inventory });
      
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
      // Regular product
      const [current] = await db
        .select({ inventory: products.inventory })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      
      const previousQuantity = current?.inventory ?? 0;
      
      const [updated] = await db
        .update(products)
        .set({ inventory: sql`GREATEST(0, ${products.inventory} - ${item.quantity})` })
        .where(eq(products.id, item.productId))
        .returning({ id: products.id, inventory: products.inventory });
      
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
 * Decrement inventory for bundle components
 */
async function decrementBundleInventory(
  bundleProductId: string,
  purchasedQty: number,
  storeId: string,
  orderId: string
): Promise<void> {
  // Get bundle and its components
  const bundle = await db.query.productBundles.findFirst({
    where: eq(productBundles.productId, bundleProductId),
  });
  
  if (!bundle) return;
  
  const components = await db
    .select()
    .from(bundleComponents)
    .where(eq(bundleComponents.bundleId, bundle.id));
  
  // Deduct from each component
  for (const component of components) {
    const deductQty = component.quantity * purchasedQty;
    
    if (component.variantId) {
      // Variant component
      const [current] = await db
        .select({ inventory: productVariants.inventory })
        .from(productVariants)
        .where(eq(productVariants.id, component.variantId))
        .limit(1);
      
      const previousQuantity = current?.inventory ?? 0;
      
      const [updated] = await db
        .update(productVariants)
        .set({ inventory: sql`GREATEST(0, ${productVariants.inventory} - ${deductQty})` })
        .where(eq(productVariants.id, component.variantId))
        .returning({ id: productVariants.id, inventory: productVariants.inventory });
      
      if (updated) {
        await db.insert(inventoryLogs).values({
          storeId,
          productId: component.productId,
          variantId: component.variantId,
          previousQuantity,
          newQuantity: updated.inventory ?? 0,
          changeAmount: (updated.inventory ?? 0) - previousQuantity,
          reason: 'order',
          orderId,
          changedByName: `Bundle (${purchasedQty}×)`,
        });
      }
    } else {
      // Product component
      const [current] = await db
        .select({ inventory: products.inventory })
        .from(products)
        .where(eq(products.id, component.productId))
        .limit(1);
      
      const previousQuantity = current?.inventory ?? 0;
      
      const [updated] = await db
        .update(products)
        .set({ inventory: sql`GREATEST(0, ${products.inventory} - ${deductQty})` })
        .where(eq(products.id, component.productId))
        .returning({ id: products.id, inventory: products.inventory });
      
      if (updated) {
        await db.insert(inventoryLogs).values({
          storeId,
          productId: component.productId,
          variantId: null,
          previousQuantity,
          newQuantity: updated.inventory ?? 0,
          changeAmount: (updated.inventory ?? 0) - previousQuantity,
          reason: 'order',
          orderId,
          changedByName: `Bundle (${purchasedQty}×)`,
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
  const { storeId, storeSlug, storeName, order, cartItems, orderData, discountCode, discountAmount, paymentInfo } = params;
  
  // Safety check - cartItems may be null/undefined from old pending payments
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    console.error('[PostPayment] Cannot send email - no cart items');
    return;
  }
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = orderData.shipping?.cost || 0;
  const creditUsed = orderData.creditUsed || 0;
  
  // Calculate per-item discounts for email display
  const discountDetails = order.discountDetails as Array<{
    type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member' | 'loyalty_tier';
    code?: string;
    name: string;
    description?: string;
    amount: number;
  }> | undefined;
  
  const itemsWithDiscounts = await calculateItemDiscounts(
    storeId,
    cartItems.map((item, idx) => ({
      id: String(idx),
      productId: item.productId || null,
      name: item.name,
      variantTitle: item.variantTitle || null,
      sku: item.sku || null,
      quantity: item.quantity,
      price: String(item.price),
      total: String(item.price * item.quantity),
      imageUrl: item.image || item.imageUrl || null,
      properties: null,
    })),
    discountCode || null,
    discountDetails || null
  );
  
  await sendOrderConfirmationEmail({
    orderNumber: order.orderNumber,
    customerName: order.customerName || 'לקוח יקר',
    customerEmail: order.customerEmail || '',
    items: cartItems.map((item, idx) => {
      const discountInfo = itemsWithDiscounts[idx];
      return {
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
        // Discount info
        hasDiscount: discountInfo?.hasDiscount || false,
        discountedPrice: discountInfo?.discountedPrice ?? undefined,
        discountedTotal: discountInfo?.discountedTotal ?? undefined,
        discountPercent: discountInfo?.discountPercent ?? undefined,
        // Bundle info
        isBundle: item.isBundle,
        bundleComponents: item.bundleComponents,
      };
    }),
    subtotal,
    shippingAmount: shippingCost,
    discountAmount: discountAmount || 0,
    discountDetails,
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

/**
 * Generate a unique gift card code
 */
function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like O,0,I,1
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create gift cards and send to recipients
 */
async function createAndSendGiftCards(
  storeId: string,
  storeName: string,
  storeSlug: string,
  order: {
    id: string;
    orderNumber: string;
    customerEmail?: string | null;
    customerName?: string | null;
  },
  giftCardItems: CartItem[]
): Promise<void> {
  console.log(`[PostPayment] Creating ${giftCardItems.length} gift cards for order ${order.orderNumber}`);
  
  for (const item of giftCardItems) {
    if (!item.giftCardDetails) continue;
    
    // Create one gift card per quantity
    for (let i = 0; i < item.quantity; i++) {
      try {
        // Generate unique code
        let code: string;
        let isUnique = false;
        do {
          code = generateGiftCardCode();
          // Check uniqueness
          const existing = await db.query.giftCards.findFirst({
            where: and(eq(giftCards.storeId, storeId), eq(giftCards.code, code)),
          });
          isUnique = !existing;
        } while (!isUnique);
        
        // Calculate expiry (12 months from now by default)
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 12);
        
        // Create gift card in database
        const [newGiftCard] = await db.insert(giftCards).values({
          storeId,
          code,
          initialBalance: String(item.price),
          currentBalance: String(item.price),
          status: 'active',
          recipientEmail: item.giftCardDetails.recipientEmail,
          recipientName: item.giftCardDetails.recipientName,
          senderName: item.giftCardDetails.senderName || order.customerName || undefined,
          message: item.giftCardDetails.message,
          purchasedOrderId: order.id,
          expiresAt,
        }).returning();
        
        // Create initial transaction
        await db.insert(giftCardTransactions).values({
          giftCardId: newGiftCard.id,
          orderId: order.id,
          amount: String(item.price),
          balanceAfter: String(item.price),
          note: `גיפט קארד נרכש בהזמנה ${order.orderNumber}`,
        });
        
        // Send email to recipient
        await sendGiftCardEmail({
          storeName,
          storeSlug,
          recipientName: item.giftCardDetails.recipientName,
          recipientEmail: item.giftCardDetails.recipientEmail,
          senderName: item.giftCardDetails.senderName || order.customerName || 'מישהו מיוחד',
          message: item.giftCardDetails.message || '',
          amount: item.price,
          giftCardCode: code,
          expiresAt,
        });
        
        console.log(`[PostPayment] Created gift card ${code} for ${item.giftCardDetails.recipientEmail}`);
        
      } catch (err) {
        console.error(`[PostPayment] Failed to create gift card:`, err);
      }
    }
  }
}

