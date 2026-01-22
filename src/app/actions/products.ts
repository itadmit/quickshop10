'use server';

import { db } from '@/lib/db';
import { products, productImages } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * טעינת פרטי מוצרים לפי IDs (למוצרי מתנה)
 * מהיר - משתמש ב-inArray query
 */
export async function getProductsByIds(productIds: string[]) {
  if (productIds.length === 0) return [];
  
  const productsList = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      inventory: products.inventory,
      isActive: products.isActive,
    })
    .from(products)
    .where(inArray(products.id, productIds));
  
  // טעינת תמונות ראשיות לכל מוצר (parallel)
  const productsWithImages = await Promise.all(
    productsList.map(async (product) => {
      const [mainImage] = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder)
        .limit(1);
      
      return {
        ...product,
        image: mainImage?.url || '',
      };
    })
  );
  
  return productsWithImages;
}




