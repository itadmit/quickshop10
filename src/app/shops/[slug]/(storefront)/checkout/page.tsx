import { headers } from 'next/headers';
import { CheckoutForm, CheckoutSettings, ShippingSettings } from '@/components/checkout-form';
import { db } from '@/lib/db';
import { stores, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Suspense } from 'react';

// Force dynamic rendering - useSearchParams needs it
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'צ\'ק אאוט',
  description: 'השלמת הרכישה',
};

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

async function getStoreDataForCheckout(storeSlug: string): Promise<{
  storeId: string;
  hasActivePaymentProvider: boolean;
  checkoutSettings: CheckoutSettings;
  shippingSettings: ShippingSettings;
} | null> {
  try {
    // Get store with settings
    const [store] = await db
      .select({ 
        id: stores.id,
        settings: stores.settings,
      })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);
    
    if (!store) return null;
    
    // Check for active payment provider
    const [activeProvider] = await db
      .select({ id: paymentProviders.id })
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.isActive, true)
        )
      )
      .limit(1);
    
    // Parse settings
    const settings = (store.settings as Record<string, unknown>) || {};
    const checkout = (settings.checkout as Record<string, unknown>) || {};
    const shipping = (settings.shipping as Record<string, unknown>) || {};
    
    const checkoutSettings: CheckoutSettings = {
      layout: (checkout.layout as 'steps' | 'single-page') || 'steps',
      requirePhone: (checkout.requirePhone as boolean) ?? true,
      requireCompany: (checkout.requireCompany as boolean) ?? false,
      showZipCode: (checkout.showZipCode as boolean) ?? false,
      allowNotes: (checkout.allowNotes as boolean) ?? true,
      termsRequired: (checkout.termsRequired as boolean) ?? false,
      successMessage: (checkout.successMessage as string) || '',
    };
    
    const shippingSettings: ShippingSettings = {
      rates: (shipping.rates as ShippingSettings['rates']) || [
        { id: '1', name: 'משלוח רגיל', price: 29, freeAbove: 200, estimatedDays: '3-5 ימי עסקים' }
      ],
      freeShippingThreshold: (shipping.freeShippingThreshold as number) ?? 200,
      enableFreeShipping: (shipping.enableFreeShipping as boolean) ?? true,
    };
    
    return {
      storeId: store.id,
      hasActivePaymentProvider: !!activeProvider,
      checkoutSettings,
      shippingSettings,
    };
  } catch {
    return null;
  }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Get store data including checkout settings
  const storeData = await getStoreDataForCheckout(slug);
  
  // Default settings if store not found
  const storeId = storeData?.storeId ?? '';
  const hasActivePaymentProvider = storeData?.hasActivePaymentProvider ?? false;
  const checkoutSettings = storeData?.checkoutSettings ?? {
    layout: 'steps' as const,
    requirePhone: true,
    requireCompany: false,
    showZipCode: false,
    allowNotes: true,
    termsRequired: false,
    successMessage: '',
  };
  const shippingSettings = storeData?.shippingSettings ?? {
    rates: [{ id: '1', name: 'משלוח רגיל', price: 29, freeAbove: 200, estimatedDays: '3-5 ימי עסקים' }],
    freeShippingThreshold: 200,
    enableFreeShipping: true,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-3xl md:text-4xl font-light tracking-[0.1em]">
            צ׳ק אאוט
          </h1>
        </div>
      </div>

      {/* Form - Client Component for interactivity */}
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutForm 
          basePath={basePath} 
          storeSlug={slug}
          storeId={storeId}
          hasActivePaymentProvider={hasActivePaymentProvider}
          checkoutSettings={checkoutSettings}
          shippingSettings={shippingSettings}
        />
      </Suspense>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="py-32 px-6 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="w-px h-16 bg-black animate-pulse" />
        </div>
        <p className="text-[11px] tracking-[0.3em] uppercase text-black">
          טוען
        </p>
      </div>
    </div>
  );
}

