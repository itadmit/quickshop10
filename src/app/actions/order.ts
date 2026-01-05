'use server';

import { db } from '@/lib/db';
import { orders, orderItems, customers, stores, products, productVariants, customerCreditTransactions, discounts, automaticDiscounts, giftCards, giftCardTransactions } from '@/lib/db/schema';
import { eq, and, sql, gte, lte, gt, or, isNull, desc } from 'drizzle-orm';
import { emitOrderCreated, emitLowStock } from '@/lib/events';

type CartItem = {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  variantTitle?: string;
};

type CustomerInfo = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company?: string;
  city: string;
  street: string;
  houseNumber: string;
  apartment?: string;
  floor?: string;
  zipCode?: string;
  notes?: string;
  acceptsMarketing: boolean;
};

// Build full address string from components
function buildAddressString(customer: CustomerInfo): string {
  let address = `${customer.street} ${customer.houseNumber}`.trim();
  if (customer.apartment) {
    address += `, דירה ${customer.apartment}`;
  }
  if (customer.floor) {
    address += `, קומה ${customer.floor}`;
  }
  return address;
}

type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'gift_product'        // מוצר במתנה (עם תנאים, בחירת מוצר ספציפי)
  | 'quantity_discount'
  | 'spend_x_pay_y'
  | 'gift_card';

type CouponInfo = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
} | null;

export type CreateOrderResult = {
  success: true;
  orderId: string;
  orderNumber: string;
} | {
  success: false;
  error: string;
};

