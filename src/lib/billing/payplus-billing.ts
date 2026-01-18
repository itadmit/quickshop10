/**
 * PayPlus Billing Service
 * חיוב פלטפורמה דרך PayPlus - מנויים, עמלות ותוספים
 */

import crypto from 'crypto';
import { getSubscriptionPricing, getFeeRates } from './platform-settings';

// PayPlus API Configuration
const PAYPLUS_CONFIG = {
  apiUrl: process.env.PAYPLUS_API_URL || 'https://restapidev.payplus.co.il/api/v1.0',
  apiKey: process.env.PAYPLUS_API_KEY || '',
  secretKey: process.env.PAYPLUS_SECRET_KEY || '',
  terminalUid: process.env.PAYPLUS_TERMINAL_UID || '',
  cashierUid: process.env.PAYPLUS_CASHIER_UID || '',
  paymentPageUid: process.env.PAYPLUS_PAYMENT_PAGE_UID || '',
};

// Default plan pricing (before VAT) - fallback if DB not available
// These are now loaded from DB via platform-settings.ts
export const PLAN_PRICING = {
  branding: 299,   // ₪299/month (default)
  quickshop: 399,  // ₪399/month (default)
} as const;

export const VAT_RATE = 0.18; // 18% (default)
export const TRANSACTION_FEE_RATE = 0.005; // 0.5% (default)

// Types
interface PayPlusResponse<T = unknown> {
  results: {
    status: string;
    code: number;
    description: string;
  };
  data?: T;
}

interface GenerateLinkResponse {
  page_request_uid: string;
  payment_page_link: string;
}

interface ChargeResponse {
  transaction_uid: string;
  transaction_number: string;
  status_code: string;
  four_digits: string;
  brand_name: string;
  expiry_month: string;
  expiry_year: string;
  customer_uid: string;
  token_uid?: string;
  invoice_number?: string;
  invoice_link?: string;
}

interface CustomerResponse {
  customer_uid: string;
}

interface TokenResponse {
  token_uid: string;
}

export interface BillingCustomer {
  name: string;
  email: string;
  phone?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
}

export interface InitiateSubscriptionPaymentParams {
  storeId: string;
  storeName: string;
  plan: 'branding' | 'quickshop';
  customer: BillingCustomer;
  successUrl: string;
  failureUrl: string;
  cancelUrl?: string;
  callbackUrl?: string; // Optional - if not provided, uses NEXT_PUBLIC_APP_URL
}

export interface ChargeWithTokenParams {
  tokenUid: string;
  customerUid: string;
  amount: number; // Amount in ILS (after VAT)
  description: string;
  invoiceItems?: {
    name: string;
    quantity: number;
    price: number; // Before VAT
  }[];
}

/**
 * Make authenticated request to PayPlus API
 */
