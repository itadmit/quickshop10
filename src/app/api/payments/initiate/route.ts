/**
 * Payment Initiation API
 * POST /api/payments/initiate
 * 
 * Initiates a payment with the store's configured provider
 * Creates a pending_payment record and returns the payment URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, pendingPayments, paymentTransactions, orders, orderItems, customers, products, contacts } from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
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
    type: 'coupon' | 'auto' | 'gift_card' | 'credit' | 'member';
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
    
    // Generate numeric order number BEFORE creating successUrl
    // So the URL contains the actual order number
    const currentCounter = store.orderCounter ?? 1000;
    const orderNumber = String(currentCounter);
    
    // Increment the store's order counter immediately
    await db.update(stores)
      .set({ orderCounter: currentCounter + 1 })
      .where(eq(stores.id, store.id));
    
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
    // orderData.items includes: productId, variantId, variantTitle, name, quantity, price, sku, image
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
    }>;

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
    const discountAmount = body.discountAmount || 0;
    const creditUsed = Number((body.orderData as { creditUsed?: number })?.creditUsed) || 0;
    const totalAmount = subtotal + shippingCost - discountAmount - creditUsed;

    // Create order with PENDING financial status
    const [newOrder] = await db.insert(orders).values({
      storeId: store.id,
      customerId,
      orderNumber,
      status: 'pending', // Order is pending until payment completes
      financialStatus: 'pending', // Payment not yet received
      fulfillmentStatus: 'unfulfilled',
      subtotal: String(subtotal),
      discountAmount: String(discountAmount),
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
      
      // Discount
      discountCode: body.discountCode,
      discountDetails: body.discountDetails || [],
      
      // Influencer
      influencerId: body.influencerId,
      
      // Note: paymentMethod and paymentDetails will be updated after payment
    }).returning();

    console.log(`[Payment Initiate] Created order #${orderNumber} with pending status`);

    // Create order items
    if (cartItemsForOrder.length > 0) {
      // Validate productIds exist before inserting (foreign key constraint)
      const productIds = cartItemsForOrder
        .map(item => item.productId)
        .filter((id): id is string => !!id);
      
      let existingProductIds = new Set<string>();
      if (productIds.length > 0) {
        const existingProducts = await db
          .select({ id: products.id })
          .from(products)
          .where(inArray(products.id, productIds));
        existingProductIds = new Set(existingProducts.map(p => p.id));
      }

      await db.insert(orderItems).values(
        cartItemsForOrder.map(item => ({
          orderId: newOrder.id,
          // Only include productId if it exists in products table
          productId: item.productId && existingProductIds.has(item.productId) 
            ? item.productId 
            : null,
          name: item.name,
          variantTitle: item.variantTitle || null,
          sku: item.sku || '',
          quantity: item.quantity,
          price: String(item.price),
          total: String(item.price * item.quantity),
          imageUrl: item.image || item.imageUrl || null,
        }))
      );
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
      amount: String(body.amount),
      currency: body.currency || 'ILS',
      status: 'pending',
      discountCode: body.discountCode,
      discountAmount: body.discountAmount ? String(body.discountAmount) : '0',
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
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


