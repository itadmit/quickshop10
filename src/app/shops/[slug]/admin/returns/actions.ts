'use server';

import { db } from '@/lib/db';
import { returnRequests, customerCreditTransactions, customers, products, productVariants, orders, orderItems, stores, productImages } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getStoreBySlug } from '@/lib/db/queries';
import { sendReturnRequestUpdateEmail, sendExchangePaymentEmail } from '@/lib/email';
import { getDefaultProvider } from '@/lib/payments';

// ============================================
// Create Return Request - Manual creation
// ============================================

interface CreateReturnInput {
  storeSlug: string;
  orderId: string;
  type: 'return' | 'exchange';
  reason: 'wrong_size' | 'defective' | 'not_as_described' | 'changed_mind' | 'wrong_item' | 'damaged_shipping' | 'other';
  requestedResolution: 'exchange' | 'store_credit' | 'refund' | 'partial_refund';
  items: Array<{
    orderItemId: string;
    quantity: number;
  }>;
  reasonDetails?: string;
}

export async function createReturnRequest(input: CreateReturnInput) {
  try {
    const store = await getStoreBySlug(input.storeSlug);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    // Get the order with its items
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, input.orderId), eq(orders.storeId, store.id)))
      .limit(1);

    if (!order) {
      return { success: false, error: 'הזמנה לא נמצאה' };
    }

    // Get order items
    const allOrderItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, input.orderId));

    // Build return items with full details
    const returnItems = [];
    let totalValue = 0;

    for (const itemInput of input.items) {
      const orderItem = allOrderItems.find(i => i.id === itemInput.orderItemId);
      if (!orderItem) continue;

      const itemPrice = Number(orderItem.price || 0);
      const itemTotal = itemPrice * itemInput.quantity;
      totalValue += itemTotal;

      returnItems.push({
        orderItemId: orderItem.id,
        productId: orderItem.productId,
        name: orderItem.name,
        variantTitle: orderItem.variantTitle,
        quantity: itemInput.quantity,
        price: itemPrice,
        total: itemTotal,
        imageUrl: orderItem.imageUrl,
        reason: input.reason,
      });
    }

    if (returnItems.length === 0) {
      return { success: false, error: 'יש לבחור לפחות פריט אחד' };
    }

    // Generate request number
    const lastRequest = await db
      .select({ requestNumber: returnRequests.requestNumber })
      .from(returnRequests)
      .where(eq(returnRequests.storeId, store.id))
      .orderBy(desc(returnRequests.createdAt))
      .limit(1);

    let newNumber = 1001;
    if (lastRequest[0]?.requestNumber) {
      const lastNum = parseInt(lastRequest[0].requestNumber.replace('RET-', ''), 10);
      if (!isNaN(lastNum)) {
        newNumber = lastNum + 1;
      }
    }
    const requestNumber = `RET-${newNumber}`;

    // Create the return request
    const [newRequest] = await db.insert(returnRequests).values({
      storeId: store.id,
      orderId: input.orderId,
      customerId: order.customerId,
      requestNumber,
      type: input.type,
      status: 'pending',
      items: returnItems,
      reason: input.reason,
      reasonDetails: input.reasonDetails,
      requestedResolution: input.requestedResolution,
      totalValue: String(totalValue),
    }).returning();

    revalidatePath(`/shops/${input.storeSlug}/admin/returns`);

    return { 
      success: true, 
      requestId: newRequest.id,
      requestNumber,
    };
  } catch (error) {
    console.error('Error creating return request:', error);
    return { success: false, error: 'אירעה שגיאה ביצירת הבקשה' };
  }
}

interface ProcessReturnInput {
  storeSlug: string;
  requestId: string;
  action: 'approve' | 'reject';
  resolution?: 'exchange' | 'store_credit' | 'refund';
  amount?: number;
  customerNotes?: string;
}

