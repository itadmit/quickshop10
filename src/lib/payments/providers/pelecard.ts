/**
 * Pelecard Payment Provider
 * Full integration with Pelecard payment gateway (Iframe/Redirect + Services REST)
 * 
 * Docs:
 * - PaymentGW (Iframe/Redirect): gateway21.pelecard.biz/PaymentGW
 * - Services REST: gateway21.pelecard.biz/services
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
} from '../types';

// ============ PELECARD API TYPES ============

interface PelecardInitRequest {
  terminal: string;
  user: string;
  password: string;
  GoodURL: string;
  ErrorURL: string;
  CancelURL: string;
  ActionType: string;
  Currency: string;
  Total: string;
  CreateToken?: string;
  Language: string;
  CustomerIdField?: string;
  Cvv2Field?: string;
  MaxPayments?: string;
  MinPayments?: string;
  UserKey?: string;
  ParamX?: string;
  // Customer details
  CustomerName?: string;
  CustomerEmail?: string;
  CustomerPhone?: string;
  // Index signature for Record<string, unknown> compatibility
  [key: string]: string | undefined;
}

interface PelecardInitResponse {
  URL?: string;
  Error?: {
    ErrCode: number;
    ErrMsg: string;
  };
  transactionID?: string;
  ValidationString?: string;
}

interface PelecardGetTransactionRequest {
  terminal: string;
  user: string;
  password: string;
  TransactionId: string;
  [key: string]: string | undefined;
}

interface PelecardGetTransactionResponse {
  ResultCode?: string;
  StatusCode?: string;
  ErrorMessage?: string;
  ApprovalNo?: string;
  VoucherId?: string;
  Token?: string;
  CreditCardNumber?: string;
  CreditCardExpDate?: string;
  CreditCardCompanyClearer?: string;
  CreditCardBrand?: string;
  DebitTotal?: string;
  DebitCurrency?: string;
  TotalPayments?: string;
  FirstPaymentTotal?: string;
  FixedPaymentTotal?: string;
  AdditionalDetailsParamX?: string;
  UserKey?: string;
}

// Services REST API types
interface PelecardServiceRequest {
  terminalNumber: string;
  user: string;
  password: string;
  shopNumber?: string;
}

interface PelecardDeleteTranRequest extends PelecardServiceRequest {
  PelecardTransactionId?: string;
  VoucherId?: string;
  total?: string;
  currency?: string;
}

interface PelecardServiceResponse {
  StatusCode?: string;
  ErrorMessage?: string;
  PelecardTransactionId?: string;
  VoucherId?: string;
  // Additional fields as needed
}

// Callback/Redirect query params from Pelecard
interface PelecardCallbackParams {
  PelecardTransactionId?: string;
  PelecardStatusCode?: string;
  ConfirmationKey?: string;
  ApprovalNo?: string;
  Token?: string;
  ParamX?: string;
  UserKey?: string;
  // Error fields
  ErrorCode?: string;
  ErrorMessage?: string;
}

export class PelecardProvider extends BasePaymentProvider {
  readonly providerType: PaymentProviderType = 'pelecard';
  readonly displayName = 'Pelecard';
  
  // Pelecard URLs
  private static readonly PRODUCTION_GATEWAY = 'https://gateway21.pelecard.biz/PaymentGW';
  private static readonly PRODUCTION_SERVICES = 'https://gateway21.pelecard.biz/services';
  private static readonly SANDBOX_SERVICES = 'https://gateway21.pelecard.biz/SandboxServices';
  
  // Status code mapping
  private static readonly STATUS_MAP: Record<string, TransactionStatus> = {
    '000': 'success',
    '001': 'processing',
    '002': 'pending',
  };
  
  // Currency codes
  private static readonly CURRENCY_MAP: Record<string, string> = {
    'ILS': '1',
    'USD': '2',
    'EUR': '3',
    'GBP': '4',
  };
  
  /**
   * Get PaymentGW URL (same for sandbox and production)
   */
  protected getApiUrl(): string {
    return PelecardProvider.PRODUCTION_GATEWAY;
  }
  
  /**
   * Get Services REST API URL
   */
  protected getServicesUrl(): string {
    this.ensureConfigured();
    return this.config!.testMode 
      ? PelecardProvider.SANDBOX_SERVICES 
      : PelecardProvider.PRODUCTION_SERVICES;
  }
  
  /**
   * Validate Pelecard specific configuration
   */
  protected validateConfig(config: PaymentProviderConfig): void {
    const { credentials } = config;
    
    if (!credentials.terminal) {
      throw new Error('Pelecard: Terminal number is required');
    }
    if (!credentials.user) {
      throw new Error('Pelecard: Username is required');
    }
    if (!credentials.password) {
      throw new Error('Pelecard: Password is required');
    }
  }
  
  /**
   * Make request to PaymentGW
   */
  protected async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
  ): Promise<T> {
    this.ensureConfigured();
    
    const url = `${this.getApiUrl()}${endpoint}`;
    
    this.log(`Request to ${endpoint}`, { method, body });
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const responseText = await response.text();
      
      this.log(`Response from ${endpoint}`, {
        status: response.status,
        bodyPreview: responseText.substring(0, 200),
      });
      
      // Try to parse as JSON
      let data: T;
      try {
        data = JSON.parse(responseText) as T;
      } catch {
        this.logError(`Failed to parse JSON response from ${endpoint}`, { responseText });
        throw new Error(`Invalid JSON response from Pelecard: ${responseText.substring(0, 100)}`);
      }
      
      return data;
    } catch (error) {
      this.logError(`Request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Make request to Services REST API
   */
  protected async makeServicesRequest<T>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<T> {
    this.ensureConfigured();
    
    const url = `${this.getServicesUrl()}/${endpoint}`;
    
    // Add credentials
    const requestBody = {
      terminalNumber: this.config!.credentials.terminal,
      user: this.config!.credentials.user,
      password: this.config!.credentials.password,
      shopNumber: this.config!.credentials.shopNumber || '001',
      ...body,
    };
    
    this.log(`Services request to ${endpoint}`, { body: requestBody });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseText = await response.text();
      
      this.log(`Services response from ${endpoint}`, {
        status: response.status,
        bodyPreview: responseText.substring(0, 200),
      });
      
      let data: T;
      try {
        data = JSON.parse(responseText) as T;
      } catch {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
      
      return data;
    } catch (error) {
      this.logError(`Services request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  /**
   * Initiate payment - Generate payment page URL
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    this.ensureConfigured();
    
    try {
      const currencyCode = PelecardProvider.CURRENCY_MAP[request.currency || 'ILS'] || '1';
      
      // Build Pelecard init request
      const body: PelecardInitRequest = {
        terminal: this.config!.credentials.terminal!,
        user: this.config!.credentials.user!,
        password: this.config!.credentials.password!,
        
        // URLs
        GoodURL: request.successUrl,
        ErrorURL: request.failureUrl,
        CancelURL: request.cancelUrl || request.failureUrl,
        
        // Transaction details
        ActionType: 'J4', // Direct charge
        Currency: currencyCode,
        Total: String(Math.round(request.amount * 100)), // Amount in agorot/cents
        
        // Settings
        Language: (request.language || 'he').toUpperCase(),
        CustomerIdField: 'optional',
        Cvv2Field: 'must',
        MaxPayments: this.config!.settings?.maxPayments as string || '12',
        MinPayments: '1',
        
        // Our reference for callback
        UserKey: request.orderReference,
        ParamX: request.orderReference,
        
        // Customer info
        CustomerName: request.customer.name,
        CustomerEmail: request.customer.email,
        CustomerPhone: request.customer.phone,
      };
      
      const response = await this.makeRequest<PelecardInitResponse>('/init', 'POST', body);
      
      if (response.URL) {
        return {
          success: true,
          paymentUrl: response.URL,
          providerRequestId: response.transactionID,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      // Error case
      const errorCode = response.Error?.ErrCode?.toString() || 'UNKNOWN';
      const errorMessage = response.Error?.ErrMsg || 'Failed to initialize payment';
      
      return {
        success: false,
        errorCode,
        errorMessage,
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('initiatePayment failed', error);
      return {
        success: false,
        errorCode: 'PELECARD_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Refund a transaction using DeleteTran
   * Note: Pelecard uses "DeleteTran" for cancellation/refund
   */
  async refund(request: RefundRequest): Promise<RefundResponse> {
    this.ensureConfigured();
    
    try {
      // Pelecard refund via Services API
      const body: Partial<PelecardDeleteTranRequest> = {
        PelecardTransactionId: request.providerTransactionId,
        total: String(Math.round(request.amount * 100)), // Amount in agorot
        currency: '1', // ILS
      };
      
      const response = await this.makeServicesRequest<PelecardServiceResponse>(
        'DeleteTran',
        body
      );
      
      if (response.StatusCode === '000') {
        return {
          success: true,
          providerTransactionId: response.PelecardTransactionId,
          refundedAmount: request.amount,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      return {
        success: false,
        errorCode: response.StatusCode || 'UNKNOWN',
        errorMessage: response.ErrorMessage || 'Refund failed',
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('refund failed', error);
      return {
        success: false,
        errorCode: 'PELECARD_REFUND_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get transaction status using GetTransaction
   */
  async getTransactionStatus(request: GetTransactionStatusRequest): Promise<TransactionStatusResponse> {
    this.ensureConfigured();
    
    try {
      const transactionId = request.providerTransactionId || request.providerRequestId;
      
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }
      
      const body: PelecardGetTransactionRequest = {
        terminal: this.config!.credentials.terminal!,
        user: this.config!.credentials.user!,
        password: this.config!.credentials.password!,
        TransactionId: transactionId,
      };
      
      const response = await this.makeRequest<PelecardGetTransactionResponse>(
        '/GetTransaction',
        'POST',
        body
      );
      
      const statusCode = response.ResultCode || response.StatusCode || '';
      const status = this.mapStatusCode(statusCode);
      
      if (status === 'success') {
        return {
          success: true,
          status,
          transactionId: transactionId,
          approvalNumber: response.ApprovalNo || response.VoucherId,
          amount: response.DebitTotal ? Number(response.DebitTotal) / 100 : undefined,
          currency: 'ILS',
          cardBrand: this.mapCardBrand(response.CreditCardBrand),
          cardLastFour: response.CreditCardNumber?.slice(-4),
          cardExpiry: response.CreditCardExpDate,
          providerResponse: response as unknown as Record<string, unknown>,
        };
      }
      
      return {
        success: false,
        status,
        errorCode: statusCode,
        errorMessage: response.ErrorMessage || 'Transaction not found or failed',
        providerResponse: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      this.logError('getTransactionStatus failed', error);
      return {
        success: false,
        errorCode: 'PELECARD_STATUS_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Validate webhook/callback
   * Pelecard uses query parameters on redirect, not webhook signatures
   */
  validateWebhook(body: unknown, headers: Record<string, string>): WebhookValidationResult {
    // Pelecard doesn't use webhook signatures like PayPlus
    // Validation is done by calling GetTransaction server-to-server
    // For now, we accept all callbacks and verify via GetTransaction
    return { isValid: true };
  }
  
  /**
   * Parse callback from Pelecard redirect
   * Data comes as query parameters on GoodURL/ErrorURL
   */
  parseCallback(body: unknown): ParsedCallback {
    // Body might be query params object or parsed body
    const data = body as PelecardCallbackParams;
    
    this.log('Parsing callback', data);
    
    const statusCode = data.PelecardStatusCode || '';
    const status = this.mapStatusCode(statusCode);
    const isSuccess = status === 'success';
    
    return {
      success: isSuccess,
      status,
      providerTransactionId: data.PelecardTransactionId || '',
      providerRequestId: data.PelecardTransactionId,
      approvalNumber: data.ApprovalNo,
      amount: 0, // Amount not included in redirect params - need to fetch via GetTransaction
      currency: 'ILS',
      
      // Our reference
      orderReference: data.UserKey || data.ParamX,
      
      // Error info
      errorCode: data.ErrorCode,
      errorMessage: data.ErrorMessage,
      
      rawData: data as unknown as Record<string, unknown>,
    };
  }
  
  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    this.ensureConfigured();
    
    try {
      // Try to init a minimal test transaction (will fail but validates credentials)
      const body = {
        terminal: this.config!.credentials.terminal,
        user: this.config!.credentials.user,
        password: this.config!.credentials.password,
        GoodURL: 'https://example.com/ok',
        ErrorURL: 'https://example.com/error',
        CancelURL: 'https://example.com/cancel',
        ActionType: 'J4',
        Currency: '1',
        Total: '100', // 1 shekel
        Language: 'HE',
      };
      
      const response = await this.makeRequest<PelecardInitResponse>('/init', 'POST', body);
      
      // If we get a URL, credentials are valid
      if (response.URL) {
        return { success: true };
      }
      
      // Check error - some errors mean valid credentials but invalid config
      // Error 1 usually means invalid credentials
      if (response.Error?.ErrCode === 1) {
        return {
          success: false,
          error: 'פרטי התחברות שגויים - בדוק את מספר הטרמינל, שם המשתמש והסיסמה',
        };
      }
      
      // Other errors might still mean connection works
      return {
        success: true,
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
   * Map Pelecard status code to our status
   */
  private mapStatusCode(statusCode: string): TransactionStatus {
    if (statusCode === '000') return 'success';
    
    const mapped = PelecardProvider.STATUS_MAP[statusCode];
    if (mapped) return mapped;
    
    // Any other code is failure
    return 'failed';
  }
  
  /**
   * Map Pelecard card brand codes
   */
  private mapCardBrand(brandCode?: string): string | undefined {
    if (!brandCode) return undefined;
    
    const brands: Record<string, string> = {
      '1': 'visa',
      '2': 'mastercard',
      '3': 'diners',
      '4': 'amex',
      '5': 'jcb',
      '6': 'isracard',
    };
    
    return brands[brandCode] || brandCode;
  }
}

