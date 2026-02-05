import { headers, cookies } from 'next/headers';
import { CheckoutForm, CheckoutSettings, ShippingSettings } from '@/components/checkout-form';
import { db } from '@/lib/db';
import { stores, paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Suspense } from 'react';
import { getUITranslations, detectLocaleWithGeo, getDirection } from '@/lib/translations';
import type { SupportedLocale, CheckoutTranslations } from '@/lib/translations/types';
import { getStorePlugin } from '@/lib/plugins/loader';
import { redirect } from 'next/navigation';

// Force dynamic rendering - useSearchParams needs it
export const dynamic = 'force-dynamic';

// Cache for seller public keys (in-memory, resets on deploy)
const sellerPublicKeyCache = new Map<string, { key: string; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch seller's public key from PayMe API
 * The public key is needed for PayMe.create() in the frontend
 */
async function getSellerPublicKey(sellerMPL: string, testMode: boolean): Promise<string | null> {
  try {
    // Check cache first
    const cached = sellerPublicKeyCache.get(sellerMPL);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[PayMe] Using cached public key for seller: ${sellerMPL}`);
      return cached.key;
    }
    
    const clientKey = process.env.PAYME_CLIENT_KEY;
    console.log('[PayMe] ============ FETCHING PUBLIC KEY ============');
    console.log('[PayMe] Seller MPL:', sellerMPL);
    console.log('[PayMe] Test Mode:', testMode);
    console.log('[PayMe] Client Key exists:', !!clientKey);
    console.log('[PayMe] Client Key value:', clientKey?.substring(0, 10) + '...');
    
    if (!clientKey) {
      console.error('[PayMe] ❌ Missing PAYME_CLIENT_KEY environment variable');
      return null;
    }
    
    const apiUrl = testMode 
      ? 'https://sandbox.payme.io/api' 
      : 'https://live.payme.io/api';
    
    const fullUrl = `${apiUrl}/sellers/${sellerMPL}/public-keys`;
    console.log('[PayMe] Full URL:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'PayMe-Partner-Key': clientKey,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[PayMe] Response status:', response.status);
    console.log('[PayMe] Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('[PayMe] Response body:', responseText);
    
    if (!response.ok) {
      console.error(`[PayMe] ❌ Failed to fetch public key: ${response.status}`);
      console.error('[PayMe] Response:', responseText);
      return null;
    }
    
    const data = JSON.parse(responseText);
    
    // Get the first active public key
    const publicKey = data.items?.find((item: { is_active?: boolean; uuid?: string }) => item.is_active)?.uuid 
      || data.items?.[0]?.uuid;
    
    if (publicKey) {
      // Cache the result
      sellerPublicKeyCache.set(sellerMPL, { key: publicKey, timestamp: Date.now() });
      console.log(`[PayMe] ✅ Got public key for seller: ${publicKey}`);
      return publicKey;
    }
    
    console.error('[PayMe] ❌ No public key found in response items');
    console.error('[PayMe] Response data:', JSON.stringify(data, null, 2));
    return null;
  } catch (error) {
    console.error('[PayMe] ❌ Error fetching seller public key:', error);
    return null;
  }
}

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
  activePaymentProvider: 'payplus' | 'pelecard' | 'quick_payments' | null;
  quickPaymentsConfig: { publicKey: string; testMode: boolean } | null;
  checkoutSettings: CheckoutSettings;
  shippingSettings: ShippingSettings;
  // Localization
  defaultLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  hasCustomTranslations: boolean;
} | null> {
  try {
    // Get store with settings
    const [store] = await db
      .select({ 
        id: stores.id,
        settings: stores.settings,
        defaultLocale: stores.defaultLocale,
        supportedLocales: stores.supportedLocales,
        hasCustomTranslations: stores.hasCustomTranslations,
      })
      .from(stores)
      .where(eq(stores.slug, storeSlug))
      .limit(1);
    
    if (!store) return null;
    
    // Check for active payment provider (prefer quick_payments if active)
    const activeProviders = await db
      .select({ 
        id: paymentProviders.id,
        provider: paymentProviders.provider,
        credentials: paymentProviders.credentials,
        testMode: paymentProviders.testMode,
        isDefault: paymentProviders.isDefault,
      })
      .from(paymentProviders)
      .where(
        and(
          eq(paymentProviders.storeId, store.id),
          eq(paymentProviders.isActive, true)
        )
      );
    
    // Find the default provider or prefer quick_payments
    const activeProvider = activeProviders.find(p => p.isDefault) 
      || activeProviders.find(p => p.provider === 'quick_payments')
      || activeProviders[0];
    
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
    
    // Build QuickPayments config if it's the active provider
    let quickPaymentsConfig: { publicKey: string; testMode: boolean } | null = null;
    if (activeProvider?.provider === 'quick_payments') {
      const creds = activeProvider.credentials as Record<string, string> | null;
      const sellerMPL = creds?.sellerPaymeId;
      
      if (sellerMPL) {
        // Fetch the seller's public key from PayMe API
        const sellerPublicKey = await getSellerPublicKey(sellerMPL, activeProvider.testMode ?? true);
        
        if (sellerPublicKey) {
          quickPaymentsConfig = {
            publicKey: sellerPublicKey,
            testMode: activeProvider.testMode ?? true,
          };
        }
      }
    }
    
    return {
      storeId: store.id,
      hasActivePaymentProvider: !!activeProvider,
      activePaymentProvider: (activeProvider?.provider as 'payplus' | 'pelecard' | 'quick_payments') ?? null,
      quickPaymentsConfig,
      checkoutSettings,
      shippingSettings,
      // Localization
      defaultLocale: (store.defaultLocale as SupportedLocale) || 'he',
      supportedLocales: (store.supportedLocales as SupportedLocale[]) || ['he'],
      hasCustomTranslations: store.hasCustomTranslations || false,
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
  
  // 📦 Catalog Mode Check - block checkout if enabled
  if (storeData?.storeId) {
    const catalogModePlugin = await getStorePlugin(storeData.storeId, 'catalog-mode');
    if (catalogModePlugin?.isActive) {
      const config = catalogModePlugin.config as Record<string, unknown> | null;
      if (config?.enabled && config?.blockCheckout && config?.mode === 'all') {
        // Redirect to home page
        redirect(basePath || '/');
      }
    }
  }
  
  // Default settings if store not found
  const storeId = storeData?.storeId ?? '';
  const hasActivePaymentProvider = storeData?.hasActivePaymentProvider ?? false;
  const activePaymentProvider = storeData?.activePaymentProvider ?? null;
  const quickPaymentsConfig = storeData?.quickPaymentsConfig ?? null;
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
  
  // 🌍 Get translations with geo-detection (only loads from DB if needed)
  const supportedLocales = (storeData?.supportedLocales as SupportedLocale[]) || ['he'];
  const defaultLocale = (storeData?.defaultLocale as SupportedLocale) || 'he';
  const hasMultipleLocales = supportedLocales.length > 1;
  const hasCustomTranslations = storeData?.hasCustomTranslations ?? false;
  
  // ⚡ FAST: Detect locale using Vercel geo headers (zero latency)
  let locale: SupportedLocale = defaultLocale;
  if (hasMultipleLocales) {
    const headersList = await headers();
    const cookieStore = await cookies();
    
    locale = detectLocaleWithGeo({
      cookieLocale: cookieStore.get('preferred_locale')?.value,
      countryCode: headersList.get('x-vercel-ip-country'),
      acceptLanguage: headersList.get('accept-language') ?? undefined,
      supportedLocales,
      defaultLocale,
    });
  }
  
  // Get translations for checkout - will return static Hebrew if no customization needed
  let checkoutTranslations: CheckoutTranslations | undefined;
  if (hasMultipleLocales || hasCustomTranslations || locale !== 'he') {
    const uiTranslations = await getUITranslations(
      storeId, 
      locale, 
      hasMultipleLocales, 
      hasCustomTranslations
    );
    checkoutTranslations = uiTranslations.checkout;
  }
  
  // Get direction (RTL/LTR) for current locale
  const direction = getDirection(locale);

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
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
          activePaymentProvider={activePaymentProvider}
          quickPaymentsConfig={quickPaymentsConfig}
          checkoutSettings={checkoutSettings}
          shippingSettings={shippingSettings}
          translations={checkoutTranslations}
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

