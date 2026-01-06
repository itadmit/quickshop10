# 📱 QuickShop Mobile App - מדריך מפתחים

> אפליקציית ניהול חנות לאנדרואיד ואייפון (Expo React Native)
> 
> **רפרנס**: Shopify Mobile App

---

## 📋 תוכן עניינים

1. [סקירה כללית](#-סקירה-כללית)
2. [ארכיטקטורה](#-ארכיטקטורה)
3. [אימות והרשאות](#-אימות-והרשאות)
4. [API Reference](#-api-reference)
5. [מודלים וסכמות](#-מודלים-וסכמות)
6. [מסכים ופיצ'רים](#-מסכים-ופיצרים)
7. [התראות Push](#-התראות-push)
8. [דגשים טכניים](#-דגשים-טכניים)
9. [השוואה לשופיפיי](#-השוואה-לשופיפיי)

---

## 🎯 סקירה כללית

### מטרת האפליקציה
אפליקציה לניהול חנות QuickShop מהנייד - מאפשרת לבעלי חנויות לנהל הזמנות, מוצרים, לקוחות ולצפות באנליטיקס בכל מקום.

### משתמשי יעד
| משתמש | תיאור | הרשאות |
|--------|--------|---------|
| **Owner** | בעל החנות | גישה מלאה |
| **Manager** | מנהל חנות | גישה מלאה למעט הגדרות רגישות |
| **Marketing** | שיווק | קופונים, הנחות, קמפיינים |
| **Developer** | מפתח | גישה ל-API, webhooks |
| **Influencer** | משפיען | דשבורד מכירות אישי בלבד |

### פיצ'רים עיקריים
- 📦 ניהול הזמנות (צפייה, עדכון סטטוס, הדפסה)
- 🛍️ ניהול מוצרים (מחירים, מלאי, תמונות)
- 👥 ניהול לקוחות
- 📊 דשבורד ואנליטיקס
- 🏷️ קופונים והנחות
- 🔔 התראות Push בזמן אמת
- 📷 סורק ברקוד לניהול מלאי
- 🖨️ חיבור למדפסת תוויות

---

## 🏗️ ארכיטקטורה

### Stack מומלץ

```
┌─────────────────────────────────────────────────────┐
│                    Expo (React Native)               │
├─────────────────────────────────────────────────────┤
│  Navigation: Expo Router / React Navigation          │
│  State: Zustand / TanStack Query                     │
│  Forms: React Hook Form + Zod                        │
│  UI: Tamagui / NativeWind                            │
│  Camera: expo-camera (barcode scanner)               │
│  Notifications: expo-notifications                   │
│  Secure Storage: expo-secure-store                   │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              QuickShop Backend API                   │
│                                                      │
│  Base URL: https://quickshop.co.il/api              │
│  Auth: Bearer Token (Session-based)                  │
│  Format: JSON                                        │
└─────────────────────────────────────────────────────┘
```

### מבנה פרויקט מומלץ

```
quickshop-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── store-select.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard
│   │   ├── orders/
│   │   │   ├── index.tsx         # Orders list
│   │   │   └── [id].tsx          # Order details
│   │   ├── products/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── customers/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   └── settings.tsx
│   └── _layout.tsx
│
├── components/
│   ├── ui/                       # Base UI components
│   ├── orders/
│   ├── products/
│   └── analytics/
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # API client setup
│   │   ├── auth.ts               # Auth endpoints
│   │   ├── orders.ts             # Orders endpoints
│   │   ├── products.ts           # Products endpoints
│   │   └── customers.ts          # Customers endpoints
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOrders.ts
│   │   └── useProducts.ts
│   ├── store/                    # Zustand stores
│   │   ├── auth.ts
│   │   └── app.ts
│   └── utils/
│       ├── format.ts
│       └── storage.ts
│
├── types/
│   └── index.ts                  # TypeScript types
│
└── app.json                      # Expo config
```

---

## 🔐 אימות והרשאות

### זרימת אימות

```
┌─────────────────────────────────────────────────────┐
│                  התחברות לאפליקציה                   │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  1. הזנת אימייל + סיסמה                             │
│  POST /api/auth/mobile/login                        │
│  { email, password, deviceId, pushToken }           │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  2. קבלת Session Token + רשימת חנויות              │
│  Response: {                                        │
│    token: "xxx",                                    │
│    user: { id, name, email },                       │
│    stores: [{ id, name, slug, role }]               │
│  }                                                  │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  3. בחירת חנות (אם יש יותר מאחת)                   │
│  שמירת storeId ב-SecureStore                       │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  4. כל קריאת API כוללת:                            │
│  Headers: {                                         │
│    Authorization: "Bearer {token}",                 │
│    X-Store-Id: "{storeId}"                          │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

### API: התחברות

```typescript
// POST /api/mobile/auth/login
// ✅ IMPLEMENTED

interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;          // Unique device identifier
  pushToken?: string;        // Expo push token for notifications
  platform: 'ios' | 'android';
  appVersion: string;
}

interface LoginResponse {
  success: boolean;
  token: string;             // Session token (store in SecureStore)
  refreshToken?: string;     // For token refresh
  expiresAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: 'admin' | 'merchant';
  };
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    role: 'owner' | 'manager' | 'marketing' | 'developer';
    permissions: Record<string, boolean>;
  }>;
}
```

### API: רענון טוקן

```typescript
// POST /api/mobile/auth/refresh
// ✅ IMPLEMENTED

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  expiresAt: string;
}
```

### API: התנתקות

```typescript
// POST /api/mobile/auth/logout
// ✅ IMPLEMENTED

// Header: Authorization: Bearer {token}
// מוחק את ה-session מהמכשיר

interface LogoutResponse {
  success: boolean;
  message: string;
}
```

### אחסון מאובטח

```typescript
// lib/utils/storage.ts
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  STORE_ID: 'current_store_id',
  USER: 'user_data',
};

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.AUTH_TOKEN);
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.STORE_ID),
  ]);
}
```

### הרשאות לפי תפקיד

```typescript
type Permission = 
  | 'orders.view'
  | 'orders.update'
  | 'orders.delete'
  | 'products.view'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'customers.view'
  | 'customers.update'
  | 'discounts.view'
  | 'discounts.create'
  | 'analytics.view'
  | 'settings.view'
  | 'settings.update'
  | 'team.manage';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: ['*'], // All permissions
  manager: [
    'orders.view', 'orders.update',
    'products.view', 'products.create', 'products.update',
    'customers.view', 'customers.update',
    'discounts.view', 'discounts.create',
    'analytics.view',
    'settings.view',
  ],
  marketing: [
    'products.view',
    'customers.view',
    'discounts.view', 'discounts.create',
    'analytics.view',
  ],
  developer: [
    'settings.view',
    // API access managed separately
  ],
};
```

---

## 📡 API Reference

### 🎯 סטטוס Endpoints - מה מוכן

| Endpoint | Method | Status | תיאור |
|----------|--------|--------|-------|
| `/api/mobile/auth/login` | POST | ✅ | התחברות מובייל |
| `/api/mobile/auth/refresh` | POST | ✅ | רענון טוקן |
| `/api/mobile/auth/logout` | POST | ✅ | התנתקות |
| `/api/mobile/store` | GET | ✅ | פרטי חנות נוכחית |
| `/api/mobile/store/switch` | POST | ✅ | החלפת חנות |
| `/api/mobile/orders` | GET | ✅ | רשימת הזמנות |
| `/api/mobile/orders/{id}` | GET | ✅ | פרטי הזמנה |
| `/api/mobile/orders/{id}` | PATCH | ✅ | עדכון הזמנה |
| `/api/mobile/orders/{id}/read` | PATCH | ✅ | סימון כנקראה |
| `/api/mobile/products` | GET | ✅ | רשימת מוצרים |
| `/api/mobile/products/{id}` | GET | ✅ | פרטי מוצר |
| `/api/mobile/products/{id}` | PATCH | ✅ | עדכון מוצר |
| `/api/mobile/products/{id}/inventory` | PATCH | ✅ | עדכון מלאי |
| `/api/mobile/products/barcode/{code}` | GET | ✅ | חיפוש בברקוד |
| `/api/mobile/customers` | GET | ✅ | רשימת לקוחות |
| `/api/mobile/customers/{id}` | GET | ✅ | פרטי לקוח |
| `/api/mobile/analytics/summary` | GET | ✅ | סיכום אנליטיקס |
| `/api/mobile/discounts` | GET | ✅ | רשימת הנחות |
| `/api/mobile/notifications` | GET | ✅ | רשימת התראות |
| `/api/mobile/notifications` | POST | ✅ | רישום Push Token |
| `/api/mobile/notifications/read` | PATCH | ✅ | סימון כנקראות |
| `/api/mobile/notifications/settings` | GET/PATCH | ✅ | הגדרות התראות |

#### Endpoints שטרם מומשו:

| Endpoint | Method | תיאור |
|----------|--------|-------|
| `/api/mobile/analytics/realtime` | GET | נתונים בזמן אמת (דורש Redis) |
| `/api/mobile/discounts/quick` | POST | יצירת קופון מהירה |
| `/api/mobile/returns` | GET | רשימת בקשות החזרה |
| `/api/mobile/settings` | GET/PATCH | הגדרות חנות |

### Base Configuration

```typescript
// lib/api/client.ts
import { getAuthToken, getStoreId } from '../utils/storage';

