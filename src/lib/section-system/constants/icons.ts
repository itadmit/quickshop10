/**
 * Section System - Icons Constants
 * SVG paths לאייקונים - משותפים לכל הסקשנים
 */

// ============================================
// FEATURE ICONS (Heroicons style - 24x24)
// ============================================
export const FEATURE_ICON_PATHS: Record<string, string> = {
  // Shipping & Delivery
  truck: 'M1 3h15v13H1zm15 5h4l3 3v5h-7m-13 0a2.5 2.5 0 105 0m8 0a2.5 2.5 0 105 0',
  
  // Returns & Refresh
  refresh: 'M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16',
  
  // Security & Shield
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  
  // Checkmark / Verified
  check: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  
  // Support / Message
  message: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  
  // Quality / Sparkles
  sparkles: 'M12 3l-1.9 5.8a2 2 0 01-1.3 1.3L3 12l5.8 1.9a2 2 0 011.3 1.3L12 21l1.9-5.8a2 2 0 011.3-1.3L21 12l-5.8-1.9a2 2 0 01-1.3-1.3L12 3zM5 3v4M19 17v4M3 5h4M17 19h4',
  
  // Love / Heart
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
  
  // Rating / Star
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  
  // Gift / Reward
  gift: 'M20 12v10H4V12m16-5H4v5h16V7zm-8 15V7m0 0H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
  
  // Time / Clock
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  
  // Discount / Percent
  percent: 'M19 5L5 19M9 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM20 17.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  
  // Award / Badge
  award: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  
  // Lightning / Fast
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  
  // Phone
  phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
  
  // Location
  location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z',
  
  // Mail
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  
  // Lock / Secure
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  
  // Users / Community
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z',
  
  // Globe / Worldwide
  globe: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  
  // Credit Card
  creditCard: 'M1 4h22v16H1zM1 10h22',
  
  // Box / Package
  box: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
};

// ============================================
// ICON LIST FOR SETTINGS
// ============================================
export interface IconOption {
  value: string;
  label: string;
  path: string;
}

export const FEATURE_ICONS: IconOption[] = [
  { value: 'truck', label: 'משלוח', path: FEATURE_ICON_PATHS.truck },
  { value: 'refresh', label: 'החזרות', path: FEATURE_ICON_PATHS.refresh },
  { value: 'shield', label: 'אבטחה', path: FEATURE_ICON_PATHS.shield },
  { value: 'check', label: 'אישור', path: FEATURE_ICON_PATHS.check },
  { value: 'message', label: 'תמיכה', path: FEATURE_ICON_PATHS.message },
  { value: 'sparkles', label: 'איכות', path: FEATURE_ICON_PATHS.sparkles },
  { value: 'heart', label: 'אהבה', path: FEATURE_ICON_PATHS.heart },
  { value: 'star', label: 'דירוג', path: FEATURE_ICON_PATHS.star },
  { value: 'gift', label: 'מתנה', path: FEATURE_ICON_PATHS.gift },
  { value: 'clock', label: 'זמן', path: FEATURE_ICON_PATHS.clock },
  { value: 'percent', label: 'הנחה', path: FEATURE_ICON_PATHS.percent },
  { value: 'award', label: 'פרס', path: FEATURE_ICON_PATHS.award },
  { value: 'zap', label: 'מהיר', path: FEATURE_ICON_PATHS.zap },
  { value: 'phone', label: 'טלפון', path: FEATURE_ICON_PATHS.phone },
  { value: 'location', label: 'מיקום', path: FEATURE_ICON_PATHS.location },
  { value: 'mail', label: 'מייל', path: FEATURE_ICON_PATHS.mail },
  { value: 'lock', label: 'מאובטח', path: FEATURE_ICON_PATHS.lock },
  { value: 'users', label: 'קהילה', path: FEATURE_ICON_PATHS.users },
  { value: 'globe', label: 'עולמי', path: FEATURE_ICON_PATHS.globe },
  { value: 'creditCard', label: 'תשלום', path: FEATURE_ICON_PATHS.creditCard },
  { value: 'box', label: 'חבילה', path: FEATURE_ICON_PATHS.box },
];

// ============================================
// UI ICONS (for controls, navigation, etc.)
// ============================================
export const UI_ICONS = {
  chevronLeft: 'M15 19l-7-7 7-7',
  chevronRight: 'M9 5l7 7-7 7',
  chevronDown: 'M19 9l-7 7-7-7',
  chevronUp: 'M5 15l7-7 7 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  drag: 'M8 6h.01M8 10h.01M8 14h.01M8 18h.01M12 6h.01M12 10h.01M12 14h.01M12 18h.01',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
};

