'use server';

import { db } from '@/lib/db';
import { products, productImages, productVariants, orders, orderItems, customers, stores, productBundles, bundleComponents } from '@/lib/db/schema';
import { eq, and, or, ilike, desc, inArray, sql } from 'drizzle-orm';
import { isOutOfStock } from '@/lib/inventory';
import { getConfiguredProvider } from '@/lib/payments/factory';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { emitOrderCreated } from '@/lib/events';
import type { CartItem, POSCustomer } from './pos-terminal';

// ============================================
// POS Server Actions
// Product search and order creation
// ============================================

interface POSOrder {
  items: CartItem[];
  customer: POSCustomer;
  shippingMethod: 'pickup' | 'delivery';
  shippingAmount: number;
  discountCode?: string;
  discountAmount: number;
  notes?: string;
  subtotal: number;
  total: number;
  runPostCheckout?: boolean; // 🆕 בצע פעולות פוסט-צ'קאאוט
  isExchange?: boolean; // 🆕 האם זו החלפה/החזרה
  markAsPaid?: boolean; // 🆕 סמן כשולם (ללא תשלום)
  skipPaymentProvider?: boolean; // 🆕 דלג על ספק תשלום (Quick Payment)
  createdByUserId?: string; // CRM Plugin: מי יצר את ההזמנה (סוכן POS)
}

// 🆕 Quick Payment charge request
interface QuickPaymentChargeRequest {
  token: string;
  orderId: string;
  amount: number;
  cardMask?: string;
  cardType?: string;
}

interface Product {
  id: string;
  name: string;
  price: string | null;
  comparePrice: string | null;
  imageUrl: string | null;
  sku: string | null;
  barcode: string | null;
  hasVariants: boolean;
  inventory: number | null;
  isBundle: boolean; // 🆕 האם זה מוצר באנדל
}

/**
 * Search products by name, SKU, or barcode
 */
export async function searchProducts(storeId: string, query: string): Promise<Product[]> {
  if (!query.trim()) {
    return [];
  }

  const searchQuery = `%${query.trim()}%`;
  
  // Get products matching the search
  const productResults = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      comparePrice: products.comparePrice,
      sku: products.sku,
      barcode: products.barcode,
      hasVariants: products.hasVariants,
      inventory: products.inventory,
      isBundle: products.isBundle, // 🆕 האם זה מוצר באנדל
    })
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.isActive, true),
        or(
          ilike(products.name, searchQuery),
          ilike(products.sku, searchQuery),
          ilike(products.barcode, searchQuery)
        )
      )
    )
    .orderBy(desc(products.updatedAt))
    .limit(20);

  // Get primary images for these products
  const productIds = productResults.map(p => p.id);
  const images = productIds.length > 0 ? await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .where(
      and(
        eq(productImages.isPrimary, true)
      )
    ) : [];

  const imageMap = new Map(images.map(img => [img.productId, img.url]));

  return productResults.map(p => ({
    ...p,
    imageUrl: imageMap.get(p.id) || null,
  }));
}

/**
 * Generate a unique order number - ATOMIC to prevent race conditions
 * IMPORTANT: Returns numeric string only (no # prefix) - # is added only in UI display
 */