const API_BASE = 'https://my-quickshop.com/api';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const storeId = await getStoreId();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Store-Id': storeId || '',
      'X-Platform': 'mobile',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle token refresh or logout
      throw new AuthError('Session expired');
    }
    throw new ApiError(response.status, await response.text());
  }
  
  return response.json();
}
```

---

### 📦 Orders API

#### רשימת הזמנות

```typescript
// GET /api/shops/{slug}/admin/orders
// Existing endpoint - can be reused

interface OrdersListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  search?: string;           // Search by order number, email, name
  dateFrom?: string;         // ISO date
  dateTo?: string;
  archived?: boolean;
}

interface OrdersListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

// Usage
const orders = await apiClient<OrdersListResponse>(
  `/shops/${slug}/admin/orders?page=1&limit=20&status=pending`
);
```

#### פרטי הזמנה

```typescript
// GET /api/mobile/orders/{id}
// ✅ IMPLEMENTED או להרחיב קיים

interface OrderDetailResponse {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    financialStatus: FinancialStatus;
    fulfillmentStatus: FulfillmentStatus;
    
    // Amounts
    subtotal: number;
    discountCode: string | null;
    discountAmount: number;
    shippingAmount: number;
    taxAmount: number;
    creditUsed: number;
    total: number;
    currency: string;
    
