'use server';

import { db } from '@/lib/db';
import { helpGuideCategories, helpGuides } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Category Actions
export async function createCategory(data: {
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const [category] = await db
    .insert(helpGuideCategories)
    .values(data)
    .returning();
  
  revalidatePath('/admin/guides');
  revalidatePath('/help');
  return category;
}

export async function updateCategory(
  id: string,
  data: {
    slug?: string;
    title?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const [category] = await db
    .update(helpGuideCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(helpGuideCategories.id, id))
    .returning();
  
  revalidatePath('/admin/guides');
  revalidatePath('/help');
  return category;
}

export async function deleteCategory(id: string) {
  await db.delete(helpGuideCategories).where(eq(helpGuideCategories.id, id));
  revalidatePath('/admin/guides');
  revalidatePath('/help');
}

// Guide Actions
export async function createGuide(data: {
  categoryId: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const [guide] = await db
    .insert(helpGuides)
    .values(data)
    .returning();
  
  revalidatePath('/admin/guides');
  revalidatePath('/help');
  return guide;
}

export async function updateGuide(
  id: string,
  data: {
    categoryId?: string;
    slug?: string;
    title?: string;
    description?: string;
    content?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const [guide] = await db
    .update(helpGuides)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(helpGuides.id, id))
    .returning();
  
  revalidatePath('/admin/guides');
  revalidatePath('/help');
  return guide;
}

export async function deleteGuide(id: string) {
  await db.delete(helpGuides).where(eq(helpGuides.id, id));
  revalidatePath('/admin/guides');
  revalidatePath('/help');
}

export async function getCategories() {
  return db.select().from(helpGuideCategories).orderBy(helpGuideCategories.sortOrder);
}

export async function getCategory(id: string) {
  const [category] = await db
    .select()
    .from(helpGuideCategories)
    .where(eq(helpGuideCategories.id, id));
  return category;
}

export async function getGuide(id: string) {
  const [guide] = await db
    .select()
    .from(helpGuides)
    .where(eq(helpGuides.id, id));
  return guide;
}

