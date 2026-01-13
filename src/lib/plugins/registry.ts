/**
 * Plugin Registry
 * 
 * רישום כל התוספים הזמינים במערכת
 * כל תוסף מוגדר כאן - הקוד שלו נטען דינמית רק כשמותקן
 * 
 * ⚠️ רק תוספים עם יישום מלא נמצאים כאן!
 */

import { PluginDefinition, PluginCategory } from './types';

/**
 * רשימת כל התוספים הזמינים
 * 
 * ⚡ Performance: הקבצים של התוספים עצמם לא נטענים כאן
 * רק ההגדרות - הקוד נטען דינמית ב-loader.ts
 */
export const pluginRegistry: PluginDefinition[] = [
  // ============================================
  // 📱 MARKETING - שיווק
  // ============================================
  {
    slug: 'product-stories',
    name: 'סטוריז מוצרים',
    description: 'הצג מוצרים בפורמט סטוריז אינטראקטיבי כמו באינסטגרם - עם לייקים, תגובות והוספה מהירה לעגלה',
    type: 'core',
    category: 'marketing',
    version: '1.0.0',
    icon: 'play-circle',
    author: 'QuickShop',
    isFree: false,
    price: 29,
    trialDays: 14,
    defaultConfig: {
      enabled: false,
      displayMode: 'home_only', // 'home_only' | 'category' | 'everywhere'
      autoAdvanceSeconds: 5,
      showProductInfo: true,
      allowLikes: true,
      allowComments: true,
      allowQuickAdd: true,
      circleBorderColor: '#e91e63',
      viewedBorderColor: '#9e9e9e',
      selectedProducts: [],
      selectedCategories: [],
    },
    metadata: {
      menuItem: {
        icon: 'PlayCircle',
        label: 'סטוריז מוצרים',
        href: '/plugins/product-stories',
        section: 'marketing',
        badge: 'חדש',
      },
      features: [
        'עיגולי סטוריז מתחת להדר',
        'מעבר אוטומטי בין מוצרים',
        'לייקים ותגובות',
        'הוספה מהירה לעגלה',
        'סטטיסטיקות צפיות',
        'התאמה אישית של צבעים',
      ],
      screenshots: [
        '/images/plugins/stories-bar.png',
        '/images/plugins/stories-viewer.png',
      ],
    },
  },

  // ============================================
  // 🧠 CUSTOMIZATION - התאמה אישית
  // ============================================
  {
    slug: 'smart-advisor',
    name: 'הצעה חכמה (AI)',
    description: 'צור שאלונים אינטראקטיביים שממליצים על מוצרים לפי תשובות הלקוח - עם אפקט AI ואנימציות מרשימות',
    type: 'core',
    category: 'customization',
    version: '1.0.0',
    icon: 'brain',
    author: 'QuickShop',
    isFree: false,
    price: 79,
    trialDays: 14,
    defaultConfig: {
      enabled: false,
      showFloatingButton: true,
    },
    metadata: {
      menuItem: {
        icon: 'Brain',
        label: 'יועץ חכם',
        href: '/plugins/smart-advisor',
        section: 'marketing',
        badge: 'AI',
      },
      features: [
        'יצירת שאלונים אינטראקטיביים',
        'התאמת מוצרים לפי תשובות',
        'אפקט AI מרשים',
        'כפתור צף בחנות',
        'סטטיסטיקות השלמה',
        'אנימציות מתקדמות',
      ],
      screenshots: [
        '/images/plugins/advisor-wizard.png',
        '/images/plugins/advisor-results.png',
      ],
    },
  },

  // ============================================
  // 🎰 GAMIFICATION - משחקים
  // ============================================
  {
    slug: 'wheel-of-fortune',
    name: 'גלגל המזל',
    description: 'גלגל מזל אינטראקטיבי עם 12 פרסים מותאמים אישית - אסוף לידים ותגביר מכירות עם חוויה מהנה',
    type: 'core',
    category: 'marketing',
    version: '1.0.0',
    icon: 'target',
    author: 'QuickShop',
    isFree: false,
    price: 29,
    trialDays: 14,
    defaultConfig: {
      enabled: false,
    },
    metadata: {
      menuItem: {
        icon: 'Target',
        label: 'גלגל המזל',
        href: '/plugins/wheel-of-fortune',
        section: 'marketing',
        badge: 'חדש',
      },
      features: [
        '12 פרסים מותאמים אישית',
        'אחוזי זכייה גמישים',
        'קופונים חד-פעמיים אוטומטיים',
        'איסוף לידים (שם, טלפון, אימייל, תאריך לידה)',
        'מוצר במתנה עם קופון',
        'סיבוב נוסף כפרס',
        'אנימציות מרשימות',
        'תזמון והפעלה חכמה',
      ],
      screenshots: [],
    },
  },
  {
    slug: 'scratch-card',
    name: 'כרטיס גירוד',
    description: 'כרטיס גירוד וירטואלי עם אפקט מטבע - חושף פרסים באופן מרגש ומגביר את המעורבות',
    type: 'core',
    category: 'marketing',
    version: '1.0.0',
    icon: 'sparkles',
    author: 'QuickShop',
    isFree: false,
    price: 29,
    trialDays: 14,
    defaultConfig: {
      enabled: false,
    },
    metadata: {
      menuItem: {
        icon: 'Sparkles',
        label: 'כרטיס גירוד',
        href: '/plugins/scratch-card',
        section: 'marketing',
        badge: 'חדש',
      },
      features: [
        'אפקט גירוד ריאליסטי',
        'מטבע עם לוגו החנות',
        'פרסים מותאמים אישית',
        'אחוזי זכייה גמישים',
        'קופונים חד-פעמיים אוטומטיים',
        'איסוף לידים',
        'מוצר במתנה עם קופון',
        'תזמון והפעלה חכמה',
      ],
      screenshots: [],
    },
  },

  // ============================================
  // 👑 LOYALTY - מועדון לקוחות
  // ============================================
  {
    slug: 'loyalty-program',
    name: 'מועדון לקוחות PRO',
    description: 'מערכת נאמנות מתקדמת עם רמות, צבירת נקודות, הטבות ופדיון - הגדל את שימור הלקוחות',
    type: 'core',
    category: 'loyalty',
    version: '1.0.0',
    icon: 'crown',
    author: 'QuickShop',
    isFree: false,
    price: 149,
    trialDays: 14,
    defaultConfig: {
      enabled: true,
      pointsPerIls: 1,
      pointsRedemptionRate: 0.1,
      minPointsToRedeem: 100,
      showProgressBar: true,
      showPointsInHeader: true,
    },
    metadata: {
      menuItem: {
        icon: 'Crown',
        label: 'מועדון לקוחות',
        href: '/loyalty',
        section: 'marketing',
        badge: 'PRO',
      },
      features: [
        'רמות מועדון (ברונזה, כסף, זהב, פלטינום)',
        'צבירת נקודות על כל רכישה',
        'מכפיל נקודות לפי רמה',
        'הנחות קבועות לחברי מועדון',
        'פדיון נקודות בצ\'קאאוט',
        'בונוס הרשמה ויום הולדת',
        'סרגל התקדמות באיזור אישי',
        'מוצרים בלעדיים לרמות',
      ],
      screenshots: [],
    },
  },

  // ============================================
  // 🧾 OPERATIONS - תפעול
  // ============================================
  {
    slug: 'pos',
    name: 'קופה חכמה',
    description: 'ממשק קופה לסליקת לקוחות עם חיפוש מהיר, מוצרים מהקטלוג ופריטים ידניים',
    type: 'core',
    category: 'operations',
    version: '1.0.0',
    icon: 'receipt',
    author: 'QuickShop',
    isFree: false,
    price: 149,
    trialDays: 14,
    defaultConfig: {
      enabled: true,
      defaultShippingMethod: 'pickup',
      showRecentProducts: true,
      recentProductsCount: 12,
      allowManualItems: true,
    },
    metadata: {
      menuItem: {
        icon: 'Receipt',
        label: 'קופה',
        href: '/plugins/pos',
        section: 'addons',
        badge: 'חדש',
      },
      features: [
        'ממשק קופה מהיר',
        'חיפוש מוצרים וברקודים',
        'חיפוש לקוחות קיימים',
        'פריטים ידניים',
        'קופונים והנחות',
        'הזמנות נשמרות במערכת',
      ],
      screenshots: [],
    },
  },

  // ============================================
  // ⭐ REVIEWS - ביקורות
  // ============================================
  {
    slug: 'product-reviews',
    name: 'ביקורות מוצרים',
    description: 'אפשר ללקוחות לדרג מוצרים, לכתוב ביקורות ולהעלות תמונות - עם מודרציה, תגיות ותגובות מנהל',
    type: 'core',
    category: 'marketing',
    version: '1.0.0',
    icon: 'star',
    author: 'QuickShop',
    isFree: false,
    price: 159,
    trialDays: 14,
    defaultConfig: {
      enabled: true,
      requireApproval: true,
      requireText: false,
      minTextLength: 10,
      allowMedia: true,
      maxMediaPerReview: 5,
      allowGuestReviews: false,
      autoApproveVerified: true,
      showVerifiedBadge: true,
      emailRequestDays: 7,
      customBadges: [
        { id: 'editors-pick', name: 'בחירת העורך', color: '#8B5CF6', icon: 'crown' },
        { id: 'top-reviewer', name: 'מבקר מוביל', color: '#FFD700', icon: 'trophy' },
        { id: 'helpful', name: 'מועיל במיוחד', color: '#10B981', icon: 'thumbs-up' },
      ],
    },
    metadata: {
      menuItem: {
        icon: 'Star',
        label: 'ביקורות',
        href: '/plugins/product-reviews',
        section: 'marketing',
      },
      features: [
        'דירוג 1-5 כוכבים',
        'תגית "רכישה מאומתת" אוטומטית',
        'העלאת תמונות ווידאו',
        'מודרציה ואישור ביקורות',
        'תגובות מנהל',
        'כפתור "מועיל" להצבעה',
        'תגיות מותאמות אישית',
        'סיכום דירוגים מהיר',
      ],
      screenshots: [],
    },
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * קבלת תוסף לפי slug
 */
export function getPluginDefinition(slug: string): PluginDefinition | undefined {
  return pluginRegistry.find(p => p.slug === slug);
}

/**
 * קבלת כל התוספים
 */
export function getAllPluginDefinitions(): PluginDefinition[] {
  return pluginRegistry;
}

/**
 * קבלת תוספים לפי קטגוריה
 */
export function getPluginsByCategory(category: PluginCategory): PluginDefinition[] {
  return pluginRegistry.filter(p => p.category === category);
}

/**
 * קבלת תוספים חינמיים
 */
export function getFreePlugins(): PluginDefinition[] {
  return pluginRegistry.filter(p => p.isFree);
}

/**
 * קבלת תוספים בתשלום
 */
export function getPaidPlugins(): PluginDefinition[] {
  return pluginRegistry.filter(p => !p.isFree);
}

/**
 * תוויות קטגוריות בעברית
 */
export const categoryLabels: Record<PluginCategory, string> = {
  marketing: 'שיווק',
  loyalty: 'נאמנות',
  analytics: 'אנליטיקס',
  payment: 'תשלום',
  inventory: 'מלאי',
  communication: 'תקשורת',
  operations: 'תפעול',
  customization: 'התאמה אישית',
};

/**
 * אייקונים לקטגוריות (lucide-react)
 */
export const categoryIcons: Record<PluginCategory, string> = {
  marketing: 'Megaphone',
  loyalty: 'Crown',
  analytics: 'BarChart3',
  payment: 'CreditCard',
  inventory: 'Package',
  communication: 'MessageCircle',
  operations: 'Settings',
  customization: 'Palette',
};
