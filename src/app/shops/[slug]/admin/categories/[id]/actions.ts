'use server';

import { db } from '@/lib/db';
import { productCategories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateProductsOrder(categoryId: string, productIds: string[]) {
  try {
    // Update sort order for each product in this category
    await Promise.all(
      productIds.map((productId, index) => 
        db
          .update(productCategories)
          .set({ sortOrder: index })
          .where(and(
            eq(productCategories.productId, productId),
            eq(productCategories.categoryId, categoryId)
          ))
      )
    );

    revalidatePath('/shops/[slug]/admin/categories/[id]', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating products order:', error);
    return { error: 'אירעה שגיאה בעדכון סדר המוצרים' };
  }
}

