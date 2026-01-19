'use server';

import { db } from '@/lib/db';
import { productBadges, productBadgeAssignments, categories } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface BadgeFormData {
  name: string;
  text: string;
  backgroundColor: string;
  textColor: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  appliesTo: 'manual' | 'category' | 'new' | 'featured' | 'sale';
  categoryIds: string[];
  newProductDays: number;
  isActive: boolean;
}

// Get all badges for a store
export async function getStoreBadges(storeId: string) {
  const badges = await db
    .select()
    .from(productBadges)
    .where(eq(productBadges.storeId, storeId))
    .orderBy(asc(productBadges.sortOrder));
  
  return badges;
}

// Create a new badge
export async function createBadge(storeId: string, storeSlug: string, data: BadgeFormData) {
  try {
    const [badge] = await db.insert(productBadges).values({
      storeId,
      name: data.name,
      text: data.text,
      backgroundColor: data.backgroundColor,
      textColor: data.textColor,
      position: data.position,
      appliesTo: data.appliesTo,
      categoryIds: data.categoryIds,
      newProductDays: data.newProductDays,
      isActive: data.isActive,
    }).returning();
    
    revalidatePath(`/shops/${storeSlug}/admin/settings/badges`);
    return { success: true, badge };
  } catch (error) {
    console.error('Error creating badge:', error);
    return { success: false, error: 'Failed to create badge' };
  }
}

// Update a badge
export async function updateBadge(badgeId: string, storeSlug: string, data: Partial<BadgeFormData>) {
  try {
    const [badge] = await db
      .update(productBadges)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(productBadges.id, badgeId))
      .returning();
    
    revalidatePath(`/shops/${storeSlug}/admin/settings/badges`);
    revalidatePath(`/shops/${storeSlug}`);
    return { success: true, badge };
  } catch (error) {
    console.error('Error updating badge:', error);
    return { success: false, error: 'Failed to update badge' };
  }
}

// Delete a badge
export async function deleteBadge(badgeId: string, storeSlug: string) {
  try {
    await db.delete(productBadges).where(eq(productBadges.id, badgeId));
    
    revalidatePath(`/shops/${storeSlug}/admin/settings/badges`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting badge:', error);
    return { success: false, error: 'Failed to delete badge' };
  }
}

// Toggle badge active status
export async function toggleBadgeStatus(badgeId: string, storeSlug: string, isActive: boolean) {
  try {
    await db
      .update(productBadges)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(productBadges.id, badgeId));
    
    revalidatePath(`/shops/${storeSlug}/admin/settings/badges`);
    revalidatePath(`/shops/${storeSlug}`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling badge status:', error);
    return { success: false, error: 'Failed to toggle status' };
  }
}

// Get manual badges for a product (for product form)
export async function getProductBadges(productId: string) {
  const assignments = await db
    .select({
      badgeId: productBadgeAssignments.badgeId,
    })
    .from(productBadgeAssignments)
    .where(eq(productBadgeAssignments.productId, productId));
  
  return assignments.map(a => a.badgeId);
}

// Update product badge assignments
export async function updateProductBadges(productId: string, badgeIds: string[], storeSlug: string) {
  try {
    // Delete existing assignments
    await db
      .delete(productBadgeAssignments)
      .where(eq(productBadgeAssignments.productId, productId));
    
    // Insert new assignments
    if (badgeIds.length > 0) {
      await db.insert(productBadgeAssignments).values(
        badgeIds.map(badgeId => ({
          productId,
          badgeId,
        }))
      );
    }
    
    revalidatePath(`/shops/${storeSlug}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating product badges:', error);
    return { success: false, error: 'Failed to update badges' };
  }
}

// Get available manual badges for product form
export async function getManualBadgesForStore(storeId: string) {
  const badges = await db
    .select({
      id: productBadges.id,
      name: productBadges.name,
      text: productBadges.text,
      backgroundColor: productBadges.backgroundColor,
      textColor: productBadges.textColor,
      position: productBadges.position,
    })
    .from(productBadges)
    .where(and(
      eq(productBadges.storeId, storeId),
      eq(productBadges.appliesTo, 'manual'),
      eq(productBadges.isActive, true)
    ))
    .orderBy(asc(productBadges.sortOrder));
  
  return badges;
}

// Get store categories for badge form
export async function getStoreCategories(storeId: string) {
  const cats = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(eq(categories.storeId, storeId))
    .orderBy(asc(categories.name));
  
  return cats;
}

