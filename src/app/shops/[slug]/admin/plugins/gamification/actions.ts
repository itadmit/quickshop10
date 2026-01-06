'use server';

import { db } from '@/lib/db';
import { 
  gamificationCampaigns, 
  gamificationPrizes, 
  gamificationEntries, 
  gamificationWins,
  discounts 
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

// ============================================
// Campaign Actions
// ============================================

export interface CreateCampaignData {
  storeId: string;
  name: string;
  type: 'wheel' | 'scratch';
  title: string;
  subtitle?: string;
  buttonText: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  collectName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  collectBirthday: boolean;
  requireMarketingConsent: boolean;
  requirePrivacyConsent: boolean;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  maxPlaysPerEmail: number;
  maxPlaysPerDay?: number;
  startDate?: Date;
  endDate?: Date;
  trigger: 'on_load' | 'exit_intent' | 'scroll' | 'time_delay';
  triggerValue?: number;
  frequency: 'once' | 'once_per_session' | 'always' | 'every_x_days';
  frequencyDays?: number;
  targetPages: 'all' | 'homepage' | 'products' | 'categories' | 'custom';
  customTargetUrls?: string[];
  showOnDesktop: boolean;
  showOnMobile: boolean;
}

export async function createCampaign(data: CreateCampaignData) {
  try {
    const [campaign] = await db.insert(gamificationCampaigns).values({
      storeId: data.storeId,
      name: data.name,
      type: data.type,
      title: data.title,
      subtitle: data.subtitle || null,
      buttonText: data.buttonText,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      backgroundColor: data.backgroundColor,
      textColor: data.textColor,
      collectName: data.collectName,
      collectEmail: data.collectEmail,
      collectPhone: data.collectPhone,
      collectBirthday: data.collectBirthday,
      requireMarketingConsent: data.requireMarketingConsent,
      requirePrivacyConsent: data.requirePrivacyConsent,
      privacyPolicyUrl: data.privacyPolicyUrl || null,
      termsUrl: data.termsUrl || null,
      maxPlaysPerEmail: data.maxPlaysPerEmail,
      maxPlaysPerDay: data.maxPlaysPerDay || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      trigger: data.trigger,
      triggerValue: data.triggerValue || 3,
      frequency: data.frequency,
      frequencyDays: data.frequencyDays || 7,
      targetPages: data.targetPages,
      customTargetUrls: data.customTargetUrls || [],
      showOnDesktop: data.showOnDesktop,
      showOnMobile: data.showOnMobile,
      isActive: false,
    }).returning();

    revalidatePath('/shops/[slug]/admin/plugins/gamification', 'page');
    return { success: true, campaignId: campaign.id };
  } catch (error) {
    console.error('Error creating campaign:', error);
    return { success: false, error: 'אירעה שגיאה ביצירת הקמפיין' };
  }
}

export async function updateCampaign(campaignId: string, data: Partial<CreateCampaignData>) {
  try {
    await db
      .update(gamificationCampaigns)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(gamificationCampaigns.id, campaignId));

    revalidatePath('/shops/[slug]/admin/plugins/gamification', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating campaign:', error);
    return { success: false, error: 'אירעה שגיאה בעדכון הקמפיין' };
  }
}

export async function deleteCampaign(campaignId: string) {
  try {
    await db
      .delete(gamificationCampaigns)
      .where(eq(gamificationCampaigns.id, campaignId));

    revalidatePath('/shops/[slug]/admin/plugins/gamification', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return { success: false, error: 'אירעה שגיאה במחיקת הקמפיין' };
  }
}

export async function toggleCampaignStatus(campaignId: string, isActive: boolean) {
  try {
    await db
      .update(gamificationCampaigns)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(gamificationCampaigns.id, campaignId));

    revalidatePath('/shops/[slug]/admin/plugins/gamification', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error toggling campaign status:', error);
    return { success: false, error: 'אירעה שגיאה בעדכון הסטטוס' };
  }
}

// ============================================
// Prize Actions
// ============================================

export interface PrizeData {
  campaignId: string;
  name: string;
  type: 'coupon_percentage' | 'coupon_fixed' | 'free_shipping' | 'gift_product' | 'extra_spin' | 'no_prize';
  value?: number;
  giftProductId?: string;
  color: string;
  icon?: string;
  probability: number;
  totalAvailable?: number;
  couponPrefix?: string;
  couponValidDays?: number;
  couponMinPurchase?: number;
  sortOrder: number;
}

export async function createPrize(data: PrizeData) {
  try {
    const [prize] = await db.insert(gamificationPrizes).values({
      campaignId: data.campaignId,
      name: data.name,
      type: data.type,
      value: data.value?.toString() || null,
      giftProductId: data.giftProductId || null,
      color: data.color,
      icon: data.icon || null,
      probability: data.probability.toString(),
      totalAvailable: data.totalAvailable || null,
      couponPrefix: data.couponPrefix || null,
      couponValidDays: data.couponValidDays || 30,
      couponMinPurchase: data.couponMinPurchase?.toString() || null,
      sortOrder: data.sortOrder,
      isActive: true,
    }).returning();

    revalidatePath('/shops/[slug]/admin/plugins/gamification/[id]', 'page');
    return { success: true, prizeId: prize.id };
  } catch (error) {
    console.error('Error creating prize:', error);
    return { success: false, error: 'אירעה שגיאה ביצירת הפרס' };
  }
}

export async function updatePrize(prizeId: string, data: Partial<PrizeData>) {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value?.toString() || null;
    if (data.giftProductId !== undefined) updateData.giftProductId = data.giftProductId || null;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.icon !== undefined) updateData.icon = data.icon || null;
    if (data.probability !== undefined) updateData.probability = data.probability.toString();
    if (data.totalAvailable !== undefined) updateData.totalAvailable = data.totalAvailable || null;
    if (data.couponPrefix !== undefined) updateData.couponPrefix = data.couponPrefix || null;
    if (data.couponValidDays !== undefined) updateData.couponValidDays = data.couponValidDays;
    if (data.couponMinPurchase !== undefined) updateData.couponMinPurchase = data.couponMinPurchase?.toString() || null;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    await db
      .update(gamificationPrizes)
      .set(updateData)
      .where(eq(gamificationPrizes.id, prizeId));

    revalidatePath('/shops/[slug]/admin/plugins/gamification/[id]', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating prize:', error);
    return { success: false, error: 'אירעה שגיאה בעדכון הפרס' };
  }
}

export async function deletePrize(prizeId: string) {
  try {
    await db
      .delete(gamificationPrizes)
      .where(eq(gamificationPrizes.id, prizeId));

    revalidatePath('/shops/[slug]/admin/plugins/gamification/[id]', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting prize:', error);
    return { success: false, error: 'אירעה שגיאה במחיקת הפרס' };
  }
}

export async function updatePrizesOrder(campaignId: string, prizeIds: string[]) {
  try {
    await Promise.all(
      prizeIds.map((prizeId, index) =>
        db
          .update(gamificationPrizes)
          .set({ sortOrder: index })
          .where(eq(gamificationPrizes.id, prizeId))
      )
    );

    revalidatePath('/shops/[slug]/admin/plugins/gamification/[id]', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating prizes order:', error);
    return { success: false, error: 'אירעה שגיאה בעדכון סדר הפרסים' };
  }
}

// ============================================
// Game Play Actions (for API routes)
// ============================================

export async function registerEntry(data: {
  campaignId: string;
  storeId: string;
  email: string;
  name?: string;
  phone?: string;
  birthday?: string;
  marketingConsent: boolean;
  privacyConsent: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    // Check if already played max times
    const campaign = await db.query.gamificationCampaigns.findFirst({
      where: eq(gamificationCampaigns.id, data.campaignId),
    });

    if (!campaign) {
      return { success: false, error: 'קמפיין לא נמצא' };
    }

    // Count existing entries for this email
    const existingEntries = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(gamificationEntries)
      .where(
        and(
          eq(gamificationEntries.campaignId, data.campaignId),
          eq(gamificationEntries.email, data.email)
        )
      );

    const entryCount = existingEntries[0]?.count || 0;

    if (entryCount >= campaign.maxPlaysPerEmail) {
      return { success: false, error: 'הגעת למספר המשחקים המקסימלי' };
    }

    // Create entry
    const [entry] = await db.insert(gamificationEntries).values({
      campaignId: data.campaignId,
      storeId: data.storeId,
      email: data.email,
      name: data.name || null,
      phone: data.phone || null,
      birthday: data.birthday || null, // Already a string date format YYYY-MM-DD
      marketingConsent: data.marketingConsent,
      privacyConsent: data.privacyConsent,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    }).returning();

    // Increment plays counter
    await db
      .update(gamificationCampaigns)
      .set({ plays: sql`${gamificationCampaigns.plays} + 1` })
      .where(eq(gamificationCampaigns.id, data.campaignId));

    return { success: true, entryId: entry.id };
  } catch (error) {
    console.error('Error registering entry:', error);
    return { success: false, error: 'אירעה שגיאה ברישום' };
  }
}

export async function spinAndWin(entryId: string, storeId: string) {
  try {
    // Get entry
    const entry = await db.query.gamificationEntries.findFirst({
      where: eq(gamificationEntries.id, entryId),
    });

    if (!entry) {
      return { success: false, error: 'רישום לא נמצא' };
    }

    // Get campaign prizes
    const prizes = await db
      .select()
      .from(gamificationPrizes)
      .where(
        and(
          eq(gamificationPrizes.campaignId, entry.campaignId),
          eq(gamificationPrizes.isActive, true)
        )
      )
      .orderBy(gamificationPrizes.sortOrder);

    if (prizes.length === 0) {
      return { success: false, error: 'אין פרסים זמינים' };
    }

    // Calculate winning prize based on probability
    const random = Math.random() * 100;
    let cumulative = 0;
    let winningPrize = prizes[0];

    for (const prize of prizes) {
      cumulative += parseFloat(prize.probability);
      if (random <= cumulative) {
        // Check if prize is still available
        if (prize.totalAvailable === null || prize.totalWon < prize.totalAvailable) {
          winningPrize = prize;
          break;
        }
      }
    }

    // Generate coupon code if needed
    let couponCode: string | null = null;
    let discountId: string | null = null;

    if (['coupon_percentage', 'coupon_fixed', 'free_shipping', 'gift_product'].includes(winningPrize.type)) {
      // Generate unique coupon code
      const prefix = winningPrize.couponPrefix || 'WIN';
      couponCode = `${prefix}-${nanoid(8).toUpperCase()}`;

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (winningPrize.couponValidDays || 30));

      // Create discount in discounts table
      const discountType = winningPrize.type === 'coupon_percentage' 
        ? 'percentage' 
        : winningPrize.type === 'free_shipping'
          ? 'free_shipping'
          : winningPrize.type === 'gift_product'
            ? 'gift_product'
            : 'fixed_amount';

      const [discount] = await db.insert(discounts).values({
        storeId,
        code: couponCode,
        title: `פרס: ${winningPrize.name}`,
        type: discountType,
        value: winningPrize.value || '0',
        minimumAmount: winningPrize.couponMinPurchase || null,
        usageLimit: 1, // Single use
        usageCount: 0,
        oncePerCustomer: true,
        startsAt: new Date(),
        endsAt: expiryDate,
        isActive: true,
        appliesTo: 'all',
        giftProductIds: winningPrize.giftProductId ? [winningPrize.giftProductId] : [],
      }).returning();

      discountId = discount.id;
    }

    // Create win record
    const [win] = await db.insert(gamificationWins).values({
      entryId,
      prizeId: winningPrize.id,
      campaignId: entry.campaignId,
      couponCode,
      discountId,
    }).returning();

    // Update prize won count
    await db
      .update(gamificationPrizes)
      .set({ totalWon: sql`${gamificationPrizes.totalWon} + 1` })
      .where(eq(gamificationPrizes.id, winningPrize.id));

    return { 
      success: true, 
      win: {
        id: win.id,
        prize: {
          id: winningPrize.id,
          name: winningPrize.name,
          type: winningPrize.type,
          value: winningPrize.value,
          color: winningPrize.color,
          icon: winningPrize.icon,
        },
        couponCode,
        prizeIndex: prizes.findIndex(p => p.id === winningPrize.id),
      }
    };
  } catch (error) {
    console.error('Error in spin and win:', error);
    return { success: false, error: 'אירעה שגיאה' };
  }
}

export async function markWinAsClaimed(winId: string) {
  try {
    await db
      .update(gamificationWins)
      .set({ 
        isClaimed: true, 
        claimedAt: new Date() 
      })
      .where(eq(gamificationWins.id, winId));

    // Increment conversions counter
    const win = await db.query.gamificationWins.findFirst({
      where: eq(gamificationWins.id, winId),
    });

    if (win) {
      await db
        .update(gamificationCampaigns)
        .set({ conversions: sql`${gamificationCampaigns.conversions} + 1` })
        .where(eq(gamificationCampaigns.id, win.campaignId));
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking win as claimed:', error);
    return { success: false, error: 'אירעה שגיאה' };
  }
}

