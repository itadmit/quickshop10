'use server';

import { db } from '@/lib/db';
import { returnRequests, orders, orderItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { getStoreBySlug } from '@/lib/db/queries';
import { generateReturnRequestNumber, isOrderEligibleForReturn } from '@/lib/db/queries/returns';
import { sendReturnRequestReceivedEmail } from '@/lib/email';

interface ReturnRequestItem {
  orderItemId: string;
  productId?: string;
  variantId?: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface ExchangeProductPreference {
  productId: string;
  productName: string;
  variantId?: string;
  variantTitle?: string;
  price: number;
  imageUrl?: string | null;
}

interface CreateReturnRequestInput {
  storeSlug: string;
  orderId: string;
  type: 'return' | 'exchange';
  items: ReturnRequestItem[];
  reason: 'wrong_size' | 'defective' | 'not_as_described' | 'changed_mind' | 'wrong_item' | 'damaged_shipping' | 'other';
  reasonDetails?: string;
  requestedResolution: 'exchange' | 'store_credit' | 'refund';
  images?: { url: string; publicId: string }[];
  exchangeProductPreference?: ExchangeProductPreference;
}

export async function createReturnRequest(input: CreateReturnRequestInput) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return { success: false, error: 'יש להתחבר כדי להגיש בקשה' };
    }

    const store = await getStoreBySlug(input.storeSlug);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    // Verify order belongs to customer
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, input.orderId),
          eq(orders.customerId, customer.id),
          eq(orders.storeId, store.id)
        )
      )
      .limit(1);

    if (!order) {
      return { success: false, error: 'הזמנה לא נמצאה' };
    }

    // Check eligibility
    const eligibility = await isOrderEligibleForReturn(input.orderId, store.id);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason || 'לא ניתן להגיש בקשת החזרה' };
    }

    // Verify items belong to order
    const orderItemsList = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, input.orderId));

    const orderItemIds = new Set(orderItemsList.map(i => i.id));
    for (const item of input.items) {
      if (!orderItemIds.has(item.orderItemId)) {
        return { success: false, error: 'פריט לא נמצא בהזמנה' };
      }
    }

    // Calculate total value
    const totalValue = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Generate request number
    const requestNumber = await generateReturnRequestNumber(store.id);

    // Create return request
    const [newRequest] = await db.insert(returnRequests).values({
      storeId: store.id,
      orderId: input.orderId,
      customerId: customer.id,
      requestNumber,
      type: input.type,
      status: 'pending',
      items: input.items,
      reason: input.reason,
      reasonDetails: input.reasonDetails,
      requestedResolution: input.requestedResolution,
      totalValue: String(totalValue),
      images: input.images || [],
      // Store customer's preferred exchange product (if provided)
      resolutionDetails: input.exchangeProductPreference 
        ? { preferredExchangeProduct: input.exchangeProductPreference }
        : null,
    }).returning();

    revalidatePath(`/shops/${input.storeSlug}/account/returns`);
    revalidatePath(`/shops/${input.storeSlug}/account/orders/${order.orderNumber}`);

    // Send confirmation email
    sendReturnRequestReceivedEmail({
      requestNumber,
      orderNumber: order.orderNumber,
      customerEmail: customer.email,
      customerName: customer.firstName || undefined,
      items: input.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.imageUrl,
      })),
      totalValue,
      requestType: input.type,
      requestedResolution: input.requestedResolution,
      storeName: store.name,
      storeSlug: store.slug,
    }).catch(err => console.error('Failed to send return request email:', err));

    return { 
      success: true, 
      requestId: newRequest.id,
      requestNumber: newRequest.requestNumber 
    };
  } catch (error) {
    console.error('Error creating return request:', error);
    return { success: false, error: 'אירעה שגיאה ביצירת הבקשה' };
  }
}

export async function cancelReturnRequest(storeSlug: string, requestId: string) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return { success: false, error: 'יש להתחבר' };
    }

    const store = await getStoreBySlug(storeSlug);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    // Verify request belongs to customer and is cancellable
    const [request] = await db
      .select()
      .from(returnRequests)
      .where(
        and(
          eq(returnRequests.id, requestId),
          eq(returnRequests.customerId, customer.id),
          eq(returnRequests.storeId, store.id)
        )
      )
      .limit(1);

    if (!request) {
      return { success: false, error: 'בקשה לא נמצאה' };
    }

    // Can only cancel pending or under_review requests
    if (!['pending', 'under_review'].includes(request.status)) {
      return { success: false, error: 'לא ניתן לבטל בקשה זו' };
    }

    await db.update(returnRequests)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(returnRequests.id, requestId));

    revalidatePath(`/shops/${storeSlug}/account/returns`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling return request:', error);
    return { success: false, error: 'אירעה שגיאה בביטול הבקשה' };
  }
}

