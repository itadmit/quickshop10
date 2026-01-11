'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createAllStoreDefaults } from '@/lib/store-defaults';

interface CreateStoreInput {
  userId: string;
  userEmail: string;
  storeName: string;
}

export async function createStoreForUser({ userId, userEmail, storeName }: CreateStoreInput) {
  try {
    // Validate store name
    const storeNameRegex = /^[a-zA-Z0-9\s_-]+$/;
    if (!storeNameRegex.test(storeName)) {
      return { success: false, error: 'שם החנות יכול להכיל רק אותיות אנגליות, מספרים, רווחים, מקפים ותווים תחתונים' };
    }

    // Generate store slug
    const baseSlug = storeName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists and add suffix if needed
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const [existingStore] = await db
        .select()
        .from(stores)
        .where(eq(stores.slug, slug))
        .limit(1);
      
      if (!existingStore) break;
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    // Create store
    const [newStore] = await db.insert(stores).values({
      ownerId: userId,
      name: storeName,
      slug,
      currency: 'ILS',
      isPublished: false,
      settings: {
        contact_email: userEmail,
      },
      themeSettings: {
        primary_color: '#1a1a1a',
        secondary_color: '#666666',
      },
      seoSettings: {
        meta_title: storeName,
      },
    }).returning();

    // Create all default content (pages, sections, categories, products, menus)
    await createAllStoreDefaults(newStore.id, storeName, userId);

    revalidatePath('/dashboard');

    return { success: true, storeSlug: slug };
  } catch (error) {
    console.error('Error creating store:', error);
    return { success: false, error: 'שגיאה ביצירת החנות. נסה שוב.' };
  }
}
