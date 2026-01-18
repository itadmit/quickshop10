'use server';

/**
 * Product Stories Actions
 * 
 * Server Actions for Stories plugin management
 */

import { db } from '@/lib/db';
import { storePlugins, productStories, products, productImages } from '@/lib/db/schema';
import { eq, and, ilike, asc, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Update Stories plugin configuration
 */
export async function updateStoriesConfig(
  storeId: string,
  config: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(storePlugins)
      .set({
        config,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storePlugins.storeId, storeId),
          eq(storePlugins.pluginSlug, 'product-stories')
        )
      );

    revalidatePath('/shops/[slug]/admin/plugins/product-stories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating stories config:', error);
    return { success: false, error: 'שגיאה בעדכון ההגדרות' };
  }
}

/**
 * Search products for adding to stories
 */
export async function searchProducts(
  storeId: string,
  query: string
): Promise<Array<{
  id: string;
  title: string;
  handle: string;
  price: number;
  image: string | null;
}>> {
  try {
    const searchResults = await db
      .select({
        id: products.id,
        title: products.name,
        handle: products.slug,
        price: products.price,
      })
      .from(products)
      .where(
        and(
          eq(products.storeId, storeId),
          eq(products.isActive, true),
          query ? ilike(products.name, `%${query}%`) : sql`true`
        )
      )
      .limit(20);

    // Get images
    const productIds = searchResults.map(p => p.id);
    const images = productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(eq(productImages.isPrimary, true))
      : [];

    const imageMap = new Map(images.map(i => [i.productId, i.url]));

    return searchResults.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      price: Number(p.price),
      image: imageMap.get(p.id) || null,
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

/**
 * Add product to stories
 */
export async function addProductToStories(
  storeId: string,
  productId: string
): Promise<{
  success: boolean;
  error?: string;
  story?: {
    id: string;
    productId: string;
    position: number;
    isActive: boolean;
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
    productTitle: string;
    productHandle: string;
    productPrice: number;
    productImage: string | null;
  };
}> {
  try {
    // Verify product exists
    const [product] = await db
      .select({
        id: products.id,
        title: products.name,
        handle: products.slug,
        price: products.price,
      })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.storeId, storeId)
        )
      )
      .limit(1);

    if (!product) {
      return { success: false, error: 'מוצר לא נמצא' };
    }

    // Get max position
    const [maxPosResult] = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${productStories.position}), 0)` })
      .from(productStories)
      .where(eq(productStories.storeId, storeId));

    const newPosition = (maxPosResult?.maxPos || 0) + 1;

    // Insert story (upsert in case it already exists)
    const [newStory] = await db
      .insert(productStories)
      .values({
        storeId,
        productId,
        position: newPosition,
        isActive: true,
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
      })
      .onConflictDoUpdate({
        target: [productStories.storeId, productStories.productId],
        set: {
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Get product image
    const [image] = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(
        and(
          eq(productImages.productId, productId),
          eq(productImages.isPrimary, true)
        )
      )
      .limit(1);

    revalidatePath('/shops/[slug]/admin/plugins/product-stories', 'page');

    return {
      success: true,
      story: {
        id: newStory.id,
        productId: newStory.productId,
        position: newStory.position,
        isActive: newStory.isActive,
        viewsCount: newStory.viewsCount,
        likesCount: newStory.likesCount,
        commentsCount: newStory.commentsCount,
        productTitle: product.title,
        productHandle: product.handle,
        productPrice: Number(product.price),
        productImage: image?.url || null,
      },
    };
  } catch (error) {
    console.error('Error adding product to stories:', error);
    return { success: false, error: 'שגיאה בהוספת המוצר' };
  }
}

/**
 * Remove story
 */
export async function removeStory(
  storyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(productStories).where(eq(productStories.id, storyId));

    revalidatePath('/shops/[slug]/admin/plugins/product-stories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error removing story:', error);
    return { success: false, error: 'שגיאה בהסרת הסטורי' };
  }
}

/**
 * Reorder stories
 */
export async function reorderStories(
  storyIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update positions
    await Promise.all(
      storyIds.map((id, index) =>
        db
          .update(productStories)
          .set({ position: index, updatedAt: new Date() })
          .where(eq(productStories.id, id))
      )
    );

    revalidatePath('/shops/[slug]/admin/plugins/product-stories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error reordering stories:', error);
    return { success: false, error: 'שגיאה בסידור הסטוריז' };
  }
}

/**
 * Update story custom media
 * Allows setting a custom image or video for the story (overrides product image)
 */
export async function updateStoryMedia(
  storyId: string,
  customMediaUrl: string | null,
  customMediaType: 'image' | 'video' | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(productStories)
      .set({
        customMediaUrl,
        customMediaType,
        updatedAt: new Date(),
      })
      .where(eq(productStories.id, storyId));

    revalidatePath('/shops/[slug]/admin/plugins/product-stories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating story media:', error);
    return { success: false, error: 'שגיאה בעדכון המדיה' };
  }
}

