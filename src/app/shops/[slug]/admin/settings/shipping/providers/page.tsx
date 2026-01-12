import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { shippingProviders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAvailableShippingProviders } from '@/lib/shipping/provider-info';
import { ShippingProvidersManager } from './providers-manager';
import { TrackingPageLink } from './tracking-page-link';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';
import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';

// ============================================
// Shipping Providers Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface ShippingProvidersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShippingProvidersPage({ params }: ShippingProvidersPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get configured shipping providers for this store - Server side fetch
  const configuredProviders = await db
    .select()
    .from(shippingProviders)
    .where(eq(shippingProviders.storeId, store.id));

  // Get all available providers info - Static data, no DB call
  const availableProviders = getAvailableShippingProviders();

  return (
    <SettingsWrapper storeSlug={slug} activeTab="shipping">
      <div className="space-y-6">
        {/* Back to Shipping Settings */}
        <Link 
          href={`/shops/${slug}/admin/settings/shipping`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה להגדרות משלוח
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">ספקי משלוחים</h1>
            <p className="text-sm text-gray-500">
              חבר חברות משלוחים ליצירת משלוחים ומעקב אוטומטי
            </p>
          </div>
        </div>

        {/* Tracking Page Link - Client Component for copy functionality */}
        <TrackingPageLink storeSlug={slug} />

        {/* Provider Manager - Client Component for interactivity */}
        <ShippingProvidersManager 
          storeId={store.id}
          storeSlug={slug}
          configuredProviders={configuredProviders}
          availableProviders={availableProviders}
        />
      </div>
    </SettingsWrapper>
  );
}

