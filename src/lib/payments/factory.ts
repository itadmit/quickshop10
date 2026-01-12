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
} from './types';
import { PayPlusProvider } from './providers/payplus';
import { PelecardProvider } from './providers/pelecard';

// Re-export from provider-info for convenience
export { PROVIDER_INFO, getAvailableProviders, getProviderInfo } from './provider-info';

// Provider registry - lazy loaded to avoid crypto issues in client
const providerRegistry: Record<PaymentProviderType, new () => IPaymentProvider> = {
  payplus: PayPlusProvider,
  pelecard: PelecardProvider,
  quick_payments: PayPlusProvider, // TODO: Implement QuickPaymentsProvider
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

