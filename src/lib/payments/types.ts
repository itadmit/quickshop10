/**
 * Payment Provider Types
 * Shared interfaces for all payment providers
 */

// Provider identifiers
export type PaymentProviderType = 'payplus' | 'placard' | 'quick_payments';

// Transaction types
export type TransactionType = 'charge' | 'refund' | 'void' | 'authorization';
export type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

// ============ REQUEST TYPES ============

export interface PaymentCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  vatNumber?: string; // עוסק מורשה
  address?: string;
  city?: string;
  postalCode?: string;
  countryIso?: string;
}

export interface PaymentItem {
  name: string;
  sku?: string;
  quantity: number;
  price: number; // per unit
  imageUrl?: string;
  isShipping?: boolean;
}

export interface InitiatePaymentRequest {
  // Store context
  storeId: string;
  storeSlug: string;
  
  // Order reference (saved in pending_payments, linked after success)
  orderReference: string; // Our internal reference
  
  // Amounts
  amount: number;
  currency?: string; // Default: ILS
  
  // Customer info
  customer: PaymentCustomer;
  
  // Cart items
  items: PaymentItem[];
  
  // Discount if applied
  discountCode?: string;
  discountAmount?: number;
  
  // Influencer tracking
  influencerId?: string;
  
  // Full order payload to be saved
  orderData: Record<string, unknown>;
  
  // URLs for redirect flow
  successUrl: string;
  failureUrl: string;
  cancelUrl?: string;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  
  // Optional settings
  language?: string; // he, en
  sendEmailOnSuccess?: boolean;
  sendEmailOnFailure?: boolean;
}

export interface RefundRequest {
  storeId: string;
  transactionId: string; // Our transaction ID
  providerTransactionId: string; // Provider's transaction ID
  amount: number; // Amount to refund (can be partial)
  reason?: string;
  orderId?: string;
}

export interface GetTransactionStatusRequest {
  storeId: string;
  providerRequestId?: string; // page_request_uid for PayPlus
  providerTransactionId?: string; // transaction_uid for PayPlus
}

// ============ RESPONSE TYPES ============

export interface InitiatePaymentResponse {
  success: boolean;
  
  // If success
  paymentUrl?: string; // URL to redirect user to
  providerRequestId?: string; // page_request_uid for tracking
  
  // If error
  errorCode?: string;
  errorMessage?: string;
  
  // Raw provider response
  providerResponse?: Record<string, unknown>;
}

export interface RefundResponse {
  success: boolean;
  
  // If success
  providerTransactionId?: string; // New transaction ID from provider
  refundedAmount?: number;
  
  // If error
  errorCode?: string;
  errorMessage?: string;
  
  // Raw provider response
  providerResponse?: Record<string, unknown>;
}

export interface TransactionStatusResponse {
  success: boolean;
  
  // Transaction details
  status?: TransactionStatus;
  transactionId?: string;
  approvalNumber?: string;
  amount?: number;
  currency?: string;
  
  // Card info (masked)
  cardBrand?: string; // visa, mastercard, etc.
  cardLastFour?: string;
  cardExpiry?: string;
  
  // Timestamps
  processedAt?: Date;
  
  // Error
  errorCode?: string;
  errorMessage?: string;
  
  // Raw response
  providerResponse?: Record<string, unknown>;
}

// ============ CALLBACK TYPES ============

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ParsedCallback {
  success: boolean;
  
  // Transaction info
  status: TransactionStatus;
  providerTransactionId: string;
  providerRequestId?: string;
  approvalNumber?: string;
  amount: number;
  currency: string;
  
  // Our reference (passed in more_info)
  orderReference?: string;
  
  // Card info
  cardBrand?: string;
  cardLastFour?: string;
  
  // Error if failed
  errorCode?: string;
  errorMessage?: string;
  
  // Raw data
  rawData: Record<string, unknown>;
}

// ============ PROVIDER CONFIG ============

export interface PaymentProviderCredentials {
  // PayPlus specific
  apiKey?: string;
  secretKey?: string;
  terminalUid?: string;
  cashierUid?: string;
  paymentPageUid?: string;
  
  // Generic fields for other providers
  merchantId?: string;
  publicKey?: string;
  privateKey?: string;
  
  // Allow any additional fields
  [key: string]: string | undefined;
}

export interface PaymentProviderSettings {
  // Environment
  testMode?: boolean;
  apiUrl?: string;
  
  // Behavior
  sendEmailOnSuccess?: boolean;
  sendEmailOnFailure?: boolean;
  defaultLanguage?: string;
  
  // Allow any additional settings
  [key: string]: unknown;
}

export interface PaymentProviderConfig {
  provider: PaymentProviderType;
  credentials: PaymentProviderCredentials;
  settings: PaymentProviderSettings;
  isActive: boolean;
  testMode: boolean;
}

// ============ PROVIDER INTERFACE ============

export interface IPaymentProvider {
  // Provider identifier
  readonly providerType: PaymentProviderType;
  readonly displayName: string;
  
  // Configuration
  configure(config: PaymentProviderConfig): void;
  
  // Core operations
  initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse>;
  refund(request: RefundRequest): Promise<RefundResponse>;
  getTransactionStatus(request: GetTransactionStatusRequest): Promise<TransactionStatusResponse>;
  
  // Webhook handling
  validateWebhook(body: unknown, headers: Record<string, string>): WebhookValidationResult;
  parseCallback(body: unknown): ParsedCallback;
  
  // Health check
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

// ============ PROVIDER DISPLAY INFO ============

export interface PaymentProviderInfo {
  type: PaymentProviderType;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  logo?: string;
  supportedFeatures: {
    creditCard: boolean;
    bit: boolean;
    applePay: boolean;
    googlePay: boolean;
    paypal: boolean;
    recurring: boolean;
  };
  requiredCredentials: {
    key: string;
    label: string;
    labelHe: string;
    type: 'text' | 'password';
    required: boolean;
  }[];
}

