/**
 * Payment Provider Info
 * Static provider information for UI - no dependencies on Node.js crypto
 */

import type { PaymentProviderInfo, PaymentProviderType } from './types';

// Provider info for UI
export const PROVIDER_INFO: Record<PaymentProviderType, PaymentProviderInfo> = {
  payplus: {
    type: 'payplus',
    name: 'PayPlus',
    nameHe: 'פייפלוס',
    description: 'Israeli payment gateway supporting credit cards, Bit, Apple Pay, and more',
    descriptionHe: 'שער תשלומים ישראלי התומך בכרטיסי אשראי, ביט, Apple Pay ועוד',
    supportedFeatures: {
      creditCard: true,
      bit: true,
      applePay: true,
      googlePay: true,
      paypal: true,
      recurring: true,
    },
    requiredCredentials: [
      { key: 'apiKey', label: 'API Key', labelHe: 'מפתח API', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', labelHe: 'מפתח סודי', type: 'password', required: true },
      { key: 'paymentPageUid', label: 'Payment Page UID', labelHe: 'מזהה עמוד תשלום', type: 'text', required: true },
    ],
  },
  pelecard: {
    type: 'pelecard',
    name: 'Pelecard',
    nameHe: 'פלאקארד',
    description: 'Israeli payment gateway with iframe/redirect integration',
    descriptionHe: 'שער תשלומים ישראלי עם תמיכה בדף תשלום ייעודי',
    supportedFeatures: {
      creditCard: true,
      bit: true,
      applePay: false,
      googlePay: true, // Google Pay on mobile with NFC
      paypal: false,
      recurring: true,
    },
    requiredCredentials: [
      { key: 'terminal', label: 'Terminal Number', labelHe: 'מספר טרמינל', type: 'text', required: true },
      { key: 'user', label: 'Username', labelHe: 'שם משתמש', type: 'text', required: true },
      { key: 'password', label: 'Password', labelHe: 'סיסמה', type: 'password', required: true },
      { key: 'shopNumber', label: 'Shop Number', labelHe: 'מספר חנות (ברירת מחדל: 001)', type: 'text', required: false },
    ],
  },
  quick_payments: {
    type: 'quick_payments',
    name: 'Quick Payments',
    nameHe: 'קוויק פיימנטס',
    description: 'Recommended - Inline payment form with best checkout experience',
    descriptionHe: 'מומלץ - טופס תשלום משובץ באתר עם חווית קנייה מהירה',
    supportedFeatures: {
      creditCard: true,
      bit: true,
      applePay: true,
      googlePay: true,
      paypal: true,
      recurring: true,
    },
    requiredCredentials: [
      { key: 'sellerPaymeId', label: 'Seller ID (MPL)', labelHe: 'מזהה סוחר (MPL)', type: 'text', required: true },
      // Public key and secret are optional - platform uses shared PAYME_PUBLIC_KEY from env
    ],
  },
  paypal: {
    type: 'paypal',
    name: 'PayPal',
    nameHe: 'פייפאל',
    description: 'Global payment solution - PayPal, credit cards, and alternative payment methods worldwide',
    descriptionHe: 'פתרון תשלום גלובלי - פייפאל, כרטיסי אשראי ואמצעי תשלום חלופיים ברחבי העולם',
    logo: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg',
    supportedFeatures: {
      creditCard: true,
      bit: false,
      applePay: true,
      googlePay: true,
      paypal: true,
      recurring: true,
    },
    requiredCredentials: [
      { key: 'clientId', label: 'Client ID', labelHe: 'מזהה לקוח', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', labelHe: 'מפתח סודי', type: 'password', required: true },
    ],
  },
};

/**
 * Get list of all available providers with info
 */
export function getAvailableProviders(): PaymentProviderInfo[] {
  return Object.values(PROVIDER_INFO);
}

/**
 * Get provider info by type
 */
export function getProviderInfo(type: PaymentProviderType): PaymentProviderInfo | null {
  return PROVIDER_INFO[type] || null;
}

