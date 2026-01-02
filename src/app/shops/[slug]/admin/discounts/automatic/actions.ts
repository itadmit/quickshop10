'use server';

import { db } from '@/lib/db';
import { automaticDiscounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface AutoDiscountData {
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: string;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  minimumAmount: string | null;
  minimumQuantity: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  priority: number;
  stackable: boolean;
  isActive: boolean;
}

export async function createAutoDiscount(storeId: string, data: AutoDiscountData) {
  try {
    await db.insert(automaticDiscounts).values({
      storeId,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      appliesTo: data.appliesTo,
      categoryIds: data.categoryIds,
      productIds: data.productIds,
      minimumAmount: data.minimumAmount,
      minimumQuantity: data.minimumQuantity,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      priority: data.priority,
      stackable: data.stackable,
      isActive: data.isActive,
    });

    revalidatePath(`/shops/[slug]/admin/discounts/automatic`);
    revalidatePath(`/shops/[slug]/admin/discounts`);
    return { success: true };
  } catch (error) {
    console.error('Error creating auto discount:', error);
    return { success: false, error: 'שגיאה ביצירת הנחה אוטומטית' };
  }
}

export async function updateAutoDiscount(discountId: string, data: AutoDiscountData) {
  try {
    await db
      .update(automaticDiscounts)
      .set({
        name: data.name,
        description: data.description,
        type: data.type,
        value: data.value,
        appliesTo: data.appliesTo,
        categoryIds: data.categoryIds,
        productIds: data.productIds,
        minimumAmount: data.minimumAmount,
        minimumQuantity: data.minimumQuantity,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        priority: data.priority,
        stackable: data.stackable,
        isActive: data.isActive,
      })
      .where(eq(automaticDiscounts.id, discountId));

    revalidatePath(`/shops/[slug]/admin/discounts/automatic`);
    revalidatePath(`/shops/[slug]/admin/discounts`);
    return { success: true };
  } catch (error) {
    console.error('Error updating auto discount:', error);
    return { success: false, error: 'שגיאה בעדכון הנחה אוטומטית' };
  }
}

export async function toggleAutoDiscount(discountId: string, isActive: boolean) {
  try {
    await db
      .update(automaticDiscounts)
      .set({ isActive })
      .where(eq(automaticDiscounts.id, discountId));

    revalidatePath(`/shops/[slug]/admin/discounts/automatic`);
    revalidatePath(`/shops/[slug]/admin/discounts`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling auto discount:', error);
    return { success: false, error: 'שגיאה בעדכון סטטוס הנחה' };
  }
}

export async function deleteAutoDiscount(discountId: string) {
  try {
    await db
      .delete(automaticDiscounts)
      .where(eq(automaticDiscounts.id, discountId));

    revalidatePath(`/shops/[slug]/admin/discounts/automatic`);
    revalidatePath(`/shops/[slug]/admin/discounts`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting auto discount:', error);
    return { success: false, error: 'שגיאה במחיקת הנחה אוטומטית' };
  }
}

