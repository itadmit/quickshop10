'use server';

import { db } from '@/lib/db';
import { discounts, influencers, discountChanges, users } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

type DiscountType = 
  | 'percentage' 
  | 'fixed_amount' 
  | 'free_shipping'
  | 'buy_x_pay_y'
  | 'buy_x_get_y'
  | 'gift_product'
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
  buyQuantity?: number | null;
  payAmount?: number | null;
  getQuantity?: number | null;
  getDiscountPercent?: number | null;
  giftProductIds?: string[];
  giftSameProduct?: boolean;
  quantityTiers?: QuantityTier[];
  spendAmount?: number | null;
  minimumQuantity?: number | null;
  triggerCouponCodes?: string[];
  activatesCouponCodes?: string[];
}

async function getCurrentUser() {
  const session = await auth();
  if (session?.user?.id) {
    const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, session.user.id)).limit(1);
    return user || null;
  }
  return null;
}

async function recordDiscountChange(params: {
  storeId: string;
  discountId: string;
  userId?: string | null;
  userName?: string | null;
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'extended' | 'expired';
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  description?: string;
}) {
  try {
    await db.insert(discountChanges).values({
      storeId: params.storeId,
      discountId: params.discountId,
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      fieldName: params.fieldName,
      oldValue: params.oldValue !== undefined ? JSON.stringify(params.oldValue) : null,
      newValue: params.newValue !== undefined ? JSON.stringify(params.newValue) : null,
      description: params.description,
    });
  } catch (error) {
    console.error('Error recording discount change:', error);
  }
}

