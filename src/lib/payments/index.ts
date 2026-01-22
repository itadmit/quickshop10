/**
 * Payment Module
 * Exports all payment-related functionality
 * 
 * IMPORTANT: For Server Components that don't need provider logic,
 * import from './provider-info' directly to avoid crypto dependencies
 */

// Types (safe for client and server)
export * from './types';

// Provider Info (safe for client and server - no crypto dependency)
export { PROVIDER_INFO, getAvailableProviders, getProviderInfo } from './provider-info';

// Factory & Utils (server-only - uses crypto)
export {
  createProviderInstance,
  getConfiguredProvider,
  getActiveProviders,
  getDefaultProvider,
  getQuickPaymentsProvider,
  detectProviderFromParams,
  parseRedirectParams,
  isSuccessfulRedirect,
} from './factory';

// Providers (server-only - use crypto)
export { PayPlusProvider } from './providers/payplus';
export { PelecardProvider } from './providers/pelecard';
export { QuickPaymentsProvider } from './providers/quick-payments';
export { PayPalProvider } from './providers/paypal';
export { BasePaymentProvider } from './providers/base';

// Quick Payments specific types
export type { 
  QuickPaymentsGenerateSaleRequest, 
  QuickPaymentsGenerateSaleResponse 
} from './providers/quick-payments';
