'use server';

import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// Cloudinary API credentials
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// Extract public_id from Cloudinary URL
function extractPublicId(url: string | null): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  const match = url.match(/\/upload\/(?:v\d+\/)?(?:[^/]+\/)*(.+?)(?:\.[a-z]+)?$/i);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

// Delete image from Cloudinary
async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials not configured');
    return false;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();
    return result.result === 'ok' || result.result === 'not found';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  hideOutOfStock?: boolean;
  moveOutOfStockToBottom?: boolean;
}

export async function createCategory(storeId: string, data: CategoryData) {
  try {
    // Check if slug already exists
    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.storeId, storeId), eq(categories.slug, data.slug)))
      .limit(1);

    if (existing.length > 0) {
      return { error: 'קטגוריה עם סלאג זה כבר קיימת' };
    }

    await db.insert(categories).values({
      storeId,
      name: data.name,
      slug: data.slug || data.name.trim().replace(/[\s]+/g, '-').replace(/[.,;:!?()[\]{}'"`~@#$%^&*+=|\\<>\/]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''),
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      parentId: data.parentId || null,
    });

    revalidatePath('/shops/[slug]/admin/categories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error creating category:', error);
    return { error: 'אירעה שגיאה ביצירת הקטגוריה' };
  }
}

export async function updateCategory(categoryId: string, data: CategoryData) {
  try {
    await db
      .update(categories)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        parentId: data.parentId || null,
        hideOutOfStock: data.hideOutOfStock ?? false,
        moveOutOfStockToBottom: data.moveOutOfStockToBottom ?? true,
      })
      .where(eq(categories.id, categoryId));

    revalidatePath('/shops/[slug]/admin/categories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { error: 'אירעה שגיאה בעדכון הקטגוריה' };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    // Get category to find image URL
    const [category] = await db
      .select({ imageUrl: categories.imageUrl })
      .from(categories)
      .where(eq(categories.id, categoryId));

    // Delete image from Cloudinary if exists
    if (category?.imageUrl) {
      const publicId = extractPublicId(category.imageUrl);
      if (publicId) {
        console.log(`[Category Delete] Deleting image from Cloudinary: ${publicId}`);
        await deleteFromCloudinary(publicId);
      }
    }

    // Delete category from database
    await db
      .delete(categories)
      .where(eq(categories.id, categoryId));

    revalidatePath('/shops/[slug]/admin/categories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: 'אירעה שגיאה במחיקת הקטגוריה' };
  }
}

// Bulk delete categories with Cloudinary cleanup
export async function bulkDeleteCategories(categoryIds: string[], storeId: string) {
  try {
    // Get all categories to find image URLs
    const categoriesToDelete = await db
      .select({ id: categories.id, imageUrl: categories.imageUrl })
      .from(categories)
      .where(and(
        eq(categories.storeId, storeId),
        inArray(categories.id, categoryIds)
      ));

    // Collect public IDs to delete from Cloudinary
    const publicIdsToDelete: string[] = [];
    for (const cat of categoriesToDelete) {
      if (cat.imageUrl) {
        const publicId = extractPublicId(cat.imageUrl);
        if (publicId) publicIdsToDelete.push(publicId);
      }
    }

    // Delete images from Cloudinary
    if (publicIdsToDelete.length > 0) {
      console.log(`[Bulk Category Delete] Deleting ${publicIdsToDelete.length} images from Cloudinary...`);
      const deleteResults = await Promise.all(publicIdsToDelete.map(deleteFromCloudinary));
      const deletedCount = deleteResults.filter(r => r).length;
      console.log(`[Bulk Category Delete] Cloudinary deletion: ${deletedCount}/${publicIdsToDelete.length} successful`);
    }

    // Delete categories from database
    await db
      .delete(categories)
      .where(and(
        eq(categories.storeId, storeId),
        inArray(categories.id, categoryIds)
      ));

    revalidatePath('/shops/[slug]/admin/categories', 'page');
    return { success: true, deletedCount: categoryIds.length };
  } catch (error) {
    console.error('Error bulk deleting categories:', error);
    return { error: 'אירעה שגיאה במחיקת הקטגוריות' };
  }
}

// Bulk activate categories
export async function bulkActivateCategories(categoryIds: string[], storeId: string) {
  try {
    await db
      .update(categories)
      .set({ isActive: true })
      .where(and(
        eq(categories.storeId, storeId),
        inArray(categories.id, categoryIds)
      ));

    revalidatePath('/shops/[slug]/admin/categories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error activating categories:', error);
    return { error: 'אירעה שגיאה בהפעלת הקטגוריות' };
  }
}

// Bulk deactivate categories
export async function bulkDeactivateCategories(categoryIds: string[], storeId: string) {
  try {
    await db
      .update(categories)
      .set({ isActive: false })
      .where(and(
        eq(categories.storeId, storeId),
        inArray(categories.id, categoryIds)
      ));

    revalidatePath('/shops/[slug]/admin/categories', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deactivating categories:', error);
    return { error: 'אירעה שגיאה בהסתרת הקטגוריות' };
  }
}

