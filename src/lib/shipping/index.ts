/**
 * Shipping Module
 * Main exports for shipping providers
 */

// Types
export * from './types';

// Provider info (safe for client)
export { 
  SHIPPING_PROVIDER_INFO, 
  getAvailableShippingProviders, 
  getShippingProviderInfo 
} from './provider-info';

// Factory (server only)
export {
  createShippingProviderInstance,
  getConfiguredShippingProvider,
  getDefaultShippingProvider,
  getActiveShippingProviders,
} from './factory';