async function generateOrderNumber(storeId: string): Promise<string> {
  // 🔒 ATOMIC: Update and return in one operation to prevent duplicates
  const [updatedStore] = await db
    .update(stores)
    .set({ orderCounter: sql`COALESCE(${stores.orderCounter}, 1000) + 1` })
    .where(eq(stores.id, storeId))
    .returning({ orderCounter: stores.orderCounter });

  const orderNumber = String(updatedStore?.orderCounter ?? 1001);
  
  // Safety check: ensure no # prefix (should never happen, but just in case)
  if (orderNumber.startsWith('#')) {
    console.error('[POS] ERROR: Order number contains # prefix! This should not happen.');
    return orderNumber.replace(/^#+/, ''); // Remove any # prefixes
  }
  
  return orderNumber;
}

/**
 * Create a POS order and get payment URL
 */
export async function createPOSOrder(
  storeId: string,
  storeSlug: string,
  order: POSOrder
): Promise<{ success: boolean; orderId?: string; paymentUrl?: string; error?: string }> {
  try {
    // Validation
    if (order.items.length === 0) {
      return { success: false, error: 'העגלה ריקה' };
    }

    if (!order.customer.name || !order.customer.email || !order.customer.phone) {
      return { success: false, error: 'חסרים פרטי לקוח' };
    }

    // ========== 🔒 SERVER-SIDE INVENTORY VALIDATION ==========
    // Skip validation for manual items (no productId)
    const productItems = order.items.filter(item => item.productId && item.type !== 'manual');
    
    if (productItems.length > 0) {
      const productIds = productItems.map(item => item.productId!);
      const variantIds = productItems
        .filter(item => item.variantId)
        .map(item => item.variantId!);
      
      // Fetch products with inventory data
      const productsData = await db
        .select({
          id: products.id,
          name: products.name,
          trackInventory: products.trackInventory,
          inventory: products.inventory,
          allowBackorder: products.allowBackorder,
          hasVariants: products.hasVariants,
          isActive: products.isActive,
        })
        .from(products)
        .where(inArray(products.id, productIds));
      
      // Fetch variants with inventory data
      const variantsData = variantIds.length > 0
        ? await db
            .select({
              id: productVariants.id,
              productId: productVariants.productId,
              title: productVariants.title,
              inventory: productVariants.inventory,
              allowBackorder: productVariants.allowBackorder,
            })
            .from(productVariants)
            .where(inArray(productVariants.id, variantIds))
        : [];
      
      const productMap = new Map(productsData.map(p => [p.id, p]));
      const variantMap = new Map(variantsData.map(v => [v.id, v]));
      
      // Validate each item
      const outOfStockItems: string[] = [];
      
      for (const item of productItems) {
        if (!item.productId) continue;
        
        const product = productMap.get(item.productId);
        if (!product || !product.isActive) {
          outOfStockItems.push(item.name);
          continue;
        }
        
        // For products with variants
        if (item.variantId) {
          const variant = variantMap.get(item.variantId);
          if (!variant) {
            outOfStockItems.push(item.name);
            continue;
          }
          
          if (!variant.allowBackorder && variant.inventory !== null && variant.inventory < item.quantity) {
            outOfStockItems.push(`${item.name} (נותרו ${variant.inventory} יחידות)`);
          }
        } 
        // For products without variants
        else if (!product.hasVariants) {
          if (isOutOfStock(product.trackInventory, product.inventory, product.allowBackorder)) {
            outOfStockItems.push(item.name);
          } else if (product.trackInventory && !product.allowBackorder && 
                     product.inventory !== null && product.inventory < item.quantity) {
            outOfStockItems.push(`${item.name} (נותרו ${product.inventory} יחידות)`);
          }
        }
      }
      
      if (outOfStockItems.length > 0) {
        return { 
          success: false, 
          error: `אין מספיק מלאי עבור: ${outOfStockItems.join(', ')}` 
        };
      }
    }
    // ========== END INVENTORY VALIDATION ==========

    // Get store info
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    // Get or create customer
    let customerId = order.customer.customerId;
    if (!customerId && order.customer.type === 'new') {
      // Check if customer exists by email
      const [existingCustomer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.storeId, storeId),
            eq(customers.email, order.customer.email)
          )
        )
        .limit(1);

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const nameParts = order.customer.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const [newCustomer] = await db.insert(customers).values({
          storeId,
          email: order.customer.email,
          firstName,
          lastName,
          phone: order.customer.phone,
          defaultAddress: order.customer.address || null,
        }).returning({ id: customers.id });

        customerId = newCustomer.id;
      }
    }

    // Generate order number
    const orderNumber = await generateOrderNumber(storeId);

    // Create order
    const [newOrder] = await db.insert(orders).values({
      storeId,
      customerId: customerId || null,
      orderNumber,
      status: 'pending',
      financialStatus: 'pending',
      fulfillmentStatus: 'unfulfilled',
      subtotal: String(order.subtotal),
      discountCode: order.discountCode || null,
      discountAmount: String(order.discountAmount || 0),
      shippingAmount: String(order.shippingAmount || 0),
      total: String(order.total),
      customerEmail: order.customer.email,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      shippingAddress: order.shippingMethod === 'delivery' && order.customer.address 
        ? order.customer.address 
        : null,
      shippingMethod: order.shippingMethod === 'pickup' ? 'איסוף עצמי' : 'משלוח',
      note: order.notes || null,
      // POS source tracking
      utmSource: 'pos',
      // CRM Plugin: מי יצר את ההזמנה (סוכן POS)
      createdByUserId: order.createdByUserId || null,
    }).returning();

    // Create order items and handle inventory
    for (const item of order.items) {
      const isReturn = item.type === 'return';
      
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId || null,
        name: item.name,
        price: String(item.price),
        total: String(item.price * item.quantity),
        quantity: isReturn ? -item.quantity : item.quantity, // Negative quantity for returns
        imageUrl: item.imageUrl || null,
        properties: item.type === 'manual' ? {
          isManual: true,
          description: item.description,
        } : isReturn ? {
          isReturn: true,
          originalOrderId: item.originalOrderId,
        } : {},
      });

      // 🆕 Update inventory based on item type (if runPostCheckout is enabled)
      if (order.runPostCheckout !== false && item.productId && item.type !== 'manual') {
        const inventoryChange = isReturn 
          ? item.quantity  // Return: ADD to inventory
          : -item.quantity; // Purchase: SUBTRACT from inventory
        
        // 🆕 Check if this product is a bundle
        const [productData] = await db
          .select({ isBundle: products.isBundle })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);
        
        if (productData?.isBundle) {
          // This is a bundle - update inventory for all components
          const bundle = await db
            .select({ id: productBundles.id })
            .from(productBundles)
            .where(eq(productBundles.productId, item.productId))
            .limit(1);
          
          if (bundle.length > 0) {
            const components = await db
              .select({
                productId: bundleComponents.productId,
                variantId: bundleComponents.variantId,
                quantity: bundleComponents.quantity,
              })
              .from(bundleComponents)
              .where(eq(bundleComponents.bundleId, bundle[0].id));
            
            for (const comp of components) {
              const compInventoryChange = inventoryChange * comp.quantity;
              
              if (comp.variantId) {
                await db.update(productVariants)
                  .set({ 
                    inventory: sql`GREATEST(COALESCE(${productVariants.inventory}, 0) + ${compInventoryChange}, 0)` 
                  })
                  .where(eq(productVariants.id, comp.variantId));
              } else if (comp.productId) {
                await db.update(products)
                  .set({ 
                    inventory: sql`GREATEST(COALESCE(${products.inventory}, 0) + ${compInventoryChange}, 0)` 
                  })
                  .where(eq(products.id, comp.productId));
              }
              
              console.log(`[POS] Bundle component ${comp.productId} inventory ${isReturn ? 'increased' : 'decreased'} by ${Math.abs(compInventoryChange)}`);
            }
          }
        } else {
          // Regular product - update inventory as usual
          if (item.variantId) {
            // Update variant inventory
            await db.update(productVariants)
              .set({ 
                inventory: sql`GREATEST(COALESCE(${productVariants.inventory}, 0) + ${inventoryChange}, 0)` 
              })
              .where(eq(productVariants.id, item.variantId));
          } else {
            // Update product inventory
            await db.update(products)
              .set({ 
                inventory: sql`GREATEST(COALESCE(${products.inventory}, 0) + ${inventoryChange}, 0)` 
              })
              .where(eq(products.id, item.productId));
          }
          
          console.log(`[POS] Inventory ${isReturn ? 'increased' : 'decreased'} for product ${item.productId}: ${Math.abs(inventoryChange)}`);
        }
      }
    }

    // 🆕 If total is 0 or less OR markAsPaid is true, mark as paid directly
    if (order.total <= 0 || order.markAsPaid) {
      console.log('[POS] Zero/negative payment or marked as paid - marking order as paid');
      await db.update(orders)
        .set({ 
          financialStatus: 'paid',
          status: 'processing',
          paidAt: new Date(), // 🔥 חשוב! לחיוב עמלות
          note: order.markAsPaid && order.total > 0 
            ? `${order.notes || ''}\n[שולם - נרשם ידנית בקופה]`.trim()
            : order.notes || null,
        })
        .where(eq(orders.id, newOrder.id));
      
      // 🆕 Run post-checkout actions if enabled
      if (order.runPostCheckout !== false) {
        await runPOSPostCheckoutActions(storeId, storeSlug, newOrder.id, orderNumber, order);
      }
      
      return {
        success: true,
        orderId: newOrder.id,
        // No payment URL needed - order is complete
      };
    }

    // 🆕 If skipPaymentProvider (Quick Payment will handle it), return order ID for client-side payment
    if (order.skipPaymentProvider) {
      console.log('[POS] Skipping payment provider - Quick Payment will be used');
      return {
        success: true,
        orderId: newOrder.id,
      };
    }

    // Get payment provider
    const provider = await getConfiguredProvider(storeId);
    if (!provider) {
      // If no payment provider, mark as pending and return success
      console.log('[POS] No payment provider configured, order created as pending');
      return {
        success: true,
        orderId: newOrder.id,
        error: 'לא הוגדר ספק סליקה - ההזמנה נוצרה כממתינה לתשלום',
      };
    }

    // Create payment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${storeSlug}.quickshop.co.il`;
    const successUrl = `${baseUrl}/shops/${storeSlug}/admin/plugins/pos?payment=success`;
    const failureUrl = `${baseUrl}/shops/${storeSlug}/admin/plugins/pos?payment=failed`;

    const paymentResult = await provider.initiatePayment({
      storeId,
      storeSlug,
      orderReference: newOrder.id,
      amount: order.total,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
        address: order.customer.address?.street,
        city: order.customer.address?.city,
      },
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      orderData: {
        source: 'pos',
        orderId: newOrder.id,
        orderNumber,
      },
      successUrl,
      failureUrl,
      language: 'he',
    });

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      console.error('[POS] Payment initiation failed:', paymentResult.errorMessage);
      return {
        success: false,
        orderId: newOrder.id,
        error: paymentResult.errorMessage || 'שגיאה ביצירת עמוד תשלום',
      };
    }

    return {
      success: true,
      orderId: newOrder.id,
      paymentUrl: paymentResult.paymentUrl,
    };
  } catch (error) {
    console.error('[POS] Create order error:', error);
    return {
      success: false,
      error: 'שגיאה ביצירת ההזמנה',
    };
  }
}