    // Customer
    customerId: string | null;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    
    // Addresses
    shippingAddress: Address;
    billingAddress: Address | null;
    shippingMethod: string | null;
    
    // Payment
    paymentMethod: string | null;
    paymentDetails: Record<string, unknown> | null;
    paidAt: string | null;
    
    // Notes
    note: string | null;
    internalNote: string | null;
    
    // Tracking
    influencerId: string | null;
    isRead: boolean;
    
    // Timestamps
    createdAt: string;
    updatedAt: string;
  };
  
  items: Array<{
    id: string;
    productId: string | null;
    name: string;
    variantTitle: string | null;
    sku: string | null;
    quantity: number;
    price: number;
    total: number;
    imageUrl: string | null;
  }>;
  
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    totalOrders: number;
    totalSpent: number;
    creditBalance: number;
  } | null;
  
  transactions: Array<{
    id: string;
    type: 'charge' | 'refund';
    status: 'pending' | 'success' | 'failed';
    amount: number;
    provider: string;
    createdAt: string;
  }>;
  
  timeline: Array<{
    action: string;
    description: string;
    userId: string | null;
    createdAt: string;
  }>;
}
```

#### עדכון סטטוס הזמנה

```typescript
// PATCH /api/mobile/orders/{id}
// ✅ IMPLEMENTED

interface UpdateOrderStatusRequest {
  status?: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  internalNote?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notifyCustomer?: boolean;   // Send email to customer
}

interface UpdateOrderStatusResponse {
  success: boolean;
  order: Order;
}

// Usage - mark as shipped
await apiClient('/shops/mystore/admin/orders/123/status', {
  method: 'PATCH',
  body: JSON.stringify({
    fulfillmentStatus: 'fulfilled',
    trackingNumber: '123456789',
    notifyCustomer: true,
  }),
});
```

#### סימון הזמנה כנקראה

```typescript
// PATCH /api/mobile/orders/{id}/read
// ✅ IMPLEMENTED

// No body needed
await apiClient(`/shops/${slug}/admin/orders/${id}/read`, {
  method: 'PATCH',
});
```

#### ארכוב הזמנות

```typescript
// POST /api/shops/{slug}/admin/orders/archive
// Existing server action - convert to API

interface ArchiveOrdersRequest {
  orderIds: string[];
}

interface ArchiveOrdersResponse {
  success: boolean;
  archivedCount: number;
}
```

#### החזר כספי (Refund)

```typescript
// POST /api/shops/{slug}/admin/orders/{id}/refund
// Partial exists - needs full implementation

interface RefundOrderRequest {
  amount?: number;            // Partial refund amount (optional)
  reason?: string;
  restockItems?: boolean;     // Return items to inventory
  notifyCustomer?: boolean;
}

interface RefundOrderResponse {
  success: boolean;
  refund: {
    id: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId: string | null;
  };
}
```

---

### 🛍️ Products API

#### רשימת מוצרים

```typescript
// GET /api/mobile/products
// ✅ IMPLEMENTED

interface ProductsListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'active' | 'draft' | 'all';
  hasVariants?: boolean;
  lowStock?: boolean;          // inventory < 5
  outOfStock?: boolean;        // inventory = 0
  sortBy?: 'name' | 'price' | 'inventory' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface ProductsListResponse {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number | null;
    comparePrice: number | null;
    imageUrl: string | null;
    inventory: number | null;
    hasVariants: boolean;
    variantsCount: number;
    isActive: boolean;
    isFeatured: boolean;
    category: {
      id: string;
      name: string;
    } | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    draft: number;
    lowStock: number;
    outOfStock: number;
  };
}
```

#### פרטי מוצר

```typescript
// GET /api/mobile/products/{id}
// ✅ IMPLEMENTED

interface ProductDetailResponse {
  product: {
    id: string;
    storeId: string;
    categoryId: string | null;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    price: number | null;
    comparePrice: number | null;
    cost: number | null;
    sku: string | null;
    barcode: string | null;
    weight: number | null;
    hasVariants: boolean;
    trackInventory: boolean;
    inventory: number | null;
    allowBackorder: boolean;
    isActive: boolean;
    isFeatured: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }>;
  
  options: Array<{
    id: string;
    name: string;
    sortOrder: number;
    values: Array<{
      id: string;
      value: string;
      sortOrder: number;
    }>;
  }>;
  
  variants: Array<{
    id: string;
    title: string;
    sku: string | null;
    barcode: string | null;
    price: number;
    comparePrice: number | null;
    cost: number | null;
    inventory: number | null;
    weight: number | null;
    imageUrl: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    isActive: boolean;
  }>;
  
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  
  categories: Array<{
    id: string;
    name: string;
  }>;
}
```

#### עדכון מהיר מלאי

```typescript
// PATCH /api/mobile/products/{id}/inventory
// ✅ IMPLEMENTED

interface UpdateInventoryRequest {
  // For simple products
  inventory?: number;
  
  // For variants
  variants?: Array<{
    id: string;
    inventory: number;
  }>;
  
  // Adjustment mode (instead of absolute value)
  adjustment?: {
    type: 'add' | 'subtract' | 'set';
    value: number;
    variantId?: string;
  };
}

interface UpdateInventoryResponse {
  success: boolean;
  product: {
    id: string;
    inventory: number | null;
    variants: Array<{
      id: string;
      inventory: number | null;
    }>;
  };
}

