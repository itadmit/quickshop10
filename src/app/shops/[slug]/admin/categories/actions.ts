'use server';

import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
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

