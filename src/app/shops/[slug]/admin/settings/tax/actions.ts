'use server';

import { db } from '@/lib/db';
import { taxRates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createTaxRate(
  storeId: string,
  slug: string,
  data: {
    name: string;
    rate: string;
    country: string | null;
    region: string | null;
    includeInPrice: boolean;
    applyToShipping: boolean;
    isDefault: boolean;
  }
) {
  try {
    // If this is set as default, remove default from other rates
    if (data.isDefault) {
      await db
        .update(taxRates)
        .set({ isDefault: false })
        .where(and(
          eq(taxRates.storeId, storeId),
          eq(taxRates.isDefault, true)
        ));
    }

    await db.insert(taxRates).values({
      storeId,
      name: data.name,
      rate: data.rate,
      country: data.country,
      region: data.region,
      includeInPrice: data.includeInPrice,
      applyToShipping: data.applyToShipping,
      isDefault: data.isDefault,
    });

    revalidatePath(`/shops/${slug}/admin/settings/tax`);
    return { success: true };
  } catch (error) {
    console.error('Error creating tax rate:', error);
    return { success: false, error: 'שגיאה ביצירת שיעור מס' };
  }
}

export async function toggleTaxRate(rateId: string, slug: string, isActive: boolean) {
  try {
    await db
      .update(taxRates)
      .set({ isActive })
      .where(eq(taxRates.id, rateId));

    revalidatePath(`/shops/${slug}/admin/settings/tax`);
    return { success: true };
  } catch (error) {
    console.error('Error toggling tax rate:', error);
    return { success: false, error: 'שגיאה בעדכון שיעור מס' };
  }
}

export async function deleteTaxRate(rateId: string, slug: string) {
  try {
    await db.delete(taxRates).where(eq(taxRates.id, rateId));
    revalidatePath(`/shops/${slug}/admin/settings/tax`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting tax rate:', error);
    return { success: false, error: 'שגיאה במחיקת שיעור מס' };
  }
}

export async function setDefaultTaxRate(rateId: string, storeId: string, slug: string) {
  try {
    // Remove default from all rates
    await db
      .update(taxRates)
      .set({ isDefault: false })
      .where(eq(taxRates.storeId, storeId));

    // Set this rate as default
    await db
      .update(taxRates)
      .set({ isDefault: true })
      .where(eq(taxRates.id, rateId));

    revalidatePath(`/shops/${slug}/admin/settings/tax`);
    return { success: true };
  } catch (error) {
    console.error('Error setting default tax rate:', error);
    return { success: false, error: 'שגיאה בהגדרת ברירת מחדל' };
  }
}