// Usage - quick inventory update from mobile
await apiClient(`/shops/${slug}/admin/products/${id}/inventory`, {
  method: 'PATCH',
  body: JSON.stringify({
    adjustment: {
      type: 'subtract',
      value: 1,
      variantId: 'variant-123',
    },
  }),
});
```

#### עדכון מהיר מחיר

```typescript
// PATCH /api/mobile/products/{id}
// ✅ IMPLEMENTED (as part of general product update)

interface UpdatePriceRequest {
  price?: number;
  comparePrice?: number | null;
  variantId?: string;          // For specific variant
}

interface UpdatePriceResponse {
  success: boolean;
  product: {
    id: string;
    price: number | null;
    comparePrice: number | null;
  };
}
```

#### סריקת ברקוד

```typescript
// GET /api/mobile/products/barcode/{code}
// ✅ IMPLEMENTED

interface BarcodeSearchResponse {
  found: boolean;
  product?: {
    id: string;
    name: string;
    price: number | null;
    inventory: number | null;
    imageUrl: string | null;
  };
  variant?: {
    id: string;
    title: string;
    price: number;
    inventory: number | null;
  };
}

// Usage - barcode scanner
const result = await apiClient<BarcodeSearchResponse>(
  `/shops/${slug}/admin/products/barcode/7290000000001`
);

if (result.found) {
  // Show product quick-edit modal
  showQuickEdit(result.product, result.variant);
}
```

---

### 👥 Customers API

#### רשימת לקוחות

```typescript
// GET /api/mobile/customers
// ✅ IMPLEMENTED

