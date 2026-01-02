/**
 * PayPlus Payment Provider
 * Full integration with PayPlus payment gateway
 * Docs: https://docs.payplus.co.il/reference/introduction
 */

import crypto from 'crypto';
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
} from '../types';

// PayPlus API Response types
interface PayPlusResponse<T = unknown> {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data?: T;
}

interface GenerateLinkData {
  page_request_uid: string;
  payment_page_link: string;
}

interface IPNData {
  transaction_uid: string;
  page_request_uid?: string;
  status_code: string;
  approval_num?: string;
  voucher_num?: string;
  amount: number;
  currency_code: string;
  more_info?: string;
  four_digits?: string;
  brand_name?: string;
  expiry_month?: string;
  expiry_year?: string;
  transaction_type?: string;
  customer?: {
    customer_name?: string;
    email?: string;
    phone?: string;
  };
}

interface RefundData {
  transaction_uid: string;
  status_code: string;
  amount: number;
}

// PayPlus Callback body structure
interface PayPlusCallbackBody {
  transaction_uid: string;
  page_request_uid?: string;
  status_code: string;
  approval_num?: string;
  voucher_num?: string;
  amount: number;
  currency_code: string;
  more_info?: string;
  more_info_1?: string;
  more_info_2?: string;
  four_digits?: string;
  brand_name?: string;
  expiry_month?: string;
  expiry_year?: string;
  number_of_payments?: number;
  type?: string;
  customer?: {
    customer_name?: string;
    email?: string;
    phone?: string;
    customer_uid?: string;
  };
  error?: {
    error_code?: string;
    error_message?: string;
  };
}

export class PayPlusProvider extends BasePaymentProvider {
  readonly providerType: PaymentProviderType = 'payplus';
  readonly displayName = 'PayPlus';
  
  // PayPlus URLs
  private static readonly STAGING_URL = 'https://restapidev.payplus.co.il/api/v1.0';
  private static readonly PRODUCTION_URL = 'https://restapi.payplus.co.il/api/v1.0';
  
  // Status code mapping
  private static readonly STATUS_MAP: Record<string, TransactionStatus> = {
    '000': 'success',
    '001': 'processing',
    '002': 'pending',
    '003': 'failed',
    '004': 'cancelled',
  };
  
  /**
   * Get API URL based on test mode
   */
  protected getApiUrl(): string {
    this.ensureConfigured();
    return this.config!.testMode 
      ? PayPlusProvider.STAGING_URL 
      : PayPlusProvider.PRODUCTION_URL;
  }
  
  /**
   * Validate PayPlus specific configuration
   */
  protected validateConfig(config: PaymentProviderConfig): void {
    const { credentials } = config;
    
    if (!credentials.apiKey) {
      throw new Error('PayPlus: API Key is required');
    }
    if (!credentials.secretKey) {
      throw new Error('PayPlus: Secret Key is required');
    }
    if (!credentials.paymentPageUid) {
      throw new Error('PayPlus: Payment Page UID is required');
    }
  }
  
