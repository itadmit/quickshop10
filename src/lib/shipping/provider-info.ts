/**
 * Shipping Provider Info
 * Static provider information for UI - no server dependencies
 */

import type { ShippingProviderInfo, ShippingProviderType } from './types';

// Provider info for UI
export const SHIPPING_PROVIDER_INFO: Record<ShippingProviderType, ShippingProviderInfo> = {
  cheetah: {
    type: 'cheetah',
    name: 'Cheetah',
    nameHe: 'צ\'יטה',
    description: 'Fast delivery service across Israel',
    descriptionHe: 'שירות משלוחים מהיר בכל הארץ',
    website: 'https://www.cheetah.co.il',
    supportedFeatures: {
      tracking: true,
      labels: true,
      pickupPoints: false,
      cod: true,
      returns: true,
      scheduling: true,
    },
    requiredCredentials: [
      { key: 'apiKey', label: 'API Key', labelHe: 'מפתח API', type: 'password', required: true },
      { key: 'customerId', label: 'Customer ID', labelHe: 'מזהה לקוח', type: 'text', required: true },
    ],
  },
  hfd: {
    type: 'hfd',
    name: 'HFD',
    nameHe: 'HFD משלוחים',
    description: 'Nationwide delivery and logistics',
    descriptionHe: 'משלוחים ולוגיסטיקה בכל הארץ',
    website: 'https://www.hfd.co.il',
    supportedFeatures: {
      tracking: true,
      labels: true,
      pickupPoints: false,
      cod: true,
      returns: true,
      scheduling: false,
    },
    requiredCredentials: [
      { key: 'username', label: 'Username', labelHe: 'שם משתמש', type: 'text', required: true },
      { key: 'password', label: 'Password', labelHe: 'סיסמה', type: 'password', required: true },
      { key: 'customerId', label: 'Customer ID', labelHe: 'מזהה לקוח', type: 'text', required: true },
    ],
  },
  boxit: {
    type: 'boxit',
    name: 'Box It',
    nameHe: 'בוקס איט',
    description: 'Smart locker pickup points',
    descriptionHe: 'נקודות איסוף בלוקרים חכמים',
    website: 'https://www.boxit.co.il',
    supportedFeatures: {
      tracking: true,
      labels: true,
      pickupPoints: true,
      cod: false,
      returns: true,
      scheduling: false,
    },
    requiredCredentials: [
      { key: 'apiKey', label: 'API Key', labelHe: 'מפתח API', type: 'password', required: true },
      { key: 'storeCode', label: 'Store Code', labelHe: 'קוד חנות', type: 'text', required: true },
    ],
  },
  baldar: {
    type: 'baldar',
    name: 'Baldar',
    nameHe: 'בלדר',
    description: 'Professional courier and delivery services',
    descriptionHe: 'שירותי שליחויות ומשלוחים מקצועיים',
    website: 'https://www.baldar.co.il',
    supportedFeatures: {
      tracking: true,
      labels: true,
      pickupPoints: false,
      cod: true,
      returns: true,
      scheduling: true,
    },
    requiredCredentials: [
      { key: 'apiKey', label: 'API Key', labelHe: 'מפתח API', type: 'password', required: true },
      { key: 'customerId', label: 'Customer ID', labelHe: 'מזהה לקוח', type: 'text', required: true },
    ],
  },
  manual: {
    type: 'manual',
    name: 'Manual',
    nameHe: 'ידני',
    description: 'Manual shipping management without API integration',
    descriptionHe: 'ניהול משלוחים ידני ללא חיבור API',
    supportedFeatures: {
      tracking: false,
      labels: false,
      pickupPoints: false,
      cod: false,
      returns: false,
      scheduling: false,
    },
    requiredCredentials: [],
  },
};

/**
 * Get list of all available shipping providers with info
 */
export function getAvailableShippingProviders(): ShippingProviderInfo[] {
  return Object.values(SHIPPING_PROVIDER_INFO);
}

/**
 * Get shipping provider info by type
 */
export function getShippingProviderInfo(type: ShippingProviderType): ShippingProviderInfo | null {
  return SHIPPING_PROVIDER_INFO[type] || null;
}

