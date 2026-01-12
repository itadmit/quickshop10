/**
 * Base Shipping Provider
 * Abstract class that all shipping providers extend
 */

import type {
  IShippingProvider,
  ShippingProviderType,
  ShippingProviderConfig,
  CreateShipmentRequest,
  CreateShipmentResponse,
  GetTrackingRequest,
  TrackingInfo,
  CancelShipmentRequest,
  CancelShipmentResponse,
  LabelResponse,
  ShipmentAddress,
} from '../types';

export abstract class BaseShippingProvider implements IShippingProvider {
  abstract readonly providerType: ShippingProviderType;
  abstract readonly displayName: string;
  
  protected config: ShippingProviderConfig | null = null;
  protected isConfigured = false;
  
  /**
   * Configure the provider with credentials and settings
   */
  configure(config: ShippingProviderConfig): void {
    this.validateConfig(config);
    this.config = config;
    this.isConfigured = true;
  }
  
  /**
   * Ensure provider is configured before operations
   */
  protected ensureConfigured(): void {
    if (!this.isConfigured || !this.config) {
      throw new Error(`Shipping provider ${this.providerType} is not configured`);
    }
  }
  
  /**
   * Get the API URL based on test mode
   */
  protected abstract getApiUrl(): string;
  
  /**
   * Validate provider-specific configuration
   */
  protected abstract validateConfig(config: ShippingProviderConfig): void;
  
  /**
   * Make authenticated API request to provider
   */
  protected abstract makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<T>;
  
  // ============ ABSTRACT METHODS ============
  
  abstract createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse>;
  abstract getTrackingInfo(request: GetTrackingRequest): Promise<TrackingInfo>;
  abstract cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse>;
  abstract getLabel(providerShipmentId: string): Promise<LabelResponse>;
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;
  
  // ============ UTILITY METHODS ============
  
  /**
   * Get sender address from settings or use provided
   */
  protected getSenderAddress(providedSender?: ShipmentAddress): ShipmentAddress {
    if (providedSender) return providedSender;
    
    const settings = this.config?.settings || {};
    return {
      name: settings.senderName as string || '',
      phone: settings.senderPhone as string || '',
      street: settings.senderStreet as string || '',
      city: settings.senderCity as string || '',
      zipCode: settings.senderZipCode as string || '',
    };
  }
  
  /**
   * Get default package dimensions from settings
   */
  protected getDefaultPackage() {
    const settings = this.config?.settings || {};
    return {
      weight: settings.defaultWeight as number || 1,
      width: settings.defaultWidth as number || 20,
      height: settings.defaultHeight as number || 20,
      length: settings.defaultLength as number || 20,
    };
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