export async function createCoupon(storeId: string, data: CouponData) {
  try {
    const normalizedCode = data.code.toUpperCase().trim();
    const existing = await db.select().from(discounts).where(and(eq(discounts.storeId, storeId), eq(discounts.code, normalizedCode))).limit(1);
    if (existing.length > 0) return { error: 'קופון עם קוד זה כבר קיים' };

    const currentUser = await getCurrentUser();

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
      buyQuantity: data.buyQuantity || null,
      payAmount: data.payAmount?.toString() || null,
      getQuantity: data.getQuantity || null,
      getDiscountPercent: data.getDiscountPercent ?? 100,
      giftProductIds: data.giftProductIds || [],
      giftSameProduct: data.giftSameProduct ?? true,
      quantityTiers: data.quantityTiers || [],
      spendAmount: data.spendAmount?.toString() || null,
      minimumQuantity: data.minimumQuantity || null,
      triggerCouponCodes: data.triggerCouponCodes || [],
      activatesCouponCodes: data.activatesCouponCodes || [],
      updatedBy: currentUser?.id,
    }).returning();

    if (newCoupon) {
      await recordDiscountChange({
        storeId,
        discountId: newCoupon.id,
        userId: currentUser?.id,
        userName: currentUser?.name,
        action: 'created',
        description: `נוצר קופון "${normalizedCode}"`,
      });
    }

    if (data.influencerId && newCoupon) {
      const [currentInfluencer] = await db.select({ discountIds: influencers.discountIds }).from(influencers).where(eq(influencers.id, data.influencerId)).limit(1);
      const currentIds = (currentInfluencer?.discountIds as string[]) || [];
      const updatedIds = currentIds.includes(newCoupon.id) ? currentIds : [...currentIds, newCoupon.id];
      await db.update(influencers).set({ discountId: updatedIds[0] || null, discountIds: updatedIds, couponCode: normalizedCode }).where(eq(influencers.id, data.influencerId));
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
    const currentUser = await getCurrentUser();
    const [oldDiscount] = await db.select().from(discounts).where(eq(discounts.id, couponId)).limit(1);
    
    await db.update(discounts).set({
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
      buyQuantity: data.buyQuantity || null,
      payAmount: data.payAmount?.toString() || null,
      getQuantity: data.getQuantity || null,
      getDiscountPercent: data.getDiscountPercent ?? 100,
      giftProductIds: data.giftProductIds || [],
      giftSameProduct: data.giftSameProduct ?? true,
      quantityTiers: data.quantityTiers || [],
      spendAmount: data.spendAmount?.toString() || null,
      minimumQuantity: data.minimumQuantity || null,
      triggerCouponCodes: data.triggerCouponCodes || [],
      activatesCouponCodes: data.activatesCouponCodes || [],
      updatedAt: new Date(),
      updatedBy: currentUser?.id,
    }).where(eq(discounts.id, couponId));

    if (oldDiscount) {
      const storeId = oldDiscount.storeId;
      if (oldDiscount.isActive !== data.isActive) {
        await recordDiscountChange({
          storeId, discountId: couponId, userId: currentUser?.id, userName: currentUser?.name,
          action: data.isActive ? 'activated' : 'deactivated',
          fieldName: 'is_active', oldValue: oldDiscount.isActive, newValue: data.isActive,
          description: data.isActive ? `הפעיל את הקופון "${normalizedCode}"` : `כיבה את הקופון "${normalizedCode}"`,
        });
      }
      if (oldDiscount.endsAt?.getTime() !== data.endsAt?.getTime()) {
        const isExtension = data.endsAt && (!oldDiscount.endsAt || data.endsAt > oldDiscount.endsAt);
        await recordDiscountChange({
          storeId, discountId: couponId, userId: currentUser?.id, userName: currentUser?.name,
          action: isExtension ? 'extended' : 'updated',
          fieldName: 'ends_at', oldValue: oldDiscount.endsAt?.toISOString(), newValue: data.endsAt?.toISOString(),
          description: isExtension ? `הרחיב תוקף הקופון "${normalizedCode}" עד ${data.endsAt?.toLocaleDateString('he-IL')}` : `שינה תאריך סיום של "${normalizedCode}"`,
        });
      }
      if (Number(oldDiscount.value) !== data.value) {
        await recordDiscountChange({
          storeId, discountId: couponId, userId: currentUser?.id, userName: currentUser?.name,
          action: 'updated', fieldName: 'value', oldValue: oldDiscount.value, newValue: data.value,
          description: `שינה ערך הקופון "${normalizedCode}" מ-${oldDiscount.value} ל-${data.value}`,
        });
      }
    }

    const influencersWithCoupon = await db.select({ id: influencers.id, discountIds: influencers.discountIds }).from(influencers).where(sql`${influencers.discountIds}::jsonb @> ${JSON.stringify([couponId])}::jsonb`);
    for (const inf of influencersWithCoupon) {
      if (inf.id !== data.influencerId) {
        const currentIds = (inf.discountIds as string[]) || [];
        const updatedIds = currentIds.filter(id => id !== couponId);
        await db.update(influencers).set({ discountIds: updatedIds, discountId: updatedIds[0] || null }).where(eq(influencers.id, inf.id));
      }
    }

    if (data.influencerId) {
      const [currentInfluencer] = await db.select({ discountIds: influencers.discountIds }).from(influencers).where(eq(influencers.id, data.influencerId)).limit(1);
      const currentIds = (currentInfluencer?.discountIds as string[]) || [];
      const updatedIds = currentIds.includes(couponId) ? currentIds : [...currentIds, couponId];
      await db.update(influencers).set({ discountId: updatedIds[0] || null, discountIds: updatedIds, couponCode: normalizedCode }).where(eq(influencers.id, data.influencerId));
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
    await db.delete(discounts).where(eq(discounts.id, couponId));
    revalidatePath('/shops/[slug]/admin/discounts', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { error: 'אירעה שגיאה במחיקת הקופון' };
  }
}

export async function toggleCoupon(couponId: string, isActive: boolean) {
  try {
    const currentUser = await getCurrentUser();
    const [oldDiscount] = await db.select().from(discounts).where(eq(discounts.id, couponId)).limit(1);
    
    await db.update(discounts).set({ isActive, updatedAt: new Date(), updatedBy: currentUser?.id }).where(eq(discounts.id, couponId));

    if (oldDiscount && oldDiscount.isActive !== isActive) {
      await recordDiscountChange({
        storeId: oldDiscount.storeId, discountId: couponId, userId: currentUser?.id, userName: currentUser?.name,
        action: isActive ? 'activated' : 'deactivated',
        fieldName: 'is_active', oldValue: oldDiscount.isActive, newValue: isActive,
        description: isActive ? `הפעיל את הקופון "${oldDiscount.code}"` : `כיבה את הקופון "${oldDiscount.code}"`,
      });
    }

    revalidatePath('/shops/[slug]/admin/discounts', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error toggling coupon:', error);
    return { error: 'אירעה שגיאה' };
  }
}

export async function getDiscountHistory(discountId: string) {
  try {
    const history = await db.select().from(discountChanges).where(eq(discountChanges.discountId, discountId)).orderBy(desc(discountChanges.createdAt)).limit(50);
    return { success: true, history };
  } catch (error) {
    console.error('Error getting discount history:', error);
    return { success: false, history: [] };
  }
}
