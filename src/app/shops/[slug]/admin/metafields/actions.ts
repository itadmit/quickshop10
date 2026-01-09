'use server';

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Metafield definition stored in store.settings.metafields
export interface MetafieldDefinition {
  id: string;
  name: string;
  key: string; // Internal key for storing values
  type: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'boolean';
  placeholder?: string;
  isRequired: boolean;
  isActive: boolean;
  // Display options
  showOnProduct: boolean;   // הצג בעמוד מוצר (לתצוגה בלבד)
  showInCheckout: boolean;  // הצג בצ'קאאוט (נשמר בהזמנה)
  sortOrder: number;
  createdAt: string;
}

export interface MetafieldFormData {
  name: string;
  key: string;
  type: MetafieldDefinition['type'];
  placeholder?: string;
  isRequired: boolean;
  isActive: boolean;
  showOnProduct: boolean;
  showInCheckout: boolean;
}

// Get metafields from store settings
export async function getStoreMetafields(storeId: string): Promise<MetafieldDefinition[]> {
  const [store] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) return [];

  const settings = store.settings as Record<string, unknown>;
  return (settings.metafields as MetafieldDefinition[]) || [];
}

// Get single metafield
export async function getMetafield(storeId: string, metafieldId: string): Promise<MetafieldDefinition | null> {
  const metafields = await getStoreMetafields(storeId);
  return metafields.find(m => m.id === metafieldId) || null;
}

// Create metafield
export async function createMetafield(storeId: string, storeSlug: string, data: MetafieldFormData) {
  const [store] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) throw new Error('Store not found');

  const settings = store.settings as Record<string, unknown>;
  const metafields = (settings.metafields as MetafieldDefinition[]) || [];

  // Check for duplicate key
  if (metafields.some(m => m.key === data.key)) {
    return { success: false, error: 'מפתח כזה כבר קיים' };
  }

  const newMetafield: MetafieldDefinition = {
    id: crypto.randomUUID(),
    name: data.name,
    key: data.key,
    type: data.type,
    placeholder: data.placeholder,
    isRequired: data.isRequired,
    isActive: data.isActive,
    showOnProduct: data.showOnProduct,
    showInCheckout: data.showInCheckout,
    sortOrder: metafields.length,
    createdAt: new Date().toISOString(),
  };

  const updatedMetafields = [...metafields, newMetafield];

  await db
    .update(stores)
    .set({
      settings: { ...settings, metafields: updatedMetafields },
      updatedAt: new Date(),
    })
    .where(eq(stores.id, storeId));

  revalidatePath(`/shops/${storeSlug}/admin/metafields`);

  return { success: true, metafield: newMetafield };
}

// Update metafield
export async function updateMetafield(storeId: string, storeSlug: string, metafieldId: string, data: MetafieldFormData) {
  const [store] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) throw new Error('Store not found');

  const settings = store.settings as Record<string, unknown>;
  const metafields = (settings.metafields as MetafieldDefinition[]) || [];

  // Check for duplicate key (excluding current)
  if (metafields.some(m => m.key === data.key && m.id !== metafieldId)) {
    return { success: false, error: 'מפתח כזה כבר קיים' };
  }

  const updatedMetafields = metafields.map(m => 
    m.id === metafieldId
      ? { ...m, ...data }
      : m
  );

  await db
    .update(stores)
    .set({
      settings: { ...settings, metafields: updatedMetafields },
      updatedAt: new Date(),
    })
    .where(eq(stores.id, storeId));

  revalidatePath(`/shops/${storeSlug}/admin/metafields`);

  return { success: true };
}

// Delete metafield
export async function deleteMetafield(storeId: string, storeSlug: string, metafieldId: string) {
  const [store] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) throw new Error('Store not found');

  const settings = store.settings as Record<string, unknown>;
  const metafields = (settings.metafields as MetafieldDefinition[]) || [];

  const updatedMetafields = metafields.filter(m => m.id !== metafieldId);

  await db
    .update(stores)
    .set({
      settings: { ...settings, metafields: updatedMetafields },
      updatedAt: new Date(),
    })
    .where(eq(stores.id, storeId));

  revalidatePath(`/shops/${storeSlug}/admin/metafields`);

  return { success: true };
}

// Toggle metafield status
export async function toggleMetafieldStatus(storeId: string, storeSlug: string, metafieldId: string, isActive: boolean) {
  const [store] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) throw new Error('Store not found');

  const settings = store.settings as Record<string, unknown>;
  const metafields = (settings.metafields as MetafieldDefinition[]) || [];

  const updatedMetafields = metafields.map(m => 
    m.id === metafieldId ? { ...m, isActive } : m
  );

  await db
    .update(stores)
    .set({
      settings: { ...settings, metafields: updatedMetafields },
      updatedAt: new Date(),
    })
    .where(eq(stores.id, storeId));

  revalidatePath(`/shops/${storeSlug}/admin/metafields`);
}

