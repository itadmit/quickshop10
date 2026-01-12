import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';
import { ShippingZonesManager } from './shipping-zones-manager';
import { getShippingZones, getPickupLocations, initializeDefaultShippingZone } from './actions';
import { db } from '@/lib/db';
import { shippingProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { Truck, ChevronLeft } from 'lucide-react';

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
  
  // Fetch shipping data and providers count in parallel
  const [zones, pickupLocationsData, activeProvidersCount] = await Promise.all([
    getShippingZones(store.id),
    getPickupLocations(store.id),
    db
      .select()
      .from(shippingProviders)
      .where(and(eq(shippingProviders.storeId, store.id), eq(shippingProviders.isActive, true)))
      .then(rows => rows.length),
  ]);

  return (
    <SettingsWrapper storeSlug={slug} activeTab="shipping">
      {/* Shipping Providers Link Card */}
      <Link 
        href={`/shops/${slug}/admin/settings/shipping/providers`}
        className="block mb-6 p-4 bg-gradient-to-l from-blue-50 to-white border border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">ספקי משלוחים</h3>
              <p className="text-sm text-gray-500">
                {activeProvidersCount > 0 
                  ? `${activeProvidersCount} ספקים מחוברים`
                  : 'חבר חברות משלוחים ליצירת משלוחים אוטומטית'
                }
              </p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </Link>

      <ShippingZonesManager 
        storeId={store.id} 
        storeSlug={slug}
        initialZones={zones} 
        initialPickupLocations={pickupLocationsData}
      />
    </SettingsWrapper>
  );
}