export async function processReturnRequest(input: ProcessReturnInput) {
  try {
    const store = await getStoreBySlug(input.storeSlug);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    // Get the request
    const [request] = await db
      .select()
      .from(returnRequests)
      .where(
        and(
          eq(returnRequests.id, input.requestId),
          eq(returnRequests.storeId, store.id)
        )
      )
      .limit(1);

    if (!request) {
      return { success: false, error: 'בקשה לא נמצאה' };
    }

    if (!['pending', 'under_review'].includes(request.status)) {
      return { success: false, error: 'לא ניתן לעבד בקשה זו' };
    }

    if (input.action === 'reject') {
      // Reject the request
      await db.update(returnRequests)
        .set({
          status: 'rejected',
          customerNotes: input.customerNotes,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, input.requestId));

      // Get customer email for notification
      if (request.customerId) {
        const [customer] = await db.select().from(customers).where(eq(customers.id, request.customerId)).limit(1);
        const [order] = await db.select({ orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, request.orderId)).limit(1);
        if (customer?.email && order) {
          sendReturnRequestUpdateEmail({
            requestNumber: request.requestNumber,
            orderNumber: order.orderNumber,
            customerEmail: customer.email,
            customerName: customer.firstName || undefined,
            status: 'rejected',
            customerNotes: input.customerNotes,
            storeName: store.name,
            storeSlug: store.slug,
          }).catch(err => console.error('Failed to send rejection email:', err));
        }
      }

      revalidatePath(`/shops/${input.storeSlug}/admin/returns`);
      return { success: true };
    }

    // Approve the request
    if (!input.resolution) {
      return { success: false, error: 'יש לבחור סוג פתרון' };
    }

    const amount = input.amount || Number(request.totalValue);

    // Handle based on resolution type
    if (input.resolution === 'store_credit') {
      // Add credit to customer account
      if (request.customerId) {
        // Get current balance
        const [customer] = await db.select({ creditBalance: customers.creditBalance }).from(customers).where(eq(customers.id, request.customerId)).limit(1);
        const currentBalance = Number(customer?.creditBalance || 0);
        const newBalance = currentBalance + amount;

        // Create credit transaction
        await db.insert(customerCreditTransactions).values({
          customerId: request.customerId,
          storeId: store.id,
          type: 'credit',
          amount: String(amount),
          balanceAfter: String(newBalance),
          reason: `זיכוי מבקשת החזרה #${request.requestNumber}`,
        });

        // Update customer credit balance
        await db.update(customers)
          .set({
            creditBalance: String(newBalance),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, request.customerId));
      }

      // Update request
      await db.update(returnRequests)
        .set({
          status: 'completed',
          finalResolution: 'store_credit',
          creditIssued: String(amount),
          customerNotes: input.customerNotes,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, input.requestId));

      // Return items to inventory
      await returnItemsToInventory(request.items as Array<{ productId?: string; variantId?: string; quantity: number }>);

    } else if (input.resolution === 'refund') {
      // For refund - mark as approved, actual refund will be done separately
      // In a real system, you would integrate with payment provider here
      await db.update(returnRequests)
        .set({
          status: 'approved',
          finalResolution: 'refund',
          refundAmount: String(amount),
          customerNotes: input.customerNotes,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, input.requestId));

    } else if (input.resolution === 'exchange') {
      // For exchange - mark as approved, exchange order will be created separately
      await db.update(returnRequests)
        .set({
          status: 'approved',
          finalResolution: 'exchange',
          customerNotes: input.customerNotes,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(returnRequests.id, input.requestId));
    }

    // Send approval email
    if (request.customerId) {
      const [customer] = await db.select().from(customers).where(eq(customers.id, request.customerId)).limit(1);
      const [order] = await db.select({ orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, request.orderId)).limit(1);
      if (customer?.email && order) {
        const status = input.resolution === 'store_credit' ? 'completed' : 'approved';
        sendReturnRequestUpdateEmail({
          requestNumber: request.requestNumber,
          orderNumber: order.orderNumber,
          customerEmail: customer.email,
          customerName: customer.firstName || undefined,
          status,
          resolution: input.resolution,
          creditAmount: input.resolution === 'store_credit' ? amount : undefined,
          refundAmount: input.resolution === 'refund' ? amount : undefined,
          customerNotes: input.customerNotes,
          storeName: store.name,
          storeSlug: store.slug,
        }).catch(err => console.error('Failed to send approval email:', err));
      }
    }

    revalidatePath(`/shops/${input.storeSlug}/admin/returns`);
    revalidatePath(`/shops/${input.storeSlug}/admin/returns/${input.requestId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error processing return request:', error);
    return { success: false, error: 'אירעה שגיאה בעיבוד הבקשה' };
  }
}

interface UpdateStatusInput {
  storeSlug: string;
  requestId: string;
  status: 'under_review' | 'awaiting_shipment' | 'item_received' | 'completed' | 'cancelled';
}

export async function updateReturnStatus(input: UpdateStatusInput) {
  try {
    const store = await getStoreBySlug(input.storeSlug);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const [request] = await db
      .select()
      .from(returnRequests)
      .where(
        and(
          eq(returnRequests.id, input.requestId),
          eq(returnRequests.storeId, store.id)
        )
      )
      .limit(1);

    if (!request) {
      return { success: false, error: 'בקשה לא נמצאה' };
    }

    const updateData: Record<string, unknown> = {
      status: input.status,
      updatedAt: new Date(),
    };

    if (input.status === 'item_received') {
      updateData.itemReceivedAt = new Date();
    }

    if (input.status === 'completed') {
      // Return items to inventory on completion
      await returnItemsToInventory(request.items as Array<{ productId?: string; variantId?: string; quantity: number }>);
    }

    await db.update(returnRequests)
      .set(updateData)
      .where(eq(returnRequests.id, input.requestId));

    revalidatePath(`/shops/${input.storeSlug}/admin/returns`);
    revalidatePath(`/shops/${input.storeSlug}/admin/returns/${input.requestId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating return status:', error);
    return { success: false, error: 'אירעה שגיאה בעדכון הסטטוס' };
  }
}

interface AddNoteInput {
  storeSlug: string;
  requestId: string;
  note: string;
}

export async function addInternalNote(input: AddNoteInput) {
  try {
    const store = await getStoreBySlug(input.storeSlug);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const [request] = await db
      .select({ internalNotes: returnRequests.internalNotes })
      .from(returnRequests)
      .where(
        and(
          eq(returnRequests.id, input.requestId),
          eq(returnRequests.storeId, store.id)
        )
      )
      .limit(1);

    if (!request) {
      return { success: false, error: 'בקשה לא נמצאה' };
    }

    const timestamp = new Date().toLocaleString('he-IL');
    const newNote = `[${timestamp}] ${input.note}`;
    const existingNotes = request.internalNotes || '';
    const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

    await db.update(returnRequests)
      .set({
        internalNotes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(returnRequests.id, input.requestId));

    revalidatePath(`/shops/${input.storeSlug}/admin/returns/${input.requestId}`);
    return { success: true };
  } catch (error) {
    console.error('Error adding internal note:', error);
    return { success: false, error: 'אירעה שגיאה בהוספת ההערה' };
  }
}

// Helper function to return items to inventory
async function returnItemsToInventory(items: Array<{ productId?: string; variantId?: string; quantity: number }>) {
  for (const item of items) {
    if (!item.productId) continue;

    try {
      if (item.variantId) {
        // Update variant inventory
        await db.update(productVariants)
          .set({ 
            inventory: sql`COALESCE(${productVariants.inventory}, 0) + ${item.quantity}`,
          })
          .where(eq(productVariants.id, item.variantId));
      } else {
        // Update product inventory
        await db.update(products)
          .set({ 
            inventory: sql`COALESCE(${products.inventory}, 0) + ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      }
    } catch (err) {
      console.error(`Failed to return item ${item.productId} to inventory:`, err);
    }
  }
}

// Create exchange order
interface CreateExchangeOrderInput {
  storeSlug: string;
  requestId: string;
  newProductId: string;
  newVariantId?: string;
}

export async function createExchangeOrder(input: CreateExchangeOrderInput) {
  try {
    const store = await getStoreBySlug(input.storeSlug);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const [request] = await db
      .select()
      .from(returnRequests)
      .where(
        and(
          eq(returnRequests.id, input.requestId),
          eq(returnRequests.storeId, store.id)
        )
      )
      .limit(1);

    if (!request) {
      return { success: false, error: 'בקשה לא נמצאה' };
    }

    if (request.finalResolution !== 'exchange') {
      return { success: false, error: 'בקשה זו לא מיועדת להחלפה' };
    }

    // Get the new product with image
    const [newProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.newProductId))
      .limit(1);

    if (!newProduct) {
      return { success: false, error: 'מוצר לא נמצא' };
    }

    // Get product image
    const [productImage] = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(and(eq(productImages.productId, input.newProductId), eq(productImages.isPrimary, true)))
      .limit(1);

    let newProductPrice = Number(newProduct.price);
    let variantTitle = null;

    // If variant selected, get variant price
    if (input.newVariantId) {
      const [variant] = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, input.newVariantId))
        .limit(1);

      if (variant) {
        newProductPrice = Number(variant.price) || newProductPrice;
        variantTitle = variant.title;
      }
    }

    const originalValue = Number(request.totalValue);
    const priceDifference = newProductPrice - originalValue;

    // Generate new order number
    const currentCounter = store.orderCounter ?? 1000;
    const orderNumber = String(currentCounter);

    // Update store counter
    await db.update(stores)
      .set({ orderCounter: currentCounter + 1 })
      .where(eq(stores.id, store.id));

    // Determine financial status based on price difference
    let financialStatus: 'paid' | 'pending' = 'paid';
    let paymentUrl: string | undefined;
    
    if (priceDifference > 0) {
      // Customer needs to pay the difference
      financialStatus = 'pending';
    }

    // Create new order
    const [newOrder] = await db.insert(orders).values({
      storeId: store.id,
      customerId: request.customerId,
      orderNumber,
      status: 'confirmed',
      financialStatus,
      fulfillmentStatus: 'unfulfilled',
      subtotal: String(newProductPrice),
      discountAmount: String(Math.min(originalValue, newProductPrice)),
      shippingAmount: '0',
      taxAmount: '0',
      total: String(Math.max(0, priceDifference)),
      currency: 'ILS',
      note: `הזמנת החלפה מבקשה #${request.requestNumber}`,
    }).returning();

    // Create order item
    await db.insert(orderItems).values({
      orderId: newOrder.id,
      productId: input.newProductId,
      name: newProduct.name,
      variantTitle,
      sku: newProduct.sku || '',
      quantity: 1,
      price: String(newProductPrice),
      total: String(newProductPrice),
      imageUrl: productImage?.url || null,
    });

    // Decrement inventory for new product
    if (input.newVariantId) {
      await db.update(productVariants)
        .set({ inventory: sql`COALESCE(${productVariants.inventory}, 0) - 1` })
        .where(eq(productVariants.id, input.newVariantId));
    } else {
      await db.update(products)
        .set({ inventory: sql`COALESCE(${products.inventory}, 0) - 1` })
        .where(eq(products.id, input.newProductId));
    }

    // Handle price difference
    if (priceDifference > 0 && request.customerId) {
      // Customer needs to pay - create payment link
      const paymentProvider = await getDefaultProvider(store.id);
      
      if (paymentProvider) {
        // Get customer details
        const [customer] = await db.select().from(customers).where(eq(customers.id, request.customerId)).limit(1);
        
        if (customer?.email) {
          // Build URLs - use custom domain if store has one
          const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my-quickshop.com';
          let customerFacingUrl: string;
          let storePath: string;
          
          if (store.customDomain) {
            customerFacingUrl = `https://${store.customDomain}`;
            storePath = '';
          } else {
            customerFacingUrl = platformUrl;
            storePath = `/shops/${input.storeSlug}`;
          }
          
          const paymentResult = await paymentProvider.initiatePayment({
            storeId: store.id,
            storeSlug: input.storeSlug,
            orderReference: newOrder.id,
            amount: priceDifference,
            currency: 'ILS',
            customer: {
              id: customer.id,
              name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
              email: customer.email,
              phone: customer.phone || undefined,
            },
            items: [{
              name: `הפרש תשלום עבור החלפה - ${newProduct.name}`,
              quantity: 1,
              price: priceDifference,
            }],
            orderData: {
              orderId: newOrder.id,
              orderNumber: newOrder.orderNumber,
              type: 'exchange_difference',
              returnRequestId: request.id,
            },
            successUrl: `${customerFacingUrl}${storePath}/checkout/thank-you/${orderNumber}`,
            failureUrl: `${customerFacingUrl}${storePath}/account/orders`,
          });

          if (paymentResult.success && paymentResult.paymentUrl) {
            paymentUrl = paymentResult.paymentUrl;
            
            // Send email with payment link
            sendExchangePaymentEmail({
              customerEmail: customer.email,
              customerName: customer.firstName || undefined,
              storeName: store.name,
              storeSlug: store.slug,
              orderNumber: newOrder.orderNumber,
              originalProductName: (request.items as Array<{ name?: string }>)?.[0]?.name || 'המוצר המקורי',
              newProductName: newProduct.name + (variantTitle ? ` - ${variantTitle}` : ''),
              originalValue,
              newProductPrice,
              priceDifference,
              paymentUrl,
            }).catch(err => console.error('Failed to send exchange payment email:', err));
          }
        }
      }
    } else if (priceDifference < 0 && request.customerId) {
      // Customer gets credit for the difference
      const creditAmount = Math.abs(priceDifference);
      
      // Get current balance
      const [customer] = await db.select({ creditBalance: customers.creditBalance }).from(customers).where(eq(customers.id, request.customerId)).limit(1);
      const currentBalance = Number(customer?.creditBalance || 0);
      const newBalance = currentBalance + creditAmount;

      // Create credit transaction
      await db.insert(customerCreditTransactions).values({
        customerId: request.customerId,
        storeId: store.id,
        type: 'credit',
        amount: String(creditAmount),
        balanceAfter: String(newBalance),
        reason: `זיכוי מהחלפה - הזמנה #${newOrder.orderNumber}`,
        orderId: newOrder.id,
      });

      // Update customer balance
      await db.update(customers)
        .set({ creditBalance: String(newBalance) })
        .where(eq(customers.id, request.customerId));
    }

    // Update return request
    await db.update(returnRequests)
      .set({
        exchangeOrderId: newOrder.id,
        status: priceDifference > 0 ? 'approved' : 'completed', // If pending payment, keep as approved
        updatedAt: new Date(),
      })
      .where(eq(returnRequests.id, input.requestId));

    // Return original items to inventory
    await returnItemsToInventory(request.items as Array<{ productId?: string; variantId?: string; quantity: number }>);

    revalidatePath(`/shops/${input.storeSlug}/admin/returns`);
    revalidatePath(`/shops/${input.storeSlug}/admin/returns/${input.requestId}`);
    revalidatePath(`/shops/${input.storeSlug}/admin/orders`);

    return { 
      success: true, 
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      priceDifference,
      paymentUrl,
      creditIssued: priceDifference < 0 ? Math.abs(priceDifference) : undefined,
    };
  } catch (error) {
    console.error('Error creating exchange order:', error);
    return { success: false, error: 'אירעה שגיאה ביצירת הזמנת ההחלפה' };
  }
}

