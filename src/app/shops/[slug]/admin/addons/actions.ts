'use server';

import { db } from '@/lib/db';
import { productAddons, productAddonAssignments } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface AddonOption {
  label: string;
  value: string;
  priceAdjustment: number;
}

export interface AddonFormData {
  name: string;
  fieldType: 'text' | 'select' | 'checkbox' | 'radio' | 'date';
  placeholder?: string;
  options?: AddonOption[];
  priceAdjustment?: number;
  isRequired: boolean;
  maxLength?: number;
  isActive: boolean;
}

// Get all addons for a store
export async function getStoreAddons(storeId: string) {
  return db
    .select()
    .from(productAddons)
    .where(eq(productAddons.storeId, storeId))
    .orderBy(asc(productAddons.sortOrder), asc(productAddons.name));
}

// Get single addon
export async function getAddon(addonId: string, storeId: string) {
  const results = await db
    .select()
    .from(productAddons)
    .where(and(
      eq(productAddons.id, addonId),
      eq(productAddons.storeId, storeId)
    ))
    .limit(1);
  
  return results[0] || null;
}

// Create addon
export async function createAddon(storeId: string, data: AddonFormData) {
  const maxSortOrder = await db
    .select({ sortOrder: productAddons.sortOrder })
    .from(productAddons)
    .where(eq(productAddons.storeId, storeId))
    .orderBy(asc(productAddons.sortOrder))
    .limit(1);
  
  const sortOrder = maxSortOrder.length > 0 ? (maxSortOrder[0].sortOrder + 1) : 0;

  const [addon] = await db.insert(productAddons).values({
    storeId,
    name: data.name,
    fieldType: data.fieldType,
    placeholder: data.placeholder || null,
    options: data.options || [],
    priceAdjustment: data.priceAdjustment?.toString() || '0',
    isRequired: data.isRequired,
    maxLength: data.maxLength || null,
    sortOrder,
    isActive: data.isActive,
  }).returning();

  revalidatePath(`/shops/${storeId}/admin/addons`);
  
  return addon;
}

// Update addon
export async function updateAddon(addonId: string, storeId: string, data: Partial<AddonFormData>) {
  const [addon] = await db
    .update(productAddons)
    .set({
      name: data.name,
      fieldType: data.fieldType,
      placeholder: data.placeholder || null,
      options: data.options || [],
      priceAdjustment: data.priceAdjustment?.toString() || '0',
      isRequired: data.isRequired,
      maxLength: data.maxLength || null,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(and(
      eq(productAddons.id, addonId),
      eq(productAddons.storeId, storeId)
    ))
    .returning();

  revalidatePath(`/shops/${storeId}/admin/addons`);
  
  return addon;
}

// Delete addon
export async function deleteAddon(addonId: string, storeId: string) {
  await db
    .delete(productAddons)
    .where(and(
      eq(productAddons.id, addonId),
      eq(productAddons.storeId, storeId)
    ));

  revalidatePath(`/shops/${storeId}/admin/addons`);
}

// Get addons assigned to a product
export async function getProductAddons(productId: string) {
  const assignments = await db
    .select({
      assignment: productAddonAssignments,
      addon: productAddons,
    })
    .from(productAddonAssignments)
    .innerJoin(productAddons, eq(productAddonAssignments.addonId, productAddons.id))
    .where(eq(productAddonAssignments.productId, productId))
    .orderBy(asc(productAddonAssignments.sortOrder));

  return assignments.map(({ assignment, addon }) => ({
    ...addon,
    isRequiredOverride: assignment.isRequired,
    priceOverride: assignment.priceOverride,
    assignmentId: assignment.id,
  }));
}

// Assign addons to a product
export async function assignAddonsToProduct(
  productId: string, 
  addonIds: string[], 
  overrides?: Record<string, { isRequired?: boolean; priceOverride?: number }>
) {
  // Remove existing assignments
  await db
    .delete(productAddonAssignments)
    .where(eq(productAddonAssignments.productId, productId));

  // Add new assignments
  if (addonIds.length > 0) {
    await db.insert(productAddonAssignments).values(
      addonIds.map((addonId, index) => ({
        productId,
        addonId,
        sortOrder: index,
        isRequired: overrides?.[addonId]?.isRequired ?? null,
        priceOverride: overrides?.[addonId]?.priceOverride?.toString() ?? null,
      }))
    );
  }
}

// Toggle addon status
export async function toggleAddonStatus(addonId: string, storeId: string, isActive: boolean) {
  await db
    .update(productAddons)
    .set({ isActive, updatedAt: new Date() })
    .where(and(
      eq(productAddons.id, addonId),
      eq(productAddons.storeId, storeId)
    ));

  revalidatePath(`/shops/${storeId}/admin/addons`);
}

