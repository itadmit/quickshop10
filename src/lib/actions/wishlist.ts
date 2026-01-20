'use server';

import { db } from '@/lib/db';
import { wishlists, products, productImages, productVariants } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============ TYPES ============

export interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productSlug: string;
  price: string | null;
  comparePrice: string | null;
  imageUrl: string | null;
  variantTitle: string | null;
  createdAt: Date;
}

// ============ SERVER ACTIONS ============

/**
 * Add a product to customer's wishlist
 */
export async function addToWishlist(
  storeId: string,
  customerId: string,
  productId: string,
  variantId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already in wishlist
    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(
        eq(wishlists.customerId, customerId),
        eq(wishlists.productId, productId),
        variantId ? eq(wishlists.variantId, variantId) : eq(wishlists.variantId, null as unknown as string)
      ))
      .limit(1);

    if (existing.length > 0) {
      return { success: true }; // Already in wishlist, no error
    }

    await db.insert(wishlists).values({
      storeId,
      customerId,
      productId,
      variantId: variantId || null,
    });

    revalidatePath('/wishlist');
    return { success: true };
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return { success: false, error: 'Failed to add to wishlist' };
  }
}

/**
 * Remove a product from customer's wishlist
 */
export async function removeFromWishlist(
  customerId: string,
  productId: string,
  variantId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(wishlists)
      .where(and(
        eq(wishlists.customerId, customerId),
        eq(wishlists.productId, productId),
        variantId ? eq(wishlists.variantId, variantId) : eq(wishlists.variantId, null as unknown as string)
      ));

    revalidatePath('/wishlist');
    return { success: true };
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return { success: false, error: 'Failed to remove from wishlist' };
  }
}

/**
 * Toggle product in wishlist (add if not exists, remove if exists)
 */
export async function toggleWishlist(
  storeId: string,
  customerId: string,
  productId: string,
  variantId?: string | null
): Promise<{ success: boolean; isInWishlist: boolean; error?: string }> {
  try {
    // Check if in wishlist
    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(
        eq(wishlists.customerId, customerId),
        eq(wishlists.productId, productId),
        variantId ? eq(wishlists.variantId, variantId) : eq(wishlists.variantId, null as unknown as string)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Remove
      await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
      revalidatePath('/wishlist');
      return { success: true, isInWishlist: false };
    } else {
      // Add
      await db.insert(wishlists).values({
        storeId,
        customerId,
        productId,
        variantId: variantId || null,
      });
      revalidatePath('/wishlist');
      return { success: true, isInWishlist: true };
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    return { success: false, isInWishlist: false, error: 'Failed to toggle wishlist' };
  }
}

/**
 * Get customer's wishlist items with product details
 */
export async function getWishlistItems(customerId: string): Promise<WishlistItem[]> {
  try {
    const items = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        variantId: wishlists.variantId,
        productName: products.name,
        productSlug: products.slug,
        price: products.price,
        comparePrice: products.comparePrice,
        createdAt: wishlists.createdAt,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.customerId, customerId))
      .orderBy(desc(wishlists.createdAt));

    // Get images for products
    const productIds = items.map(i => i.productId);
    const images = productIds.length > 0 
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(eq(productImages.isPrimary, true))
      : [];
    
    const imageMap = new Map(images.map(img => [img.productId, img.url]));

    // Get variant details if needed
    const variantIds = items.filter(i => i.variantId).map(i => i.variantId!);
    const variants = variantIds.length > 0
      ? await db
          .select({
            id: productVariants.id,
            title: productVariants.title,
            price: productVariants.price,
            comparePrice: productVariants.comparePrice,
          })
          .from(productVariants)
      : [];
    
    const variantMap = new Map(variants.map(v => [v.id, v]));

    return items.map(item => {
      const variant = item.variantId ? variantMap.get(item.variantId) : null;
      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        productSlug: item.productSlug,
        price: variant?.price || item.price,
        comparePrice: variant?.comparePrice || item.comparePrice,
        imageUrl: imageMap.get(item.productId) || null,
        variantTitle: variant?.title || null,
        createdAt: item.createdAt,
      };
    });
  } catch (error) {
    console.error('Error getting wishlist items:', error);
    return [];
  }
}

/**
 * Get wishlist product IDs for a customer (for quick check)
 */
export async function getWishlistProductIds(customerId: string): Promise<string[]> {
  try {
    const items = await db
      .select({ productId: wishlists.productId })
      .from(wishlists)
      .where(eq(wishlists.customerId, customerId));
    
    return items.map(i => i.productId);
  } catch (error) {
    console.error('Error getting wishlist product IDs:', error);
    return [];
  }
}

/**
 * Get wishlist count for a customer
 */
export async function getWishlistCount(customerId: string): Promise<number> {
  try {
    const result = await db
      .select({ productId: wishlists.productId })
      .from(wishlists)
      .where(eq(wishlists.customerId, customerId));
    
    return result.length;
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    return 0;
  }
}

/**
 * Check if a product is in customer's wishlist
 */
export async function isInWishlist(
  customerId: string,
  productId: string,
  variantId?: string | null
): Promise<boolean> {
  try {
    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(
        eq(wishlists.customerId, customerId),
        eq(wishlists.productId, productId),
        variantId ? eq(wishlists.variantId, variantId) : eq(wishlists.variantId, null as unknown as string)
      ))
      .limit(1);

    return existing.length > 0;
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return false;
  }
}

/**
 * Merge guest wishlist (from localStorage) into customer's wishlist after login
 */
export async function mergeGuestWishlist(
  storeId: string,
  customerId: string,
  guestItems: Array<{ productId: string; variantId?: string | null }>
): Promise<{ success: boolean; merged: number }> {
  try {
    let merged = 0;

    for (const item of guestItems) {
      // Check if already exists
      const existing = await db
        .select({ id: wishlists.id })
        .from(wishlists)
        .where(and(
          eq(wishlists.customerId, customerId),
          eq(wishlists.productId, item.productId),
          item.variantId 
            ? eq(wishlists.variantId, item.variantId) 
            : eq(wishlists.variantId, null as unknown as string)
        ))
        .limit(1);

      if (existing.length === 0) {
        // Add to wishlist
        await db.insert(wishlists).values({
          storeId,
          customerId,
          productId: item.productId,
          variantId: item.variantId || null,
        });
        merged++;
      }
    }

    if (merged > 0) {
      revalidatePath('/wishlist');
    }

    return { success: true, merged };
  } catch (error) {
    console.error('Error merging guest wishlist:', error);
    return { success: false, merged: 0 };
  }
}

/**
 * Clear customer's wishlist
 */
export async function clearWishlist(customerId: string): Promise<{ success: boolean }> {
  try {
    await db
      .delete(wishlists)
      .where(eq(wishlists.customerId, customerId));

    revalidatePath('/wishlist');
    return { success: true };
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    return { success: false };
  }
}