/**
 * Run post-checkout actions for POS orders
 * - Send order confirmation email
 * - Emit order.created event (triggers dashboard notification + mobile push)
 * - Future: Check automations, auto-shipping, etc.
 */
async function runPOSPostCheckoutActions(
  storeId: string,
  storeSlug: string,
  orderId: string,
  orderNumber: string,
  order: POSOrder
) {
  try {
    console.log('[POS] Running post-checkout actions for order:', orderNumber);
    
    // Get store details for email
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    
    if (!store) {
      console.error('[POS] Store not found for post-checkout actions');
      return;
    }
    
    // Filter out return items for total calculation (purchase items only)
    const purchaseItems = order.items.filter(i => i.type !== 'return');
    const returnItems = order.items.filter(i => i.type === 'return');
    const purchaseTotal = purchaseItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    // 1. Send order confirmation email
    try {
      await sendOrderConfirmationEmail({
        storeName: store.name,
        storeSlug,
        orderNumber,
        customerEmail: order.customer.email,
        customerName: order.customer.name,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.type === 'return' ? -item.quantity : item.quantity,
          price: Math.abs(item.price),
          total: Math.abs(item.price) * item.quantity,
          imageUrl: item.imageUrl,
        })),
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        total: Math.max(order.total, 0),
        shippingAddress: order.shippingMethod === 'delivery' && order.customer.address
          ? {
              address: `${order.customer.address.street || ''} ${order.customer.address.houseNumber || ''}`.trim(),
              city: order.customer.address.city,
              firstName: order.customer.name.split(' ')[0],
              lastName: order.customer.name.split(' ').slice(1).join(' '),
              phone: order.customer.phone,
            }
          : undefined,
      });
      console.log('[POS] Order confirmation email sent');
    } catch (emailError) {
      console.error('[POS] Failed to send order confirmation email:', emailError);
    }
    
    // 2. Emit order.created event (dashboard notification + mobile push)
    emitOrderCreated(
      storeId,
      store.name,
      orderId,
      orderNumber,
      order.customer.email,
      Math.max(order.total, 0),
      purchaseItems.length,
      order.customer.name || undefined,
      order.discountCode || undefined
    );
    console.log('[POS] Order created event emitted');
    
    // 3. Future: Check for automations (abandoned cart recovery, etc.)
    // 4. Future: Auto-send to shipping provider if configured
    
  } catch (error) {
    console.error('[POS] Post-checkout actions error:', error);
    // Don't throw - post-checkout actions are non-blocking
  }
}

