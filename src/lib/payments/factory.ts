/**
 * Payment Provider Factory
 * Creates and manages payment provider instances
 * 
 * NOTE: This file uses Node.js crypto and should only be imported server-side
 * For client-safe provider info, use './provider-info'
 */

import { db } from '@/lib/db';
import { paymentProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { 
  PaymentProviderType, 
  PaymentProviderConfig, 
  IPaymentProvider,
  RedirectParseResult,
} from './types';
import { PayPlusProvider } from './providers/payplus';
import { PelecardProvider } from './providers/pelecard';
import { QuickPaymentsProvider } from './providers/quick-payments';
import { PayPalProvider } from './providers/paypal';

// Re-export from provider-info for convenience
export { PROVIDER_INFO, getAvailableProviders, getProviderInfo } from './provider-info';

// Provider registry - lazy loaded to avoid crypto issues in client
const providerRegistry: Record<PaymentProviderType, new () => IPaymentProvider> = {
  payplus: PayPlusProvider,
  pelecard: PelecardProvider,
  quick_payments: QuickPaymentsProvider,
  paypal: PayPalProvider,
};

/**
 * Create a provider instance (without configuration)
 */
export function createProviderInstance(type: PaymentProviderType): IPaymentProvider {
  const ProviderClass = providerRegistry[type];
  if (!ProviderClass) {
    throw new Error(`Unknown payment provider: ${type}`);
  }
  return new ProviderClass();
}

/**
 * Get configured provider for a store
 */
export async function getConfiguredProvider(
  storeId: string,
  providerType?: PaymentProviderType
): Promise<IPaymentProvider | null> {
  // Get provider config from database
  const conditions = providerType
    ? and(eq(paymentProviders.storeId, storeId), eq(paymentProviders.provider, providerType), eq(paymentProviders.isActive, true))
    : and(eq(paymentProviders.storeId, storeId), eq(paymentProviders.isDefault, true), eq(paymentProviders.isActive, true));
  
  const [providerConfig] = await db
    .select()
    .from(paymentProviders)
    .where(conditions)
    .limit(1);
  
  if (!providerConfig) {
    return null;
  }
  
  // Create and configure provider
  const provider = createProviderInstance(providerConfig.provider);
  
  const config: PaymentProviderConfig = {
    provider: providerConfig.provider,
    credentials: providerConfig.credentials as Record<string, string>,
    settings: providerConfig.settings as Record<string, unknown>,
    isActive: providerConfig.isActive,
    testMode: providerConfig.testMode,
  };
  
  provider.configure(config);
  return provider;
}

/**
 * Get all active providers for a store
 */
export async function getActiveProviders(storeId: string): Promise<Array<{
  provider: IPaymentProvider;
  config: typeof paymentProviders.$inferSelect;
}>> {
  const configs = await db
    .select()
    .from(paymentProviders)
    .where(and(eq(paymentProviders.storeId, storeId), eq(paymentProviders.isActive, true)));
  
  return configs.map(config => {
    const provider = createProviderInstance(config.provider);
    provider.configure({
      provider: config.provider,
      credentials: config.credentials as Record<string, string>,
      settings: config.settings as Record<string, unknown>,
      isActive: config.isActive,
      testMode: config.testMode,
    });
    
    return { provider, config };
  });
}

/**
 * Get the default provider for a store
 */
export async function getDefaultProvider(storeId: string): Promise<IPaymentProvider | null> {
  return getConfiguredProvider(storeId);
}

/**
 * Detect which payment provider's redirect params are present
 * Returns the provider type based on the URL params
 */
export function detectProviderFromParams(
  params: Record<string, string | undefined>
): PaymentProviderType | null {
  // Pelecard-specific params
  if (params.PelecardTransactionId || params.PelecardStatusCode) {
    return 'pelecard';
  }
  
  // PayPlus-specific params
  if (params.page_request_uid || params.transaction_uid) {
    return 'payplus';
  }
  
  // Quick Payments (PayMe) specific params
  if (params.payme_sale_id || params.seller_payme_id) {
    return 'quick_payments';
  }
  
  // PayPal-specific params (token = order ID, PayerID = payer identifier)
  if (params.token && (params.PayerID || params.payerId)) {
    return 'paypal';
  }
  
  return null;
}

/**
 * Parse redirect params using the appropriate provider
 * Auto-detects which provider based on params, or uses explicit provider type
 */
export function parseRedirectParams(
  params: Record<string, string | undefined>,
  providerType?: PaymentProviderType
): RedirectParseResult | null {
  // Detect provider if not specified
  const detectedProvider = providerType || detectProviderFromParams(params);
  
  if (!detectedProvider) {
    console.log('[parseRedirectParams] Could not detect provider from params:', Object.keys(params));
    return null;
  }
  
  console.log(`[parseRedirectParams] Using provider: ${detectedProvider}`);
  
  // Create provider instance and parse
  const provider = createProviderInstance(detectedProvider);
  return provider.parseRedirectParams(params);
}

/**
 * Check if the redirect indicates a successful payment
 * Can be used before creating provider instance
 */
export function isSuccessfulRedirect(params: Record<string, string | undefined>): boolean {
  // Pelecard success
  if (params.PelecardStatusCode === '000') {
    return true;
  }
  
  // PayPlus success
  if (params.status_code === '000' || params.status === 'approved') {
    return true;
  }
  
  // Quick Payments (PayMe) success - after 3DS redirect
  if (params.status_code === '0' || params.sale_status === 'completed') {
    return true;
  }
  
  // PayPal success - customer approved the order (has token and PayerID)
  // Note: This only means approval, still needs capture!
  if (params.token && (params.PayerID || params.payerId)) {
    return true;
  }
  
  return false;
}

/**
 * Get Quick Payments provider instance for a store
 * Specialized function for Hosted Fields integration
 */
export async function getQuickPaymentsProvider(
  storeId: string
): Promise<QuickPaymentsProvider | null> {
  const provider = await getConfiguredProvider(storeId, 'quick_payments');
  if (provider && provider.providerType === 'quick_payments') {
    return provider as QuickPaymentsProvider;
  }
  return null;
}

