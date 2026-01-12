/**
 * Shipping Provider Types
 * Shared interfaces for all shipping providers
 * 
 * Architecture: Same modular pattern as payments
 * Each provider has one file that handles everything
 */

// Provider identifiers
export type ShippingProviderType = 'focus' | 'cheetah' | 'hfd' | 'boxit' | 'baldar' | 'manual';

// Shipment status
export type ShipmentStatus = 
  | 'pending'      // ממתין לשליחה
  | 'created'      // נוצר אצל הספק
  | 'picked_up'    // נאסף
  | 'in_transit'   // בדרך
  | 'out_for_delivery' // יצא לחלוקה
  | 'delivered'    // נמסר
  | 'failed'       // נכשל
  | 'returned'     // הוחזר
  | 'cancelled';   // בוטל

// ============ REQUEST TYPES ============

export interface ShipmentAddress {
  name: string;
  phone: string;
  email?: string;
  street: string;
  city: string;
  zipCode?: string;
  apartment?: string;
  floor?: string;
  entrance?: string;
  notes?: string;
}

export interface ShipmentPackage {
  weight?: number;      // kg
  width?: number;       // cm
  height?: number;      // cm
  length?: number;      // cm
  quantity?: number;    // number of packages
  description?: string;
}

export interface CreateShipmentRequest {
  // Store context
  storeId: string;
  
  // Order reference
  orderId: string;
  orderNumber: string;
  
  // Addresses
  recipient: ShipmentAddress;
  sender?: ShipmentAddress; // If not provided, use store address
  
  // Package details
  package?: ShipmentPackage;
  
  // Payment
  collectOnDelivery?: number; // COD amount if applicable
  
  // Options
  notes?: string;
  requireSignature?: boolean;
  
  // Items for customs/description
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface GetTrackingRequest {
  storeId: string;
  trackingNumber?: string;
  providerShipmentId?: string;
}

export interface CancelShipmentRequest {
  storeId: string;
  providerShipmentId: string;
  reason?: string;
}

// ============ RESPONSE TYPES ============

export interface CreateShipmentResponse {
  success: boolean;
  
  // If success
  providerShipmentId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  estimatedDelivery?: Date;
  
  // If error
  errorCode?: string;
  errorMessage?: string;
  
  // Raw provider response
  providerResponse?: Record<string, unknown>;
}

export interface TrackingEvent {
  timestamp: Date;
  status: ShipmentStatus;
  description: string;
  location?: string;
}

export interface TrackingInfo {
  success: boolean;
  
  // Current status
  status?: ShipmentStatus;
  statusDescription?: string;
  
  // Tracking history
  events?: TrackingEvent[];
  
  // Delivery info
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  deliveredTo?: string;
  
  // Error
  errorCode?: string;
  errorMessage?: string;
  
  providerResponse?: Record<string, unknown>;
}

export interface CancelShipmentResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  providerResponse?: Record<string, unknown>;
}

export interface LabelResponse {
  success: boolean;
  labelUrl?: string;
  labelData?: string; // Base64 PDF
  errorCode?: string;
  errorMessage?: string;
}

// ============ PROVIDER CONFIG ============

export interface ShippingProviderCredentials {
  // Generic
  apiKey?: string;
  secretKey?: string;
  username?: string;
  password?: string;
  customerId?: string;
  
  // Allow any additional fields
  [key: string]: string | undefined;
}

export interface ShippingProviderSettings {
  // Environment
  testMode?: boolean;
  apiUrl?: string;
  
  // Auto-send settings
  autoSendOnOrder?: boolean;      // שלח אוטומטית כשהזמנה משולמת
  autoSendOnFulfillment?: boolean; // שלח כשמסמנים fulfilled
  
  // Default package
  defaultWeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultLength?: number;
  
  // Sender address (store address)
  senderName?: string;
  senderPhone?: string;
  senderStreet?: string;
  senderCity?: string;
  senderZipCode?: string;
  
  // Allow any additional settings
  [key: string]: unknown;
}

export interface ShippingProviderConfig {
  provider: ShippingProviderType;
  credentials: ShippingProviderCredentials;
  settings: ShippingProviderSettings;
  isActive: boolean;
  testMode: boolean;
}

// ============ PROVIDER INTERFACE ============

export interface IShippingProvider {
  // Provider identifier
  readonly providerType: ShippingProviderType;
  readonly displayName: string;
  
  // Configuration
  configure(config: ShippingProviderConfig): void;
  
  // Core operations
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResponse>;
  getTrackingInfo(request: GetTrackingRequest): Promise<TrackingInfo>;
  cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse>;
  
  // Label
  getLabel(providerShipmentId: string): Promise<LabelResponse>;
  
  // Health check
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

// ============ PROVIDER DISPLAY INFO ============

export interface ShippingProviderInfo {
  type: ShippingProviderType;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  logo?: string;
  website?: string;
  supportedFeatures: {
    tracking: boolean;
    labels: boolean;
    pickupPoints: boolean;
    cod: boolean; // Cash on delivery
    returns: boolean;
    scheduling: boolean;
  };
  requiredCredentials: {
    key: string;
    label: string;
    labelHe: string;
    type: 'text' | 'password';
    required: boolean;
  }[];
}

