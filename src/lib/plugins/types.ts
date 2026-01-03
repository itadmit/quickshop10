/**
 * Plugin System Types
 * 
 * מערכת תוספים מודולרית - כל תוסף נטען רק כשמותקן
 * תואם לדרישות המהירות: Server Components, lazy loading
 */

export type PluginType = 'core' | 'script';

export type PluginCategory = 
  | 'marketing'      // סטוריז, Shop the Look, פופאפים
  | 'loyalty'        // מועדון VIP, נקודות
  | 'analytics'      // Google Analytics, פיקסלים
  | 'payment'        // תשלום במזומן, ביט
  | 'inventory'      // באנדלים, מלאי מתקדם
  | 'communication'  // וואטסאפ, צ'אט
  | 'operations'     // שבת, שעות פעילות
  | 'customization'; // שדות מותאמים, טבלאות מידות

export type PluginStatus = 'active' | 'inactive' | 'pending' | 'expired';

export type ScriptLocation = 'head' | 'body_start' | 'body_end';

// הגדרת תוסף - מה שמופיע ב-Registry
export interface PluginDefinition {
  slug: string;
  name: string;
  description: string;
  type: PluginType;
  category: PluginCategory;
  version: string;
  icon?: string;
  author?: string;
  
  // תמחור
  isFree: boolean;
  price?: number;           // מחיר חודשי בש"ח
  trialDays?: number;       // ימי ניסיון חינם
  
  // לתוספי Script
  scriptUrl?: string;
  scriptContent?: string;
  injectLocation?: ScriptLocation;
  
  // הגדרות ברירת מחדל
  defaultConfig: Record<string, unknown>;
  
  // מטא-דאטה
  metadata?: {
    menuItem?: PluginMenuItem;
    screenshots?: string[];
    documentation?: string;
    features?: string[];
  };
  
  // דרישות
  requirements?: {
    minVersion?: string;
    requiredPlugins?: string[];
  };
}

// פריט תפריט שהתוסף מוסיף לסיידבר
export interface PluginMenuItem {
  icon: string;         // שם האייקון מ-lucide-react
  label: string;        // טקסט בעברית
  href: string;         // נתיב יחסי (יתווסף /shops/[slug]/admin/plugins/[pluginSlug])
  section?: 'marketing' | 'settings' | 'addons';  // היכן בסיידבר
  badge?: string;       // תג (חדש, Beta)
}

// התקנת תוסף בחנות ספציפית
export interface StorePlugin {
  id: string;
  storeId: string;
  pluginSlug: string;
  isActive: boolean;
  config: Record<string, unknown>;
  installedAt: Date;
  expiresAt?: Date;           // לתוספים בתשלום
  lastBillingDate?: Date;
  nextBillingDate?: Date;
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | 'trial';
}

// תוסף עם מידע מורחב (לתצוגה)
export interface PluginWithStatus extends PluginDefinition {
  isInstalled: boolean;
  isActive: boolean;
  config?: Record<string, unknown>;
  installedAt?: Date;
  subscription?: {
    status: string;
    expiresAt?: Date;
    nextBillingDate?: Date;
  };
}

// Hooks שתוסף Core יכול לממש
export interface PluginHooks {
  // אירועי עגלה
  onCartAdd?: (item: unknown, storeId: string) => Promise<void>;
  onCartUpdate?: (cart: unknown, storeId: string) => Promise<void>;
  
  // אירועי הזמנה
  onOrderCreate?: (order: unknown, storeId: string) => Promise<void>;
  onOrderComplete?: (order: unknown, storeId: string) => Promise<void>;
  
  // אירועי Storefront
  onStorefrontRender?: (storeId: string) => Promise<React.ReactNode | null>;
  onProductPageRender?: (productId: string, storeId: string) => Promise<React.ReactNode | null>;
}

// API Response Types
export interface PluginApiResponse {
  success: boolean;
  error?: string;
  plugin?: PluginWithStatus;
  plugins?: PluginWithStatus[];
}

export interface InstallPluginRequest {
  pluginSlug: string;
  config?: Record<string, unknown>;
}

export interface UpdatePluginConfigRequest {
  config: Record<string, unknown>;
}


