/**
 * PayPal Payment Provider
 * Full integration with PayPal REST API v2 (Orders API)
 * 
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 * 
 * Flow:
 * 1. Create Order → Get approval URL
 * 2. Redirect customer to PayPal
 * 3. Customer approves → Redirected back with token
 * 4. Capture Order → Complete payment
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

// ============ PAYPAL API TYPES ============

interface PayPalAccessTokenResponse {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

interface PayPalMoney {
  currency_code: string;
  value: string;
}

interface PayPalItem {
  name: string;
  quantity: string;
  unit_amount: PayPalMoney;
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
  sku?: string;
  description?: string;
}

interface PayPalPurchaseUnit {
  reference_id?: string;
  description?: string;
  custom_id?: string;
  invoice_id?: string;
  soft_descriptor?: string;
  items?: PayPalItem[];
  amount: {
    currency_code: string;
    value: string;
    breakdown?: {
      item_total?: PayPalMoney;
      shipping?: PayPalMoney;
      handling?: PayPalMoney;
      tax_total?: PayPalMoney;
      insurance?: PayPalMoney;
      shipping_discount?: PayPalMoney;
      discount?: PayPalMoney;
    };
  };
  shipping?: {
    name?: {
      full_name?: string;
    };
    address?: {
      address_line_1?: string;
      address_line_2?: string;
      admin_area_1?: string; // State/Province
      admin_area_2?: string; // City
      postal_code?: string;
      country_code: string;
    };
  };
}

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalCreateOrderRequest {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: PayPalPurchaseUnit[];
  payment_source?: {
    paypal?: {
      experience_context?: {
        payment_method_preference?: 'IMMEDIATE_PAYMENT_REQUIRED' | 'UNRESTRICTED';
        brand_name?: string;
        locale?: string;
        landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
        shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
        user_action?: 'CONTINUE' | 'PAY_NOW';
        return_url?: string;
        cancel_url?: string;
      };
      email_address?: string;
      name?: {
        given_name?: string;
        surname?: string;
      };
      phone?: {
        phone_type?: 'FAX' | 'HOME' | 'MOBILE' | 'OTHER' | 'PAGER';
        phone_number: {
          national_number: string;
        };
      };
    };
  };
  application_context?: {
    brand_name?: string;
    locale?: string;
    landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
    user_action?: 'CONTINUE' | 'PAY_NOW';
    return_url?: string;
    cancel_url?: string;
  };
}

interface PayPalOrderResponse {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links: PayPalLink[];
  purchase_units?: PayPalPurchaseUnit[];
  payer?: {
    email_address?: string;
    payer_id?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
    phone?: {
      phone_number?: {
        national_number?: string;
      };
    };
    address?: {
      country_code?: string;
    };
  };
  payment_source?: {
    paypal?: {
      email_address?: string;
      account_id?: string;
      name?: {
        given_name?: string;
        surname?: string;
      };
    };
    card?: {
      brand?: string;
      last_digits?: string;
      expiry?: string;
    };
  };
}

interface PayPalCaptureResponse {
  id: string;
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  links?: PayPalLink[];
  payer?: {
    email_address?: string;
    payer_id?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
  purchase_units?: Array<{
    reference_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED' | 'FAILED';
        amount: PayPalMoney;
        final_capture: boolean;
        seller_protection?: {
          status: string;
        };
        create_time: string;
        update_time: string;
      }>;
    };
  }>;
}

interface PayPalRefundResponse {
  id: string;
  status: 'CANCELLED' | 'PENDING' | 'COMPLETED';
  amount?: PayPalMoney;
  note_to_payer?: string;
  seller_payable_breakdown?: {
    gross_amount: PayPalMoney;
    paypal_fee?: PayPalMoney;
    net_amount?: PayPalMoney;
    total_refunded_amount?: PayPalMoney;
  };
  links?: PayPalLink[];
  create_time?: string;
  update_time?: string;
}

interface PayPalWebhookEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  event_type: string;
  summary: string;
  resource: {
    id: string;
    status?: string;
    amount?: PayPalMoney;
    custom_id?: string;
    invoice_id?: string;
    [key: string]: unknown;
  };
  links?: PayPalLink[];
}

interface PayPalError {
  name: string;
  message: string;
  debug_id?: string;
  details?: Array<{
    field?: string;
    value?: string;
    location?: string;
    issue: string;
    description: string;
  }>;
}

export class PayPalProvider extends BasePaymentProvider {
  readonly providerType: PaymentProviderType = 'paypal';
  readonly displayName = 'PayPal';
  
  // PayPal URLs
  private static readonly SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
  private static readonly PRODUCTION_URL = 'https://api-m.paypal.com';
  
  // Token cache
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  
  // Status code mapping
  private static readonly STATUS_MAP: Record<string, TransactionStatus> = {
    'CREATED': 'pending',
    'SAVED': 'pending',
    'APPROVED': 'processing',
    'VOIDED': 'cancelled',
    'COMPLETED': 'success',
    'PAYER_ACTION_REQUIRED': 'pending',
  };
  
  /**
   * Get API URL based on test mode
   */
  protected getApiUrl(): string {
    this.ensureConfigured();
    return this.config!.testMode 
      ? PayPalProvider.SANDBOX_URL 
      : PayPalProvider.PRODUCTION_URL;
  }
  
  /**
   * Validate PayPal configuration
   */
  protected validateConfig(config: PaymentProviderConfig): void {
    const { credentials } = config;
    
    if (!credentials.clientId) {
      throw new Error('PayPal: Client ID is required');
    }
    if (!credentials.clientSecret) {
      throw new Error('PayPal: Client Secret is required');
    }
  }
  
  /**
   * Get access token using OAuth 2.0 Client Credentials
   */
  private async getAccessToken(): Promise<string> {
    this.ensureConfigured();
    
    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && this.tokenExpiresAt > Date.now() + 60000) {
      return this.accessToken;
    }
    
    const url = `${this.getApiUrl()}/v1/oauth2/token`;
    const credentials = Buffer.from(
      `${this.config!.credentials.clientId}:${this.config!.credentials.clientSecret}`
    ).toString('base64');
    
    this.log('Fetching access token');
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logError('Failed to get access token', { status: response.status, body: errorText });
        throw new Error(`PayPal auth failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json() as PayPalAccessTokenResponse;
      
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
      
      this.log('Access token obtained', { expiresIn: data.expires_in });
      
      return this.accessToken;
    } catch (error) {
      this.logError('getAccessToken failed', error);
      throw error;
    }
  }
  
  /**
   * Make authenticated request to PayPal API
   */
  protected async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH',
    body?: Record<string, unknown>,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    this.ensureConfigured();
    
    const accessToken = await this.getAccessToken();
    const url = `${this.getApiUrl()}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `QS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...additionalHeaders,
    };
    
    this.log(`Request to ${endpoint}`, { method, body: body ? JSON.stringify(body).substring(0, 500) : undefined });
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const responseText = await response.text();
      
      this.log(`Response from ${endpoint}`, {
        status: response.status,
        bodyPreview: responseText.substring(0, 300),
      });
      
      // Handle empty response (some endpoints return 204)
      if (!responseText) {
        return {} as T;
      }
      
      let data: T;
      try {
        data = JSON.parse(responseText) as T;
      } catch {
        this.logError(`Failed to parse response from ${endpoint}`, { responseText });
        throw new Error(`Invalid JSON from PayPal: ${responseText.substring(0, 100)}`);
      }
      
      // Check for PayPal error response
      if (!response.ok) {
        const errorData = data as unknown as PayPalError;
        throw new Error(
          errorData.message || 
          errorData.details?.[0]?.description || 
          `PayPal API error: ${response.status}`
        );
      }
      
      return data;
    } catch (error) {
      this.logError(`Request to ${endpoint} failed`, error);
      throw error;
    }
  }
  
  // ============ CORE PAYMENT OPERATIONS ============
  
  /**
   * Initiate payment - Create PayPal order and return approval URL
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    this.ensureConfigured();
    
    try {
      const currency = request.currency || 'ILS';
      const totalAmount = this.formatAmount(request.amount);
      
      // Calculate item total (excluding shipping and discount)
      let itemTotal = 0;
      const paypalItems: PayPalItem[] = [];
      
      for (const item of request.items) {
        if (!item.isShipping && item.price > 0) {
          const itemPrice = this.formatAmount(item.price);
          itemTotal += item.price * item.quantity;
          
          paypalItems.push({
            name: item.name.substring(0, 127), // PayPal limit
            quantity: String(item.quantity),
            unit_amount: {
              currency_code: currency,
              value: itemPrice.toFixed(2),
            },
            category: 'PHYSICAL_GOODS',
            ...(item.sku && { sku: item.sku.substring(0, 127) }),
          });
        }
      }
      
      // Calculate shipping
      const shippingItem = request.items.find(item => item.isShipping);
      const shippingAmount = shippingItem ? this.formatAmount(shippingItem.price) : 0;
      
      // Calculate discount
      const discountAmount = request.discountAmount ? this.formatAmount(request.discountAmount) : 0;
      
      // Build purchase unit
      const purchaseUnit: PayPalPurchaseUnit = {
        reference_id: request.orderReference,
        custom_id: request.orderReference,
        description: `Order ${request.orderReference}`.substring(0, 127),
        amount: {
          currency_code: currency,
          value: totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: itemTotal.toFixed(2),
            },
            ...(shippingAmount > 0 && {
              shipping: {
                currency_code: currency,
                value: shippingAmount.toFixed(2),
              },
            }),
            ...(discountAmount > 0 && {
              discount: {
                currency_code: currency,
                value: discountAmount.toFixed(2),
              },
            }),
          },
        },
        ...(paypalItems.length > 0 && { items: paypalItems }),
      };
      
      // Add shipping address if provided
      if (request.customer.address && request.customer.city) {
        purchaseUnit.shipping = {
          name: {
            full_name: request.customer.name,
          },
          address: {
            address_line_1: request.customer.address,
            admin_area_2: request.customer.city, // City
            postal_code: request.customer.postalCode || '',
            country_code: request.customer.countryIso || 'IL',
          },
        };
      }
      
      // Build order request
      const orderRequest: PayPalCreateOrderRequest = {
        intent: 'CAPTURE',
        purchase_units: [purchaseUnit],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              brand_name: request.storeSlug.substring(0, 127),
              locale: request.language === 'en' ? 'en-US' : 'he-IL',
              landing_page: 'NO_PREFERENCE',
              shipping_preference: purchaseUnit.shipping ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING',
              user_action: 'PAY_NOW',
              return_url: request.successUrl,
              cancel_url: request.cancelUrl || request.failureUrl,
            },
            ...(request.customer.email && { email_address: request.customer.email }),
            ...(request.customer.name && {
              name: {
                given_name: request.customer.name.split(' ')[0] || request.customer.name,
                surname: request.customer.name.split(' ').slice(1).join(' ') || '',
              },
            }),
            ...(request.customer.phone && {
              phone: {
                phone_type: 'MOBILE',
                phone_number: {
                  national_number: request.customer.phone.replace(/[^0-9]/g, ''),
                },
              },
            }),
          },
        },
      };
      
      // Create order
      const response = await this.makeRequest<PayPalOrderResponse>(
        '/v2/checkout/orders',
        'POST',
        orderRequest as unknown as Record<string, unknown>
      );
      
      // Find approval URL
      const approvalLink = response.links?.find(link => link.rel === 'payer-action');
      const approveLink = response.links?.find(link => link.rel === 'approve');
      const paymentUrl = approvalLink?.href || approveLink?.href;
      
      if (!paymentUrl) {
        this.logError('No approval URL in PayPal response', response);
        return {
          success: false,
          errorCode: 'NO_APPROVAL_URL',
          errorMessage: 'PayPal did not return an approval URL',
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      return {
        success: true,
        paymentUrl,
        providerRequestId: response.id, // PayPal order ID
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('initiatePayment failed', error);
      return {
        success: false,
        errorCode: 'PAYPAL_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown PayPal error',
      };
    }
  }
  
  /**
   * Capture a PayPal order after customer approval
   * This must be called after customer returns from PayPal
   */
  async captureOrder(orderId: string): Promise<{
    success: boolean;
    transactionId?: string;
    captureId?: string;
    amount?: number;
    currency?: string;
    status?: string;
    errorCode?: string;
    errorMessage?: string;
    providerResponse?: Record<string, unknown>;
  }> {
    this.ensureConfigured();
    
    try {
      const response = await this.makeRequest<PayPalCaptureResponse>(
        `/v2/checkout/orders/${orderId}/capture`,
        'POST',
        {}
      );
      
      // Get capture details
      const capture = response.purchase_units?.[0]?.payments?.captures?.[0];
      
      if (response.status === 'COMPLETED' && capture) {
        return {
          success: true,
          transactionId: response.id,
          captureId: capture.id,
          amount: parseFloat(capture.amount.value),
          currency: capture.amount.currency_code,
          status: capture.status,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      return {
        success: false,
        errorCode: response.status || 'CAPTURE_FAILED',
        errorMessage: `Order status: ${response.status}`,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('captureOrder failed', error);
      return {
        success: false,
        errorCode: 'PAYPAL_CAPTURE_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get order details
   */
  async getOrderDetails(orderId: string): Promise<PayPalOrderResponse | null> {
    try {
      return await this.makeRequest<PayPalOrderResponse>(
        `/v2/checkout/orders/${orderId}`,
        'GET'
      );
    } catch (error) {
      this.logError('getOrderDetails failed', error);
      return null;
    }
  }
  
  /**
   * Refund a captured payment
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    this.ensureConfigured();
    
    try {
      // PayPal requires the capture ID for refunds
      // providerTransactionId should be the capture ID
      const captureId = request.providerTransactionId;
      
      const body: Record<string, unknown> = {};
      
      // For partial refund, specify amount
      if (request.amount) {
        body.amount = {
          currency_code: 'ILS', // Default to ILS
          value: this.formatAmount(request.amount).toFixed(2),
        };
      }
      
      if (request.reason) {
        body.note_to_payer = request.reason.substring(0, 255);
      }
      
      const response = await this.makeRequest<PayPalRefundResponse>(
        `/v2/payments/captures/${captureId}/refund`,
        'POST',
        Object.keys(body).length > 0 ? body : undefined
      );
      
      if (response.status === 'COMPLETED' || response.status === 'PENDING') {
        return {
          success: true,
          providerTransactionId: response.id,
          refundedAmount: response.amount ? parseFloat(response.amount.value) : request.amount,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      return {
        success: false,
        errorCode: response.status || 'REFUND_FAILED',
        errorMessage: `Refund status: ${response.status}`,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('refund failed', error);
      return {
        success: false,
        errorCode: 'PAYPAL_REFUND_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get transaction status
   */
  async getTransactionStatus(request: GetTransactionStatusRequest): Promise<TransactionStatusResponse> {
    this.ensureConfigured();
    
    try {
      const orderId = request.providerRequestId || request.providerTransactionId;
      
      if (!orderId) {
        throw new Error('Order ID is required');
      }
      
      const response = await this.makeRequest<PayPalOrderResponse>(
        `/v2/checkout/orders/${orderId}`,
        'GET'
      );
      
      const status = this.mapStatus(response.status);
      
      // Get card info if available
      const cardInfo = response.payment_source?.card;
      
      return {
        success: true,
        status,
        transactionId: response.id,
        amount: response.purchase_units?.[0]?.amount 
          ? parseFloat(response.purchase_units[0].amount.value) 
          : undefined,
        currency: response.purchase_units?.[0]?.amount?.currency_code,
        cardBrand: cardInfo?.brand,
        cardLastFour: cardInfo?.last_digits,
        cardExpiry: cardInfo?.expiry,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('getTransactionStatus failed', error);
      return {
        success: false,
        errorCode: 'PAYPAL_STATUS_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  // ============ WEBHOOK HANDLING ============
  
  /**
   * Validate PayPal webhook signature
   * PayPal uses webhook signature verification
   */
  validateWebhook(body: unknown, headers: Record<string, string>): WebhookValidationResult {
    // For full security, implement PayPal webhook signature verification
    // See: https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/
    
    // Basic validation - check for PayPal webhook headers
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const certUrl = headers['paypal-cert-url'];
    const authAlgo = headers['paypal-auth-algo'];
    const transmissionSig = headers['paypal-transmission-sig'];
    
    if (!transmissionId || !transmissionTime) {
      return {
        isValid: false,
        error: 'Missing PayPal webhook headers',
      };
    }
    
    // TODO: Implement full signature verification using:
    // 1. Fetch PayPal certificate from certUrl
    // 2. Verify signature using authAlgo
    // 3. Compare with transmissionSig
    
    // For now, basic validation only
    this.log('Webhook validation', { transmissionId, transmissionTime });
    
    return { isValid: true };
  }
  
  /**
   * Parse webhook callback from PayPal
   */
  parseCallback(body: unknown): ParsedCallback {
    const data = body as PayPalWebhookEvent;
    
    this.log('Parsing webhook callback', { eventType: data.event_type, resourceId: data.resource?.id });
    
    // Map PayPal event types to our status
    let status: TransactionStatus = 'pending';
    let isSuccess = false;
    
    switch (data.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        status = 'processing';
        break;
      case 'PAYMENT.CAPTURE.COMPLETED':
        status = 'success';
        isSuccess = true;
        break;
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        status = 'failed';
        break;
      case 'PAYMENT.CAPTURE.REFUNDED':
        status = 'cancelled';
        break;
      default:
        status = 'pending';
    }
    
    return {
      success: isSuccess,
      status,
      providerTransactionId: data.resource?.id || '',
      providerRequestId: data.resource?.id,
      amount: data.resource?.amount ? parseFloat(data.resource.amount.value) : 0,
      currency: data.resource?.amount?.currency_code || 'ILS',
      orderReference: data.resource?.custom_id || data.resource?.invoice_id,
      rawData: data as unknown as Record<string, unknown>,
    };
  }
  
  /**
   * Parse redirect params after PayPal approval
   * PayPal redirects with: token (order ID), PayerID
   */
  parseRedirectParams(params: Record<string, string | undefined>): RedirectParseResult {
    this.log('Parsing redirect params', params);
    
    const token = params.token; // PayPal order ID
    const payerId = params.PayerID;
    
    // If we have both token and PayerID, customer approved
    const isApproved = !!(token && payerId);
    
    // Check for cancel
    const isCancelled = params.cancel === 'true' || (!payerId && token);
    
    const status: TransactionStatus = isCancelled ? 'cancelled' : (isApproved ? 'processing' : 'pending');
    
    return {
      success: isApproved,
      status,
      transactionId: token,
      requestId: token, // PayPal order ID
      orderReference: params.ref || params.orderRef,
      errorCode: isCancelled ? 'CANCELLED' : undefined,
      errorMessage: isCancelled ? 'Payment was cancelled' : undefined,
      rawParams: params,
    };
  }
  
  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    this.ensureConfigured();
    
    try {
      // Try to get access token - this validates credentials
      await this.getAccessToken();
      return { success: true };
    } catch (error) {
      this.logError('testConnection failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
  
  // ============ HELPER METHODS ============
  
  /**
   * Map PayPal status to our TransactionStatus
   */
  private mapStatus(status?: string): TransactionStatus {
    if (!status) return 'pending';
    return PayPalProvider.STATUS_MAP[status] || 'pending';
  }
}