/**
 * 🆕 Process refund for exchange with customer credit
 * When exchange results in customer favor (negative total), we need to refund the difference
 */
export async function processExchangeRefund(
  storeSlug: string,
  originalOrderId: string,
  refundAmount: number,
  reason?: string
): Promise<{ success: boolean; error?: string; refundId?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${storeSlug}.quickshop.co.il`;
    
    const response = await fetch(`${baseUrl}/api/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storeSlug,
        orderId: originalOrderId,
        amount: Math.abs(refundAmount),
        reason: reason || 'החזר בגין החלפה',
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('[POS] Exchange refund successful:', result.refundId);
      return {
        success: true,
        refundId: result.refundId,
      };
    }
    
    return {
      success: false,
      error: result.error || 'שגיאה בביצוע הזיכוי',
    };
  } catch (error) {
    console.error('[POS] Exchange refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה בביצוע הזיכוי',
    };
  }
}

/**
 * 🆕 Charge order using Quick Payment (PayMe) token
 */
export async function chargeWithQuickPayment(
  storeSlug: string,
  request: QuickPaymentChargeRequest
): Promise<{ success: boolean; error?: string; transactionId?: string }> {
  try {
    const { token, orderId, amount, cardMask, cardType } = request;
    
    // Call the Quick Payment charge API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${storeSlug}.quickshop.co.il`;
    const response = await fetch(`${baseUrl}/api/shops/${storeSlug}/payments/quick/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        orderId,
        amount,
        currency: 'ILS',
        cardMask,
        cardType,
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('[POS] Quick Payment charge successful:', result.transactionId);
      return {
        success: true,
        transactionId: result.transactionId,
      };
    }
    
    // Handle 3DS redirect if required
    if (result.requires3DS && result.redirectUrl) {
      // For POS, we can't do 3DS easily - return error
      return {
        success: false,
        error: 'הכרטיס דורש אימות 3D Secure. אנא השתמש בכרטיס אחר או בצע תשלום דרך הצ\'קאאוט הרגיל.',
      };
    }
    
    return {
      success: false,
      error: result.error || 'שגיאה בביצוע התשלום',
    };
  } catch (error) {
    console.error('[POS] Quick Payment charge error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה בביצוע התשלום',
    };
  }
}

