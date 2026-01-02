'use server';

import { db } from '@/lib/db';
import { draftOrders, orders, orderItems, stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getStoreBySlug } from '@/lib/db/queries';

interface DraftItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export async function createDraft(
  slug: string,
  data: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    items: DraftItem[];
    notes?: string;
    shippingAddress?: Record<string, unknown>;
    shipping?: number;
  }
) {
  try {
    const store = await getStoreBySlug(slug);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = data.shipping || 0;
    const total = subtotal + shipping;

    const [draft] = await db
      .insert(draftOrders)
      .values({
        storeId: store.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        items: data.items,
        subtotal: String(subtotal),
        shipping: String(shipping),
        total: String(total),
        notes: data.notes,
        shippingAddress: data.shippingAddress,
      })
      .returning();

    revalidatePath(`/shops/${slug}/admin/orders/drafts`);
    return { success: true, draftId: draft.id };
  } catch (error) {
    console.error('Error creating draft:', error);
    return { success: false, error: 'שגיאה ביצירת טיוטה' };
  }
}

export async function completeDraft(draftId: string, slug: string) {
  try {
    const draft = await db.query.draftOrders.findFirst({
      where: eq(draftOrders.id, draftId),
    });

    if (!draft) {
      return { success: false, error: 'טיוטה לא נמצאה' };
    }

    if (draft.completedAt) {
      return { success: false, error: 'הטיוטה כבר הושלמה' };
    }

    const items = draft.items as DraftItem[];

    // Get store for order counter
    const [store] = await db.select().from(stores).where(eq(stores.id, draft.storeId)).limit(1);
    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }
    
    // Generate numeric order number from store counter (starts at 1000)
    const currentCounter = store.orderCounter ?? 1000;
    const orderNumber = String(currentCounter);
    
    // Increment the store's order counter
    await db.update(stores)
      .set({ orderCounter: currentCounter + 1 })
      .where(eq(stores.id, store.id));

    // Create the order
    const [order] = await db
      .insert(orders)
      .values({
        storeId: draft.storeId,
        orderNumber,
        customerId: draft.customerId,
        customerName: draft.customerName || null,
        customerEmail: draft.customerEmail || null,
        customerPhone: draft.customerPhone || null,
        status: 'confirmed',
        financialStatus: 'paid',
        subtotal: draft.subtotal || '0',
        discountAmount: draft.discount || '0',
        shippingAmount: draft.shipping || '0',
        taxAmount: draft.tax || '0',
        total: draft.total || '0',
        shippingAddress: draft.shippingAddress as Record<string, unknown>,
        billingAddress: draft.billingAddress as Record<string, unknown>,
        note: draft.notes,
        internalNote: `Created from draft order. Customer: ${draft.customerName || ''} ${draft.customerEmail || ''} ${draft.customerPhone || ''}`.trim(),
      })
      .returning();

    // Create order items
    for (const item of items) {
      // For manual items, productId starts with 'manual-', so we set it to null
      const productId = item.productId.startsWith('manual-') ? null : item.productId;
      
      await db.insert(orderItems).values({
        orderId: order.id,
        productId,
        name: item.name,
        price: String(item.price),
        quantity: item.quantity,
        total: String(item.price * item.quantity),
        imageUrl: item.imageUrl || null,
      });

      // Only update inventory for real products
      if (productId) {
        // Note: For proper inventory decrement, you'd use a raw SQL query or transaction
        // This is simplified - in production you'd want: inventory = inventory - quantity
        console.log(`Would decrement inventory for product ${productId} by ${item.quantity}`);
      }
    }

    // Update draft as completed
    await db
      .update(draftOrders)
      .set({
        completedAt: new Date(),
        orderId: order.id,
        updatedAt: new Date(),
      })
      .where(eq(draftOrders.id, draftId));

    revalidatePath(`/shops/${slug}/admin/orders/drafts`);
    revalidatePath(`/shops/${slug}/admin/orders`);
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('Error completing draft:', error);
    return { success: false, error: 'שגיאה בהמרת הטיוטה' };
  }
}

export async function deleteDraft(draftId: string, slug: string) {
  try {
    await db.delete(draftOrders).where(eq(draftOrders.id, draftId));
    revalidatePath(`/shops/${slug}/admin/orders/drafts`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting draft:', error);
    return { success: false, error: 'שגיאה במחיקת הטיוטה' };
  }
}

export async function updateDraft(
  draftId: string,
  slug: string,
  data: Partial<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: DraftItem[];
    notes: string;
    shippingAddress: Record<string, unknown>;
    shipping: number;
  }>
) {
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.customerName !== undefined) updateData.customerName = data.customerName;
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.shippingAddress !== undefined) updateData.shippingAddress = data.shippingAddress;

    if (data.items) {
      updateData.items = data.items;
      const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = data.shipping || 0;
      updateData.subtotal = String(subtotal);
      updateData.shipping = String(shipping);
      updateData.total = String(subtotal + shipping);
    }

    await db
      .update(draftOrders)
      .set(updateData)
      .where(eq(draftOrders.id, draftId));

    revalidatePath(`/shops/${slug}/admin/orders/drafts`);
    return { success: true };
  } catch (error) {
    console.error('Error updating draft:', error);
    return { success: false, error: 'שגיאה בעדכון הטיוטה' };
  }
}

