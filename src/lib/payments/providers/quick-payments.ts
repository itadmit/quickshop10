/**
 * Quick Payments Provider
 * White-label solution based on PayMe with Hosted Fields (JSAPI)
 * 
 * Key difference from PayPlus/Pelecard:
 * - No redirect to external page
 * - Frontend loads PayMe Hosted Fields for card input
 * - Frontend calls tokenize() to get buyer_key
 * - Backend uses buyer_key with generate-sale API
 * 
 * Docs: Based on PayMe API (see docs/payme_quickpayments.md)
 */

import { BasePaymentProvider } from './base';
import type {
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
  TransactionStatus,
  RedirectParseResult,
} from '../types';

// ============ QUICK PAYMENTS SPECIFIC TYPES ============

// Request to generate a sale with a token (buyer_key)
export interface GenerateSaleRequest {
  storeId: string;
  buyerKey: string; // Token from frontend tokenization
  amount: number; // In agorot (cents), e.g., 10000 = 100.00 ILS
  currency?: string; // Default: ILS
  productName: string;
  transactionId?: string; // Our order reference
  installments?: number; // 1-12 or 103/106/109/112 for range
  
  // Customer info
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerSocialId?: string;
  
  // Business invoice
  businessName?: string;
  businessCode?: string; // VAT identifier
  
  // Callbacks
  callbackUrl?: string;
  returnUrl?: string;
  
  // Options
  sendNotification?: boolean;
  language?: string; // he/en
}

export interface GenerateSaleResponse {
  success: boolean;
  
  // If successful payment
  saleId?: string; // payme_sale_id
  saleCode?: number; // payme_sale_code
  status?: 'completed' | 'pending' | 'failed';
  approvalNumber?: string;
  
  // If 3DS challenge required
  requires3DS?: boolean;
  redirectUrl?: string;
  
  // Error info
  errorCode?: string;
  errorMessage?: string;
  
  // Raw response
  providerResponse?: Record<string, unknown>;
}

// PayMe API response structures
interface PayMeApiResponse {
  status_code: number; // 0 = success, 1 = error, 5 = 3DS redirect
  status_message?: string;
  status_error_code?: number | null;
  status_error_details?: string | null;
}

interface PayMeGenerateSaleResponse extends PayMeApiResponse {
  sale_url?: string;
  payme_sale_id?: string;
  payme_sale_code?: number;
  price?: number;
  transaction_id?: string;
  currency?: string;
  
  // After successful payment with token
  payme_status?: 'success' | 'failure';
  sale_status?: 'completed' | 'initial' | 'failure';
  payme_sale_status?: string;
  transaction_cc_auth_number?: string;
  payme_transaction_auth_number?: string;
  '3ds_sale'?: boolean;
  redirect_url?: string;
  
  // Card info
  buyer_key?: string;
}

interface PayMeRefundResponse extends PayMeApiResponse {
  payme_status?: string;
  sale_status?: string;
  payme_transaction_id?: string;
  payme_transaction_total?: number;
  payme_transaction_auth_number?: string;
  payme_transaction_card_brand?: string;
  sale_refund_buffer?: number;
  payme_signature?: string;
}

interface PayMeGetSaleResponse extends PayMeApiResponse {
  payme_sale_id?: string;
  sale_status?: string;
  price?: number;
  currency?: string;
  transaction_auth_number?: string;
  card_brand?: string;
  four_digits?: string;
  expiry_month?: string;
  expiry_year?: string;
  buyer_name?: string;
  buyer_email?: string;
}

// Callback structure from PayMe
interface PayMeCallbackBody {
  notify_type?: string; // 'sale-complete', 'sale-failure', 'sale-refund'
  payme_sale_id?: string;
  payme_sale_code?: number;
  sale_status?: string;
  sale_price?: number;
  sale_currency?: string;
  transaction_id?: string; // Our reference
  buyer_key?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  transaction_auth_number?: string;
  payme_transaction_id?: string;
  four_digits?: string;
  card_brand?: string;
  installments?: number;
  seller_payme_id?: string;
  payme_signature?: string;
  status_code?: string;
  status_error_code?: string;
  status_error_details?: string;
}

