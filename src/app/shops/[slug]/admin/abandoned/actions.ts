'use server';

import { db } from '@/lib/db';
import { abandonedCarts, stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { sendAbandonedCartEmail } from '@/lib/email';

interface CartItem {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  image?: string;
}

export async function sendRecoveryEmail(cartId: string, slug: string) {
  try {
    // Get cart with store info
    const cart = await db.query.abandonedCarts.findFirst({
      where: eq(abandonedCarts.id, cartId),
    });

    if (!cart) {
      return { success: false, error: 'עגלה לא נמצאה' };
    }

    if (!cart.email) {
      return { success: false, error: 'אין כתובת אימייל' };
    }

    // Get store info
    const store = await db.query.stores.findFirst({
      where: eq(stores.id, cart.storeId),
    });

    if (!store) {
      return { success: false, error: 'חנות לא נמצאה' };
    }

    // Generate recovery token if doesn't exist
    let recoveryToken = cart.recoveryToken;
    if (!recoveryToken) {
      recoveryToken = randomBytes(32).toString('hex');
    }

    // Parse cart items
    const cartItems = (cart.items as CartItem[]) || [];
    
    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get custom sender name from store settings
    const storeSettings = store.settings as Record<string, unknown> || {};
    const senderName = (storeSettings.emailSenderName as string) || store.name;

    // Build recovery URL
    const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shops/${slug}/checkout?recover=${recoveryToken}`;

    // Send the email
    const emailResult = await sendAbandonedCartEmail({
      customerEmail: cart.email,
      customerName: cart.email.split('@')[0], // Use email prefix as name fallback
      items: cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        variantTitle: item.variant,
        image: item.image,
      })),
      subtotal,
      recoveryUrl,
      storeName: store.name,
      storeSlug: slug,
      senderName,
    });

    if (!emailResult.success) {
      return { success: false, error: 'שגיאה בשליחת האימייל' };
    }

    // Update cart with reminder info
    await db
      .update(abandonedCarts)
      .set({
        recoveryToken,
        reminderSentAt: new Date(),
        reminderCount: (cart.reminderCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(abandonedCarts.id, cartId));

    revalidatePath(`/shops/${slug}/admin/abandoned`);
    return { success: true };
  } catch (error) {
    console.error('Error sending recovery email:', error);
    return { success: false, error: 'שגיאה בשליחת האימייל' };
  }
}

export async function deleteAbandonedCart(cartId: string, slug: string) {
  try {
    await db.delete(abandonedCarts).where(eq(abandonedCarts.id, cartId));
    revalidatePath(`/shops/${slug}/admin/abandoned`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting abandoned cart:', error);
    return { success: false, error: 'שגיאה במחיקת העגלה' };
  }
}


