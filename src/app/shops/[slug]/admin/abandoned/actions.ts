'use server';

import { db } from '@/lib/db';
import { abandonedCarts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

export async function sendRecoveryEmail(cartId: string, slug: string) {
  try {
    const cart = await db.query.abandonedCarts.findFirst({
      where: eq(abandonedCarts.id, cartId),
    });

    if (!cart) {
      return { success: false, error: 'עגלה לא נמצאה' };
    }

    if (!cart.email) {
      return { success: false, error: 'אין כתובת אימייל' };
    }

    // Generate recovery token if doesn't exist
    let recoveryToken = cart.recoveryToken;
    if (!recoveryToken) {
      recoveryToken = randomBytes(32).toString('hex');
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

    // TODO: Actually send the email
    // For now, we just mark it as sent
    // In production, use a service like Resend, SendGrid, etc.
    
    // Example email content:
    // Subject: שכחת משהו בעגלה שלך?
    // Body: Hey {name}, you left items in your cart. Click here to complete your purchase:
    // Link: https://store.quickshop.co.il/checkout?recover={recoveryToken}

    console.log(`Recovery email would be sent to ${cart.email} with token ${recoveryToken}`);

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