export class QuickPaymentsProvider extends BasePaymentProvider {
  readonly providerType: PaymentProviderType = 'quick_payments';
  readonly displayName = 'Quick Payments';
  
  // PayMe URLs
  private static readonly SANDBOX_URL = 'https://sandbox.payme.io/api';
  private static readonly PRODUCTION_URL = 'https://live.payme.io/api';
  
  // Status code mapping
  private static readonly STATUS_MAP: Record<string, TransactionStatus> = {
    'completed': 'success',
    'success': 'success',
    'initial': 'pending',
    'pending': 'pending',
    'failure': 'failed',
    'failed': 'failed',
    'refunded': 'cancelled',
  };
  
  /**
   * Get API URL based on test mode
   */
  protected getApiUrl(): string {
    this.ensureConfigured();
    return this.config!.testMode 
      ? QuickPaymentsProvider.SANDBOX_URL 
      : QuickPaymentsProvider.PRODUCTION_URL;
  }
  
  /**
   * Validate Quick Payments configuration
   */
  protected validateConfig(config: PaymentProviderConfig): void {
    const { credentials } = config;
    
    if (!credentials.sellerPaymeId) {
      throw new Error('Quick Payments: Seller PayMe ID (MPL) is required');
    }
    if (!credentials.sellerPublicKey) {
      throw new Error('Quick Payments: Seller Public Key is required');
    }
    // sellerSecret is optional for some operations
  }
  
  /**
   * Make authenticated request to PayMe API
   */
  protected async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    this.ensureConfigured();
    
