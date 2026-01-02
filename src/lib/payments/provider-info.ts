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
  placard: {
    type: 'placard',
    name: 'Placard',
    nameHe: 'פלאקארד',
    description: 'Israeli payment gateway',
    descriptionHe: 'שער תשלומים ישראלי',
    supportedFeatures: {
      creditCard: true,
      bit: true,
      applePay: false,
      googlePay: false,
      paypal: false,
      recurring: true,
    },
    requiredCredentials: [
      { key: 'merchantId', label: 'Merchant ID', labelHe: 'מזהה סוחר', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', labelHe: 'מפתח API', type: 'password', required: true },
    ],
  },
  quick_payments: {
    type: 'quick_payments',
    name: 'Quick Payments',
    nameHe: 'קוויק פיימנטס',
    description: 'Recommended - Our in-house payment solution with best rates',
    descriptionHe: 'מומלץ - פתרון התשלומים הפנימי שלנו עם העמלות הטובות ביותר',
    supportedFeatures: {
      creditCard: true,
      bit: true,
      applePay: true,
      googlePay: true,
      paypal: true,
      recurring: true,
    },
    requiredCredentials: [
      { key: 'merchantId', label: 'Merchant ID', labelHe: 'מזהה סוחר', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', labelHe: 'מפתח API', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', labelHe: 'מפתח סודי', type: 'password', required: true },
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