interface CustomersListParams {
  page?: number;
  limit?: number;
  search?: string;             // email, name, phone
  hasOrders?: boolean;
  acceptsMarketing?: boolean;
  sortBy?: 'name' | 'totalSpent' | 'totalOrders' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface CustomersListResponse {
  customers: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    totalOrders: number;
    totalSpent: number;
    creditBalance: number;
    acceptsMarketing: boolean;
    lastOrderAt: string | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### פרטי לקוח

```typescript
// GET /api/mobile/customers/{id}
// ✅ IMPLEMENTED

interface CustomerDetailResponse {
  customer: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    defaultAddress: Address | null;
    notes: string | null;
    totalOrders: number;
    totalSpent: number;
    creditBalance: number;
    acceptsMarketing: boolean;
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  
  orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
  }>;
  
  creditHistory: Array<{
    id: string;
    type: 'credit' | 'debit' | 'refund';
    amount: number;
    balanceAfter: number;
    reason: string | null;
    createdAt: string;
  }>;
}
```

#### הוספת קרדיט ללקוח

```typescript
// POST /api/admin/customer/credit
// Existing endpoint

interface AddCreditRequest {
  customerId: string;
  amount: number;
  reason: string;
}

interface AddCreditResponse {
  success: boolean;
  customer: {
    id: string;
    creditBalance: number;
  };
}
```

---

### 📊 Analytics API

#### Dashboard Summary

```typescript
// GET /api/mobile/analytics/summary
// ✅ IMPLEMENTED

interface DashboardSummaryParams {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year';
  dateFrom?: string;
  dateTo?: string;
}

interface DashboardSummaryResponse {
  revenue: {
    total: number;
    change: number;           // % change from previous period
    orders: number;
    avgOrderValue: number;
  };
  
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    change: number;
  };
  
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  
  customers: {
    total: number;
    new: number;
    returning: number;
    change: number;
  };
  
  topProducts: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    revenue: number;
    quantity: number;
  }>;
  
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
  }>;
  
  // Chart data
  revenueChart: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}
```

#### Realtime Stats

```typescript
// GET /api/mobile/analytics/realtime
// ❌ NOT YET IMPLEMENTED - עובד עם Redis

interface RealtimeStatsResponse {
  activeVisitors: number;
  todayPageViews: number;
  todayOrders: number;
  todayRevenue: number;
  
  // Live cart info
  activeCarts: number;
  cartValue: number;
}
```

---

### 🏷️ Discounts API

#### רשימת קופונים

```typescript
// GET /api/mobile/discounts
// ✅ IMPLEMENTED

interface DiscountsListResponse {
  coupons: Array<{
    id: string;
    code: string;
    title: string | null;
    type: DiscountType;
    value: number;
    usageCount: number;
    usageLimit: number | null;
    isActive: boolean;
    startsAt: string | null;
    endsAt: string | null;
  }>;
  
  automaticDiscounts: Array<{
    id: string;
    name: string;
    type: DiscountType;
    value: number;
    appliesTo: 'all' | 'category' | 'product' | 'member';
    isActive: boolean;
    usageCount: number;
  }>;
}
```

#### יצירת קופון מהיר

```typescript
// POST /api/mobile/discounts/quick
// ❌ NOT YET IMPLEMENTED - יצירת קופון מהירה

interface QuickCouponRequest {
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumAmount?: number;
  usageLimit?: number;
  endsAt?: string;
}

interface QuickCouponResponse {
  success: boolean;
  coupon: {
    id: string;
    code: string;
    type: DiscountType;
    value: number;
  };
}
```

---

### 🔄 Returns API

#### רשימת בקשות החזרה

```typescript
// GET /api/mobile/returns
// ❌ NOT YET IMPLEMENTED

interface ReturnsListParams {
  page?: number;
  limit?: number;
  status?: ReturnRequestStatus;
  type?: 'return' | 'exchange';
}

interface ReturnsListResponse {
  returns: Array<{
    id: string;
    requestNumber: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    type: 'return' | 'exchange';
    status: ReturnRequestStatus;
    totalValue: number;
    reason: ReturnReason;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  stats: {
    pending: number;
    approved: number;
    completed: number;
  };
}
```

---

### 🔔 Notifications API

#### רשימת התראות

```typescript
// GET /api/mobile/notifications
// ✅ IMPLEMENTED

interface NotificationsListResponse {
  notifications: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string | null;
    resourceId: string | null;
    resourceType: string | null;
    isRead: boolean;
    createdAt: string;
  }>;
  unreadCount: number;
}

type NotificationType = 
  | 'new_order'
  | 'low_stock'
  | 'out_of_stock'
  | 'new_customer'
  | 'order_cancelled'
  | 'return_request'
  | 'system';
```

#### סימון התראות כנקראו

```typescript
// PATCH /api/mobile/notifications/read
// ✅ IMPLEMENTED

interface MarkNotificationsReadRequest {
  notificationIds?: string[];  // Specific IDs, or all if empty
}
```

#### רישום Push Token

```typescript
// POST /api/mobile/notifications
// ✅ IMPLEMENTED (with POST body containing pushToken)

interface RegisterPushTokenRequest {
  pushToken: string;           // Expo push token
  deviceId: string;
  platform: 'ios' | 'android';
}
```

---

## 📊 מודלים וסכמות

### סטטוסים

```typescript
// Order Status
type OrderStatus = 
  | 'pending'      // ממתינה
  | 'confirmed'    // אושרה
  | 'processing'   // בטיפול
  | 'shipped'      // נשלחה
  | 'delivered'    // נמסרה
  | 'cancelled'    // בוטלה
  | 'refunded';    // זוכתה

// Financial Status
type FinancialStatus = 
  | 'pending'           // ממתין לתשלום
  | 'paid'              // שולם
  | 'partially_paid'    // שולם חלקית
  | 'refunded'          // זוכה
  | 'partially_refunded'; // זוכה חלקית

// Fulfillment Status
type FulfillmentStatus = 
  | 'unfulfilled'  // לא נשלח
  | 'partial'      // נשלח חלקית
  | 'fulfilled';   // נשלח

// Discount Types
type DiscountType = 
  | 'percentage'        // אחוז הנחה
  | 'fixed_amount'      // סכום קבוע
  | 'free_shipping'     // משלוח חינם
  | 'buy_x_pay_y'       // קנה X שלם Y
  | 'buy_x_get_y'       // קנה X קבל Y
  | 'gift_product'      // מוצר במתנה
  | 'quantity_discount' // הנחת כמות
  | 'spend_x_pay_y';    // קנה ב-X שלם Y

// Return Request Status
type ReturnRequestStatus = 
  | 'pending'           // ממתין לבדיקה
  | 'under_review'      // בבדיקה
  | 'approved'          // אושר
  | 'rejected'          // נדחה
  | 'awaiting_shipment' // ממתין למשלוח
  | 'item_received'     // המוצר התקבל
  | 'completed'         // הושלם
  | 'cancelled';        // בוטל
```

### Address

```typescript
interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  address?: string;
  street?: string;
  houseNumber?: string;
  apartment?: string;
  floor?: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  country?: string;
}
```

### Order

```typescript
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  financialStatus: FinancialStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  creditUsed: number;
  total: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: Address;
  billingAddress: Address | null;
  note: string | null;
  internalNote: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Product

```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  comparePrice: number | null;
  cost: number | null;
  sku: string | null;
  barcode: string | null;
  weight: number | null;
  hasVariants: boolean;
  trackInventory: boolean;
  inventory: number | null;
  allowBackorder: boolean;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  comparePrice: number | null;
  inventory: number | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  isActive: boolean;
}
```

### Customer

```typescript
interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  defaultAddress: Address | null;
  notes: string | null;
  totalOrders: number;
  totalSpent: number;
  creditBalance: number;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 📱 מסכים ופיצ'רים

### מבנה ניווט

```
┌─────────────────────────────────────────────────────────────────┐
│                         Tab Navigator                            │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   🏠 Home   │  📦 Orders  │  🛍️ Products │  👥 Customers│ ⚙️ More │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

### 1. Dashboard (Home)

```
┌─────────────────────────────────────────────────────────────────┐
│  🏪 שם החנות                                    🔔 (3)  👤     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  היום                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   ₪12,500   │  │     28      │  │    ₪446     │              │
│  │   מכירות    │  │   הזמנות    │  │  ממוצע      │              │
│  │   ▲ 15%     │  │   ▲ 8      │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  📈 גרף מכירות (7 ימים)                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      📊 Chart                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  🔔 דורשות טיפול                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 5 הזמנות ממתינות                                    →      ││
│  │ 3 מוצרים במלאי נמוך                                 →      ││
│  │ 2 בקשות החזרה                                       →      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  📦 הזמנות אחרונות                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ #1045  │  ישראל כהן  │  ₪320  │  ממתינה    │  10:30      ││
│  │ #1044  │  שרה לוי    │  ₪189  │  בטיפול    │  09:15      ││
│  │ #1043  │  דוד חיים   │  ₪450  │  נשלחה     │  אתמול      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Orders List

```
┌─────────────────────────────────────────────────────────────────┐
│  הזמנות                                        🔍  📊           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ הכל (156) │ ממתינות (5) │ בטיפול (12) │ נשלחו (28) │ ...  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔴 #1045         ישראל כהן          היום 10:30             ││
│  │    3 פריטים      ₪320               🟡 ממתינה              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │    #1044         שרה לוי            היום 09:15             ││
│  │    1 פריט        ₪189               🔵 בטיפול              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │    #1043         דוד חיים           אתמול 18:00            ││
│  │    2 פריטים      ₪450               🟢 נשלחה               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Pull to refresh...                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

🔴 = לא נקראה
```

### 3. Order Details

```
┌─────────────────────────────────────────────────────────────────┐
│  ← חזרה           הזמנה #1045                     ⋮            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  סטטוס: 🟡 ממתינה                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ▼ שנה סטטוס                                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  👤 פרטי לקוח                                                   │
│  ישראל כהן                                                      │
│  📧 israel@email.com                                            │
│  📱 050-1234567                          [📞 התקשר]             │
│                                                                  │
│  🏠 כתובת משלוח                                                 │
│  הרצל 15, דירה 4                                                │
│  תל אביב, 6789012                        [📍 ניווט]             │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  📦 פריטים                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [🖼️] חולצה כחולה - M         x1             ₪199          ││
│  │ [🖼️] מכנסיים שחורים - L     x1             ₪299          ││
│  │ [🖼️] גרביים                  x2             ₪58           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  💰 סיכום                                                       │
│  סכום ביניים                                        ₪556       │
│  הנחה (SUMMER20)                                   -₪111       │
│  משלוח                                              ₪30        │
│  ────────────────────────────────────────────────────────       │
│  סה"כ                                               ₪475       │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  📝 הערות                                                       │
│  [הוסף הערה פנימית...]                                          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │               ✓ סמן כנשלחה                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Products List

```
┌─────────────────────────────────────────────────────────────────┐
│  מוצרים                                    🔍  📷  ➕           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ הכל │ פעילים │ טיוטה │ מלאי נמוך │ אזל                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [🖼️] חולצה כחולה                                           ││
│  │      ₪199  │  🟢 12 במלאי  │  5 מכירות                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [🖼️] מכנסיים שחורים                                        ││
│  │      ₪299  │  🟡 3 במלאי   │  12 מכירות                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [🖼️] נעליים ספורט                                          ││
│  │      ₪449  │  🔴 אזל       │  8 מכירות                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

📷 = Barcode Scanner
```

### 5. Quick Inventory Edit (Modal)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                        ✕        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         [🖼️ Product Image]                                      │
│                                                                  │
│         חולצה כחולה                                             │
│         מק"ט: SKU-001                                           │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  מלאי נוכחי: 12                                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [-]                   12                   [+]             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  או הזן ערך חדש:                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                          15                                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  מחיר: ₪199                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                        ₪199                                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                       שמור שינויים                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Barcode Scanner

```
┌─────────────────────────────────────────────────────────────────┐
│  סורק ברקוד                                            ✕        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │                                                              ││
│  │                    📷 Camera View                            ││
│  │                                                              ││
│  │           ┌─────────────────────────┐                       ││
│  │           │     Scan Area           │                       ││
│  │           └─────────────────────────┘                       ││
│  │                                                              ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  מחפש ברקוד...                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔦 פנס │ או הזן ידנית: [_______________]                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7. More Menu

```
┌─────────────────────────────────────────────────────────────────┐
│  עוד                                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🏷️  קופונים והנחות                                     →   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📊  דוחות ואנליטיקס                                    →   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔄  החזרות והחלפות                                     →   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 👑  משפיענים                                            →   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📧  אנשי קשר                                            →   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⚙️  הגדרות חנות                                         →   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔔  הגדרות התראות                                       →   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🏪  החלפת חנות                                          →   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🚪  התנתקות                                                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  גרסה 1.0.0 (build 1)                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔔 התראות Push

### סוגי התראות

| סוג | הודעה | פעולה |
|-----|-------|-------|
| `new_order` | "הזמנה חדשה #1045 - ₪320" | פתיחת הזמנה |
| `low_stock` | "מלאי נמוך: חולצה כחולה (3 במלאי)" | פתיחת מוצר |
| `out_of_stock` | "אזל מהמלאי: נעליים ספורט" | פתיחת מוצר |
| `new_customer` | "לקוח חדש: israel@email.com" | פתיחת לקוח |
| `order_cancelled` | "הזמנה #1045 בוטלה" | פתיחת הזמנה |
| `return_request` | "בקשת החזרה חדשה #R1001" | פתיחת בקשה |

### אינטגרציה עם Expo

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return null;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('orders', {
      name: 'הזמנות',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  return token;
}

// Handle notification tap
export function setupNotificationListener(
  onNotification: (notification: Notifications.Notification) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const { notification } = response;
      onNotification(notification);
    }
  );
  
  return subscription;
}
```

### Backend: שליחת Push

```typescript
// צריך להוסיף ב-lib/events.ts או ליצור service חדש

import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(
  pushTokens: string[],
  title: string,
  body: string,
  data: Record<string, string>
) {
  const messages: ExpoPushMessage[] = pushTokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));
  
  const chunks = expo.chunkPushNotifications(messages);
  
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }
}

// Usage in order.created event
export async function emitOrderCreated(
  storeId: string,
  orderId: string,
  orderNumber: string,
  total: number
) {
  // Get all push tokens for store members
  const tokens = await getStorePushTokens(storeId);
  
  await sendPushNotification(
    tokens,
    'הזמנה חדשה!',
    `הזמנה #${orderNumber} - ₪${total}`,
    { 
      type: 'new_order',
      orderId,
      orderNumber,
    }
  );
}
```

---

## 🔧 דגשים טכניים

### ביצועים

```typescript
// 1. Optimistic Updates - עדכון UI מיידי
const updateOrderStatus = useMutation({
  mutationFn: (data) => api.updateOrderStatus(data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['order', orderId]);
    
    // Snapshot previous value
    const previousOrder = queryClient.getQueryData(['order', orderId]);
    
    // Optimistically update
    queryClient.setQueryData(['order', orderId], (old) => ({
      ...old,
      status: newData.status,
    }));
    
    return { previousOrder };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['order', orderId], context.previousOrder);
  },
});

