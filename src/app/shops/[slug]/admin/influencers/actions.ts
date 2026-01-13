'use server';

import { db } from '@/lib/db';
import { influencers, discounts, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { sendInfluencerWelcomeEmail } from '@/lib/email';

interface InfluencerData {
  name: string;
  email: string;
  phone?: string | null;
  password?: string | null;
  instagramHandle?: string | null;
  instagramFollowers?: number | null;
  tiktokHandle?: string | null;
  tiktokFollowers?: number | null;
  youtubeChannel?: string | null;
  youtubeSubscribers?: number | null;
  commissionType?: 'percentage' | 'fixed_amount';
  commissionValue?: number | null;
  showCommission?: boolean;
  showCustomerNames?: boolean;
  showOrderDetails?: boolean;
  couponCode?: string | null;
  discountId?: string | null;
  discountIds?: string[];  // מערך של מזהי קופונים
  automaticDiscountId?: string | null;
  isActive?: boolean;
  notes?: string | null;
}

export async function createInfluencer(storeId: string, slug: string, data: InfluencerData) {
  try {
    // Check if email already exists for this store
    const existing = await db
      .select()
      .from(influencers)
      .where(and(eq(influencers.storeId, storeId), eq(influencers.email, data.email)))
      .limit(1);

    if (existing.length > 0) {
      return { error: 'משפיען עם אימייל זה כבר קיים' };
    }

    // Get store name for email
    const [store] = await db
      .select({ name: stores.name })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    // Hash password if provided
    let passwordHash = null;
    const tempPassword = data.password; // Keep original password for email
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    // Create influencer (normalize email to lowercase)
    const [newInfluencer] = await db.insert(influencers).values({
      storeId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone || null,
      passwordHash,
      instagramHandle: data.instagramHandle || null,
      instagramFollowers: data.instagramFollowers || null,
      tiktokHandle: data.tiktokHandle || null,
      tiktokFollowers: data.tiktokFollowers || null,
      youtubeChannel: data.youtubeChannel || null,
      youtubeSubscribers: data.youtubeSubscribers || null,
      commissionType: data.commissionType || 'percentage',
      commissionValue: data.commissionValue?.toString() || null,
      showCommission: data.showCommission ?? true,
      showCustomerNames: data.showCustomerNames ?? true,
      showOrderDetails: data.showOrderDetails ?? true,
      couponCode: data.couponCode || null,
      discountId: data.discountIds?.[0] || data.discountId || null, // backwards compatibility
      discountIds: data.discountIds || [],
      automaticDiscountId: data.automaticDiscountId || null,
      isActive: data.isActive ?? true,
      notes: data.notes || null,
    }).returning();

    // Send welcome email to influencer
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_APP_URL is not configured');
      revalidatePath(`/shops/${slug}/admin/influencers`);
      return { success: true, influencer: newInfluencer };
    }
    const loginUrl = `${baseUrl}/shops/${slug}/influencer/login`;
    
    try {
      await sendInfluencerWelcomeEmail({
        email: data.email,
        name: data.name,
        storeName: store?.name || slug,
        storeSlug: slug,
        loginUrl,
        tempPassword: tempPassword || undefined,
      });
    } catch (emailError) {
      console.error('Failed to send influencer welcome email:', emailError);
      // Don't fail the entire operation if email fails
    }

    revalidatePath(`/shops/${slug}/admin/influencers`);
    return { success: true, influencer: newInfluencer };
  } catch (error) {
    console.error('Error creating influencer:', error);
    return { error: 'אירעה שגיאה ביצירת המשפיען' };
  }
}

export async function updateInfluencer(influencerId: string, slug: string, data: Partial<InfluencerData>) {
  try {
    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.instagramHandle !== undefined) updateData.instagramHandle = data.instagramHandle || null;
    if (data.instagramFollowers !== undefined) updateData.instagramFollowers = data.instagramFollowers || null;
    if (data.tiktokHandle !== undefined) updateData.tiktokHandle = data.tiktokHandle || null;
    if (data.tiktokFollowers !== undefined) updateData.tiktokFollowers = data.tiktokFollowers || null;
    if (data.youtubeChannel !== undefined) updateData.youtubeChannel = data.youtubeChannel || null;
    if (data.youtubeSubscribers !== undefined) updateData.youtubeSubscribers = data.youtubeSubscribers || null;
    if (data.commissionType !== undefined) updateData.commissionType = data.commissionType;
    if (data.commissionValue !== undefined) updateData.commissionValue = data.commissionValue?.toString() || null;
    if (data.showCommission !== undefined) updateData.showCommission = data.showCommission;
    if (data.showCustomerNames !== undefined) updateData.showCustomerNames = data.showCustomerNames;
    if (data.showOrderDetails !== undefined) updateData.showOrderDetails = data.showOrderDetails;
    if (data.couponCode !== undefined) updateData.couponCode = data.couponCode || null;
    if (data.discountId !== undefined) updateData.discountId = data.discountId || null;
    if (data.discountIds !== undefined) {
      updateData.discountIds = data.discountIds;
      // backwards compatibility - set discountId to first one
      updateData.discountId = data.discountIds[0] || null;
    }
    if (data.automaticDiscountId !== undefined) updateData.automaticDiscountId = data.automaticDiscountId || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    // Hash password if provided
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await db
      .update(influencers)
      .set(updateData)
      .where(eq(influencers.id, influencerId));

    revalidatePath(`/shops/${slug}/admin/influencers`);
    revalidatePath(`/shops/${slug}/admin/influencers/${influencerId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating influencer:', error);
    return { error: 'אירעה שגיאה בעדכון המשפיען' };
  }
}

export async function deleteInfluencer(influencerId: string, slug: string) {
  try {
    await db
      .delete(influencers)
      .where(eq(influencers.id, influencerId));

    revalidatePath(`/shops/${slug}/admin/influencers`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting influencer:', error);
    return { error: 'אירעה שגיאה במחיקת המשפיען' };
  }
}

export async function toggleInfluencerStatus(influencerId: string, slug: string) {
  try {
    // Get current status
    const [influencer] = await db
      .select({ isActive: influencers.isActive })
      .from(influencers)
      .where(eq(influencers.id, influencerId))
      .limit(1);

    if (!influencer) {
      return { error: 'משפיען לא נמצא' };
    }

    await db
      .update(influencers)
      .set({ 
        isActive: !influencer.isActive,
        updatedAt: new Date(),
      })
      .where(eq(influencers.id, influencerId));

    revalidatePath(`/shops/${slug}/admin/influencers`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling influencer status:', error);
    return { error: 'אירעה שגיאה' };
  }
}

