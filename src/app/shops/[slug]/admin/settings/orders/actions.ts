'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface CustomStatus {
  id: string;
  name: string;
  color: string;
}

export async function updateCustomOrderStatuses(
  storeId: string,
  storeSlug: string,
  statuses: CustomStatus[]
) {
  try {
    await db
      .update(stores)
      .set({
        customOrderStatuses: statuses,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, storeId));

    revalidatePath(`/shops/${storeSlug}/admin/settings/orders`);
    revalidatePath(`/shops/${storeSlug}/admin/orders`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update custom order statuses:', error);
    return { success: false, error: 'שגיאה בשמירת הסטטוסים' };
  }
}

