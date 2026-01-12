/**
 * Shipping Provider Factory
 * Creates and manages shipping provider instances
 * 
 * NOTE: This file uses server-side dependencies
 */

import { db } from '@/lib/db';
import { shippingProviders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { 
  ShippingProviderType, 
  ShippingProviderConfig, 
  IShippingProvider,
} from './types';
// Import providers here as we add them
// import { CheetahProvider } from './providers/cheetah';
// import { HfdProvider } from './providers/hfd';
import { ManualShippingProvider } from './providers/manual';

// Re-export from provider-info for convenience
export { SHIPPING_PROVIDER_INFO, getAvailableShippingProviders, getShippingProviderInfo } from './provider-info';

// Provider registry
const providerRegistry: Partial<Record<ShippingProviderType, new () => IShippingProvider>> = {
  manual: ManualShippingProvider,
  // cheetah: CheetahProvider,
  // hfd: HfdProvider,
  // boxit: BoxitProvider,
  // baldar: BaldarProvider,
};

/**
 * Create a provider instance (without configuration)
 */
export function createShippingProviderInstance(type: ShippingProviderType): IShippingProvider | null {
  const ProviderClass = providerRegistry[type];
  if (!ProviderClass) {
    console.warn(`Shipping provider ${type} is not implemented yet`);
    return null;
  }
  return new ProviderClass();
}

/**
 * Get configured shipping provider for a store
 */
export async function getConfiguredShippingProvider(
  storeId: string,
  providerType?: ShippingProviderType
): Promise<IShippingProvider | null> {
  
  const conditions = providerType
    ? and(eq(shippingProviders.storeId, storeId), eq(shippingProviders.provider, providerType), eq(shippingProviders.isActive, true))
    : and(eq(shippingProviders.storeId, storeId), eq(shippingProviders.isDefault, true), eq(shippingProviders.isActive, true));
  
  const [providerConfig] = await db
    .select()
    .from(shippingProviders)
    .where(conditions)
    .limit(1);
  
  if (!providerConfig) {
    return null;
  }
  
  // Create and configure provider
  const provider = createShippingProviderInstance(providerConfig.provider);
  if (!provider) {
    return null;
  }
  
  const config: ShippingProviderConfig = {
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
 * Get default shipping provider for a store
 */
export async function getDefaultShippingProvider(storeId: string): Promise<IShippingProvider | null> {
  return getConfiguredShippingProvider(storeId);
}

/**
 * Get all active shipping providers for a store
 */
export async function getActiveShippingProviders(storeId: string): Promise<Array<{
  provider: IShippingProvider;
  config: typeof shippingProviders.$inferSelect;
}>> {
  
  const configs = await db
    .select()
    .from(shippingProviders)
    .where(and(eq(shippingProviders.storeId, storeId), eq(shippingProviders.isActive, true)));
  
  const result: Array<{
    provider: IShippingProvider;
    config: typeof shippingProviders.$inferSelect;
  }> = [];
  
  for (const config of configs) {
    const provider = createShippingProviderInstance(config.provider);
    if (provider) {
      provider.configure({
        provider: config.provider,
        credentials: config.credentials as Record<string, string>,
        settings: config.settings as Record<string, unknown>,
        isActive: config.isActive,
        testMode: config.testMode,
      });
      result.push({ provider, config });
    }
  }
  
  return result;
}