async function makePayPlusRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>
): Promise<PayPlusResponse<T>> {
  const url = `${PAYPLUS_CONFIG.apiUrl}/${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'api-key': PAYPLUS_CONFIG.apiKey,
    'secret-key': PAYPLUS_CONFIG.secretKey,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PayPlus Billing] API Error:', response.status, errorText);
    throw new Error(`PayPlus API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Verify PayPlus callback signature
 */
export function verifyPayPlusCallback(
  body: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha256', PAYPLUS_CONFIG.secretKey)
    .update(body)
    .digest('base64');
  return hash === signature;
}

/**
 * Create or get PayPlus customer
 */
export async function getOrCreatePayPlusCustomer(
  customer: BillingCustomer
): Promise<string> {
  try {
    // Try to find existing customer by email
    const searchResponse = await makePayPlusRequest<{ items: { customer_uid: string }[] }>(
      'Customers/Search',
      'POST',
      {
        terminal_uid: PAYPLUS_CONFIG.terminalUid,
        email: customer.email,
        take: 1,
      }
    );

    if (searchResponse.data?.items && searchResponse.data.items.length > 0) {
      return searchResponse.data.items[0].customer_uid;
    }

    // Create new customer
    const createResponse = await makePayPlusRequest<CustomerResponse>(
      'Customers/Add',
      'POST',
      {
        terminal_uid: PAYPLUS_CONFIG.terminalUid,
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        vat_number: customer.vatNumber || '',
        address: customer.address || '',
        city: customer.city || '',
        country_iso: 'IL',
      }
    );

    if (createResponse.results.status !== 'success' || !createResponse.data?.customer_uid) {
      throw new Error(`Failed to create customer: ${createResponse.results.description}`);
    }

    return createResponse.data.customer_uid;
  } catch (error) {
    console.error('[PayPlus Billing] Error creating customer:', error);
    throw error;
  }
}

/**
 * Generate payment page link for initial subscription payment
 * This will save a token for future charges
 */
export async function initiateSubscriptionPayment(
  params: InitiateSubscriptionPaymentParams
): Promise<{ paymentPageUrl: string; pageRequestUid: string }> {
  // Get pricing from DB - pass storeId for custom pricing support
  const { basePrice, vatAmount, totalPrice: totalAmount } = await calculateSubscriptionPriceAsync(params.plan, params.storeId);

  const planNameHe = params.plan === 'branding' ? 'מסלול תדמית' : 'מסלול קוויק שופ';

  try {
    // Note: Customers API requires special permissions, so we pass customer info directly
    // If you need customer_uid, contact PayPlus to enable Customers API access

    // Prepare more_info data for logging
    const moreInfoData = {
      type: 'subscription',
      storeId: params.storeId,
      plan: params.plan,
      amount: totalAmount,
      basePrice,
      vatAmount,
    };
    
    console.log('[PayPlus Billing] Initiating payment with data:', {
      storeId: params.storeId,
      plan: params.plan,
      amount: totalAmount,
      basePrice,
      vatAmount,
      more_info: moreInfoData,
    });

    const response = await makePayPlusRequest<GenerateLinkResponse>(
      'PaymentPages/generateLink',
      'POST',
      {
        payment_page_uid: PAYPLUS_CONFIG.paymentPageUid,
        charge_method: 1, // J4 - Direct charge
        create_token: true, // Save card for future charges!
        
        amount: totalAmount,
        currency_code: 'ILS',
        
        // Generate invoice via PayPlus
        initial_invoice: true,
        
        // Customer info - passed directly without customer_uid
        customer: {
          customer_name: params.customer.name,
          email: params.customer.email,
          phone: params.customer.phone || '',
          vat_number: params.customer.vatNumber || '',
        },
        
        // Products for invoice
        items: [
          {
            name: `מנוי חודשי QuickShop - ${planNameHe}`,
            quantity: 1,
            price: totalAmount,
            vat_type: 0, // VAT included (0 = VAT included in price)
            // Add more details for better invoice description
            product_invoice_extra_details: `מנוי חודשי לפלטפורמת QuickShop - ${planNameHe}. כולל כל הפיצ'רים של המסלול.`,
          },
        ],
        
        // URLs
        refURL_success: params.successUrl,
        refURL_failure: params.failureUrl,
        refURL_cancel: params.cancelUrl || params.failureUrl,
        // Use provided callbackUrl or fallback to NEXT_PUBLIC_APP_URL
        // This allows localhost testing by passing the origin from the request
        refURL_callback: params.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/platform/billing/callback`,
        send_failure_callback: true,
        
        // Store reference for callback
        // more_info - תיאור בעברית שיוצג בדף התשלום ובחשבונית
        // more_info_1 - JSON עם נתונים טכניים ל-callback
        more_info: `מנוי חודשי QuickShop - ${planNameHe}`,
        more_info_1: JSON.stringify(moreInfoData),
        
        // Language
        language_code: 'he',
        
        // Page expiry - 30 minutes
        expiry_datetime: '30',
        
        // Email settings
        sendEmailApproval: true,
        sendEmailFailure: false,
      }
    );

    if (response.results.status !== 'success' || !response.data) {
      throw new Error(`Failed to generate payment link: ${response.results.description}`);
    }

    return {
      paymentPageUrl: response.data.payment_page_link,
      pageRequestUid: response.data.page_request_uid,
    };
  } catch (error) {
    console.error('[PayPlus Billing] Error initiating subscription payment:', error);
    throw error;
  }
}

/**
 * Charge using saved token
 * Used for recurring subscription charges, transaction fees, and plugin fees
 */
export async function chargeWithToken(
  params: ChargeWithTokenParams
): Promise<{
  success: boolean;
  transactionUid?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  error?: string;
}> {
  try {
    // Calculate amounts
    const subtotal = params.invoiceItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || (params.amount / (1 + VAT_RATE));
    const vatAmount = params.amount - subtotal;

    const response = await makePayPlusRequest<ChargeResponse>(
      'Transactions/Charge',
      'POST',
      {
        terminal_uid: PAYPLUS_CONFIG.terminalUid,
        cashier_uid: PAYPLUS_CONFIG.cashierUid,
        
        amount: params.amount,
        currency_code: 'ILS',
        credit_terms: 1, // Regular charge
        
        // Use saved token
        use_token: true,
        token: params.tokenUid,
        customer_uid: params.customerUid,
        
        // Generate invoice
        initial_invoice: true,
        
        // Products for invoice
        // According to PayPlus docs: quantity and price should be strings, vat_type should be string ('0', '1', '2')
        products: params.invoiceItems?.map(item => {
          // Calculate price with VAT
          const priceWithVat = Math.round(item.price * (1 + VAT_RATE) * 100) / 100;
          return {
            name: item.name,
            quantity: String(item.quantity), // Must be string according to PayPlus API
            price: String(priceWithVat), // Must be string according to PayPlus API
            currency_code: 'ILS',
            vat_type: '0', // '0' = VAT included (must be string: '0', '1', or '2')
          };
        }) || [
          {
            name: params.description,
            quantity: '1', // Must be string
            price: String(params.amount), // Must be string
            currency_code: 'ILS',
            vat_type: '0', // '0' = VAT included (must be string)
          },
        ],
        
        // Info
        more_info_1: params.description,
      }
    );

    if (response.results.status !== 'success' || response.results.code !== 0) {
      return {
        success: false,
        error: response.results.description || 'Unknown error',
      };
    }

    return {
      success: true,
      transactionUid: response.data?.transaction_uid,
      invoiceNumber: response.data?.invoice_number,
      invoiceUrl: response.data?.invoice_link,
    };
  } catch (error) {
    console.error('[PayPlus Billing] Error charging with token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if token is valid
 */
export async function checkToken(tokenUid: string): Promise<{
  valid: boolean;
  lastFour?: string;
  brand?: string;
  expiry?: string;
}> {
  try {
    const response = await makePayPlusRequest<{
      four_digits: string;
      brand_name: string;
      expiry_month: string;
      expiry_year: string;
    }>(
      `Token/Check/${tokenUid}`,
      'GET'
    );

    if (response.results.status !== 'success') {
      return { valid: false };
    }

    return {
      valid: true,
      lastFour: response.data?.four_digits,
      brand: response.data?.brand_name,
      expiry: response.data ? `${response.data.expiry_month}/${response.data.expiry_year}` : undefined,
    };
  } catch (error) {
    console.error('[PayPlus Billing] Error checking token:', error);
    return { valid: false };
  }
}

/**
 * Remove/invalidate a token
 */
export async function removeToken(tokenUid: string): Promise<boolean> {
  try {
    const response = await makePayPlusRequest(
      `Token/Remove/${tokenUid}`,
      'POST',
      {
        terminal_uid: PAYPLUS_CONFIG.terminalUid,
      }
    );

    return response.results.status === 'success';
  } catch (error) {
    console.error('[PayPlus Billing] Error removing token:', error);
    return false;
  }
}

/**
 * Calculate subscription price with VAT (sync version - uses defaults)
 * @deprecated Use calculateSubscriptionPriceAsync for DB values
 */
export function calculateSubscriptionPrice(plan: 'branding' | 'quickshop'): {
  basePrice: number;
  vatAmount: number;
  totalPrice: number;
} {
  const basePrice = PLAN_PRICING[plan];
  const vatAmount = Math.round(basePrice * VAT_RATE * 100) / 100;
  const totalPrice = basePrice + vatAmount;
  
  return { basePrice, vatAmount, totalPrice };
}

/**
 * Calculate subscription price with VAT (async version - reads from DB)
 * Supports custom pricing per store
 */
export async function calculateSubscriptionPriceAsync(
  plan: 'branding' | 'quickshop',
  storeId?: string
): Promise<{
  basePrice: number;
  vatAmount: number;
  totalPrice: number;
}> {
  let basePrice: number;
  
  // If storeId provided, check for custom pricing first
  if (storeId) {
    const { db } = await import('@/lib/db');
    const { storeSubscriptions } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    
    const subscription = await db
      .select({ customMonthlyPrice: storeSubscriptions.customMonthlyPrice })
      .from(storeSubscriptions)
      .where(eq(storeSubscriptions.storeId, storeId))
      .then(rows => rows[0]);
    
    // Use custom price if set
    if (subscription?.customMonthlyPrice) {
      basePrice = parseFloat(subscription.customMonthlyPrice);
    } else {
      // Use default pricing from DB
      const pricing = await getSubscriptionPricing();
      basePrice = plan === 'branding' ? pricing.branding : pricing.quickshop;
    }
  } else {
    // No storeId - use default pricing
  const pricing = await getSubscriptionPricing();
    basePrice = plan === 'branding' ? pricing.branding : pricing.quickshop;
  }
  
  const feeRates = await getFeeRates();
  const vatAmount = Math.round(basePrice * feeRates.vatRate * 100) / 100;
  const totalPrice = basePrice + vatAmount;
  
  return { basePrice, vatAmount, totalPrice };
}

/**
 * Calculate transaction fee with VAT (sync version - uses defaults)
 * @deprecated Use calculateTransactionFeeAsync for DB values
 */
export function calculateTransactionFee(transactionTotal: number): {
  feeAmount: number;
  vatAmount: number;
  totalFee: number;
} {
  const feeAmount = Math.round(transactionTotal * TRANSACTION_FEE_RATE * 100) / 100;
  const vatAmount = Math.round(feeAmount * VAT_RATE * 100) / 100;
  const totalFee = feeAmount + vatAmount;
  
  return { feeAmount, vatAmount, totalFee };
}

/**
 * Calculate transaction fee with VAT (async version - reads from DB)
 */
export async function calculateTransactionFeeAsync(transactionTotal: number): Promise<{
  feeAmount: number;
  vatAmount: number;
  totalFee: number;
  feeRate: number;
}> {
  const feeRates = await getFeeRates();
  
  const feeAmount = Math.round(transactionTotal * feeRates.transactionFee * 100) / 100;
  const vatAmount = Math.round(feeAmount * feeRates.vatRate * 100) / 100;
  const totalFee = feeAmount + vatAmount;
  
  return { feeAmount, vatAmount, totalFee, feeRate: feeRates.transactionFee };
}

/**
 * Calculate transaction fee for a specific store with custom fee percentage support
 * Uses store's customFeePercentage if set, otherwise uses platform default
 */
export async function calculateTransactionFeeForStore(
  transactionTotal: number,
  storeId: string,
  customFeePercentage?: string | null
): Promise<{
  feeAmount: number;
  vatAmount: number;
  totalFee: number;
  feeRate: number;
}> {
  const feeRates = await getFeeRates();
  
  // Use custom fee percentage if set for this store, otherwise use platform default
  const feeRate = customFeePercentage 
    ? parseFloat(customFeePercentage) 
    : feeRates.transactionFee;
  
  const feeAmount = Math.round(transactionTotal * feeRate * 100) / 100;
  const vatAmount = Math.round(feeAmount * feeRates.vatRate * 100) / 100;
  const totalFee = feeAmount + vatAmount;
  
  return { feeAmount, vatAmount, totalFee, feeRate };
}

