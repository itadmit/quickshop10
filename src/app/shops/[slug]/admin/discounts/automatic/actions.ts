'use server';

import { db } from '@/lib/db';
import { automaticDiscounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'gift_product'        // מוצר במתנה (עם תנאים, בחירת מוצר ספציפי)
  | 'quantity_discount'
  | 'spend_x_pay_y';

interface QuantityTier {
  minQuantity: number;
  discountPercent: number;
}

interface AutoDiscountData {
  name: string;
  description: string | null;
  type: DiscountType;
  value: string;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  excludeCategoryIds: string[];
  excludeProductIds: string[];
  minimumAmount: string | null;
  minimumQuantity: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  priority: number;
  stackable: boolean;
  isActive: boolean;
  // Advanced discount fields
  buyQuantity?: number | null;
  payAmount?: number | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;  // אחוז הנחה על Y (100 = חינם)
  giftProductIds?: string[];
  giftSameProduct?: boolean;
  quantityTiers?: QuantityTier[];
  spendAmount?: number | null;
}

export async function createAutoDiscount(storeId: string, data: AutoDiscountData) {
  try {
    await db.insert(automaticDiscounts).values({
      storeId,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value || '0',
      appliesTo: data.appliesTo,
      categoryIds: data.categoryIds,
      productIds: data.productIds,
      excludeCategoryIds: data.excludeCategoryIds,
      excludeProductIds: data.excludeProductIds,
      minimumAmount: data.minimumAmount,
      minimumQuantity: data.minimumQuantity,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      priority: data.priority,
      stackable: data.stackable,
      isActive: data.isActive,
      // Advanced discount fields
      buyQuantity: data.buyQuantity || null,
      payAmount: data.payAmount?.toString() || null,
      getQuantity: data.getQuantity || null,
      getDiscountPercent: data.getDiscountPercent ?? 100,
      giftProductIds: data.giftProductIds || [],
      giftSameProduct: data.giftSameProduct ?? true,
      quantityTiers: data.quantityTiers || [],
      spendAmount: data.spendAmount?.toString() || null,
    });

    revalidatePath(`/shops/[slug]/admin/discounts/automatic`, 'page');
    revalidatePath(`/shops/[slug]/admin/discounts`, 'page');
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
        value: data.value || '0',
        appliesTo: data.appliesTo,
        categoryIds: data.categoryIds,
        productIds: data.productIds,
        excludeCategoryIds: data.excludeCategoryIds,
        excludeProductIds: data.excludeProductIds,
        minimumAmount: data.minimumAmount,
        minimumQuantity: data.minimumQuantity,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        priority: data.priority,
        stackable: data.stackable,
        isActive: data.isActive,
        // Advanced discount fields
        buyQuantity: data.buyQuantity || null,
        payAmount: data.payAmount?.toString() || null,
        getQuantity: data.getQuantity || null,
        getDiscountPercent: data.getDiscountPercent ?? 100,
        giftProductIds: data.giftProductIds || [],
        giftSameProduct: data.giftSameProduct ?? true,
        quantityTiers: data.quantityTiers || [],
        spendAmount: data.spendAmount?.toString() || null,
      })
      .where(eq(automaticDiscounts.id, discountId));

    revalidatePath(`/shops/[slug]/admin/discounts/automatic`, 'page');
    revalidatePath(`/shops/[slug]/admin/discounts`, 'page');
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

    revalidatePath(`/shops/[slug]/admin/discounts/automatic`, 'page');
    revalidatePath(`/shops/[slug]/admin/discounts`, 'page');
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

    revalidatePath(`/shops/[slug]/admin/discounts/automatic`, 'page');
    revalidatePath(`/shops/[slug]/admin/discounts`, 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting auto discount:', error);
    return { success: false, error: 'שגיאה במחיקת הנחה אוטומטית' };
  }
}

