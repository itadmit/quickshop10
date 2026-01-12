/**
 * Manual Shipping Provider
 * A simple provider for stores that handle shipping manually
 * No API integration - just record keeping
 */

import { BaseShippingProvider } from './base';
import type {
  ShippingProviderType,
  ShippingProviderConfig,
  CreateShipmentRequest,
  CreateShipmentResponse,
  GetTrackingRequest,
  TrackingInfo,
  CancelShipmentRequest,
  CancelShipmentResponse,
  LabelResponse,
} from '../types';

export class ManualShippingProvider extends BaseShippingProvider {
  readonly providerType: ShippingProviderType = 'manual';
  readonly displayName = 'ידני';
  
  protected getApiUrl(): string {
    return ''; // No API for manual
  }
  
  protected validateConfig(_config: ShippingProviderConfig): void {
    // No validation needed for manual provider
  }
  
  protected async makeRequest<T>(): Promise<T> {
    throw new Error('Manual provider does not make API requests');
  }
  
  /**
   * Create shipment - just returns success with a generated ID
   */
  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    // Generate a simple tracking ID based on order number
    const trackingNumber = `MAN-${request.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
    
    return {
      success: true,
      providerShipmentId: trackingNumber,
      trackingNumber,
    };
  }
  
  /**
   * Get tracking - manual provider doesn't support tracking
   */
  async getTrackingInfo(_request: GetTrackingRequest): Promise<TrackingInfo> {
    return {
      success: true,
      status: 'pending',
      statusDescription: 'מעקב ידני - עדכן את הסטטוס בדף ההזמנה',
      events: [],
    };
  }
  
  /**
   * Cancel shipment
   */
  async cancelShipment(_request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    return {
      success: true,
    };
  }
  
  /**
   * Get label - manual provider doesn't generate labels
   */
  async getLabel(_providerShipmentId: string): Promise<LabelResponse> {
    return {
      success: false,
      errorMessage: 'ספק ידני לא תומך בהפקת תוויות',
    };
  }
  
  /**
   * Test connection - always succeeds for manual
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}

