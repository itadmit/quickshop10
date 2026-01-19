import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stores, shippingZones, shippingMethods, pickupLocations } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// ============================================
// Shipping Options API
// Returns available shipping methods based on:
// - Customer's country
// - Cart total
// - Cart weight (if applicable)
// ============================================

interface ShippingMethodConditions {
  minOrderAmount?: number;
  maxOrderAmount?: number;
  minWeight?: number;
  maxWeight?: number;
  weightRate?: number;
  baseWeight?: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await req.json();
    const { country = 'IL', cartTotal = 0, cartWeight = 0 } = body;

    // Get store
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get all active shipping zones with methods
    const zones = await db.query.shippingZones.findMany({
      where: and(
        eq(shippingZones.storeId, store.id),
        eq(shippingZones.isActive, true)
      ),
      with: {
        methods: {
          where: eq(shippingMethods.isActive, true),
          orderBy: [asc(shippingMethods.sortOrder)],
        },
      },
      orderBy: [asc(shippingZones.sortOrder)],
    });

    // Find matching zone for the country
    let matchingZone = zones.find(zone => {
      const countries = zone.countries as string[];
      return countries.includes(country);
    });

    // If no specific zone, try to find a "world" zone
    if (!matchingZone) {
      matchingZone = zones.find(zone => {
        const countries = zone.countries as string[];
        return countries.includes('*');
      });
    }

    // If still no zone, fall back to default zone
    if (!matchingZone) {
      matchingZone = zones.find(zone => zone.isDefault);
    }

    // If no zone at all, return legacy shipping from store settings
    if (!matchingZone) {
      const settings = (store.settings as Record<string, unknown>) || {};
      const shippingSettings = (settings.shipping as Record<string, unknown>) || {};
      const rates = (shippingSettings.rates as Array<{
        id: string;
        name: string;
        price: number;
        estimatedDays: string;
      }>) || [];
      const enableFreeShipping = (shippingSettings.enableFreeShipping as boolean) ?? true;
      const freeShippingThreshold = (shippingSettings.freeShippingThreshold as number) || 200;

      // Convert legacy rates to new format
      const legacyMethods = rates.map(rate => ({
        id: rate.id,
        name: rate.name,
        type: 'flat_rate' as const,
        price: enableFreeShipping && cartTotal >= freeShippingThreshold ? 0 : rate.price,
        estimatedDays: rate.estimatedDays,
        isFree: enableFreeShipping && cartTotal >= freeShippingThreshold,
        freeThreshold: enableFreeShipping ? freeShippingThreshold : null,
      }));

      return NextResponse.json({
        methods: legacyMethods.length > 0 ? legacyMethods : [{
          id: 'default',
          name: 'משלוח',
          type: 'flat_rate',
          price: 29,
          estimatedDays: '3-5 ימי עסקים',
          isFree: false,
          freeThreshold: null,
        }],
        pickupLocations: [],
        zone: null,
        legacy: true,
      });
    }

    // Filter methods based on conditions
    const availableMethods = matchingZone.methods
      .filter(method => {
        const conditions = method.conditions as ShippingMethodConditions || {};
        
        // Check min order amount
        if (conditions.minOrderAmount !== undefined && cartTotal < conditions.minOrderAmount) {
          return false;
        }
        
        // Check max order amount
        if (conditions.maxOrderAmount !== undefined && cartTotal > conditions.maxOrderAmount) {
          return false;
        }
        
        // Check weight conditions
        if (conditions.minWeight !== undefined && cartWeight < conditions.minWeight) {
          return false;
        }
        if (conditions.maxWeight !== undefined && cartWeight > conditions.maxWeight) {
          return false;
        }
        
        return true;
      })
      .map(method => {
        const conditions = method.conditions as ShippingMethodConditions || {};
        let calculatedPrice = parseFloat(method.price);
        
        // Calculate weight-based pricing
        if (method.type === 'weight_based' && conditions.weightRate && cartWeight > 0) {
          const baseWeight = conditions.baseWeight || 0;
          const extraWeight = Math.max(0, cartWeight - baseWeight);
          calculatedPrice = calculatedPrice + (extraWeight * conditions.weightRate);
        }
        
        // Free shipping
        if (method.type === 'free') {
          calculatedPrice = 0;
        }
        
        // Local pickup is always free
        if (method.type === 'local_pickup') {
          calculatedPrice = 0;
        }
        
        return {
          id: method.id,
          name: method.name,
          description: method.description,
          type: method.type,
          price: Math.round(calculatedPrice * 100) / 100,
          estimatedDays: method.estimatedDays,
          isFree: calculatedPrice === 0,
          freeThreshold: method.type === 'free' ? conditions.minOrderAmount : null,
          isPickup: method.type === 'local_pickup',
        };
      });

    // Get pickup locations if there's a local_pickup method
    const hasPickupMethod = availableMethods.some(m => m.type === 'local_pickup');
    let storePickupLocations: Array<{
      id: string;
      name: string;
      address: string;
      city: string;
      phone: string | null;
      hours: string | null;
      instructions: string | null;
    }> = [];
    
    if (hasPickupMethod) {
      const locations = await db.query.pickupLocations.findMany({
        where: and(
          eq(pickupLocations.storeId, store.id),
          eq(pickupLocations.isActive, true)
        ),
        orderBy: [asc(pickupLocations.sortOrder)],
      });
      
      storePickupLocations = locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        phone: loc.phone,
        hours: loc.hours,
        instructions: loc.instructions,
      }));
    }

    return NextResponse.json({
      methods: availableMethods,
      pickupLocations: storePickupLocations,
      zone: {
        id: matchingZone.id,
        name: matchingZone.name,
      },
      legacy: false,
    });
  } catch (error) {
    console.error('Error fetching shipping options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping options' },
      { status: 500 }
    );
  }
}



