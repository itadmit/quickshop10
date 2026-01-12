/**
 * Focus Delivery Provider
 * Uses Run ERP API
 * 
 * API Documentation: https://focusdelivery.co.il
 * Based on Run ERP system - GET requests with parameters
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
} from '../types';

// Status code mapping from Run ERP
const STATUS_MAP: Record<number, ShipmentStatus> = {
  5: 'created',      // Internet - נוצר
  7: 'in_transit',   // On the way to warehouse
  10: 'picked_up',   // נאסף
  20: 'in_transit',  // בדרך
  30: 'out_for_delivery', // יצא לחלוקה
  40: 'delivered',   // נמסר
  50: 'returned',    // הוחזר
  60: 'failed',      // נכשל
};

export class FocusProvider extends BaseShippingProvider {
  readonly providerType: ShippingProviderType = 'focus';
  readonly displayName = 'פוקוס משלוחים';
  
  private readonly BASE_URL = 'https://focusdelivery.co.il/RunCom.Server/Request.aspx';
  
  protected getApiUrl(): string {
    // Focus uses the same URL for production
    return this.BASE_URL;
  }
  
  protected validateConfig(config: ShippingProviderConfig): void {
    const { credentials } = config;
    
    if (!credentials.customerNumber) {
      throw new Error('Focus: מספר לקוח חסר');
    }
    // shipmentType and cargoType have defaults of '1' if not provided
  }
  
  protected async makeRequest<T>(
    endpoint: string,
    _method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    _body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.getApiUrl()}?${endpoint}`;
    
    const requestHeaders: Record<string, string> = {
      ...headers,
    };
    
    // Add authorization if token is provided
    const token = this.config?.credentials.token;
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    this.log('Request URL', url);
    
    const response = await fetch(url, {
      method: 'GET', // Run ERP uses GET for all requests
      headers: requestHeaders,
    });
    
    if (!response.ok) {
      throw new Error(`Focus API error: ${response.status}`);
    }
    
    const text = await response.text();
    this.log('Response', text);
    
    // Parse XML response
    return this.parseXmlResponse(text) as T;
  }
  
  /**
   * Parse XML response from Run ERP
   */
  private parseXmlResponse(xml: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Simple XML parsing for key tags
    const tags = [
      'ship_create_num', 'ship_num_rand', 'status', 'message',
      'shgiya_yn', 'mishloah', 'random', 'status_desc',
      'status_code', 'status_date', 'status_time'
    ];
    
    for (const tag of tags) {
      const match = xml.match(new RegExp(`<${tag}>\\s*(?:<!\\[CDATA\\[)?([^<\\]]*?)(?:\\]\\]>)?\\s*</${tag}>`, 'i'));
      if (match) {
        result[tag] = match[1].trim();
      }
    }
    
    // Check for error
    if (xml.includes('<shgiya_yn>y</shgiya_yn>') || xml.includes('<status>ERROR</status>')) {
      result.error = 'true';
    }
    
    return result;
  }
  
  /**
   * Parse tracking events from XML
   */
  private parseTrackingEvents(xml: string): TrackingEvent[] {
    const events: TrackingEvent[] = [];
    
    // Find all status blocks
    const statusBlocks = xml.match(/<status>[\s\S]*?<\/status>/gi) || [];
    
    for (const block of statusBlocks) {
      const codeMatch = block.match(/<status_code>(\d+)<\/status_code>/);
      const descMatch = block.match(/<status_desc>([^<]*)<\/status_desc>/);
      const dateMatch = block.match(/<status_date>([^<]*)<\/status_date>/);
      const timeMatch = block.match(/<status_time>([^<]*)<\/status_time>/);
      
      if (codeMatch && dateMatch) {
        const statusCode = parseInt(codeMatch[1], 10);
        const dateStr = dateMatch[1]; // DD/MM/YYYY
        const timeStr = timeMatch ? timeMatch[1] : '00:00'; // HH:MM
        
        // Parse date (DD/MM/YYYY HH:MM)
        const [day, month, year] = dateStr.split('/');
        const [hours, minutes] = timeStr.split(':');
        const timestamp = new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10),
          parseInt(hours, 10),
          parseInt(minutes, 10)
        );
        
        events.push({
          timestamp,
          status: STATUS_MAP[statusCode] || 'in_transit',
          description: descMatch ? descMatch[1] : `סטטוס ${statusCode}`,
        });
      }
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Build URL arguments for Run ERP
   */
  private buildArguments(params: (string | number | null)[]): string {
    return params.map((p, i) => {
      const isNumeric = typeof p === 'number' || (typeof p === 'string' && /^\d+$/.test(p));
      const prefix = isNumeric ? '-N' : '-A';
      const value = p === null || p === undefined ? '' : String(p);
      return `${prefix}${value}`;
    }).join(',');
  }
  
  /**
   * Create shipment using WS Simple
   */
  async createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse> {
    this.ensureConfigured();
    
    const credentials = this.config!.credentials;
    const sender = this.getSenderAddress(request.sender);
    const recipient = request.recipient;
    const pkg = request.package || this.getDefaultPackage();
    
    // Build the 42 parameters for WS Simple
    // P1-P42 according to Run ERP documentation
    const params: (string | number | null)[] = [
      credentials.customerNumber || '',  // P1: Customer number
      'מסירה',                           // P2: Delivery type (מסירה for delivery)
      credentials.shipmentType || '1',   // P3: Shipment type code
      '',                                 // P4: Shipment stage (leave blank)
      sender.name,                        // P5: Ordered by name
      '',                                 // P6: Leave blank
      credentials.cargoType || '1',      // P7: Shipped cargo type
      '',                                 // P8: Returned cargo type (for returns)
      '',                                 // P9: Number of returned packages
      '',                                 // P10: Leave blank
      recipient.name,                     // P11: Consignee's name
      '',                                 // P12: City code (optional)
      recipient.city,                     // P13: City name
      '',                                 // P14: Street code (optional)
      recipient.street,                   // P15: Street name with building number
      '',                                 // P16: Building No
      recipient.entrance || '',           // P17: Entrance No
      recipient.floor || '',              // P18: Floor No
      recipient.apartment || '',          // P19: Apartment No
      recipient.phone,                    // P20: Primary phone
      '',                                 // P21: Additional phone
      request.orderNumber,                // P22: Your reference number
      ('quantity' in pkg ? pkg.quantity : 1) || 1,  // P23: Number of packages
      recipient.notes || '',              // P24: Address remarks
      request.notes || '',                // P25: Additional remarks
      '',                                 // P26: Second reference
      '',                                 // P27: Pickup date (DD/MM/YYYY)
      '',                                 // P28: Pickup time (HH:MM)
      '',                                 // P29: Leave blank
      request.collectOnDelivery ? 1 : '', // P30: Payment type code (if COD)
      request.collectOnDelivery || '',    // P31: Sum to collect
      '',                                 // P32: Collection date
      '',                                 // P33: Collection notes
      '',                                 // P34: Source pickup point (for returns)
      '',                                 // P35: Destination pickup point
      'XML',                              // P36: Response type
      'N',                                // P37: Auto pickup point assignment
      recipient.email || '',              // P38: Consignee email
      pkg.weight || 1,                    // P39: Weight
      pkg.width || 20,                    // P40: Width
      pkg.height || 20,                   // P41: Height
      pkg.length || 20,                   // P42: Length
    ];
    
    try {
      const args = this.buildArguments(params);
      const endpoint = `APPNAME=run&PRGNAME=ship_create_anonymous&ARGUMENTS=${args}`;
      
      const response = await this.makeRequest<Record<string, string>>(endpoint, 'GET');
      
      if (response.error || response.shgiya_yn === 'y') {
        return {
          success: false,
          errorCode: 'CREATE_FAILED',
          errorMessage: response.message || 'שגיאה ביצירת משלוח',
          providerResponse: response,
        };
      }
      
      const shipmentNumber = response.ship_create_num;
      const randomNumber = response.ship_num_rand;
      
      if (!shipmentNumber) {
        return {
          success: false,
          errorCode: 'NO_SHIPMENT_NUMBER',
          errorMessage: 'לא התקבל מספר משלוח מהשרת',
          providerResponse: response,
        };
      }
      
      // Generate label URL (PDF)
      const labelUrl = `${this.getApiUrl()}?APPNAME=run&PRGNAME=print_label&ARGUMENTS=-A${shipmentNumber},-APDF`;
      
      return {
        success: true,
        providerShipmentId: randomNumber || shipmentNumber,
        trackingNumber: shipmentNumber,
        labelUrl,
        providerResponse: response,
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
      // Use ws_info_full for detailed tracking
      const endpoint = `APPNAME=run&PRGNAME=ws_info_full&ARGUMENTS=-A${trackingNumber}`;
      
      const response = await this.makeRequest<Record<string, string>>(endpoint, 'GET');
      
      if (response.error || response.shgiya_yn === 'y') {
        return {
          success: false,
          errorCode: 'TRACKING_FAILED',
          errorMessage: response.message || 'שגיאה בקבלת מידע מעקב',
          providerResponse: response,
        };
      }
      
      // Parse the full XML for tracking events
      // Note: This is a simplified version - the actual XML structure may vary
      const statusCode = parseInt(response.status_code || '0', 10);
      const status = STATUS_MAP[statusCode] || 'pending';
      
      return {
        success: true,
        status,
        statusDescription: response.status_desc || this.getStatusDescription(status),
        events: [], // Would need raw XML to parse events
        providerResponse: response,
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
      // Use bitul_mishloah for cancellation
      const endpoint = `APPNAME=run&PRGNAME=bitul_mishloah&ARGUMENTS=-A${providerShipmentId},-A,-A,-N${this.config!.credentials.customerNumber}`;
      
      const response = await this.makeRequest<Record<string, string>>(endpoint, 'GET');
      
      if (response.status === 'ERROR') {
        return {
          success: false,
          errorCode: 'CANCEL_FAILED',
          errorMessage: response.status_desc || 'לא ניתן לבטל את המשלוח',
          providerResponse: response,
        };
      }
      
      return {
        success: true,
        providerResponse: response,
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
  async getLabel(providerShipmentId: string): Promise<LabelResponse> {
    this.ensureConfigured();
    
    try {
      // Direct URL to PDF label
      const labelUrl = `${this.getApiUrl()}?APPNAME=run&PRGNAME=print_label&ARGUMENTS=-A${providerShipmentId},-APDF`;
      
      return {
        success: true,
        labelUrl,
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
   * Test connection to Focus API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    this.ensureConfigured();
    
    try {
      // Try to get pickup points list as a connection test
      const endpoint = `APPNAME=run&PRGNAME=ws_spotslist&ARGUMENTS=-Aall`;
      
      const response = await this.makeRequest<Record<string, string>>(endpoint, 'GET');
      
      if (response.error || response.shgiya_yn === 'y') {
        return {
          success: false,
          error: response.message || 'שגיאת התחברות',
        };
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
   * Get status description in Hebrew
   */
  private getStatusDescription(status: ShipmentStatus): string {
    const descriptions: Record<ShipmentStatus, string> = {
      pending: 'ממתין',
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

