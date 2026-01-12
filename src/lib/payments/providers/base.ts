/**
 * Base Payment Provider
 * Abstract class that all payment providers extend
 */

import type {
  IPaymentProvider,
  PaymentProviderType,
  PaymentProviderConfig,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  RefundRequest,
  RefundResponse,
  GetTransactionStatusRequest,
  TransactionStatusResponse,
  WebhookValidationResult,
  ParsedCallback,
  RedirectParseResult,
} from '../types';

export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract readonly providerType: PaymentProviderType;
  abstract readonly displayName: string;
  
  protected config: PaymentProviderConfig | null = null;
  protected isConfigured = false;
  
  /**
   * Configure the provider with credentials and settings
   */
  configure(config: PaymentProviderConfig): void {
    this.validateConfig(config);
    this.config = config;
    this.isConfigured = true;
  }
  
  /**
   * Ensure provider is configured before operations
   */
  protected ensureConfigured(): void {
    if (!this.isConfigured || !this.config) {
      throw new Error(`Payment provider ${this.providerType} is not configured`);
    }
  }
  
  /**
   * Get the API URL based on test mode
   */
  protected abstract getApiUrl(): string;
  
  /**
   * Validate provider-specific configuration
   */
  protected abstract validateConfig(config: PaymentProviderConfig): void;
  
  /**
   * Make authenticated API request to provider
   */
  protected abstract makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<T>;
  
  // ============ ABSTRACT METHODS ============
  
  abstract initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse>;
  abstract refund(request: RefundRequest): Promise<RefundResponse>;
  abstract getTransactionStatus(request: GetTransactionStatusRequest): Promise<TransactionStatusResponse>;
  abstract validateWebhook(body: unknown, headers: Record<string, string>): WebhookValidationResult;
  abstract parseCallback(body: unknown): ParsedCallback;
  abstract parseRedirectParams(params: Record<string, string | undefined>): RedirectParseResult;
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;
  
  // ============ UTILITY METHODS ============
  
  /**
   * Format amount for provider (some require cents, some require decimal)
   */
  protected formatAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
  
  /**
   * Log provider activity (for debugging)
   */
  protected log(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.providerType}] ${message}`, data || '');
    }
  }
  
  /**
   * Log error
   */
  protected logError(message: string, error: unknown): void {
    console.error(`[${this.providerType}] ERROR: ${message}`, error);
  }
}



