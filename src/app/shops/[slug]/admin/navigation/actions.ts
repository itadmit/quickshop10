'use server';

import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface MenuItemData {
  title: string;
  linkType: 'url' | 'page' | 'category' | 'product';
  linkUrl: string | null;
  linkResourceId: string | null;
  sortOrder: number;
  parentId?: string | null;
  imageUrl?: string | null;
}

export async function addMenuItem(
  menuId: string,
  slug: string,
  data: MenuItemData
) {
  try {
    await db.insert(menuItems).values({
      menuId,
      title: data.title,
      linkType: data.linkType,
      linkUrl: data.linkUrl,
      linkResourceId: data.linkResourceId,
      sortOrder: data.sortOrder,
      parentId: data.parentId || null,
      imageUrl: data.imageUrl || null,
      isActive: true,
    });

    revalidatePath(`/shops/${slug}/admin/navigation`);
    // Also revalidate the store pages for mega menu
    revalidatePath(`/shops/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Error adding menu item:', error);
    return { success: false, error: 'שגיאה בהוספת פריט' };
  }
}

export async function updateMenuItem(
  itemId: string,
  slug: string,
  data: Partial<MenuItemData>
) {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.linkType !== undefined) updateData.linkType = data.linkType;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.linkResourceId !== undefined) updateData.linkResourceId = data.linkResourceId;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    await db.update(menuItems).set(updateData).where(eq(menuItems.id, itemId));

    revalidatePath(`/shops/${slug}/admin/navigation`);
    revalidatePath(`/shops/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating menu item:', error);
    return { success: false, error: 'שגיאה בעדכון פריט' };
  }
}

export async function deleteMenuItem(itemId: string, slug: string) {
  try {
    await db.delete(menuItems).where(eq(menuItems.id, itemId));
    revalidatePath(`/shops/${slug}/admin/navigation`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return { success: false, error: 'שגיאה במחיקת פריט' };
  }
}

export async function reorderMenuItems(
  menuId: string,
  slug: string,
  items: Array<{ id: string; sortOrder: number }>
) {
  try {
    await Promise.all(
      items.map((item) =>
        db.update(menuItems)
          .set({ sortOrder: item.sortOrder })
          .where(eq(menuItems.id, item.id))
      )
    );

    revalidatePath(`/shops/${slug}/admin/navigation`);
    return { success: true };
  } catch (error) {
    console.error('Error reordering menu items:', error);
    return { success: false, error: 'שגיאה בשינוי סדר' };
  }
}


