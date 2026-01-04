'use server';

import { db } from '@/lib/db';
import { returnRequests, customerCreditTransactions, customers, products, productVariants, orders, orderItems } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getStoreBySlug } from '@/lib/db/queries';
import { sendReturnRequestUpdateEmail } from '@/lib/email';

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

    // Get the new product
    const [newProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.newProductId))
      .limit(1);

    if (!newProduct) {
      return { success: false, error: 'מוצר לא נמצא' };
    }

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
    await db.update(require('@/lib/db/schema').stores)
      .set({ orderCounter: currentCounter + 1 })
      .where(eq(require('@/lib/db/schema').stores.id, store.id));

    // Create new order
    const [newOrder] = await db.insert(orders).values({
      storeId: store.id,
      customerId: request.customerId,
      orderNumber,
      status: 'confirmed',
      financialStatus: priceDifference <= 0 ? 'paid' : 'pending',
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

    // Update return request
    await db.update(returnRequests)
      .set({
        exchangeOrderId: newOrder.id,
        status: 'completed',
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
    };
  } catch (error) {
    console.error('Error creating exchange order:', error);
    return { success: false, error: 'אירעה שגיאה ביצירת הזמנת ההחלפה' };
  }
}

