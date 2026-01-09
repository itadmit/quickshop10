import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';
import { ShippingZonesManager } from './shipping-zones-manager';
import { getShippingZones, getPickupLocations, initializeDefaultShippingZone } from './actions';

// ============================================
// Shipping Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface ShippingSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShippingSettingsPage({ params }: ShippingSettingsPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Initialize default shipping zone if none exists
  await initializeDefaultShippingZone(store.id);
  
  // Fetch shipping data
  const [zones, pickupLocationsData] = await Promise.all([
    getShippingZones(store.id),
    getPickupLocations(store.id),
  ]);

  return (
    <SettingsWrapper storeSlug={slug} activeTab="shipping">
      <ShippingZonesManager 
        storeId={store.id} 
        storeSlug={slug}
        initialZones={zones} 
        initialPickupLocations={pickupLocationsData}
      />
    </SettingsWrapper>
  );
}