  /**
   * Make authenticated request to PayPlus API
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
      'api-key': this.config!.credentials.apiKey!,
      'secret-key': this.config!.credentials.secretKey!,
      ...additionalHeaders,
    };
    
    this.log(`Request to ${endpoint}`, { method, body });
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json() as T;
      this.log(`Response from ${endpoint}`, data);
      
      return data;
    } catch (error) {
      this.logError(`Request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Initiate payment - Generate payment link
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    this.ensureConfigured();
    
    try {
      // Build PayPlus request body
      const body: Record<string, unknown> = {
        payment_page_uid: this.config!.credentials.paymentPageUid,
        charge_method: 1, // J4 - Direct charge
        amount: this.formatAmount(request.amount),
        currency_code: request.currency || 'ILS',
        sendEmailApproval: request.sendEmailOnSuccess ?? true,
        sendEmailFailure: request.sendEmailOnFailure ?? false,
        language_code: request.language || 'he',
        
        // URLs
        refURL_success: request.successUrl,
        refURL_failure: request.failureUrl,
        refURL_cancel: request.cancelUrl || request.failureUrl,
        refURL_callback: this.buildCallbackUrl(request.storeSlug),
        send_failure_callback: true,
        
        // Store our reference in more_info for callback identification
        more_info: request.orderReference,
        
        // Customer
        customer: {
          customer_name: request.customer.name,
          email: request.customer.email,
          phone: request.customer.phone || '',
          vat_number: request.customer.vatNumber || '',
          address: request.customer.address || '',
          city: request.customer.city || '',
          postal_code: request.customer.postalCode || '',
          country_iso: request.customer.countryIso || 'IL',
        },
        
        // Items
        items: request.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: this.formatAmount(item.price),
          ...(item.imageUrl && { image_url: item.imageUrl }),
          ...(item.isShipping && { shipping: true }),
        })),
        
        // Page expiry - 30 minutes
        expiry_datetime: '30',
      };
      
      const response = await this.makeRequest<PayPlusResponse<GenerateLinkData>>(
        '/PaymentPages/generateLink',
        'POST',
        body
      );
      
      if (response.results.status === 'success' && response.data) {
        return {
          success: true,
          paymentUrl: response.data.payment_page_link,
          providerRequestId: response.data.page_request_uid,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      return {
        success: false,
        errorCode: String(response.results.code),
        errorMessage: response.results.description,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('initiatePayment failed', error);
      return {
        success: false,
        errorCode: 'PAYPLUS_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Refund a transaction
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    this.ensureConfigured();
    
    try {
      const body = {
        transaction_uid: request.providerTransactionId,
        amount: this.formatAmount(request.amount),
        more_info: request.reason || `Refund for order ${request.orderId}`,
      };
      
      const response = await this.makeRequest<PayPlusResponse<RefundData>>(
        '/Transactions/RefundByTransactionUID',
        'POST',
        body
      );
      
      if (response.results.status === 'success' && response.data) {
        return {
          success: true,
          providerTransactionId: response.data.transaction_uid,
          refundedAmount: response.data.amount,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      return {
        success: false,
        errorCode: String(response.results.code),
        errorMessage: response.results.description,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('refund failed', error);
      return {
        success: false,
        errorCode: 'PAYPLUS_REFUND_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get transaction status via IPN
   */
  async getTransactionStatus(request: GetTransactionStatusRequest): Promise<TransactionStatusResponse> {
    this.ensureConfigured();
    
    try {
      const body: Record<string, unknown> = {};
      
      if (request.providerRequestId) {
        body.payment_request_uid = request.providerRequestId;
      } else if (request.providerTransactionId) {
        body.transaction_uid = request.providerTransactionId;
      } else {
        throw new Error('Either providerRequestId or providerTransactionId is required');
      }
      
      const response = await this.makeRequest<PayPlusResponse<IPNData>>(
        '/PaymentPages/ipn',
        'POST',
        body
      );
      
      if (response.results.status === 'success' && response.data) {
        const data = response.data;
        
        return {
          success: true,
          status: this.mapStatusCode(data.status_code),
          transactionId: data.transaction_uid,
          approvalNumber: data.approval_num,
          amount: data.amount,
          currency: data.currency_code,
          cardBrand: data.brand_name,
          cardLastFour: data.four_digits,
          cardExpiry: data.expiry_month && data.expiry_year 
            ? `${data.expiry_month}/${data.expiry_year}` 
            : undefined,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      return {
        success: false,
        errorCode: String(response.results.code),
        errorMessage: response.results.description,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('getTransactionStatus failed', error);
      return {
        success: false,
        errorCode: 'PAYPLUS_STATUS_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Validate webhook signature from PayPlus
   */
  validateWebhook(body: unknown, headers: Record<string, string>): WebhookValidationResult {
    this.ensureConfigured();
    
    // Check User-Agent
    const userAgent = headers['user-agent'] || headers['User-Agent'];
    if (userAgent !== 'PayPlus') {
      return {
        isValid: false,
        error: 'Invalid User-Agent header',
      };
    }
    
    // Check hash signature
    const hash = headers['hash'] || headers['Hash'];
    if (!hash) {
      return {
        isValid: false,
        error: 'Missing hash header',
      };
    }
    
    // Generate expected hash
    const secretKey = this.config!.credentials.secretKey!;
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(bodyString)
      .digest('base64');
    
    if (hash !== expectedHash) {
      return {
        isValid: false,
        error: 'Invalid hash signature',
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Parse callback/webhook body from PayPlus
   */
  parseCallback(body: unknown): ParsedCallback {
    // Handle both JSON and form data formats
    let data: PayPlusCallbackBody;
    
    if (typeof body === 'object' && body !== null) {
      // Check if it's already an object (from JSON.parse)
      data = body as PayPlusCallbackBody;
    } else if (typeof body === 'string') {
      // Try to parse as JSON string
      try {
        data = JSON.parse(body) as PayPlusCallbackBody;
      } catch {
        // If that fails, treat as empty object
        this.logError('Failed to parse callback body', { body });
        data = {} as PayPlusCallbackBody;
      }
    } else {
      data = {} as PayPlusCallbackBody;
    }
    
    // Log raw data for debugging
    this.log('Parsing callback body', { 
      hasData: !!data,
      keys: Object.keys(data || {}),
      statusCode: data?.status_code,
      transactionUid: data?.transaction_uid,
      pageRequestUid: data?.page_request_uid,
      moreInfo: data?.more_info,
    });
    
    // Determine success based on status_code
    const statusCode = data?.status_code || '';
    const status = this.mapStatusCode(statusCode);
    const isSuccess = status === 'success';
    
    return {
      success: isSuccess,
      status,
      providerTransactionId: data?.transaction_uid || '',
      providerRequestId: data?.page_request_uid,
      approvalNumber: data?.approval_num || data?.voucher_num,
      amount: data?.amount ? Number(data.amount) : 0,
      currency: data?.currency_code || 'ILS',
      
      // Our reference stored in more_info
      orderReference: data?.more_info,
      
      // Card info
      cardBrand: data?.brand_name,
      cardLastFour: data?.four_digits,
      
      // Error info if failed
      errorCode: data?.error?.error_code,
      errorMessage: data?.error?.error_message,
      
      // Raw data for logging
      rawData: (data || {}) as unknown as Record<string, unknown>,
    };
  }
  
  /**
   * Test API connection by generating a minimal test payment link
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    this.ensureConfigured();
    
    try {
      // Test by generating a minimal payment link (won't be used)
      const body = {
        payment_page_uid: this.config!.credentials.paymentPageUid,
        charge_method: 1,
        amount: 1, // 1 agora for test
        currency_code: 'ILS',
        language_code: 'he',
        expiry_datetime: '1', // Expire in 1 minute
        customer: {
          customer_name: 'Test',
          email: 'test@test.com',
        },
        items: [{
          name: 'Test Connection',
          quantity: 1,
          price: 1,
        }],
      };
      
      const url = `${this.getApiUrl()}/PaymentPages/generateLink`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config!.credentials.apiKey!,
          'secret-key': this.config!.credentials.secretKey!,
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json() as PayPlusResponse;
      this.log('Test connection response', data);
      
      if (data.results.status === 'success') {
        return { success: true };
      }
      
      return {
        success: false,
        error: data.results.description || 'החיבור נכשל - בדוק את המפתחות',
      };
    } catch (error) {
      this.logError('Test connection failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'החיבור נכשל',
      };
    }
  }
  
  // ============ PRIVATE HELPERS ============
  
  /**
   * Build callback URL for webhooks
   */
  private buildCallbackUrl(storeSlug: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/payments/payplus/callback?store=${storeSlug}`;
  }
  
  /**
   * Map PayPlus status code to our status
   */
  private mapStatusCode(statusCode: string): TransactionStatus {
    // PayPlus uses '000' for success
    if (statusCode === '000') return 'success';
    
    // Check our map
    const mapped = PayPlusProvider.STATUS_MAP[statusCode];
    if (mapped) return mapped;
    
    // Default to failed for unknown codes
    return 'failed';
  }
}

