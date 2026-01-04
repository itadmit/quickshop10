'use server';

import { db } from '@/lib/db';
import { products, productVariants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateInventory(itemId: string, inventory: number, isVariant: boolean) {
  try {
    if (isVariant) {
      await db
        .update(productVariants)
        .set({ inventory })
        .where(eq(productVariants.id, itemId));
    } else {
      await db
        .update(products)
        .set({ 
          inventory,
          updatedAt: new Date(),
        })
        .where(eq(products.id, itemId));
    }

    revalidatePath('/shops/[slug]/admin/products/inventory', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating inventory:', error);
    return { error: 'אירעה שגיאה בעדכון המלאי' };
  }
}