// 2. Infinite Scroll for Lists
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['orders'],
  queryFn: ({ pageParam = 1 }) => fetchOrders({ page: pageParam }),
  getNextPageParam: (lastPage) => 
    lastPage.pagination.page < lastPage.pagination.totalPages 
      ? lastPage.pagination.page + 1 
      : undefined,
});

// 3. Cache Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
    },
  },
});
```

### Offline Support

```typescript
// lib/offline.ts
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Queue for offline actions
const OFFLINE_QUEUE_KEY = 'offline_queue';

interface OfflineAction {
  id: string;
  type: 'UPDATE_ORDER_STATUS' | 'UPDATE_INVENTORY';
  payload: Record<string, unknown>;
  timestamp: number;
}

export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
  const queue = await getOfflineQueue();
  const newAction: OfflineAction = {
    ...action,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  
  queue.push(newAction);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function processOfflineQueue() {
  const queue = await getOfflineQueue();
  
  for (const action of queue) {
    try {
      switch (action.type) {
        case 'UPDATE_ORDER_STATUS':
          await api.updateOrderStatus(action.payload);
          break;
        case 'UPDATE_INVENTORY':
          await api.updateInventory(action.payload);
          break;
      }
      // Remove from queue on success
      await removeFromQueue(action.id);
    } catch (error) {
      console.error('Failed to process offline action:', action.id);
    }
  }
}

// Listen for network changes
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    processOfflineQueue();
  }
});
```

### אבטחה

```typescript
// 1. Certificate Pinning (for production)
// expo-dev-client or react-native-ssl-pinning

