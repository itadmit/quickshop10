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
  CreateReturnShipmentRequest,
  CreateExchangeShipmentsRequest,
  CreateExchangeShipmentsResponse,
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
    
    const response = await fetch(url, {
      method: 'GET', // Run ERP uses GET for all requests
      headers: requestHeaders,
    });
    
    if (!response.ok) {
      // Don't log full HTML error pages - just the status
      const isHtml = response.headers.get('content-type')?.includes('text/html');
      if (isHtml) {
        throw new Error(`Focus API error: ${response.status} - Server returned HTML error page`);
      }
      const errorText = await response.text();
      throw new Error(`Focus API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }
    
    // Get response as buffer first to handle encoding properly
    const buffer = await response.arrayBuffer();
    // Try to decode as UTF-8 first, then as Windows-1255 (Hebrew encoding)
    let text: string;
    try {
      text = new TextDecoder('utf-8').decode(buffer);
      // Check if it looks like encoding issues (gibberish)
      if (text.includes('�')) {
        // Try Windows-1255 (Hebrew Windows encoding)
        text = new TextDecoder('windows-1255').decode(buffer);
      }
    } catch {
      text = new TextDecoder('windows-1255').decode(buffer);
    }
    
    // Check if response is XML or plain text
    if (text.startsWith('<?xml') || text.startsWith('<')) {
      // Parse XML response
      return this.parseXmlResponse(text) as T;
    } else {
      // Parse text response (format: code,message|errorCode)
      return this.parseTextResponse(text) as T;
    }
  }
  
  /**
   * Parse plain text response from Run ERP
   * Format: code,message|errorCode or shipmentNumber,randomNumber
   */
  private parseTextResponse(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Check for error format: 0,error message|errorCode
    if (text.startsWith('0,') || text.startsWith('-')) {
      result.error = 'true';
      
      // Extract message (between first comma and pipe)
      const pipeIndex = text.indexOf('|');
      if (pipeIndex > 0) {
        result.message = text.substring(2, pipeIndex).trim();
        result.errorCode = text.substring(pipeIndex + 1).trim();
      } else {
        result.message = text.substring(2).trim();
      }
    } else {
      // Success format: shipmentNumber,randomNumber or just shipmentNumber
      const parts = text.split(',');
      if (parts.length >= 1 && parts[0].trim()) {
        result.ship_create_num = parts[0].trim();
        if (parts.length >= 2) {
          result.ship_num_rand = parts[1].trim();
        }
      }
    }
    
    return result;
  }

  /**
   * Parse XML response from Run ERP
   */
  private parseXmlResponse(xml: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Simple XML parsing for key tags - including common variations
    const tags = [
      'ship_create_num', 'ship_num_rand', 'status', 'message',
      'shgiya_yn', 'mishloah', 'random', 'status_desc',
      'status_code', 'status_date', 'status_time',
      // Error fields
      'ship_create_error', 'ship_create_error_code',
      // Additional possible tag names
      'error', 'err', 'msg', 'shipment_num', 'tracking_num',
      'barcode', 'shipcreate', 'ship_num', 'num', 'customer_number'
    ];
    
    for (const tag of tags) {
      // Try multiple patterns for tag matching
      // Pattern 1: Standard XML
      let match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
      if (!match) {
        // Pattern 2: With CDATA
        match = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([^\\]]*?)\\]\\]>\\s*</${tag}>`, 'i'));
      }
      if (!match) {
        // Pattern 3: Self-closing or empty
        match = xml.match(new RegExp(`<${tag}[^>]*/>`, 'i'));
        if (match) {
          result[tag] = '';
          continue;
        }
      }
      if (match) {
        result[tag] = match[1]?.trim() || '';
      }
    }
    
    // Check for error
    if (xml.includes('<shgiya_yn>y</shgiya_yn>') || 
        xml.includes('<shgiya_yn>Y</shgiya_yn>') ||
        xml.includes('<status>ERROR</status>') ||
        xml.includes('<error>')) {
      result.error = 'true';
      // Try to extract error message
      const msgMatch = xml.match(/<(?:message|msg|error)>([^<]+)<\/(?:message|msg|error)>/i);
      if (msgMatch) {
        result.message = msgMatch[1];
      }
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
   * According to RUN API documentation, each parameter has a FIXED type prefix
   * based on its POSITION, not based on the actual value!
   * 
   * Format from docs:
   * ARGUMENTS=-N<p1>,-A<p2>,-N<p3>,-N<p4>,-A<p5>,-A<p6>,-N<p7>,-N<p8>,-N<p9>,-N<p10>,
   *           -A<p11>,-A<p12>,-A<p13>,-A<p14>,-A<p15>,-A<p16>,-A<p17>,-A<p18>,-A<p19>,
   *           -A<p20>,-A<p21>,-A<p22>,-A<p23>,-A<p24>,-A<p25>,-A<p26>,-A<p27>,-A<p28>,
   *           -N<p29>,-N<p30>,-N<p31>,-A<p32>,-A<p33>,-N<p34>,-N<p35>,-A<p36>,-A<p37>,
   *           -A<p38>,-N<p39>,-N<p40>,-N<p41>,-N<p42>
   */
  private buildArguments(params: (string | number | null)[]): string {
    // Type prefixes by position (0-indexed = P1, P2, etc.)
    // N = Numeric, A = Alphanumeric (string)
    const typeByPosition: ('N' | 'A')[] = [
      'N',  // P1: Customer number
      'A',  // P2: מסירה/איסוף
      'N',  // P3: Shipment type
      'N',  // P4: Shipment stage
      'A',  // P5: Ordered by name
      'A',  // P6: (blank)
      'N',  // P7: Shipped cargo type
      'N',  // P8: Returned cargo type
      'N',  // P9: Number of returned packages
      'N',  // P10: (blank)
      'A',  // P11: Consignee's name
      'A',  // P12: City code
      'A',  // P13: City name
      'A',  // P14: Street code
      'A',  // P15: Street name
      'A',  // P16: Building No
      'A',  // P17: Entrance No
      'A',  // P18: Floor No
      'A',  // P19: Apartment No
      'A',  // P20: Primary phone
      'A',  // P21: Additional phone
      'A',  // P22: Reference number
      'A',  // P23: Number of packages (docs show -A even though it's numeric)
      'A',  // P24: Address remarks
      'A',  // P25: Additional remarks
      'A',  // P26: Second reference
      'A',  // P27: Pickup date
      'A',  // P28: Pickup time
      'N',  // P29: (blank)
      'N',  // P30: Payment type code
      'N',  // P31: Sum to collect
      'A',  // P32: Collection date
      'A',  // P33: Collection notes
      'N',  // P34: Source pickup point
      'N',  // P35: Destination pickup point
      'A',  // P36: Response type (XML)
      'A',  // P37: Auto pickup assignment
      'A',  // P38: Consignee email
      'N',  // P39: Weight
      'N',  // P40: Width
      'N',  // P41: Height
      'N',  // P42: Length
    ];
    
    return params.map((p, i) => {
      const prefix = `-${typeByPosition[i] || 'A'}`;
      let value = p === null || p === undefined || p === '' ? '' : String(p);
      
      // According to RUN API docs: "There cannot be commas and & characters in the text of a parameter"
      // Replace commas with spaces and & with "and"
      value = value.replace(/,/g, ' ').replace(/&/g, ' ');
      
      // Also remove any pipe characters that might break the response parsing
      value = value.replace(/\|/g, ' ');
      
      // Normalize Israeli phone numbers: remove +972 prefix and add leading 0
      if (value.startsWith('+972')) {
        value = '0' + value.substring(4);
      } else if (value.startsWith('972')) {
        value = '0' + value.substring(3);
      }
      
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
    
    // Debug log - always show for shipment creation
    console.log('[Focus] Creating shipment for order:', request.orderNumber);
    console.log('[Focus] Sender:', sender);
    console.log('[Focus] Recipient:', recipient);
    
    // Build the 42 parameters for WS Simple
    // P1-P42 according to Run ERP documentation
    const params: (string | number | null)[] = [
      credentials.customerNumber || '',  // P1: Customer number
      'מסירה',                           // P2: Delivery type (מסירה for delivery)
      credentials.shipmentType && credentials.shipmentType !== '1' ? credentials.shipmentType : '100', // P3: Shipment type code (default: 100)
      '',                                 // P4: Shipment stage (leave blank)
      sender.name,                        // P5: Ordered by name
      '',                                 // P6: Leave blank
      credentials.cargoType && credentials.cargoType !== '1' ? credentials.cargoType : '100', // P7: Shipped cargo type (default: 100)
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
      // URL encode the arguments (especially for Hebrew text like מסירה)
      const encodedArgs = encodeURIComponent(args);
      const endpoint = `APPNAME=run&PRGNAME=ship_create_anonymous&ARGUMENTS=${encodedArgs}`;
      
      console.log('[Focus] Calling API with args:', args);
      const response = await this.makeRequest<Record<string, string>>(endpoint, 'GET');
      console.log('[Focus] API Response:', JSON.stringify(response, null, 2));
      
      if (response.error || response.shgiya_yn === 'y' || response.shgiya_yn === 'Y') {
        const errorMsg = response.message || 'שגיאה ביצירת משלוח';
        const errorCode = response.errorCode || 'CREATE_FAILED';
        console.error(`[Focus] API Error: ${errorMsg} (Code: ${errorCode})`);
        return {
          success: false,
          errorCode,
          errorMessage: errorMsg,
          providerResponse: response,
        };
      }
      
      const shipmentNumber = response.ship_create_num;
      const randomNumber = response.ship_num_rand;
      
      // Check for error in response
      if (response.ship_create_error) {
        console.error(`[Focus] Shipment creation error: ${response.ship_create_error} (Code: ${response.ship_create_error_code})`);
        return {
          success: false,
          errorCode: response.ship_create_error_code || 'CREATE_ERROR',
          errorMessage: response.ship_create_error,
          providerResponse: response,
        };
      }
      
      // Check if shipment number is valid (not empty and not 0)
      if (!shipmentNumber || shipmentNumber === '0') {
        return {
          success: false,
          errorCode: 'NO_SHIPMENT_NUMBER',
          errorMessage: 'לא התקבל מספר משלוח מהשרת',
          providerResponse: response,
        };
      }
      
      // Generate label URL using ship_print_ws (Web Service endpoint)
      // Format: PRGNAME=ship_print_ws&ARGUMENTS=-N{shipmentId},-A,-A,-A,-A,-A,-A,-N,-A{referenceNumber}
      // This returns PDF content directly without requiring portal login
      const labelUrl = `${this.getApiUrl()}?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N${shipmentNumber},-A,-A,-A,-A,-A,-A,-N,-A${request.orderNumber || ''}`;
      
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
   * Get shipping label using ship_print_ws (Web Service)
   * Returns PDF content directly without requiring portal login
   */
  async getLabel(providerShipmentId: string, referenceNumber?: string): Promise<LabelResponse> {
    this.ensureConfigured();
    
    try {
      // Use ship_print_ws endpoint which returns PDF directly
      const labelUrl = `${this.getApiUrl()}?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N${providerShipmentId},-A,-A,-A,-A,-A,-A,-N,-A${referenceNumber || ''}`;
      
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
  
  /**
   * Create return pickup shipment (customer → store)
   * Uses P2 = 'איסוף' for return pickups
   */
  async createReturnShipment(request: CreateReturnShipmentRequest): Promise<CreateShipmentResponse> {
    this.ensureConfigured();
    
    const credentials = this.config!.credentials;
    const pickupFrom = request.pickupFrom;
    const returnTo = request.returnTo || this.getSenderAddress();
    const pkg = request.package || this.getDefaultPackage();
    
    console.log('[Focus] Creating return pickup for:', request.returnRequestNumber);
    console.log('[Focus] Pickup from:', pickupFrom);
    console.log('[Focus] Return to:', returnTo);
    
    // Build the 42 parameters for WS Simple - RETURN PICKUP
    // P2 = 'איסוף' for returns
    const params: (string | number | null)[] = [
      credentials.customerNumber || '',  // P1: Customer number
      'איסוף',                           // P2: Return type (איסוף for pickup/return)
      credentials.shipmentType && credentials.shipmentType !== '1' ? credentials.shipmentType : '100', // P3: Shipment type
      '',                                 // P4: Shipment stage
      returnTo.name,                      // P5: Ordered by (store name)
      '',                                 // P6: Leave blank
      '',                                 // P7: Shipped cargo type (not used for returns)
      credentials.cargoType && credentials.cargoType !== '1' ? credentials.cargoType : '100', // P8: Returned cargo type
      request.numberOfPackages || 1,      // P9: Number of returned packages
      '',                                 // P10: Leave blank
      pickupFrom.name,                    // P11: Consignee's name (pickup from)
      '',                                 // P12: City code
      pickupFrom.city,                    // P13: City name
      '',                                 // P14: Street code
      pickupFrom.street,                  // P15: Street name
      '',                                 // P16: Building No
      pickupFrom.entrance || '',          // P17: Entrance No
      pickupFrom.floor || '',             // P18: Floor No
      pickupFrom.apartment || '',         // P19: Apartment No
      pickupFrom.phone,                   // P20: Primary phone
      '',                                 // P21: Additional phone
      `RET-${request.returnRequestNumber}:${request.originalOrderNumber}`, // P22: Reference
      request.numberOfPackages || 1,      // P23: Number of packages
      pickupFrom.notes || '',             // P24: Address remarks
      request.notes || `איסוף החזרה - ${request.returnRequestNumber}`, // P25: Additional remarks
      request.returnRequestNumber,        // P26: Second reference
      '',                                 // P27: Pickup date
      '',                                 // P28: Pickup time
      '',                                 // P29: Leave blank
      '',                                 // P30: Payment type code
      '',                                 // P31: Sum to collect
      '',                                 // P32: Collection date
      '',                                 // P33: Collection notes
      '',                                 // P34: Source pickup point (will be filled by system)
      '',                                 // P35: Destination pickup point
      'XML',                              // P36: Response type
      'N',                                // P37: Auto pickup assignment
      pickupFrom.email || '',             // P38: Consignee email
      pkg.weight || 1,                    // P39: Weight
      pkg.width || 20,                    // P40: Width
      pkg.height || 20,                   // P41: Height
      pkg.length || 20,                   // P42: Length
    ];
    
    try {
      const args = this.buildArguments(params);
      const encodedArgs = encodeURIComponent(args);
      const endpoint = `APPNAME=run&PRGNAME=ship_create_anonymous&ARGUMENTS=${encodedArgs}`;
      
      console.log('[Focus] Creating return shipment...');
      const response = await this.makeRequest<Record<string, string>>(endpoint, 'GET');
      console.log('[Focus] Return API Response:', JSON.stringify(response, null, 2));
      
      if (response.error || response.shgiya_yn === 'y' || response.shgiya_yn === 'Y') {
        const errorMsg = response.message || 'שגיאה ביצירת משלוח איסוף';
        return {
          success: false,
          errorCode: response.errorCode || 'CREATE_RETURN_FAILED',
          errorMessage: errorMsg,
          providerResponse: response,
        };
      }
      
      const shipmentNumber = response.ship_create_num;
      const randomNumber = response.ship_num_rand;
      
      if (!shipmentNumber || shipmentNumber === '0') {
        return {
          success: false,
          errorCode: 'NO_SHIPMENT_NUMBER',
          errorMessage: 'לא התקבל מספר משלוח מהשרת',
          providerResponse: response,
        };
      }
      
      const labelUrl = `${this.getApiUrl()}?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N${shipmentNumber},-A,-A,-A,-A,-A,-A,-N,-ARET-${request.returnRequestNumber}`;
      
      return {
        success: true,
        providerShipmentId: randomNumber || shipmentNumber,
        trackingNumber: shipmentNumber,
        labelUrl,
        providerResponse: response,
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
   * Returns two shipments with two separate labels
   */
  async createExchangeShipments(request: CreateExchangeShipmentsRequest): Promise<CreateExchangeShipmentsResponse> {
    this.ensureConfigured();
    
    console.log('[Focus] Creating exchange shipments for:', request.returnRequestNumber);
    
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
      // Return pickup was created but delivery failed
      // We still return partial success with the return shipment
      console.warn('[Focus] Exchange: Return created but delivery failed');
      return {
        success: false,
        returnShipment: {
          providerShipmentId: returnResult.providerShipmentId!,
          trackingNumber: returnResult.trackingNumber!,
          labelUrl: returnResult.labelUrl!,
        },
        errorCode: deliveryResult.errorCode,
        errorMessage: `משלוח האיסוף נוצר, אבל שגיאה במשלוח המסירה: ${deliveryResult.errorMessage}`,
      };
    }
    
    console.log('[Focus] Exchange shipments created successfully');
    console.log('[Focus] Return tracking:', returnResult.trackingNumber);
    console.log('[Focus] Delivery tracking:', deliveryResult.trackingNumber);
    
    return {
      success: true,
      returnShipment: {
        providerShipmentId: returnResult.providerShipmentId!,
        trackingNumber: returnResult.trackingNumber!,
        labelUrl: returnResult.labelUrl!,
      },
      deliveryShipment: {
        providerShipmentId: deliveryResult.providerShipmentId!,
        trackingNumber: deliveryResult.trackingNumber!,
        labelUrl: deliveryResult.labelUrl!,
      },
    };
  }
}

