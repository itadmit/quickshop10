'use server';

import { db } from '@/lib/db';
import { giftCards, giftCardTransactions } from '@/lib/db/schema';
import { getStoreBySlug } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createGiftCard(
  slug: string,
  data: {
    amount: number;
    recipientEmail?: string;
    recipientName?: string;
    senderName?: string;
    message?: string;
    expiresAt?: Date;
  }
) {
  try {
    const store = await getStoreBySlug(slug);
    if (!store) {
      return { error: 'החנות לא נמצאה' };
    }

    // Generate unique code
    let code = generateGiftCardCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db
        .select({ id: giftCards.id })
        .from(giftCards)
        .where(and(
          eq(giftCards.storeId, store.id),
          eq(giftCards.code, code)
        ))
        .limit(1);
      
      if (existing.length === 0) break;
      code = generateGiftCardCode();
      attempts++;
    }

    const [newCard] = await db
      .insert(giftCards)
      .values({
        storeId: store.id,
        code,
        initialBalance: data.amount.toString(),
        currentBalance: data.amount.toString(),
        status: 'active',
        recipientEmail: data.recipientEmail || null,
        recipientName: data.recipientName || null,
        senderName: data.senderName || null,
        message: data.message || null,
        expiresAt: data.expiresAt || null,
      })
      .returning();

    revalidatePath(`/shops/${slug}/admin/gift-cards`);
    return { success: true, card: newCard };
  } catch (error) {
    console.error('Error creating gift card:', error);
    return { error: 'שגיאה ביצירת הגיפט קארד' };
  }
}

export async function disableGiftCard(cardId: string, slug: string) {
  try {
    const store = await getStoreBySlug(slug);
    if (!store) {
      return { error: 'החנות לא נמצאה' };
    }

    await db
      .update(giftCards)
      .set({ status: 'cancelled' })
      .where(and(
        eq(giftCards.id, cardId),
        eq(giftCards.storeId, store.id)
      ));

    revalidatePath(`/shops/${slug}/admin/gift-cards`);
    return { success: true };
  } catch (error) {
    console.error('Error disabling gift card:', error);
    return { error: 'שגיאה בהשבתת הגיפט קארד' };
  }
}

export async function enableGiftCard(cardId: string, slug: string) {
  try {
    const store = await getStoreBySlug(slug);
    if (!store) {
      return { error: 'החנות לא נמצאה' };
    }

    await db
      .update(giftCards)
      .set({ status: 'active' })
      .where(and(
        eq(giftCards.id, cardId),
        eq(giftCards.storeId, store.id)
      ));

    revalidatePath(`/shops/${slug}/admin/gift-cards`);
    return { success: true };
  } catch (error) {
    console.error('Error enabling gift card:', error);
    return { error: 'שגיאה בהפעלת הגיפט קארד' };
  }
}

export async function deleteGiftCard(cardId: string, slug: string) {
  try {
    const store = await getStoreBySlug(slug);
    if (!store) {
      return { error: 'החנות לא נמצאה' };
    }

    // Check if card was used
    const transactions = await db
      .select({ id: giftCardTransactions.id })
      .from(giftCardTransactions)
      .where(eq(giftCardTransactions.giftCardId, cardId))
      .limit(1);

    if (transactions.length > 0) {
      return { error: 'לא ניתן למחוק גיפט קארד שכבר נעשה בו שימוש' };
    }

    await db
      .delete(giftCards)
      .where(and(
        eq(giftCards.id, cardId),
        eq(giftCards.storeId, store.id)
      ));

    revalidatePath(`/shops/${slug}/admin/gift-cards`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting gift card:', error);
    return { error: 'שגיאה במחיקת הגיפט קארד' };
  }
}

export async function adjustGiftCardBalance(
  cardId: string, 
  slug: string, 
  amount: number,
  note?: string
) {
  try {
    const store = await getStoreBySlug(slug);
    if (!store) {
      return { error: 'החנות לא נמצאה' };
    }

    // Get current card
    const [card] = await db
      .select()
      .from(giftCards)
      .where(and(
        eq(giftCards.id, cardId),
        eq(giftCards.storeId, store.id)
      ));

    if (!card) {
      return { error: 'הגיפט קארד לא נמצא' };
    }

    const currentBalance = Number(card.currentBalance);
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      return { error: 'היתרה לא יכולה להיות שלילית' };
    }

    // Update balance
    await db
      .update(giftCards)
      .set({ 
        currentBalance: newBalance.toString(),
        status: newBalance === 0 ? 'used' : 'active',
      })
      .where(eq(giftCards.id, cardId));

    // Record transaction
    await db
      .insert(giftCardTransactions)
      .values({
        giftCardId: cardId,
        amount: amount.toString(),
        balanceAfter: newBalance.toString(),
        note: note || (amount > 0 ? 'הוספת יתרה ידנית' : 'ניכוי יתרה ידני'),
      });

    revalidatePath(`/shops/${slug}/admin/gift-cards`);
    return { success: true, newBalance };
  } catch (error) {
    console.error('Error adjusting gift card balance:', error);
    return { error: 'שגיאה בעדכון היתרה' };
  }
}

