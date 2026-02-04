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
  // 📋 CRM - ניהול לקוחות
  // ============================================
  {
    slug: 'crm',
    name: 'מערכת CRM',
    description: 'ניהול לקוחות מתקדם עם תגיות, הערות ומשימות - מושלם לחנויות פיזיות עם סוכני מכירות',
    type: 'core',
    category: 'operations',
    version: '1.0.0',
    icon: 'users',
    author: 'QuickShop',
    isFree: false,
    price: 149,
    trialDays: 14,
    defaultConfig: {
      enabled: true,
      defaultTags: [
        { id: 'vip', label: 'VIP', color: '#FFD700', isDefault: true },
        { id: 'new', label: 'חדש', color: '#3B82F6', isDefault: true },
        { id: 'returning', label: 'חוזר', color: '#10B981', isDefault: true },
        { id: 'problematic', label: 'בעייתי', color: '#EF4444', isDefault: true },
        { id: 'b2b', label: 'B2B', color: '#8B5CF6', isDefault: true },
      ],
    },
    metadata: {
      menuItem: {
        icon: 'Users',
        label: 'CRM',
        href: '/plugins/crm',
        section: 'addons',
        badge: 'חדש',
      },
      features: [
        'תגיות מותאמות ללקוחות',
        'הערות CRM',
        'משימות והקצאה לסוכנים',
        'מעקב מי יצר כל הזמנה',
        'אינטגרציה עם תוסף קופה',
        'סינון לקוחות לפי תגיות',
      ],
      screenshots: [],
    },
  },

  // ============================================
  // 💬 COMMUNICATION - תקשורת
  // ============================================
  {
    slug: 'whatsapp-trustory',
    name: 'WhatsApp דיוור',
    description: 'שלח הודעות WhatsApp ללקוחות - דיוור המוני, עדכוני הזמנות ואוטומציות. מופעל דרך True Story API',
    type: 'core',
    category: 'communication',
    version: '1.0.0',
    icon: 'message-circle',
    author: 'QuickShop',
    isFree: true, // חינמי - התשלום ישירות לטרו סטורי
    defaultConfig: {
      enabled: false,
      token: '',
      instanceId: '',
    },
    metadata: {
      menuItem: {
        icon: 'MessageCircle',
        label: 'WhatsApp דיוור',
        href: '/plugins/whatsapp-trustory',
        section: 'addons',
        badge: 'חדש',
      },
      features: [
        'שליחת הודעות טקסט',
        'שליחת תמונות ווידאו',
        'שליחת מסמכים',
        'דיוור המוני לאנשי קשר',
        'סינון לפי לקוחות/מועדון/יצירת קשר',
        'אינטגרציה לאוטומציות',
        'תבניות הודעות מוכנות',
      ],
      screenshots: [],
      documentation: 'https://true-story.net/api/docs',
    },
  },

  // ============================================
  // 🍳 KITCHEN DISPLAY - מסך מטבח
  // ============================================
  {
    slug: 'kitchen-display',
    name: 'מסך מטבח',
    description: 'הצג הזמנות בזמן אמת על מסך ייעודי עם התראות קוליות, שעון סופר וכפתורי ניהול - מושלם למסעדות ובתי מלאכה',
    type: 'core',
    category: 'operations',
    version: '1.0.0',
    icon: 'monitor',
    author: 'QuickShop',
    isFree: false,
    price: 89,
    trialDays: 14,
    defaultConfig: {
      enabled: true,
      // סטטוסים להצגה (מה מוצג על המסך)
      displayStatuses: ['pending', 'confirmed', 'processing'],
      // סטטוס אחרי לחיצה על "אישור"
      successStatus: 'processing',
      successCustomStatus: null,
      // סטטוס אחרי לחיצה על "ביטול"
      cancelStatus: 'cancelled',
      cancelCustomStatus: null,
      // הגדרות צליל
      soundEnabled: true,
      soundVolume: 80,
      // רענון (שניות)
      refreshInterval: 60,
      // מיון
      sortOrder: 'oldest_first',
      // תצוגה
      showCustomerPhone: true,
      showCustomerName: true,
      showOrderNotes: true,
      showProductImages: true,
      cardSize: 'medium',
      darkMode: true,
      // זמני התראה (דקות)
      warningTimeMinutes: 5,
      dangerTimeMinutes: 10,
    },
    metadata: {
      menuItem: {
        icon: 'Monitor',
        label: 'מסך מטבח',
        href: '/plugins/kitchen-display',
        section: 'addons',
        badge: 'חדש',
      },
      features: [
        'תצוגת הזמנות בזמן אמת',
        'התראות קוליות',
        'שעון סופר לכל הזמנה',
        'כפתורי אישור/ביטול/הדפסה',
        'סטטוסים מותאמים אישית',
        'מצב מסך מלא',
        'תמיכה במצב כהה',
        'תמונות מוצרים ותוספות',
      ],
      screenshots: [],
    },
  },

  // ============================================
  // 💬 WHATSAPP FLOAT - כפתור וואטסאפ צף
  // ============================================
  {
    slug: 'whatsapp-float',
    name: 'כפתור וואטסאפ צף',
    description: 'כפתור וואטסאפ צף שמאפשר ללקוחות לשלוח הודעה ישירה לוואטסאפ עם הודעה מוכנה מראש',
    type: 'core',
    category: 'communication',
    version: '1.0.0',
    icon: 'message-circle',
    author: 'QuickShop',
    isFree: true,
    defaultConfig: {
      enabled: true,
      phoneNumber: '', // מספר הוואטסאפ (עם קידומת מדינה)
      buttonColor: '#25D366', // צבע ברירת מחדל של וואטסאפ
      position: 'left', // 'left' | 'right'
      showBubble: true, // האם להציג בועית הודעה
      bubbleText: 'היי! איך אפשר לעזור? 👋', // טקסט הבועית
      bubbleDelaySeconds: 3, // אחרי כמה שניות להציג את הבועית
      defaultMessage: 'שלום, הגעתי דרך האתר ואשמח לקבל עזרה', // הודעת ברירת מחדל
      showOnMobile: true,
      showOnDesktop: true,
      showPulse: true, // האם להציג אנימציית הבהוב
      bottomOffset: 20, // מרחק מהתחתית (px)
      sideOffset: 20, // מרחק מהצד (px)
    },
    metadata: {
      menuItem: {
        icon: 'MessageCircle',
        label: 'כפתור וואטסאפ',
        href: '/plugins/whatsapp-float',
        section: 'addons',
      },
      features: [
        'כפתור וואטסאפ צף בפינת המסך',
        'בועית הודעה מותאמת אישית',
        'הודעה מוכנה מראש',
        'בחירת צבע',
        'מיקום גמיש (ימין/שמאל)',
        'תמיכה במובייל ודסקטופ',
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

  // ============================================
  // 📦 CATALOG MODE - מצב קטלוג
  // ============================================
  {
    slug: 'catalog-mode',
    name: 'מצב קטלוג',
    description: 'הפוך את החנות לקטלוג דיגיטלי ללא אפשרות קנייה - מושלם לקטלוגים, B2B או חנויות שרוצות להציג מוצרים בלבד',
    type: 'core',
    category: 'operations',
    version: '1.0.0',
    icon: 'book-open',
    author: 'QuickShop',
    isFree: true,
    defaultConfig: {
      enabled: false,
      mode: 'all', // 'all' | 'categories'
      categoryIds: [], // רשימת קטגוריות (אם mode === 'categories')
      hideCartButton: true,
      hideCartSidebar: true,
      hideAddToCart: true,
      blockCheckout: true,
      showContactButton: false,
      contactButtonText: 'צור קשר להזמנה',
      contactButtonUrl: '',
    },
    metadata: {
      menuItem: {
        icon: 'BookOpen',
        label: 'מצב קטלוג',
        href: '/plugins/catalog-mode',
        section: 'addons',
      },
      features: [
        'הסתרת עגלת קניות מכל האתר',
        'הסתרת כפתור הוספה לסל',
        'חסימת דפי checkout ועגלה',
        'מצב קטלוג לפי קטגוריות',
        'כפתור צור קשר מותאם (אופציונלי)',
        'התאמה לחנויות B2B',
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
