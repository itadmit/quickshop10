/**
 * Cargo Shipping Provider
 * Israeli courier service with box shipments and express delivery
 * 
 * API Documentation: https://api-v2.cargo.co.il
 * API Base URL: https://api-v2.cargo.co.il/api
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
  ShipmentStatus,
  TrackingEvent,
  CreateReturnShipmentRequest,
  CreateExchangeShipmentsRequest,
  CreateExchangeShipmentsResponse,
} from '../types';

// Cargo status code mapping
const STATUS_MAP: Record<number, ShipmentStatus> = {
  1: 'created',           // Open
  2: 'picked_up',         // Transferred to courier
  3: 'delivered',         // Done
  4: 'picked_up',         // Collected by CARGO
  5: 'returned',          // Return from a double
  7: 'created',           // Execution approved
  8: 'cancelled',         // Cancelled
  9: 'out_for_delivery',  // Second delivery
  12: 'pending',          // Pending shipping
  25: 'in_transit',       // במחסן (In warehouse)
  50: 'out_for_delivery', // בדרך למסירה (On the way to delivery)
  51: 'in_transit',       // On the way to Delivery point
  52: 'in_transit',       // Delivery point
  55: 'in_transit',       // In Delivery point
};

// Carrier types
const CARRIER_BOX = 0;     // Box shipment
const CARRIER_EXPRESS = 1; // Express delivery (default)

// Shipping types
const SHIPPING_DELIVERY = 1; // Regular delivery
const SHIPPING_PICKUP = 2;   // Pickup from customer
const SHIPPING_TRANSFER = 3; // Transfer between points

export class CargoProvider extends BaseShippingProvider {
  readonly providerType: ShippingProviderType = 'cargo';
  readonly displayName = 'קרגו משלוחים';
  
  private readonly BASE_URL = 'https://api-v2.cargo.co.il/api';
  
  protected getApiUrl(): string {
    return this.BASE_URL;
  }
  
  protected validateConfig(config: ShippingProviderConfig): void {
    const { credentials } = config;
    
    if (!credentials.apiToken) {
      throw new Error('Cargo: טוקן API חסר');
    }
    if (!credentials.customerCode) {
      throw new Error('Cargo: קוד לקוח חסר');
    }
  }
  
  protected async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.getApiUrl()}${endpoint}`;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config!.credentials.apiToken}`,
      ...headers,
    };
    
    // Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;
    const TIMEOUT_MS = 30000;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        
        console.log(`[Cargo] API request attempt ${attempt}/${MAX_RETRIES}: ${method} ${endpoint}`);
        
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Cargo API error: ${response.status} - ${errorText.substring(0, 500)}`);
        }
        
        const data = await response.json();
        
        // Check for Cargo API error format
        if (data.errors === true || data.error) {
          throw new Error(data.message || data.error || 'Unknown Cargo API error');
        }
        
        return data as T;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (lastError.name === 'AbortError') {
          lastError = new Error(`Cargo API timeout after ${TIMEOUT_MS / 1000}s`);
        }
        
        console.error(`[Cargo] API request attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < MAX_RETRIES) {
          console.log(`[Cargo] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }
    
    throw lastError || new Error('Cargo API request failed after all retries');
  }
  
  /**
   * Create shipment using Cargo API
   */
  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    this.ensureConfigured();
    
    const credentials = this.config!.credentials;
    const sender = this.getSenderAddress(request.sender);
    const recipient = request.recipient;
    const pkg = request.package || this.getDefaultPackage();
    
    console.log('[Cargo] Creating shipment for order:', request.orderNumber);
    console.log('[Cargo] Sender:', sender);
    console.log('[Cargo] Recipient:', recipient);
    
    // Determine carrier type - default to express, use box if specified in settings
    const carrierType = this.config!.settings.useBoxShipment ? CARRIER_BOX : CARRIER_EXPRESS;
    
    // Build request body according to Cargo API
    const shipmentBody = {
      shipping_type: SHIPPING_DELIVERY,
      number_of_parcels: ('quantity' in pkg ? pkg.quantity : 1) || 1,
      barcode: '',
      double_delivery: 0, // Regular delivery (not double)
      total_value: request.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
      transaction_id: request.orderNumber,
      cod_type: request.collectOnDelivery ? 3 : 0, // 3 = All payment methods, 0 = No COD
      cash_on_delivery: request.collectOnDelivery || 0,
      carrier_id: carrierType,
      order_id: request.orderId,
      notes: request.notes || '',
      website: this.config!.settings.website as string || '',
      platform: 'QuickShop',
      customer_code: credentials.customerCode,
      box_point_id: this.config!.settings.defaultBoxPointId as number || undefined,
      to_address: {
        name: recipient.name,
        company: '',
        street1: recipient.street,
        street2: '',
        city: recipient.city,
        phone: this.normalizePhone(recipient.phone),
        email: recipient.email || '',
        entrance: recipient.entrance || '',
        floor: recipient.floor || '',
        apartment: recipient.apartment || '',
      },
      from_address: {
        name: sender.name,
        company: this.config!.settings.companyName as string || '',
        street1: sender.street,
        street2: '',
        city: sender.city,
        phone: this.normalizePhone(sender.phone),
        email: '',
        entrance: '',
        floor: '',
        apartment: '',
      },
    };
    
    try {
      interface CargoCreateResponse {
        errors: boolean;
        data: {
          shipment_id: number;
          driver_name?: string;
          line_text?: string;
          validation_method?: number;
          cargo_validation?: {
            street_number: string;
            street: string;
            city: string;
            full_city: string;
            coordinates?: {
              latitude: number;
              longitude: number;
            };
          };
        };
        message: string;
      }
      
      const response = await this.makeRequest<CargoCreateResponse>(
        '/shipments/create',
        'POST',
        shipmentBody
      );
      
      console.log('[Cargo] API Response:', JSON.stringify(response, null, 2));
      
      const shipmentId = response.data.shipment_id.toString();
      
      return {
        success: true,
        providerShipmentId: shipmentId,
        trackingNumber: shipmentId,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('Create shipment error', error);
      return {
        success: false,
        errorCode: 'API_ERROR',
        errorMessage: error instanceof Error ? error.message : 'שגיאה לא צפויה',
      };
    }
  }
  
  /**
   * Get tracking information
   */
  async getTrackingInfo(request: GetTrackingRequest): Promise<TrackingInfo> {
    this.ensureConfigured();
    
    const trackingNumber = request.trackingNumber || request.providerShipmentId;
    
    if (!trackingNumber) {
      return {
        success: false,
        errorCode: 'NO_TRACKING_NUMBER',
        errorMessage: 'מספר מעקב חסר',
      };
    }
    
    try {
      interface CargoStatusResponse {
        errors: boolean;
        data: {
          shipment_id: number;
          status_code: number;
          status_text: string;
          status_text_en: string;
          status_date: string;
          city?: string;
          state?: string;
          transaction_id?: string;
        };
        message: string;
      }
      
      const response = await this.makeRequest<CargoStatusResponse>(
        '/shipments/get-status',
        'POST',
        {
          shipment_id: parseInt(trackingNumber, 10),
          customer_code: this.config!.credentials.customerCode,
        }
      );
      
      const statusCode = response.data.status_code;
      const status = STATUS_MAP[statusCode] || 'in_transit';
      
      const events: TrackingEvent[] = [{
        timestamp: new Date(response.data.status_date),
        status,
        description: response.data.status_text,
        location: response.data.city,
      }];
      
      return {
        success: true,
        status,
        statusDescription: response.data.status_text,
        events,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('Tracking error', error);
      return {
        success: false,
        errorCode: 'API_ERROR',
        errorMessage: error instanceof Error ? error.message : 'שגיאה לא צפויה',
      };
    }
  }
  
  /**
   * Cancel shipment
   */
  async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    this.ensureConfigured();
    
    const { providerShipmentId } = request;
    
    try {
      interface CargoUpdateResponse {
        errors: boolean;
        data: {
          shipment_id: number;
          updated: boolean;
          status_code: number;
        };
        message: string;
      }
      
      const response = await this.makeRequest<CargoUpdateResponse>(
        '/shipments/update-status',
        'PUT',
        {
          shipment_id: parseInt(providerShipmentId, 10),
          customer_code: this.config!.credentials.customerCode,
          status_code: 8, // Cancelled status
        }
      );
      
      return {
        success: response.data.updated,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('Cancel shipment error', error);
      return {
        success: false,
        errorCode: 'API_ERROR',
        errorMessage: error instanceof Error ? error.message : 'שגיאה לא צפויה',
      };
    }
  }
  
  /**
   * Get shipping label
   */
  async getLabel(providerShipmentId: string, _referenceNumber?: string): Promise<LabelResponse> {
    this.ensureConfigured();
    
    try {
      interface CargoLabelResponse {
        errors: boolean;
        data: string; // URL to PDF
        message: string;
      }
      
      const response = await this.makeRequest<CargoLabelResponse>(
        '/shipments/print-label',
        'POST',
        {
          shipment_ids: [parseInt(providerShipmentId, 10)],
          format: 'pdf',
        }
      );
      
      return {
        success: true,
        labelUrl: response.data,
      };
    } catch (error) {
      this.logError('Get label error', error);
      return {
        success: false,
        errorCode: 'API_ERROR',
        errorMessage: error instanceof Error ? error.message : 'שגיאה לא צפויה',
      };
    }
  }
  
  /**
   * Test connection to Cargo API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    this.ensureConfigured();
    
    try {
      interface CargoPickupPointsResponse {
        length?: number;
        [key: number]: unknown;
      }
      
      // Try to get pickup points list as a connection test
      const response = await this.makeRequest<CargoPickupPointsResponse>(
        '/shipments/get-pickup-points',
        'GET'
      );
      
      // If we got a response (array of points), connection is successful
      if (Array.isArray(response) || response.length !== undefined) {
        return { success: true };
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'שגיאת התחברות',
      };
    }
  }
  
  /**
   * Get pickup points for box shipment
   */
  async getPickupPoints(latitude?: number, longitude?: number, radius?: number): Promise<{
    success: boolean;
    points?: Array<{
      id: number;
      name: string;
      city: string;
      street: string;
      streetNumber: string;
      phone: string;
      isLocker: boolean;
      latitude: number;
      longitude: number;
      distance?: number;
    }>;
    error?: string;
  }> {
    this.ensureConfigured();
    
    try {
      // If coordinates provided, find closest points
      if (latitude && longitude) {
        interface CargoClosestPointsResponse {
          DistributionPointID: number;
          DistributionPointName: string;
          CityName: string;
          StreetName: string;
          StreetNum: string;
          Phone: string;
          Islocker: string;
          Latitude: number;
          Longitude: number;
          distance?: number;
        }
        
        const response = await this.makeRequest<CargoClosestPointsResponse[]>(
          '/shipments/find-closest-pickup-points',
          'POST',
          { latitude, longitude, radius: radius || 5 }
        );
        
        const points = response.map(point => ({
          id: point.DistributionPointID,
          name: point.DistributionPointName,
          city: point.CityName,
          street: point.StreetName,
          streetNumber: point.StreetNum,
          phone: point.Phone,
          isLocker: point.Islocker === 'כן',
          latitude: point.Latitude,
          longitude: point.Longitude,
          distance: point.distance,
        }));
        
        return { success: true, points };
      }
      
      // Get all pickup points
      interface CargoPointsResponse {
        DistributionPointID: number;
        DistributionPointName: string;
        CityName: string;
        StreetName: string;
        StreetNum: string;
        Phone: string;
        Islocker: string;
        Latitude: number;
        Longitude: number;
      }
      
      const response = await this.makeRequest<CargoPointsResponse[]>(
        '/shipments/get-pickup-points',
        'GET'
      );
      
      const points = response.map(point => ({
        id: point.DistributionPointID,
        name: point.DistributionPointName,
        city: point.CityName,
        street: point.StreetName,
        streetNumber: point.StreetNum,
        phone: point.Phone,
        isLocker: point.Islocker === 'כן',
        latitude: point.Latitude,
        longitude: point.Longitude,
      }));
      
      return { success: true, points };
    } catch (error) {
      this.logError('Get pickup points error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'שגיאה לא צפויה',
      };
    }
  }
  
  /**
   * Create return pickup shipment (customer → store)
   */
  async createReturnShipment(request: CreateReturnShipmentRequest): Promise<CreateShipmentResponse> {
    this.ensureConfigured();
    
    const credentials = this.config!.credentials;
    const pickupFrom = request.pickupFrom;
    const returnTo = request.returnTo || this.getSenderAddress();
    const pkg = request.package || this.getDefaultPackage();
    
    console.log('[Cargo] Creating return pickup for:', request.returnRequestNumber);
    
    const shipmentBody = {
      shipping_type: SHIPPING_PICKUP, // Pickup type for returns
      number_of_parcels: request.numberOfPackages || 1,
      barcode: '',
      double_delivery: 0,
      total_value: 0,
      transaction_id: `RET-${request.returnRequestNumber}`,
      cod_type: 0,
      cash_on_delivery: 0,
      carrier_id: CARRIER_EXPRESS,
      order_id: request.returnRequestId,
      notes: request.notes || `איסוף החזרה - ${request.returnRequestNumber}`,
      website: this.config!.settings.website as string || '',
      platform: 'QuickShop',
      customer_code: credentials.customerCode,
      to_address: {
        name: returnTo.name,
        company: this.config!.settings.companyName as string || '',
        street1: returnTo.street,
        street2: '',
        city: returnTo.city,
        phone: this.normalizePhone(returnTo.phone),
        email: '',
        entrance: '',
        floor: '',
        apartment: '',
      },
      from_address: {
        name: pickupFrom.name,
        company: '',
        street1: pickupFrom.street,
        street2: '',
        city: pickupFrom.city,
        phone: this.normalizePhone(pickupFrom.phone),
        email: pickupFrom.email || '',
        entrance: pickupFrom.entrance || '',
        floor: pickupFrom.floor || '',
        apartment: pickupFrom.apartment || '',
      },
    };
    
    try {
      interface CargoCreateResponse {
        errors: boolean;
        data: {
          shipment_id: number;
        };
        message: string;
      }
      
      const response = await this.makeRequest<CargoCreateResponse>(
        '/shipments/create',
        'POST',
        shipmentBody
      );
      
      const shipmentId = response.data.shipment_id.toString();
      
      return {
        success: true,
        providerShipmentId: shipmentId,
        trackingNumber: shipmentId,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('Create return shipment error', error);
      return {
        success: false,
        errorCode: 'API_ERROR',
        errorMessage: error instanceof Error ? error.message : 'שגיאה לא צפויה',
      };
    }
  }
  
  /**
   * Create exchange shipments (return pickup + new delivery)
   */
  async createExchangeShipments(request: CreateExchangeShipmentsRequest): Promise<CreateExchangeShipmentsResponse> {
    this.ensureConfigured();
    
    console.log('[Cargo] Creating exchange shipments for:', request.returnRequestNumber);
    
    // Step 1: Create return pickup (customer → store)
    const returnResult = await this.createReturnShipment({
      storeId: request.storeId,
      returnRequestId: request.returnRequestId,
      returnRequestNumber: request.returnRequestNumber,
      originalOrderNumber: request.exchangeOrderNumber,
      pickupFrom: request.customerAddress,
      returnTo: request.storeAddress,
      package: request.returnPackage,
      notes: `איסוף עבור החלפה - הזמנה ${request.exchangeOrderNumber}`,
    });
    
    if (!returnResult.success) {
      return {
        success: false,
        errorCode: returnResult.errorCode,
        errorMessage: `שגיאה ביצירת משלוח איסוף: ${returnResult.errorMessage}`,
      };
    }
    
    // Step 2: Create delivery (store → customer)
    const deliveryResult = await this.createShipment({
      storeId: request.storeId,
      orderId: request.exchangeOrderId,
      orderNumber: request.exchangeOrderNumber,
      recipient: request.customerAddress,
      sender: request.storeAddress,
      package: request.deliveryPackage,
      notes: `החלפה - ${request.returnRequestNumber}`,
    });
    
    if (!deliveryResult.success) {
      console.warn('[Cargo] Exchange: Return created but delivery failed');
      return {
        success: false,
        returnShipment: {
          providerShipmentId: returnResult.providerShipmentId!,
          trackingNumber: returnResult.trackingNumber!,
          labelUrl: '',
        },
        errorCode: deliveryResult.errorCode,
        errorMessage: `משלוח האיסוף נוצר, אבל שגיאה במשלוח המסירה: ${deliveryResult.errorMessage}`,
      };
    }
    
    // Get labels for both shipments
    const returnLabel = await this.getLabel(returnResult.providerShipmentId!);
    const deliveryLabel = await this.getLabel(deliveryResult.providerShipmentId!);
    
    console.log('[Cargo] Exchange shipments created successfully');
    
    return {
      success: true,
      returnShipment: {
        providerShipmentId: returnResult.providerShipmentId!,
        trackingNumber: returnResult.trackingNumber!,
        labelUrl: returnLabel.labelUrl || '',
      },
      deliveryShipment: {
        providerShipmentId: deliveryResult.providerShipmentId!,
        trackingNumber: deliveryResult.trackingNumber!,
        labelUrl: deliveryLabel.labelUrl || '',
      },
    };
  }
  
  /**
   * Setup webhook for status updates
   */
  async setupWebhook(webhookUrl: string): Promise<{ success: boolean; webhookId?: number; error?: string }> {
    this.ensureConfigured();
    
    try {
      interface CargoWebhookResponse {
        errors: boolean;
        data: {
          id: number;
          type: string;
          customer_code: string;
          webhook_url: string;
        };
        message: string;
      }
      
      const response = await this.makeRequest<CargoWebhookResponse>(
        '/webhooks/create',
        'POST',
        {
          type: 'status-update',
          customer_code: this.config!.credentials.customerCode,
          webhook_url: webhookUrl,
        }
      );
      
      return {
        success: true,
        webhookId: response.data.id,
      };
    } catch (error) {
      this.logError('Setup webhook error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'שגיאה לא צפויה',
      };
    }
  }
  
  /**
   * Normalize Israeli phone numbers
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    
    // Remove spaces and dashes
    let normalized = phone.replace(/[\s-]/g, '');
    
    // Convert +972 to 0
    if (normalized.startsWith('+972')) {
      normalized = '0' + normalized.substring(4);
    } else if (normalized.startsWith('972')) {
      normalized = '0' + normalized.substring(3);
    }
    
    return normalized;
  }
  
  /**
   * Get status description in Hebrew
   */
  private getStatusDescription(status: ShipmentStatus): string {
    const descriptions: Record<ShipmentStatus, string> = {
      pending: 'ממתין לשליחה',
      created: 'נוצר במערכת',
      picked_up: 'נאסף',
      in_transit: 'בדרך',
      out_for_delivery: 'יצא לחלוקה',
      delivered: 'נמסר',
      failed: 'נכשל',
      returned: 'הוחזר',
      cancelled: 'בוטל',
    };
    return descriptions[status] || status;
  }
}
