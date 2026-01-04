'use server';

import { db } from '@/lib/db';
import { discounts, influencers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

interface CouponData {
  code: string;
  title: string;
  type: DiscountType;
  value: number;
  minimumAmount: number | null;
  usageLimit: number | null;
  oncePerCustomer: boolean;
  firstOrderOnly: boolean;
  stackable: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  influencerId?: string | null;
  appliesTo: 'all' | 'category' | 'product' | 'member';
  categoryIds: string[];
  productIds: string[];
  excludeCategoryIds: string[];
  excludeProductIds: string[];
  // Advanced discount fields
  buyQuantity?: number | null;
  payAmount?: number | null;
  getQuantity?: number | null;
  giftProductIds?: string[];
  giftSameProduct?: boolean;
  quantityTiers?: QuantityTier[];
  spendAmount?: number | null;
}

export async function createCoupon(storeId: string, data: CouponData) {
  try {
    const normalizedCode = data.code.toUpperCase().trim();

    // Check if code already exists
    const existing = await db
      .select()
      .from(discounts)
      .where(and(eq(discounts.storeId, storeId), eq(discounts.code, normalizedCode)))
      .limit(1);

    if (existing.length > 0) {
      return { error: 'קופון עם קוד זה כבר קיים' };
    }

    const [newCoupon] = await db.insert(discounts).values({
      storeId,
      code: normalizedCode,
      title: data.title || null,
      type: data.type,
      value: data.value.toString(),
      minimumAmount: data.minimumAmount?.toString() || null,
      usageLimit: data.usageLimit,
      usageCount: 0,
      oncePerCustomer: data.oncePerCustomer,
      firstOrderOnly: data.firstOrderOnly,
      stackable: data.stackable,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: data.isActive,
      appliesTo: data.appliesTo,
      categoryIds: data.categoryIds,
      productIds: data.productIds,
      excludeCategoryIds: data.excludeCategoryIds,
      excludeProductIds: data.excludeProductIds,
      // Advanced discount fields
      buyQuantity: data.buyQuantity || null,
      payAmount: data.payAmount?.toString() || null,
      getQuantity: data.getQuantity || null,
      giftProductIds: data.giftProductIds || [],
      giftSameProduct: data.giftSameProduct ?? true,
      quantityTiers: data.quantityTiers || [],
      spendAmount: data.spendAmount?.toString() || null,
    }).returning();

    // Link to influencer if specified
    if (data.influencerId && newCoupon) {
      await db
        .update(influencers)
        .set({ 
          discountId: newCoupon.id,
          couponCode: normalizedCode,
        })
        .where(eq(influencers.id, data.influencerId));
    }

    revalidatePath('/shops/[slug]/admin/discounts', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { error: 'אירעה שגיאה ביצירת הקופון' };
  }
}

export async function updateCoupon(couponId: string, data: CouponData) {
  try {
    const normalizedCode = data.code.toUpperCase().trim();
    
    await db
      .update(discounts)
      .set({
        code: normalizedCode,
        title: data.title || null,
        type: data.type,
        value: data.value.toString(),
        minimumAmount: data.minimumAmount?.toString() || null,
        usageLimit: data.usageLimit,
        oncePerCustomer: data.oncePerCustomer,
        firstOrderOnly: data.firstOrderOnly,
        stackable: data.stackable,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        isActive: data.isActive,
        appliesTo: data.appliesTo,
        categoryIds: data.categoryIds,
        productIds: data.productIds,
        excludeCategoryIds: data.excludeCategoryIds,
        excludeProductIds: data.excludeProductIds,
        // Advanced discount fields
        buyQuantity: data.buyQuantity || null,
        payAmount: data.payAmount?.toString() || null,
        getQuantity: data.getQuantity || null,
        giftProductIds: data.giftProductIds || [],
        giftSameProduct: data.giftSameProduct ?? true,
        quantityTiers: data.quantityTiers || [],
        spendAmount: data.spendAmount?.toString() || null,
      })
      .where(eq(discounts.id, couponId));

    // Clear old influencer link
    await db
      .update(influencers)
      .set({ discountId: null, couponCode: null })
      .where(eq(influencers.discountId, couponId));

    // Link to new influencer if specified
    if (data.influencerId) {
      await db
        .update(influencers)
        .set({ 
          discountId: couponId,
          couponCode: normalizedCode,
        })
        .where(eq(influencers.id, data.influencerId));
    }

    revalidatePath('/shops/[slug]/admin/discounts', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating coupon:', error);
    return { error: 'אירעה שגיאה בעדכון הקופון' };
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    await db
      .delete(discounts)
      .where(eq(discounts.id, couponId));

    revalidatePath('/shops/[slug]/admin/discounts', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { error: 'אירעה שגיאה במחיקת הקופון' };
  }
}

export async function toggleCoupon(couponId: string, isActive: boolean) {
  try {
    await db
      .update(discounts)
      .set({ isActive })
      .where(eq(discounts.id, couponId));

    revalidatePath('/shops/[slug]/admin/discounts', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error toggling coupon:', error);
    return { error: 'אירעה שגיאה' };
  }
}