// 2. Biometric Authentication
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateWithBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (!hasHardware || !isEnrolled) {
    return false;
  }
  
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'אמת את זהותך',
    fallbackLabel: 'השתמש בסיסמה',
  });
  
  return result.success;
}

// 3. Secure Storage (already shown above)

// 4. App Lock after inactivity
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useAppLock() {
  const [isLocked, setIsLocked] = useState(false);
  const lastActiveRef = useRef(Date.now());
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const elapsed = Date.now() - lastActiveRef.current;
        if (elapsed > LOCK_TIMEOUT) {
          setIsLocked(true);
        }
      } else {
        lastActiveRef.current = Date.now();
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  return { isLocked, unlock: () => setIsLocked(false) };
}
```

### RTL Support

```typescript
// app.json
{
  "expo": {
    "extra": {
      "supportsRTL": true
    }
  }
}

// _layout.tsx
import { I18nManager } from 'react-native';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Restart app if needed
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  Updates.reloadAsync();
}
```

---

## 📊 השוואה לשופיפיי

### Shopify Mobile App Features

| פיצ'ר | Shopify | QuickShop Mobile | עדיפות |
|-------|---------|------------------|--------|
| **הזמנות** |
| צפייה בהזמנות | ✅ | ✅ | P0 |
| עדכון סטטוס | ✅ | ✅ | P0 |
| שליחת אימייל ללקוח | ✅ | ✅ | P1 |
| הדפסת תווית | ✅ | ✅ | P1 |
| Fulfillment scanning | ✅ | ✅ | P2 |
| **מוצרים** |
| צפייה במוצרים | ✅ | ✅ | P0 |
| עדכון מלאי | ✅ | ✅ | P0 |
| סורק ברקוד | ✅ | ✅ | P1 |
| עדכון מחיר | ✅ | ✅ | P1 |
| הוספת מוצר | ✅ | P2 | P2 |
| **לקוחות** |
| צפייה בלקוחות | ✅ | ✅ | P0 |
| היסטוריית הזמנות | ✅ | ✅ | P1 |
| הוספת הערות | ✅ | ✅ | P2 |
| **אנליטיקס** |
| Dashboard | ✅ | ✅ | P0 |
| גרפים | ✅ | ✅ | P1 |
| Real-time | ✅ | ✅ | P2 |
| **שיווק** |
| קופונים | ✅ | ✅ | P1 |
| הנחות אוטומטיות | ✅ | ✅ | P2 |
| **התראות** |
| Push notifications | ✅ | ✅ | P0 |
| הגדרות התראות | ✅ | ✅ | P1 |
| **אחר** |
| Multi-store | ✅ | ✅ | P1 |
| Dark mode | ✅ | ✅ | P2 |
| Offline mode | ✅ | ✅ | P2 |
| Biometric auth | ✅ | ✅ | P2 |

### יתרונות QuickShop על Shopify

1. **RTL מובנה** - תמיכה מלאה בעברית ו-RTL
2. **מותאם לישראל** - משלוחים, תשלומים, מע"מ
3. **מחיר תחרותי** - ללא עמלות עסקה גבוהות
4. **אינטגרציה הדוקה** - עם כל מערכות QuickShop

---

## 🚀 שלבי פיתוח

### Phase 1 - MVP (4-6 שבועות)

- [ ] Setup Expo project + navigation
- [ ] Authentication flow
- [ ] Dashboard with basic stats
- [ ] Orders list + detail view
- [ ] Update order status
- [ ] Basic push notifications

### Phase 2 - Core Features (4-6 שבועות)

- [ ] Products list + inventory management
- [ ] Barcode scanner
- [ ] Customers list + detail
- [ ] Full notifications system
- [ ] Multi-store support

### Phase 3 - Advanced (4-6 שבועות)

- [ ] Offline mode
- [ ] Analytics & reports
- [ ] Discounts management
- [ ] Returns handling
- [ ] Biometric auth
- [ ] Dark mode

### Phase 4 - Polish (2-4 שבועות)

- [ ] Performance optimization
- [ ] Animations & UX improvements
- [ ] Accessibility
- [ ] App Store / Play Store submission

---

## 📝 API Endpoints לפיתוח

### Endpoints חדשים נדרשים

| Endpoint | Method | תיאור | עדיפות |
|----------|--------|-------|--------|
| `/api/auth/mobile/login` | POST | התחברות מובייל | P0 |
| `/api/auth/mobile/refresh` | POST | רענון טוקן | P0 |
| `/api/shops/{slug}/admin/orders` | GET | רשימת הזמנות (paginated) | P0 |
| `/api/shops/{slug}/admin/orders/{id}` | GET | פרטי הזמנה מלאים | P0 |
| `/api/shops/{slug}/admin/orders/{id}/status` | PATCH | עדכון סטטוס | P0 |
| `/api/shops/{slug}/admin/orders/{id}/read` | PATCH | סימון כנקראה | P1 |
| `/api/shops/{slug}/admin/products` | GET | רשימת מוצרים | P0 |
| `/api/shops/{slug}/admin/products/{id}` | GET | פרטי מוצר | P0 |
| `/api/shops/{slug}/admin/products/{id}/inventory` | PATCH | עדכון מלאי | P0 |
| `/api/shops/{slug}/admin/products/{id}/price` | PATCH | עדכון מחיר | P1 |
| `/api/shops/{slug}/admin/products/barcode/{code}` | GET | חיפוש ברקוד | P1 |
| `/api/shops/{slug}/admin/customers` | GET | רשימת לקוחות | P1 |
| `/api/shops/{slug}/admin/customers/{id}` | GET | פרטי לקוח | P1 |
| `/api/shops/{slug}/admin/analytics/summary` | GET | Dashboard summary | P0 |
| `/api/shops/{slug}/admin/analytics/realtime` | GET | Realtime stats | P2 |
| `/api/shops/{slug}/admin/notifications` | GET | רשימת התראות | P1 |
| `/api/shops/{slug}/admin/notifications/read` | PATCH | סימון כנקראו | P1 |
| `/api/shops/{slug}/admin/notifications/register-push` | POST | רישום Push token | P0 |
| `/api/shops/{slug}/admin/discounts` | GET | רשימת קופונים | P1 |
| `/api/shops/{slug}/admin/discounts/quick` | POST | יצירת קופון מהיר | P2 |
| `/api/shops/{slug}/admin/returns` | GET | רשימת החזרות | P2 |

---

## 🎨 Design System

### צבעים

```typescript
const colors = {
  // Brand
  primary: '#3b82f6',
  primaryDark: '#1e40af',
  
  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Order status colors
  orderPending: '#f59e0b',
  orderProcessing: '#3b82f6',
  orderShipped: '#8b5cf6',
  orderDelivered: '#22c55e',
  orderCancelled: '#ef4444',
  
  // Text
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  
  // Background
  bgPrimary: '#ffffff',
  bgSecondary: '#f3f4f6',
  bgTertiary: '#e5e7eb',
  
  // Dark mode
  dark: {
    bgPrimary: '#111827',
    bgSecondary: '#1f2937',
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
  },
};
```

### Typography

```typescript
const typography = {
  // Hebrew-first fonts
  fontFamily: {
    regular: 'Heebo-Regular',
    medium: 'Heebo-Medium',
    bold: 'Heebo-Bold',
  },
  
  // Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
};
```

---

## ✅ Checklist לפני השקה

### אבטחה
- [ ] Certificate pinning enabled
- [ ] Secure storage for tokens
- [ ] Biometric auth implemented
- [ ] App lock after inactivity
- [ ] No sensitive data in logs

### ביצועים
- [ ] List virtualization
- [ ] Image caching
- [ ] API response caching
- [ ] Offline queue

### UX
- [ ] Pull to refresh
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Haptic feedback

### נגישות
- [ ] Screen reader support
- [ ] Touch targets ≥ 44pt
- [ ] Color contrast
- [ ] Font scaling

### App Stores
- [ ] App icons (all sizes)
- [ ] Splash screens
- [ ] Screenshots
- [ ] Privacy policy
- [ ] Terms of service

---

**מסמך זה ישמש כבסיס לפיתוח האפליקציה. יש לעדכנו בהתאם להתקדמות הפיתוח.**