export async function createOrder(
  storeId: string,
  cart: CartItem[],
  customerInfo: CustomerInfo,
  coupon: CouponInfo,
  subtotal: number,
  discount: number,
  shipping: number,
  total: number,
  creditUsed: number = 0
): Promise<CreateOrderResult> {
  console.log('[Order] Creating order...');
  console.log('[Order] Cart:', JSON.stringify(cart, null, 2));
  console.log('[Order] Subtotal:', subtotal, 'Discount:', discount, 'Shipping:', shipping, 'Credit:', creditUsed, 'Total:', total);
  
  try {
    if (!storeId) {
      return { success: false, error: 'מזהה חנות חסר' };
    }
    
    // Get store by ID
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    console.log('[Order] Store found:', store?.id);
    
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    if (cart.length === 0) {
      return { success: false, error: 'העגלה ריקה' };
    }

    // ===== SECURITY: Server-side validation =====
    // Re-calculate subtotal from cart (never trust client values)
    const serverSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const now = new Date();
    
    // STEP 1: Calculate automatic discounts FIRST
    let autoDiscountTotal = 0;
    const activeAutoDiscounts = await db
      .select()
      .from(automaticDiscounts)
      .where(and(
        eq(automaticDiscounts.storeId, store.id),
        eq(automaticDiscounts.isActive, true),
        or(isNull(automaticDiscounts.startsAt), lte(automaticDiscounts.startsAt, now)),
        or(isNull(automaticDiscounts.endsAt), gte(automaticDiscounts.endsAt, now))
      ))
      .orderBy(desc(automaticDiscounts.priority));
    
    for (const autoDiscount of activeAutoDiscounts) {
      // Check minimum amount
      if (autoDiscount.minimumAmount && serverSubtotal < Number(autoDiscount.minimumAmount)) {
        continue;
      }
      
      // Check minimum quantity
      if (autoDiscount.minimumQuantity) {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQty < autoDiscount.minimumQuantity) continue;
      }
      
      // Apply discount based on type (for 'all' and 'member' types that apply to whole cart)
      if (autoDiscount.appliesTo === 'all') {
        if (autoDiscount.type === 'percentage') {
          autoDiscountTotal += (serverSubtotal * Number(autoDiscount.value)) / 100;
        } else if (autoDiscount.type === 'fixed_amount') {
          autoDiscountTotal += Math.min(Number(autoDiscount.value), serverSubtotal);
        }
      }
      // Note: category/product/member specific discounts handled by client for simplicity
    }
    
    // STEP 2: Calculate amount AFTER auto discounts - coupons apply to THIS amount
    const afterAutoDiscounts = serverSubtotal - autoDiscountTotal;
    
    // STEP 3: Validate and apply coupon on the REDUCED amount
    let couponDiscount = 0;
    let validatedCouponCode: string | null = null;
    let usedGiftCardId: string | null = null;
    let giftCardAmountUsed = 0;
    
    if (coupon) {
      // Check if it's a gift card
      if (coupon.type === 'gift_card') {
        const [dbGiftCard] = await db
          .select()
          .from(giftCards)
          .where(and(
            eq(giftCards.storeId, store.id),
            eq(giftCards.code, coupon.code),
            eq(giftCards.status, 'active'),
            gt(giftCards.currentBalance, '0')
          ))
          .limit(1);
        
        if (dbGiftCard) {
          const balance = Number(dbGiftCard.currentBalance);
          // Gift card can cover up to the remaining amount after auto discounts
          giftCardAmountUsed = Math.min(balance, afterAutoDiscounts);
          couponDiscount = giftCardAmountUsed;
          validatedCouponCode = dbGiftCard.code;
          usedGiftCardId = dbGiftCard.id;
        }
      } else {
        // Regular coupon
        const [dbCoupon] = await db
          .select()
          .from(discounts)
          .where(and(
            eq(discounts.storeId, store.id),
            eq(discounts.code, coupon.code),
            eq(discounts.isActive, true),
            or(isNull(discounts.startsAt), lte(discounts.startsAt, now)),
            or(isNull(discounts.endsAt), gte(discounts.endsAt, now))
          ))
          .limit(1);
        
        if (dbCoupon) {
          const usageOk = !dbCoupon.usageLimit || (dbCoupon.usageCount ?? 0) < dbCoupon.usageLimit;
          // Check minimum against ORIGINAL subtotal (before auto discounts)
          const minAmount = dbCoupon.minimumAmount ? Number(dbCoupon.minimumAmount) : 0;
          
          if (usageOk && serverSubtotal >= minAmount) {
            // Apply coupon to amount AFTER automatic discounts ⚠️ IMPORTANT
            if (dbCoupon.type === 'percentage') {
              couponDiscount = (afterAutoDiscounts * Number(dbCoupon.value)) / 100;
            } else if (dbCoupon.type === 'fixed_amount') {
              couponDiscount = Math.min(Number(dbCoupon.value), afterAutoDiscounts);
            }
            validatedCouponCode = dbCoupon.code;
            
            // Increment usage (non-blocking)
            db.update(discounts)
              .set({ usageCount: sql`COALESCE(${discounts.usageCount}, 0) + 1` })
              .where(eq(discounts.id, dbCoupon.id))
              .then(() => {});
          }
        }
      }
    }
    
    // STEP 4: Final totals
    const totalDiscount = autoDiscountTotal + couponDiscount;
    const finalSubtotal = serverSubtotal;
    const finalDiscount = totalDiscount;
    const finalTotal = Math.max(finalSubtotal - finalDiscount + shipping - creditUsed, 0);
    // ===== END Security =====

    // 1. Create or find customer
    let customerId: string;
    
    const existingCustomers = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.storeId, store.id),
        eq(customers.email, customerInfo.email)
      ))
      .limit(1);

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
      // Update customer info
      await db
        .update(customers)
        .set({
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
          acceptsMarketing: customerInfo.acceptsMarketing,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customerId));
    } else {
      const [newCustomer] = await db.insert(customers).values({
        storeId: store.id,
        email: customerInfo.email,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        phone: customerInfo.phone,
        acceptsMarketing: customerInfo.acceptsMarketing,
      }).returning();
      customerId = newCustomer.id;
    }

    // 2. Generate order number and increment counter
    const currentCounter = store.orderCounter ?? 1000;
    const orderNumber = String(currentCounter);
    
    // Increment the store's order counter (handle null case)
    await db
      .update(stores)
      .set({ orderCounter: sql`COALESCE(${stores.orderCounter}, 1000) + 1` })
      .where(eq(stores.id, store.id));

    // 3. Create order (using SERVER-VALIDATED values, not client values)
    const customerFullName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();
    const [order] = await db.insert(orders).values({
      storeId: store.id,
      customerId,
      orderNumber,
      status: 'pending',
      financialStatus: 'paid', // Simulated payment
      fulfillmentStatus: 'unfulfilled',
      subtotal: finalSubtotal.toFixed(2),
      discountCode: validatedCouponCode,
      discountAmount: finalDiscount.toFixed(2),
      creditUsed: creditUsed.toFixed(2),
      shippingAmount: shipping.toFixed(2),
      taxAmount: '0.00',
      total: finalTotal.toFixed(2),
      currency: 'ILS',
      // Customer info (denormalized for quick access)
      customerEmail: customerInfo.email,
      customerName: customerFullName,
      customerPhone: customerInfo.phone,
      shippingAddress: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        company: customerInfo.company || null,
        address: buildAddressString(customerInfo),
        street: customerInfo.street,
        houseNumber: customerInfo.houseNumber,
        apartment: customerInfo.apartment || null,
        floor: customerInfo.floor || null,
        city: customerInfo.city,
        zipCode: customerInfo.zipCode || null,
        phone: customerInfo.phone,
      },
      billingAddress: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        address: buildAddressString(customerInfo),
        city: customerInfo.city,
        zipCode: customerInfo.zipCode || null,
        phone: customerInfo.phone,
      },
      note: customerInfo.notes || null,
    }).returning();

    // 4. Deduct credit from customer if used
    if (creditUsed > 0) {
      // Get current balance before deduction
      const [currentCustomer] = await db
        .select({ creditBalance: customers.creditBalance })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);
      
      const currentBalance = Number(currentCustomer?.creditBalance) || 0;
      const newBalance = currentBalance - creditUsed;
      
      // Update customer credit balance
      await db
        .update(customers)
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
        orderId: order.id,
      });
    }

    // 5. Deduct gift card balance if used
    if (usedGiftCardId && giftCardAmountUsed > 0) {
      const [currentGiftCard] = await db
        .select({ currentBalance: giftCards.currentBalance })
        .from(giftCards)
        .where(eq(giftCards.id, usedGiftCardId))
        .limit(1);
      
      const currentBalance = Number(currentGiftCard?.currentBalance) || 0;
      const newBalance = currentBalance - giftCardAmountUsed;
      
      // Update gift card balance
      await db
        .update(giftCards)
        .set({ 
          currentBalance: newBalance.toFixed(2),
          lastUsedAt: new Date(),
          status: newBalance <= 0 ? 'used' : 'active',
        })
        .where(eq(giftCards.id, usedGiftCardId));
      
      // Create gift card transaction record
      await db.insert(giftCardTransactions).values({
        giftCardId: usedGiftCardId,
        orderId: order.id,
        amount: (-giftCardAmountUsed).toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        note: `הזמנה #${orderNumber}`,
      });
    }

    // 7. Create order items and update inventory
    for (const item of cart) {
      // Handle legacy productId format (productId-variantId)
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
      let actualProductId = item.productId;
      if (item.productId.length > 36 && item.productId.includes('-')) {
        // Extract the first UUID (product ID)
        actualProductId = item.productId.substring(0, 36);
        console.log(`Extracted productId: ${actualProductId} from ${item.productId}`);
      }
      
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: actualProductId,
        variantTitle: item.variantTitle || null,
        name: item.name,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: (item.price * item.quantity).toFixed(2),
      });

      // 5. Update inventory (decrement stock)
      if (item.variantId) {
        // Update variant inventory
        await db
          .update(productVariants)
          .set({ 
            inventory: sql`GREATEST(COALESCE(${productVariants.inventory}, 0) - ${item.quantity}, 0)` 
          })
          .where(eq(productVariants.id, item.variantId));
      } else {
        // Update product inventory (for products without variants)
        await db
          .update(products)
          .set({ 
            inventory: sql`GREATEST(COALESCE(${products.inventory}, 0) - ${item.quantity}, 0)` 
          })
          .where(eq(products.id, actualProductId));
      }
    }

    // 6. Update customer statistics (using server-validated total)
    await db
      .update(customers)
      .set({
        totalOrders: sql`COALESCE(${customers.totalOrders}, 0) + 1`,
        totalSpent: sql`COALESCE(${customers.totalSpent}, 0) + ${finalTotal}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    // 7. Emit order.created event (fire-and-forget, non-blocking)
    emitOrderCreated(
      store.id,
      order.id,
      orderNumber,
      customerInfo.email,
      finalTotal,
      cart.length
    );

    // 8. Check for low stock and emit events (non-blocking)
    for (const item of cart) {
      let actualProductId = item.productId;
      if (item.productId.length > 36 && item.productId.includes('-')) {
        actualProductId = item.productId.substring(0, 36);
      }
      
      // Get current inventory to check for low stock
      const [product] = await db
        .select({ inventory: products.inventory, name: products.name })
        .from(products)
        .where(eq(products.id, actualProductId))
        .limit(1);
      
      if (product) {
        emitLowStock(store.id, actualProductId, product.name, product.inventory || 0);
      }
    }

    console.log(`[Order] Created: #${orderNumber} for ${customerInfo.email}`);

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  } catch (error) {
    console.error('[Order] Error:', error);
    console.error('[Order] Cart items:', JSON.stringify(cart, null, 2));
    console.error('[Order] Customer info:', JSON.stringify(customerInfo, null, 2));
    // Return actual error message for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `שגיאה ביצירת ההזמנה: ${errorMessage}` };
  }
}

