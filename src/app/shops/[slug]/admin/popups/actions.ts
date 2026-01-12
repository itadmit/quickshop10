'use server';

import { db } from '@/lib/db';
import { popups, popupSubmissions, stores } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Types for popup content and style
export interface PopupContent {
  // Image type
  imageUrl?: string;
  imageAlt?: string;
  linkUrl?: string;
  linkText?: string;
  
  // Text type
  title?: string;
  subtitle?: string;
  body?: string;
  buttonText?: string;
  buttonUrl?: string;
  
  // Form type
  fields?: Array<{
    name: string;
    type: 'text' | 'email' | 'phone' | 'textarea';
    placeholder?: string;
    required?: boolean;
  }>;
  successMessage?: string;
}

export interface PopupStyle {
  bgColor?: string;
  textColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  overlayOpacity?: number;
  borderRadius?: number;
  width?: 'small' | 'medium' | 'large' | 'full';
}

export interface PopupFormData {
  name: string;
  type: 'image' | 'text' | 'form' | 'combined';
  isActive: boolean;
  trigger: 'on_load' | 'exit_intent' | 'scroll' | 'time_delay';
  triggerValue?: number;
  position: 'center' | 'bottom_right' | 'bottom_left' | 'full_screen';
  frequency: 'once' | 'once_per_session' | 'always' | 'every_x_days';
  frequencyDays?: number;
  targetPages: 'all' | 'homepage' | 'products' | 'categories' | 'custom';
  customTargetUrls?: string[];
  showOnDesktop: boolean;
  showOnMobile: boolean;
  startDate?: string;
  endDate?: string;
  content: PopupContent;
  style: PopupStyle;
}

export async function createPopup(storeId: string, data: PopupFormData) {
  try {
    const [popup] = await db.insert(popups).values({
      storeId,
      name: data.name,
      type: data.type,
      isActive: data.isActive,
      trigger: data.trigger,
      triggerValue: data.triggerValue || 3,
      position: data.position,
      frequency: data.frequency,
      frequencyDays: data.frequencyDays || 7,
      targetPages: data.targetPages,
      customTargetUrls: data.customTargetUrls || [],
      showOnDesktop: data.showOnDesktop,
      showOnMobile: data.showOnMobile,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      content: data.content,
      style: data.style,
    }).returning();

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/popups`);
      revalidatePath(`/shops/${store.slug}`);
    }

    return { success: true, popup };
  } catch (error) {
    console.error('Failed to create popup:', error);
    return { success: false, error: 'Failed to create popup' };
  }
}

export async function updatePopup(popupId: string, storeId: string, data: Partial<PopupFormData>) {
  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.trigger !== undefined) updateData.trigger = data.trigger;
    if (data.triggerValue !== undefined) updateData.triggerValue = data.triggerValue;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.frequencyDays !== undefined) updateData.frequencyDays = data.frequencyDays;
    if (data.targetPages !== undefined) updateData.targetPages = data.targetPages;
    if (data.customTargetUrls !== undefined) updateData.customTargetUrls = data.customTargetUrls;
    if (data.showOnDesktop !== undefined) updateData.showOnDesktop = data.showOnDesktop;
    if (data.showOnMobile !== undefined) updateData.showOnMobile = data.showOnMobile;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.style !== undefined) updateData.style = data.style;

    await db.update(popups)
      .set(updateData)
      .where(and(eq(popups.id, popupId), eq(popups.storeId, storeId)));

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/popups`);
      revalidatePath(`/shops/${store.slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update popup:', error);
    return { success: false, error: 'Failed to update popup' };
  }
}

export async function deletePopup(popupId: string, storeId: string) {
  try {
    await db.delete(popups)
      .where(and(eq(popups.id, popupId), eq(popups.storeId, storeId)));

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/popups`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete popup:', error);
    return { success: false, error: 'Failed to delete popup' };
  }
}

export async function togglePopupStatus(popupId: string, storeId: string, isActive: boolean) {
  return updatePopup(popupId, storeId, { isActive });
}

export async function duplicatePopup(popupId: string, storeId: string) {
  try {
    const original = await db.query.popups.findFirst({
      where: and(eq(popups.id, popupId), eq(popups.storeId, storeId)),
    });

    if (!original) {
      return { success: false, error: 'Popup not found' };
    }

    const [newPopup] = await db.insert(popups).values({
      storeId,
      name: `${original.name} (עותק)`,
      type: original.type,
      isActive: false,
      trigger: original.trigger,
      triggerValue: original.triggerValue,
      position: original.position,
      frequency: original.frequency,
      frequencyDays: original.frequencyDays,
      targetPages: original.targetPages,
      customTargetUrls: original.customTargetUrls,
      showOnDesktop: original.showOnDesktop,
      showOnMobile: original.showOnMobile,
      startDate: original.startDate,
      endDate: original.endDate,
      content: original.content,
      style: original.style,
    }).returning();

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
      columns: { slug: true },
    });

    if (store) {
      revalidatePath(`/shops/${store.slug}/admin/popups`);
    }

    return { success: true, popup: newPopup };
  } catch (error) {
    console.error('Failed to duplicate popup:', error);
    return { success: false, error: 'Failed to duplicate popup' };
  }
}

export async function incrementPopupStats(
  popupId: string, 
  type: 'impressions' | 'clicks' | 'conversions'
) {
  try {
    const popup = await db.query.popups.findFirst({
      where: eq(popups.id, popupId),
    });

    if (!popup) return;

    const updateData: Record<string, number> = {};
    updateData[type] = (popup[type] || 0) + 1;

    await db.update(popups)
      .set(updateData)
      .where(eq(popups.id, popupId));
  } catch (error) {
    console.error('Failed to increment popup stats:', error);
  }
}

export async function savePopupSubmission(
  popupId: string,
  storeId: string,
  formData: Record<string, string>,
  metadata: { ipAddress?: string; userAgent?: string; pageUrl?: string; customerId?: string }
) {
  try {
    await db.insert(popupSubmissions).values({
      popupId,
      storeId,
      customerId: metadata.customerId || null,
      formData,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      pageUrl: metadata.pageUrl,
    });

    // Increment conversions count
    await incrementPopupStats(popupId, 'conversions');

    return { success: true };
  } catch (error) {
    console.error('Failed to save popup submission:', error);
    return { success: false, error: 'Failed to save submission' };
  }
}

export async function getPopupSubmissions(popupId: string, storeId: string) {
  return db.query.popupSubmissions.findMany({
    where: and(
      eq(popupSubmissions.popupId, popupId),
      eq(popupSubmissions.storeId, storeId)
    ),
    orderBy: desc(popupSubmissions.createdAt),
    limit: 100,
  });
}



