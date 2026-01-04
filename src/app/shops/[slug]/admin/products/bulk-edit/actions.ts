'use server';

import { db } from '@/lib/db';
import { products, productVariants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface UpdateData {
  sku?: string;
  price?: string;
  comparePrice?: string;
  cost?: string;
  inventory?: number;
  isActive?: boolean;
  categoryId?: string;
}

export async function bulkUpdateProduct(
  itemId: string,
  isVariant: boolean,
  data: UpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Build update object
    const updateObj: Record<string, unknown> = {};
    
    if (data.sku !== undefined) {
      updateObj.sku = data.sku || null;
    }
    if (data.price !== undefined) {
      updateObj.price = data.price || null;
    }
    if (data.comparePrice !== undefined) {
      updateObj.comparePrice = data.comparePrice || null;
    }
    if (data.cost !== undefined) {
      updateObj.cost = data.cost || null;
    }
    if (data.inventory !== undefined) {
      updateObj.inventory = data.inventory;
    }
    if (data.isActive !== undefined) {
      updateObj.isActive = data.isActive;
    }
    if (data.categoryId !== undefined) {
      updateObj.categoryId = data.categoryId || null;
    }

    // Update in database
    if (isVariant) {
      await db
        .update(productVariants)
        .set(updateObj)
        .where(eq(productVariants.id, itemId));
    } else {
      await db
        .update(products)
        .set({ ...updateObj, updatedAt: new Date() })
        .where(eq(products.id, itemId));
    }

    revalidatePath('/shops/[slug]/admin/products/bulk-edit', 'page');
    revalidatePath('/shops/[slug]/admin/products/inventory', 'page');
    revalidatePath('/shops/[slug]/admin/products', 'page');

    return { success: true };
  } catch (error) {
    console.error('Bulk update error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    };
  }
}

// Bulk update multiple items at once
export async function bulkUpdateMultiple(
  items: Array<{ id: string; isVariant: boolean }>,
  data: UpdateData
): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    let updated = 0;

    for (const item of items) {
      const result = await bulkUpdateProduct(item.id, item.isVariant, data);
      if (result.success) updated++;
    }

    revalidatePath('/shops/[slug]/admin/products/bulk-edit', 'page');
    revalidatePath('/shops/[slug]/admin/products/inventory', 'page');
    revalidatePath('/shops/[slug]/admin/products', 'page');

    return { success: true, updated };
  } catch (error) {
    console.error('Bulk update multiple error:', error);
    return { 
      success: false, 
      updated: 0,
      error: error instanceof Error ? error.message : 'Update failed' 
    };
  }
}

