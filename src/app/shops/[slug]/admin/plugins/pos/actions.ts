'use server';

import { db } from '@/lib/db';
import { products, productImages, productVariants, orders, orderItems, customers, stores } from '@/lib/db/schema';
import { eq, and, or, ilike, desc, inArray } from 'drizzle-orm';
import { isOutOfStock } from '@/lib/inventory';
import { getConfiguredProvider } from '@/lib/payments/factory';
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
 * Generate a unique order number
 */
async function generateOrderNumber(storeId: string): Promise<string> {
  // Get the last order number for this store
  const [lastOrder] = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.storeId, storeId))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  let nextNumber = 1001;
  if (lastOrder?.orderNumber) {
    const match = lastOrder.orderNumber.match(/\d+/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

  return `#${nextNumber}`;
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
    }).returning();

    // Create order items
    for (const item of order.items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId || null,
        name: item.name,
        price: String(item.price),
        total: String(item.price * item.quantity),
        quantity: item.quantity,
        imageUrl: item.imageUrl || null,
        properties: item.type === 'manual' ? {
          isManual: true,
          description: item.description,
        } : {},
      });
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