    const url = `${this.getApiUrl()}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
    
    // Add merchant key header if available
    if (this.config!.credentials.sellerPaymeId) {
      headers['PayMe-Merchant-Key'] = this.config!.credentials.sellerPaymeId;
    }
    
    this.log(`Request to ${endpoint}`, { method, body: JSON.stringify(body).substring(0, 500) });
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();
      
      this.log(`Response from ${endpoint}`, {
        status: response.status,
        contentType,
        body: responseText.substring(0, 500),
      });
      
      if (!contentType.includes('application/json')) {
        throw new Error(`Quick Payments API returned non-JSON: ${response.status} ${responseText.substring(0, 100)}`);
      }
      
      try {
        return JSON.parse(responseText) as T;
      } catch {
        throw new Error(`Invalid JSON from Quick Payments: ${responseText.substring(0, 100)}`);
      }
    } catch (error) {
      this.logError(`Request to ${endpoint} failed`, error);
      throw error;
    }
  }
  
  // ============ CORE PAYMENT OPERATIONS ============
  
  /**
   * Generate a sale with a buyer token (from frontend tokenization)
   * This is the main payment method for Quick Payments
   */
  async generateSale(request: GenerateSaleRequest): Promise<GenerateSaleResponse> {
    this.ensureConfigured();
    
    try {
      // Build request body
      const body: Record<string, unknown> = {
        seller_payme_id: this.config!.credentials.sellerPaymeId,
        sale_price: Math.round(request.amount * 100), // Convert to agorot
        currency: request.currency || 'ILS',
        product_name: request.productName,
        buyer_key: request.buyerKey, // Token from frontend
        installments: String(request.installments || 1),
        sale_type: 'sale',
        sale_payment_method: 'credit-card',
      };
      
      if (request.transactionId) {
        body.transaction_id = request.transactionId;
      }
      
      if (request.callbackUrl) {
        body.sale_callback_url = request.callbackUrl;
      }
      
      if (request.returnUrl) {
        body.sale_return_url = request.returnUrl;
      }
      
      if (request.sendNotification !== undefined) {
        body.sale_send_notification = request.sendNotification;
      }
      
      if (request.customerEmail) {
        body.sale_email = request.customerEmail;
      }
      
      if (request.customerName) {
        body.sale_name = request.customerName;
      }
      
      if (request.customerPhone) {
        body.sale_mobile = request.customerPhone;
      }
      
      if (request.businessName) {
        body.buyer_business_name = request.businessName;
      }
      
      if (request.businessCode) {
        body.buyer_business_code = request.businessCode;
      }
      
      if (request.language) {
        body.language = request.language;
      }
      
      const response = await this.makeRequest<PayMeGenerateSaleResponse>(
        '/generate-sale',
        'POST',
        body
      );
      
      // Handle different response types
      if (response.status_code === 0) {
        // Success - payment completed
        return {
          success: true,
          saleId: response.payme_sale_id,
          saleCode: response.payme_sale_code,
          status: 'completed',
          approvalNumber: response.transaction_cc_auth_number || response.payme_transaction_auth_number,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      } else if (response.status_code === 5) {
        // 3DS challenge required
        return {
          success: true,
          requires3DS: true,
          redirectUrl: response.redirect_url,
          saleId: response.payme_sale_id,
          status: 'pending',
          providerResponse: response as unknown as Record<string, unknown>,
        };
      } else {
        // Error
        return {
          success: false,
          errorCode: String(response.status_error_code || response.status_code),
          errorMessage: response.status_error_details || response.status_message || 'Payment failed',
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
    } catch (error) {
      this.logError('generateSale failed', error);
      return {
        success: false,
        errorCode: 'QUICK_PAYMENTS_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Initiate payment - for Quick Payments this returns config for frontend
   * The actual payment is done via generateSale after tokenization
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    this.ensureConfigured();
    
    // For Quick Payments, we don't redirect - frontend handles tokenization
    // Return the public key and configuration for frontend
    return {
      success: true,
      // No paymentUrl - frontend uses Hosted Fields
      providerRequestId: `qp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerResponse: {
        type: 'hosted_fields',
        publicKey: this.config!.credentials.sellerPublicKey,
        testMode: this.config!.testMode,
        amount: request.amount,
        currency: request.currency || 'ILS',
        orderReference: request.orderReference,
      },
    };
  }
  
  /**
   * Refund a sale
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    this.ensureConfigured();
    
    try {
      const body: Record<string, unknown> = {
        seller_payme_id: this.config!.credentials.sellerPaymeId,
        payme_sale_id: request.providerTransactionId,
        language: 'he',
      };
      
      // For partial refund
      if (request.amount) {
        body.sale_refund_amount = Math.round(request.amount * 100);
      }
      
      const response = await this.makeRequest<PayMeRefundResponse>(
        '/refund-sale',
        'POST',
        body
      );
      
      if (response.status_code === 0) {
        return {
          success: true,
          providerTransactionId: response.payme_transaction_id,
          refundedAmount: response.payme_transaction_total ? response.payme_transaction_total / 100 : request.amount,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      } else {
        return {
          success: false,
          errorCode: String(response.status_error_code || response.status_code),
          errorMessage: response.status_error_details || 'Refund failed',
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
    } catch (error) {
      this.logError('refund failed', error);
      return {
        success: false,
        errorCode: 'QUICK_PAYMENTS_REFUND_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get transaction/sale status
   */
  async getTransactionStatus(request: GetTransactionStatusRequest): Promise<TransactionStatusResponse> {
    this.ensureConfigured();
    
    try {
      // Use IPN endpoint to get sale status
      const body: Record<string, unknown> = {
        seller_payme_id: this.config!.credentials.sellerPaymeId,
      };
      
      if (request.providerTransactionId) {
        body.payme_sale_id = request.providerTransactionId;
      }
      
      const response = await this.makeRequest<PayMeGetSaleResponse>(
        '/get-sales',
        'POST',
        body
      );
      
      if (response.status_code === 0) {
        const status = this.mapStatus(response.sale_status);
        
        return {
          success: true,
          status,
          transactionId: response.payme_sale_id,
          approvalNumber: response.transaction_auth_number,
          amount: response.price ? response.price / 100 : undefined,
          currency: response.currency,
          cardBrand: response.card_brand,
          cardLastFour: response.four_digits,
          cardExpiry: response.expiry_month && response.expiry_year 
            ? `${response.expiry_month}/${response.expiry_year}` 
            : undefined,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      } else {
        return {
          success: false,
          errorCode: String(response.status_error_code || response.status_code),
          errorMessage: response.status_error_details || 'Failed to get status',
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
    } catch (error) {
      this.logError('getTransactionStatus failed', error);
      return {
        success: false,
        errorCode: 'QUICK_PAYMENTS_STATUS_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  // ============ WEBHOOK/CALLBACK HANDLING ============
  
  /**
   * Validate webhook signature from PayMe
   * PayMe uses MD5 signature based on seller_payme_id + payme_sale_id + seller_secret
   */
  validateWebhook(body: unknown, headers: Record<string, string>): WebhookValidationResult {
    // PayMe sends POST with x-www-form-urlencoded
    // Signature validation would require seller_secret
    // For now, basic validation
    
    if (!body || typeof body !== 'object') {
      return { isValid: false, error: 'Invalid body' };
    }
    
    const data = body as PayMeCallbackBody;
    
    if (!data.payme_sale_id || !data.seller_payme_id) {
      return { isValid: false, error: 'Missing required fields' };
    }
    
    // Verify seller_payme_id matches our config
    if (this.config && data.seller_payme_id !== this.config.credentials.sellerPaymeId) {
      return { isValid: false, error: 'Seller ID mismatch' };
    }
    
    // TODO: Implement MD5 signature verification if seller_secret is available
    // const expectedSignature = md5(seller_payme_id + payme_sale_id + seller_secret)
    
    return { isValid: true };
  }
  
  /**
   * Parse callback body from PayMe
   */
  parseCallback(body: unknown): ParsedCallback {
    const data = body as PayMeCallbackBody;
    
    const status = this.mapStatus(data.sale_status);
    const isSuccess = status === 'success';
    
    return {
      success: isSuccess,
      status,
      providerTransactionId: data.payme_sale_id || '',
      providerRequestId: data.payme_sale_id,
      approvalNumber: data.transaction_auth_number,
      amount: data.sale_price ? data.sale_price / 100 : 0,
      currency: data.sale_currency || 'ILS',
      orderReference: data.transaction_id,
      cardBrand: data.card_brand,
      cardLastFour: data.four_digits,
      errorCode: data.status_error_code,
      errorMessage: data.status_error_details,
      rawData: data as unknown as Record<string, unknown>,
    };
  }
  
  /**
   * Parse redirect params (after 3DS redirect)
   */
  parseRedirectParams(params: Record<string, string | undefined>): RedirectParseResult {
    // PayMe may redirect back with sale info after 3DS
    const saleId = params.payme_sale_id || params.sale_id;
    const statusCode = params.status_code || params.status;
    
    const isSuccess = statusCode === '0' || statusCode === '000' || statusCode === 'success';
    const status = isSuccess ? 'success' : 'failed';
    
    return {
      success: isSuccess,
      status,
      statusCode,
      transactionId: saleId,
      requestId: saleId,
      orderReference: params.transaction_id,
      errorCode: isSuccess ? undefined : statusCode,
      errorMessage: params.error_message,
      rawParams: params,
    };
  }
  
  /**
   * Test connection to PayMe API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    this.ensureConfigured();
    
    try {
      // Try to get seller info or make a simple API call
      // For now, just verify credentials are set
      if (!this.config!.credentials.sellerPaymeId) {
        return { success: false, error: 'Seller PayMe ID not configured' };
      }
      
      if (!this.config!.credentials.sellerPublicKey) {
        return { success: false, error: 'Seller Public Key not configured' };
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  // ============ HELPER METHODS ============
  
  /**
   * Map PayMe status to our TransactionStatus
   */
  private mapStatus(status?: string): TransactionStatus {
    if (!status) return 'pending';
    const lowerStatus = status.toLowerCase();
    return QuickPaymentsProvider.STATUS_MAP[lowerStatus] || 'pending';
  }
  
  /**
   * Get the public key for frontend Hosted Fields
   */
  getPublicKey(): string {
    this.ensureConfigured();
    return this.config!.credentials.sellerPublicKey || '';
  }
  
  /**
   * Check if in test mode
   */
  isTestMode(): boolean {
    return this.config?.testMode ?? true;
  }
}

// Export types for use in other files
export type {
  GenerateSaleRequest as QuickPaymentsGenerateSaleRequest,
  GenerateSaleResponse as QuickPaymentsGenerateSaleResponse,
};

