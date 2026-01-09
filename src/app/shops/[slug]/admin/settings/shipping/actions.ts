'use server';

import { db } from '@/lib/db';
import { shippingZones, shippingMethods, pickupLocations } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================
// Shipping Zone Actions
// ============================================

export async function getShippingZones(storeId: string) {
  return await db.query.shippingZones.findMany({
    where: eq(shippingZones.storeId, storeId),
    with: {
      methods: {
        orderBy: [asc(shippingMethods.sortOrder)],
      },
    },
    orderBy: [asc(shippingZones.sortOrder)],
  });
}

export async function createShippingZone(storeId: string, data: {
  name: string;
  countries: string[];
  isDefault?: boolean;
}) {
  const [zone] = await db.insert(shippingZones).values({
    storeId,
    name: data.name,
    countries: data.countries,
    isDefault: data.isDefault ?? false,
  }).returning();
  
  revalidatePath(`/shops/*/admin/settings/shipping`);
  return zone;
}

export async function updateShippingZone(zoneId: string, data: {
  name?: string;
  countries?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}) {
  await db.update(shippingZones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(shippingZones.id, zoneId));
  
  revalidatePath(`/shops/*/admin/settings/shipping`);
}

export async function deleteShippingZone(zoneId: string) {
  await db.delete(shippingZones).where(eq(shippingZones.id, zoneId));
  revalidatePath(`/shops/*/admin/settings/shipping`);
}

// ============================================
// Shipping Method Actions
// ============================================

interface ShippingMethodConditions {
  minOrderAmount?: number;
  maxOrderAmount?: number;
  minWeight?: number;
  maxWeight?: number;
  weightRate?: number;
  baseWeight?: number;
}

export async function createShippingMethod(zoneId: string, data: {
  name: string;
  type: 'flat_rate' | 'free' | 'weight_based' | 'price_based' | 'local_pickup';
  price: number;
  conditions?: ShippingMethodConditions;
  estimatedDays?: string;
  description?: string;
}) {
  const [method] = await db.insert(shippingMethods).values({
    zoneId,
    name: data.name,
    type: data.type,
    price: String(data.price),
    conditions: data.conditions || {},
    estimatedDays: data.estimatedDays,
    description: data.description,
  }).returning();
  
  revalidatePath(`/shops/*/admin/settings/shipping`);
  return method;
}

export async function updateShippingMethod(methodId: string, data: {
  name?: string;
  type?: 'flat_rate' | 'free' | 'weight_based' | 'price_based' | 'local_pickup';
  price?: number;
  conditions?: ShippingMethodConditions;
  estimatedDays?: string;
  description?: string;
  isActive?: boolean;
}) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.price !== undefined) updateData.price = String(data.price);
  if (data.conditions !== undefined) updateData.conditions = data.conditions;
  if (data.estimatedDays !== undefined) updateData.estimatedDays = data.estimatedDays;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  await db.update(shippingMethods)
    .set(updateData)
    .where(eq(shippingMethods.id, methodId));
  
  revalidatePath(`/shops/*/admin/settings/shipping`);
}

export async function deleteShippingMethod(methodId: string) {
  await db.delete(shippingMethods).where(eq(shippingMethods.id, methodId));
  revalidatePath(`/shops/*/admin/settings/shipping`);
}

// ============================================
// Pickup Location Actions
// ============================================

export async function getPickupLocations(storeId: string) {
  return await db.query.pickupLocations.findMany({
    where: eq(pickupLocations.storeId, storeId),
    orderBy: [asc(pickupLocations.sortOrder)],
  });
}

export async function createPickupLocation(storeId: string, data: {
  name: string;
  address: string;
  city: string;
  phone?: string;
  hours?: string;
  instructions?: string;
}) {
  const [location] = await db.insert(pickupLocations).values({
    storeId,
    ...data,
  }).returning();
  
  revalidatePath(`/shops/*/admin/settings/shipping`);
  return location;
}

export async function updatePickupLocation(locationId: string, data: {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  hours?: string;
  instructions?: string;
  isActive?: boolean;
}) {
  await db.update(pickupLocations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pickupLocations.id, locationId));
  
  revalidatePath(`/shops/*/admin/settings/shipping`);
}

export async function deletePickupLocation(locationId: string) {
  await db.delete(pickupLocations).where(eq(pickupLocations.id, locationId));
  revalidatePath(`/shops/*/admin/settings/shipping`);
}

// ============================================
// Legacy Settings Update (for compatibility)
// ============================================

export async function updateShippingSettings(
  storeId: string,
  settings: Record<string, unknown>
) {
  // Import stores only when needed
  const { stores } = await import('@/lib/db/schema');
  
  // Get current store settings
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, storeId),
  });
  
  if (!store) {
    return { success: false, error: 'Store not found' };
  }
  
  const currentSettings = (store.settings as Record<string, unknown>) || {};
  
  // Update with new shipping settings
  await db.update(stores)
    .set({
      settings: {
        ...currentSettings,
        shipping: settings,
      },
    })
    .where(eq(stores.id, storeId));
  
  revalidatePath(`/shops/*/admin/settings/shipping`);
  
  return { success: true };
}

// ============================================
// Initialize Default Shipping Zone
// ============================================

export async function initializeDefaultShippingZone(storeId: string) {
  // Check if store already has zones
  const existingZones = await db.query.shippingZones.findFirst({
    where: eq(shippingZones.storeId, storeId),
  });
  
  if (existingZones) {
    return existingZones;
  }
  
  // Create default zone for Israel
  const [zone] = await db.insert(shippingZones).values({
    storeId,
    name: 'ישראל',
    countries: ['IL'],
    isDefault: true,
  }).returning();
  
  // Create default shipping methods
  await db.insert(shippingMethods).values([
    {
      zoneId: zone.id,
      name: 'משלוח רגיל',
      type: 'flat_rate',
      price: '35',
      estimatedDays: '3-5 ימי עסקים',
      sortOrder: 0,
    },
    {
      zoneId: zone.id,
      name: 'משלוח חינם',
      type: 'free',
      price: '0',
      conditions: { minOrderAmount: 299 },
      estimatedDays: '3-5 ימי עסקים',
      sortOrder: 1,
    },
  ]);
  
  revalidatePath(`/shops/*/admin/settings/shipping`);
  return zone;
}
