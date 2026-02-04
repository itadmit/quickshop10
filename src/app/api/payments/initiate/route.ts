/**
 * Payment Initiation API
 * POST /api/payments/initiate
 * 
 * Initiates a payment with the store's configured provider
 * Creates a pending_payment record and returns the payment URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pendingPayments, paymentTransactions, orders, orderItems, customers, products, productVariants, contacts, discounts } from '@/lib/db/schema';
import { eq, and, sql, inArray, or, lte, gte, isNull } from 'drizzle-orm';
import { isOutOfStock } from '@/lib/inventory';
import { getConfiguredProvider, getDefaultProvider } from '@/lib/payments';
import type { InitiatePaymentRequest, PaymentProviderType } from '@/lib/payments/types';
import { nanoid } from 'nanoid';
import { hashPassword } from '@/lib/customer-auth';

interface InitiatePaymentBody {
  storeSlug: string;
  provider?: PaymentProviderType;
  
  // Order data
  amount: number;
  currency?: string;
  
  // Customer
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  
  // Cart items
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  
  // Shipping
  shipping?: {
    method: string;
    cost: number;
    address: string;
    city: string;
    postalCode?: string;
  };
  
  // Discount
  discountCode?: string;
  discountAmount?: number;
  discountDetails?: Array<{
    type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member' | 'loyalty_tier';
    code?: string;
    name: string;
    description?: string;
    amount: number;
  }>;
  
  // Influencer
  influencerId?: string;
  
  // Full order payload
  orderData: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as InitiatePaymentBody;
    
    // Validate required fields
    if (!body.storeSlug) {
      return NextResponse.json(
        { success: false, error: 'Store slug is required' },
        { status: 400 }
      );
    }
    
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }
    
    if (!body.customer?.email || !body.customer?.name) {
      return NextResponse.json(
        { success: false, error: 'Customer name and email are required' },
        { status: 400 }
      );
    }
    
    // Get store
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, body.storeSlug))
      .limit(1);
    
    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Get payment provider
    const provider = body.provider
      ? await getConfiguredProvider(store.id, body.provider)
      : await getDefaultProvider(store.id);
    
    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'No active payment provider configured' },
        { status: 400 }
      );
    }
    
    // Generate order reference for internal tracking
    const orderReference = `QS-${nanoid(10)}`;
    
    // 🔒 ATOMIC: Generate numeric order number with atomic increment
    // This prevents race conditions when multiple orders are created simultaneously
    // We increment first, then use the NEW value as the order number
    // IMPORTANT: Returns numeric string only (no # prefix) - # is added only in UI display
    const [updatedStore] = await db.update(stores)
      .set({ orderCounter: sql`COALESCE(${stores.orderCounter}, 1000) + 1` })
      .where(eq(stores.id, store.id))
      .returning({ orderCounter: stores.orderCounter });
    
    let orderNumber = String(updatedStore?.orderCounter ?? 1001);
    
    // Safety check: ensure no # prefix (should never happen, but just in case)
    if (orderNumber.startsWith('#')) {
      console.error('[Payment Initiate] ERROR: Order number contains # prefix! This should not happen.');
      orderNumber = orderNumber.replace(/^#+/, ''); // Remove any # prefixes
    }
    
    // Build URLs - use custom domain if store has one, otherwise use platform URL
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!platformUrl) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // For customer-facing redirects: use custom domain if available
    let customerFacingUrl: string;
    let storePath: string;
    
    if (store.customDomain) {
      // Custom domain - no /shops/slug prefix needed
      customerFacingUrl = `https://${store.customDomain}`;
      storePath = '';
    } else {
      // Platform subdomain - use /shops/slug path
      customerFacingUrl = platformUrl;
      storePath = `/shops/${body.storeSlug}`;
    }
    
    // Use orderNumber (numeric) in URL for reliable lookup
    const successUrl = `${customerFacingUrl}${storePath}/checkout/thank-you?ref=${orderNumber}`;
    const failureUrl = `${customerFacingUrl}${storePath}/checkout?error=payment_failed`;
    const cancelUrl = `${customerFacingUrl}${storePath}/checkout`;
    
    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Add shipping as item if exists
    const allItems = [...body.items];
    if (body.shipping && body.shipping.cost > 0) {
      allItems.push({
        name: `משלוח - ${body.shipping.method}`,
        quantity: 1,
        price: body.shipping.cost,
        isShipping: true,
      } as typeof body.items[0] & { isShipping: boolean });
    }
    
    // Add discount as negative item if exists (PayPlus supports negative prices)
    // This ensures the final amount matches what customer should pay
    if (body.discountAmount && body.discountAmount > 0) {
      const discountName = body.discountCode 
        ? `הנחה - ${body.discountCode}`
        : 'הנחה';
      
      allItems.push({
        name: discountName,
        quantity: 1,
        price: -body.discountAmount, // Negative price for discount
        isShipping: false,
      } as typeof body.items[0] & { isShipping: boolean });
    }
    
    // Calculate total amount from items (PayPlus requires amount = sum of items)
    // This ensures PayPlus validation passes: global-price-is-not-equal-to-total-items-sum
    const calculatedAmount = allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Log for debugging
    console.log('[Payment Initiate] Amount calculation:', {
      clientAmount: body.amount,
      calculatedAmount,
      itemsCount: allItems.length,
      itemsTotal: allItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      discountAmount: body.discountAmount,
      shippingCost: body.shipping?.cost || 0,
      itemsBreakdown: allItems.map(item => ({ name: item.name, price: item.price, quantity: item.quantity })),
    });
    
    // Build payment request
    const paymentRequest: InitiatePaymentRequest = {
      storeId: store.id,
      storeSlug: body.storeSlug,
      orderReference,
      amount: calculatedAmount, // Use calculated amount (sum of items) for PayPlus validation
      currency: body.currency || 'ILS',
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        address: body.customer.address,
        city: body.customer.city,
        postalCode: body.customer.postalCode,
        countryIso: 'IL',
      },
      items: allItems.map(item => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl,
        isShipping: 'isShipping' in item ? (item as { isShipping: boolean }).isShipping : false,
      })),
      discountCode: body.discountCode,
      discountAmount: body.discountAmount,
      influencerId: body.influencerId,
      orderData: body.orderData,
      successUrl,
      failureUrl,
      cancelUrl,
      ipAddress,
      userAgent,
      language: 'he',
      sendEmailOnSuccess: true,
      sendEmailOnFailure: false,
    };
    
    // Initiate payment with provider
    const response = await provider.initiatePayment(paymentRequest);
    
    if (!response.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: response.errorMessage || 'Payment initiation failed',
          errorCode: response.errorCode,
        },
        { status: 400 }
      );
    }
    
    // Use orderData.items (which has productId) instead of body.items (which doesn't)
    // orderData.items includes: productId, variantId, variantTitle, name, quantity, price, sku, image, addons
    // body.items includes: name, sku, quantity, price, imageUrl (no productId!)
    const cartItemsForOrder = (body.orderData?.items || body.items) as Array<{
      productId: string;
      variantId?: string;
      variantTitle?: string;
      name: string;
      quantity: number;
      price: number;
      sku?: string;
      image?: string;
      imageUrl?: string;
      // Addons (product customizations)
      addons?: Array<{
        addonId: string;
        name: string;
        value: string;
        displayValue: string;
        priceAdjustment: number;
      }>;
      addonTotal?: number;
      // Bundle info
      isBundle?: boolean;
      bundleComponents?: Array<{
        name: string;
        variantTitle?: string;
        quantity: number;
      }>;
    }>;
    
    // Validate cart items exist
    if (!cartItemsForOrder || cartItemsForOrder.length === 0) {
      console.error('[Payment Initiate] No cart items found in request', { 
        hasOrderDataItems: !!body.orderData?.items, 
        hasBodyItems: !!body.items 
      });
      return NextResponse.json(
        { success: false, error: 'העגלה ריקה. אנא הוסף מוצרים והמשך לתשלום.' },
        { status: 400 }
      );
    }

    // ========== 🔒 SERVER-SIDE INVENTORY VALIDATION ==========
    // Critical: Validate stock before creating order to prevent overselling
    // This catches race conditions where multiple customers checkout simultaneously
    
    const productIds = cartItemsForOrder
      .map(item => item.productId)
      .filter((id): id is string => !!id);
    
    const variantIds = cartItemsForOrder
      .map(item => item.variantId)
      .filter((id): id is string => !!id);
    
    // Fetch products with inventory data
    const productsWithInventory = productIds.length > 0 
      ? await db
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
          .where(inArray(products.id, productIds))
      : [];
    
    // Fetch variants with inventory data
    const variantsWithInventory = variantIds.length > 0
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
    
    // Create lookup maps
    const productMap = new Map(productsWithInventory.map(p => [p.id, p]));
    const variantMap = new Map(variantsWithInventory.map(v => [v.id, v]));
    
    // Validate each cart item
    const outOfStockItems: string[] = [];
    const insufficientStockItems: string[] = [];
    const inactiveItems: string[] = [];
    
    for (const item of cartItemsForOrder) {
      if (!item.productId) continue; // Skip items without productId (e.g., shipping)
      
      const product = productMap.get(item.productId);
      
      // Check if product exists and is active
      if (!product) {
        outOfStockItems.push(item.name || 'מוצר לא ידוע');
        continue;
      }
      
      if (!product.isActive) {
        inactiveItems.push(product.name);
        continue;
      }
      
      // For products WITH variants - check variant inventory
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        
        if (!variant) {
          outOfStockItems.push(`${product.name}${item.variantTitle ? ` - ${item.variantTitle}` : ''}`);
          continue;
        }
        
        // Check variant stock (variants always track inventory when they exist)
        if (!variant.allowBackorder && variant.inventory !== null && variant.inventory < item.quantity) {
          if (variant.inventory <= 0) {
            outOfStockItems.push(`${product.name} - ${variant.title}`);
          } else {
            insufficientStockItems.push(`${product.name} - ${variant.title} (נותרו ${variant.inventory} יחידות)`);
          }
        }
      } 
      // For products WITHOUT variants - check product inventory
      else if (!product.hasVariants) {
        if (isOutOfStock(product.trackInventory, product.inventory, product.allowBackorder)) {
          outOfStockItems.push(product.name);
        } else if (product.trackInventory && !product.allowBackorder && 
                   product.inventory !== null && product.inventory < item.quantity) {
          insufficientStockItems.push(`${product.name} (נותרו ${product.inventory} יחידות)`);
        }
      }
    }
    
    // Return error if any items have stock issues
    if (outOfStockItems.length > 0 || insufficientStockItems.length > 0 || inactiveItems.length > 0) {
      const errorParts: string[] = [];
      
      if (outOfStockItems.length > 0) {
        errorParts.push(`המוצרים הבאים אזלו מהמלאי: ${outOfStockItems.join(', ')}`);
      }
      if (insufficientStockItems.length > 0) {
        errorParts.push(`אין מספיק מלאי עבור: ${insufficientStockItems.join(', ')}`);
      }
      if (inactiveItems.length > 0) {
        errorParts.push(`המוצרים הבאים אינם זמינים יותר: ${inactiveItems.join(', ')}`);
      }
      
      console.log('[Payment Initiate] Inventory validation failed:', {
        outOfStockItems,
        insufficientStockItems,
        inactiveItems,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorParts.join('. ') + '. אנא עדכן את העגלה ונסה שנית.',
          outOfStockItems,
          insufficientStockItems,
          inactiveItems,
        },
        { status: 400 }
      );
    }
    
    console.log('[Payment Initiate] Inventory validation passed for all items');

    // ========== CREATE ORDER WITH PENDING STATUS ==========
    // This allows us to track all checkout attempts, not just completed ones
    
    // Get or create customer
    let customerId: string | null = null;
    const orderData = body.orderData as { 
      acceptsMarketing?: boolean; 
      createAccount?: boolean; 
      password?: string;
      shippingAddress?: Record<string, unknown>;
    } | undefined;
    const acceptsMarketing = Boolean(orderData?.acceptsMarketing);
    const createAccount = Boolean(orderData?.createAccount);
    const password = orderData?.password;
    
    if (body.customer.email) {
      const [existingCustomer] = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.storeId, store.id),
            eq(customers.email, body.customer.email)
          )
        )
        .limit(1);
      
      const nameParts = body.customer.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
        
        // Build update object
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        
        // Update acceptsMarketing if customer opted in
        if (acceptsMarketing && !existingCustomer.acceptsMarketing) {
          updateData.acceptsMarketing = true;
        }
        
        // Set password if createAccount is checked and customer doesn't have one
        if (createAccount && password && !existingCustomer.passwordHash) {
          updateData.passwordHash = await hashPassword(password);
          console.log(`[Payment Initiate] Set password for existing customer: ${customerId}`);
        }
        
        if (Object.keys(updateData).length > 1) {
          await db.update(customers)
            .set(updateData)
            .where(eq(customers.id, customerId));
        }
      } else {
        // Create new customer - hash password if createAccount is true
        let passwordHash: string | null = null;
        if (createAccount && password) {
          passwordHash = await hashPassword(password);
        }
        
        const [newCustomer] = await db.insert(customers).values({
          storeId: store.id,
          email: body.customer.email,
          firstName,
          lastName,
          phone: body.customer.phone || '',
          passwordHash,
          defaultAddress: {
            address: body.customer.address || '',
            city: body.customer.city || '',
            zipCode: body.customer.postalCode || '',
          },
          acceptsMarketing,
          totalOrders: 0,
          totalSpent: '0',
        }).returning();
        customerId = newCustomer.id;
        console.log(`[Payment Initiate] Created new customer: ${customerId}${passwordHash ? ' with account' : ''}`);
      }
      
      // Create club_member contact if createAccount is true
      if (createAccount && customerId) {
        // Check if club_member contact already exists
        const [existingContact] = await db
          .select({ id: contacts.id })
          .from(contacts)
          .where(
            and(
              eq(contacts.storeId, store.id),
              eq(contacts.email, body.customer.email),
              eq(contacts.type, 'club_member')
            )
          )
          .limit(1);
        
        if (!existingContact) {
          await db.insert(contacts).values({
            storeId: store.id,
            email: body.customer.email,
            firstName,
            lastName,
            phone: body.customer.phone || null,
            type: 'club_member',
            status: 'active',
            source: 'checkout',
            customerId,
            metadata: {},
          });
          console.log(`[Payment Initiate] Created club_member contact for: ${body.customer.email}`);
        }
      }
    }

    // Calculate totals (orderNumber already generated above)
    const subtotal = cartItemsForOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = body.shipping?.cost || 0;
    const creditUsed = Number((body.orderData as { creditUsed?: number })?.creditUsed) || 0;
    
    // 🔒 CRITICAL: Validate coupon server-side before creating order
    let validatedDiscountAmount = 0;
    let validatedDiscountCode: string | null = null;
    let validatedDiscountDetails = body.discountDetails || [];
    
    if (body.discountCode) {
      const now = new Date();
      const normalizedCode = body.discountCode.toUpperCase().trim();
      
      // Validate coupon exists, is active, and within date range
      const [dbCoupon] = await db
        .select()
        .from(discounts)
        .where(and(
          eq(discounts.storeId, store.id),
          eq(discounts.code, normalizedCode),
          eq(discounts.isActive, true),
          or(isNull(discounts.startsAt), lte(discounts.startsAt, now)),
          or(isNull(discounts.endsAt), gte(discounts.endsAt, now))
        ))
        .limit(1);
      
      if (!dbCoupon) {
        // Coupon is invalid - reject the request
        return NextResponse.json(
          { success: false, error: 'הקופון כבר אינו בתוקף' },
          { status: 400 }
        );
      }
      
      // Check usage limit
      if (dbCoupon.usageLimit && dbCoupon.usageCount && dbCoupon.usageCount >= dbCoupon.usageLimit) {
        return NextResponse.json(
          { success: false, error: 'קופון זה כבר אינו בתוקף' },
          { status: 400 }
        );
      }
      
      // Check minimum amount
      const minAmount = dbCoupon.minimumAmount ? Number(dbCoupon.minimumAmount) : 0;
      if (subtotal < minAmount) {
        return NextResponse.json(
          { success: false, error: `סכום ההזמנה נמוך מהמינימום הנדרש לקופון זה (₪${minAmount})` },
          { status: 400 }
        );
      }
      
      // Calculate discount based on validated coupon
      if (dbCoupon.type === 'percentage') {
        validatedDiscountAmount = (subtotal * Number(dbCoupon.value)) / 100;
      } else if (dbCoupon.type === 'fixed_amount') {
        validatedDiscountAmount = Math.min(Number(dbCoupon.value), subtotal);
      }
      
      validatedDiscountCode = dbCoupon.code;
      
      // Rebuild discountDetails with validated data
      validatedDiscountDetails = [{
        type: 'coupon' as const,
        code: dbCoupon.code,
        name: dbCoupon.title || dbCoupon.code,
        amount: validatedDiscountAmount,
        description: dbCoupon.type === 'percentage' ? `${dbCoupon.value}% הנחה` : `₪${validatedDiscountAmount.toFixed(2)} הנחה`,
      }];
    }
    
    const totalAmount = subtotal + shippingCost - validatedDiscountAmount - creditUsed;

    // Create order with PENDING financial status
    const [newOrder] = await db.insert(orders).values({
      storeId: store.id,
      customerId,
      orderNumber,
      status: 'pending', // Order is pending until payment completes
      financialStatus: 'pending', // Payment not yet received
      fulfillmentStatus: 'unfulfilled',
      subtotal: String(subtotal),
      discountAmount: String(validatedDiscountAmount),
      creditUsed: String(creditUsed),
      shippingAmount: String(shippingCost),
      taxAmount: '0',
      total: String(totalAmount),
      currency: body.currency || 'ILS',
      
      // Customer info
      customerEmail: body.customer.email,
      customerName: body.customer.name,
      customerPhone: body.customer.phone || '',
      
      // Shipping address
      shippingAddress: body.orderData?.shippingAddress as Record<string, unknown> || {
        address: body.customer.address,
        city: body.customer.city,
        zipCode: body.customer.postalCode,
      },
      billingAddress: body.orderData?.billingAddress as Record<string, unknown> || {},
      
      // Discount (using validated values)
      discountCode: validatedDiscountCode,
      discountDetails: validatedDiscountDetails.length > 0 ? validatedDiscountDetails : null,
      
      // Influencer
      influencerId: body.influencerId,
      
      // 📊 UTM tracking for traffic attribution
      utmSource: (body.orderData as { utmSource?: string; utmData?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string } })?.utmSource 
        || (body.orderData as { utmData?: { source?: string } })?.utmData?.source 
        || null,
      utmMedium: (body.orderData as { utmData?: { medium?: string } })?.utmData?.medium || null,
      utmCampaign: (body.orderData as { utmData?: { campaign?: string } })?.utmData?.campaign || null,
      utmContent: (body.orderData as { utmData?: { content?: string } })?.utmData?.content || null,
      utmTerm: (body.orderData as { utmData?: { term?: string } })?.utmData?.term || null,
      
      // Device type - detect from User-Agent
      deviceType: (() => {
        const ua = request.headers.get('user-agent') || '';
        if (/Tablet|iPad/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
        return 'desktop';
      })(),
      
      // Note: paymentMethod and paymentDetails will be updated after payment
    }).returning();

    console.log(`[Payment Initiate] Created order #${orderNumber} with pending status`);

    // 🔒 Update coupon usage count (atomic increment to prevent race conditions)
    if (validatedDiscountCode) {
      try {
        await db.update(discounts)
          .set({ usageCount: sql`COALESCE(${discounts.usageCount}, 0) + 1` })
          .where(and(
            eq(discounts.storeId, store.id),
            eq(discounts.code, validatedDiscountCode),
            // Only increment if still under limit (or no limit)
            or(
              isNull(discounts.usageLimit),
              sql`COALESCE(${discounts.usageCount}, 0) < ${discounts.usageLimit}`
            )
          ));
      } catch (error) {
        console.error('[Payment Initiate] Failed to update coupon usage count:', error);
        // Don't fail the order creation if usage count update fails
      }
    }

    // Create order items
    if (cartItemsForOrder.length > 0) {
      try {
        // Validate productIds exist and get product names for fallback
        const productIds = cartItemsForOrder
          .map(item => item.productId)
          .filter((id): id is string => !!id);
        
        // Fetch existing products with their names (for fallback if item.name is missing)
        const productNameMap = new Map<string, string>();
        if (productIds.length > 0) {
          const existingProducts = await db
            .select({ id: products.id, name: products.name })
            .from(products)
            .where(inArray(products.id, productIds));
          
          existingProducts.forEach(p => {
            productNameMap.set(p.id, p.name);
          });
        }

        await db.insert(orderItems).values(
          cartItemsForOrder.map(item => {
            // Calculate total including addon prices
            const addonTotal = item.addonTotal || 0;
            const itemTotal = (item.price + addonTotal) * item.quantity;
            
            return {
            orderId: newOrder.id,
            // Only include productId if it exists in products table
            productId: item.productId && productNameMap.has(item.productId) 
              ? item.productId 
              : null,
            // 🐛 FIX: Fallback to product name from DB if cart item has no name
            name: item.name || (item.productId && productNameMap.get(item.productId)) || 'מוצר',
            variantTitle: item.variantTitle || null,
            sku: item.sku || '',
            quantity: item.quantity,
            price: String(item.price),
              total: String(itemTotal),
            imageUrl: item.image || item.imageUrl || null,
              // 🔧 FIX: Save addons and bundle components in properties
              properties: {
                addons: item.addons || [],
                addonTotal: addonTotal,
                bundleComponents: item.bundleComponents || [],
              },
            };
          })
        );
        
        console.log(`[Payment Initiate] Created ${cartItemsForOrder.length} order items for order #${orderNumber}`);
      } catch (itemError) {
        // Log but don't fail the payment - the order exists, items can be recovered
        console.error(`[Payment Initiate] Failed to create order items for order #${orderNumber}:`, itemError);
      }
    }

    // ========== CREATE PENDING PAYMENT RECORD ==========
    // This links the payment provider request to our order
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry
    
    // Add orderReference to orderData for fallback lookup
    const orderDataWithReference = {
      ...body.orderData,
      orderReference,
    };
    
    await db.insert(pendingPayments).values({
      storeId: store.id,
      provider: provider.providerType,
      providerRequestId: response.providerRequestId!,
      orderId: newOrder.id, // Link to the order we just created!
      orderData: orderDataWithReference,
      cartItems: cartItemsForOrder,
      customerEmail: body.customer.email,
      customerId,
      amount: String(totalAmount), // Use validated total amount
      currency: body.currency || 'ILS',
      status: 'pending',
      discountCode: validatedDiscountCode, // Use validated discount code
      discountAmount: String(validatedDiscountAmount), // Use validated discount amount
      influencerId: body.influencerId,
      expiresAt,
    });
    
    // Create initial transaction record
    await db.insert(paymentTransactions).values({
      storeId: store.id,
      provider: provider.providerType,
      type: 'charge',
      status: 'pending',
      amount: String(body.amount),
      currency: body.currency || 'ILS',
      providerRequestId: response.providerRequestId,
      metadata: {
        orderReference,
        customerEmail: body.customer.email,
      },
      ipAddress,
      userAgent,
    });
    
    return NextResponse.json({
      success: true,
      paymentUrl: response.paymentUrl,
      orderReference,
      providerRequestId: response.providerRequestId,
    });
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    
    // Don't expose raw error messages (may contain SQL) to users
    // Log the full error for debugging but return a friendly message
    let friendlyError = 'שגיאה ביצירת התשלום. אנא נסה שנית.';
    
    // Check for specific known error types
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique')) {
        friendlyError = 'הזמנה כפולה. אנא רענן את הדף ונסה שנית.';
      } else if (msg.includes('foreign key') || msg.includes('violates')) {
        friendlyError = 'שגיאה בנתוני המוצר. אנא רענן את הדף.';
      } else if (msg.includes('timeout') || msg.includes('connection')) {
        friendlyError = 'בעיית תקשורת. אנא נסה שנית.';
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: friendlyError,
      },
      { status: 500 }
    );
  }
}


