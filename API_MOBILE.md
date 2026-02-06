# Mobile API Documentation

תיעוד מלא של API למובייל (React Native/Expo)

## תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Store Configuration](#store-configuration)
  - [Products](#products)
  - [Categories](#categories)
  - [Customer Orders](#customer-orders)
  - [Wishlist](#wishlist)
  - [Customer Profile](#customer-profile)
  - [Push Notifications](#push-notifications)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)

---

## סקירה כללית

ה-API מחולק ל-3 סוגים:

1. **Public API** (`/api/storefront/[storeSlug]/*`) - לא דורש authentication, למוצרים וקטגוריות
2. **Customer API** (`/api/customer/*`) - דורש customer authentication, להזמנות ופרופיל
3. **Mobile API** (`/api/mobile/*`) - דורש customer authentication, למכשירים והתראות

### Base URL

```
https://your-domain.com
```

### Response Format

כל ה-endpoints מחזירים response בפורמט JSON:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## Authentication

### Customer Authentication

הלקוח מתחבר דרך session cookie שנוצר בעת login/register.

#### Login
```typescript
POST /api/customer/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123",
  "storeId": "store-uuid"
}

// Response:
{
  "success": true,
  "customer": {
    "id": "uuid",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    // ... additional fields
  }
}
```

#### Register
```typescript
POST /api/customer/auth/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0501234567",
  "storeId": "store-uuid"
}
```

#### Get Current Customer
```typescript
GET /api/customer/auth/me

// Response:
{
  "success": true,
  "customer": {
    "id": "uuid",
    "email": "customer@example.com",
    // ... customer data
  }
}
```

#### Logout
```typescript
POST /api/customer/auth/logout
```

---

## API Endpoints

### Store Configuration

#### Get Store Config
מחזיר הגדרות חנות (לוגו, מטבע, צבעים, נושא).

```typescript
GET /api/storefront/[storeSlug]/config

// Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Store",
    "slug": "my-store",
    "logoUrl": "https://...",
    "currency": "ILS",
    "timezone": "Asia/Jerusalem",
    "isPublished": true,
    "settings": {
      "contactEmail": "info@store.com",
      "contactPhone": "03-1234567",
      "address": "Tel Aviv, Israel",
      "showDecimalPrices": true
    },
    "theme": {
      "primaryColor": "#000000",
      "secondaryColor": "#666666"
    },
    "localization": {
      "defaultLocale": "he",
      "supportedLocales": ["he", "en"]
    }
  }
}
```

---

### Products

#### List Products (Public)
רשימת מוצרים עם פילטרים ו-pagination.

```typescript
GET /api/storefront/[storeSlug]/products?page=1&limit=20&category=shoes&search=nike&sort=price&order=asc&minPrice=100&maxPrice=500&featured=true

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 50)
- category: string (category slug)
- search: string (search in name, description, sku)
- sort: 'price' | 'name' | 'created_at' (default: 'created_at')
- order: 'asc' | 'desc' (default: 'desc')
- minPrice: number
- maxPrice: number
- featured: boolean

// Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nike Air Max",
      "slug": "nike-air-max",
      "shortDescription": "...",
      "description": "...",
      "price": 450,
      "comparePrice": 600,
      "hasVariants": true,
      "inStock": true,
      "isFeatured": true,
      "image": "https://...",
      "imageAlt": "Nike Air Max",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Single Product (Public)
פרטי מוצר מלאים עם variants, options, ותמונות.

```typescript
GET /api/storefront/[storeSlug]/products/[slug]

// Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Nike Air Max",
    "slug": "nike-air-max",
    "sku": "NIKE-001",
    "shortDescription": "...",
    "description": "...",
    "price": 450,
    "comparePrice": 600,
    "weight": 0.5,
    "hasVariants": true,
    "trackInventory": true,
    "inventory": 10,
    "allowBackorder": false,
    "inStock": true,
    "isFeatured": true,
    "metadata": {},
    "seoTitle": "...",
    "seoDescription": "...",
    
    "images": [
      {
        "id": "uuid",
        "url": "https://...",
        "alt": "Nike Air Max",
        "sortOrder": 0,
        "isPrimary": true,
        "mediaType": "image",
        "thumbnailUrl": "https://..."
      }
    ],
    
    "primaryImage": "https://...",
    
    "options": [
      {
        "id": "uuid",
        "name": "Size",
        "displayType": "dropdown",
        "sortOrder": 0,
        "values": [
          {
            "id": "uuid",
            "value": "40",
            "metadata": {},
            "sortOrder": 0
          }
        ]
      }
    ],
    
    "variants": [
      {
        "id": "uuid",
        "title": "40 / Black",
        "sku": "NIKE-001-40-BLK",
        "barcode": "123456789",
        "price": 450,
        "comparePrice": 600,
        "weight": 0.5,
        "inventory": 5,
        "allowBackorder": false,
        "inStock": true,
        "option1": "40",
        "option2": "Black",
        "option3": null,
        "imageUrl": "https://...",
        "sortOrder": 0
      }
    ],
    
    "category": {
      "id": "uuid",
      "name": "Shoes",
      "slug": "shoes"
    },
    
    "categories": [
      {
        "id": "uuid",
        "name": "Shoes",
        "slug": "shoes"
      }
    ]
  }
}
```

---

### Categories

#### List Categories (Public)
רשימת קטגוריות עם ספירת מוצרים.

```typescript
GET /api/storefront/[storeSlug]/categories?parentId=null&includeSubcategories=true

Query Parameters:
- parentId: string | 'null' | 'root' (filter by parent, 'null'/'root' for top-level)
- includeSubcategories: boolean (default: true)

// Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "parentId": null,
      "name": "Clothing",
      "slug": "clothing",
      "description": "All clothing items",
      "imageUrl": "https://...",
      "sortOrder": 0,
      "productCount": 45,
      "hideOutOfStock": false,
      "moveOutOfStockToBottom": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "subcategories": [
        {
          "id": "uuid",
          "parentId": "parent-uuid",
          "name": "T-Shirts",
          "slug": "t-shirts",
          "productCount": 15
        }
      ]
    }
  ]
}
```

---

### Customer Orders

**Authentication Required**: כל ה-endpoints האלה דורשים customer login.

#### Get Order History
```typescript
GET /api/customer/orders?page=1&limit=20&status=delivered

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 50)
- status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

// Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-1001",
      "status": "delivered",
      "financialStatus": "paid",
      "fulfillmentStatus": "fulfilled",
      "subtotal": 400,
      "discountAmount": 50,
      "shippingAmount": 30,
      "taxAmount": 0,
      "creditUsed": 0,
      "total": 380,
      "currency": "ILS",
      "discountCode": "SUMMER10",
      "discountDetails": [
        {
          "type": "coupon",
          "code": "SUMMER10",
          "name": "Summer Sale",
          "amount": 50
        }
      ],
      "itemCount": 2,
      "totalQuantity": 3,
      "paidAt": "2024-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T15:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

#### Get Single Order
```typescript
GET /api/customer/orders/[orderNumber]

// Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-1001",
    "status": "delivered",
    "financialStatus": "paid",
    "fulfillmentStatus": "fulfilled",
    
    // Pricing
    "subtotal": 400,
    "discountCode": "SUMMER10",
    "discountAmount": 50,
    "discountDetails": [...],
    "creditUsed": 0,
    "shippingAmount": 30,
    "taxAmount": 0,
    "total": 380,
    "currency": "ILS",
    
    // Customer info
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "customerPhone": "0501234567",
    
    // Addresses
    "shippingAddress": {
      "address": "123 Main St",
      "city": "Tel Aviv",
      "zipCode": "12345",
      "country": "IL"
    },
    "billingAddress": { ... },
    
    // Shipping & Payment
    "shippingMethod": "Standard Shipping",
    "paymentMethod": "credit_card",
    "trackingNumber": "TRACK123",
    "trackingUrl": "https://...",
    
    // Note
    "note": "Please deliver between 10-12",
    
    // Timestamps
    "paidAt": "2024-01-01T12:00:00.000Z",
    "shippedAt": "2024-01-02T10:00:00.000Z",
    "deliveredAt": "2024-01-03T15:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-03T15:00:00.000Z",
    
    // Items
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "name": "Nike Air Max",
        "variantTitle": "40 / Black",
        "sku": "NIKE-001-40-BLK",
        "quantity": 2,
        "price": 450,
        "total": 900,
        "imageUrl": "https://...",
        "properties": {}
      }
    ]
  }
}
```

---

### Wishlist

**Authentication Required**: כל ה-endpoints האלה דורשים customer login.

#### Get Wishlist
```typescript
GET /api/customer/wishlist

// Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "variantId": "uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "product": {
          "id": "uuid",
          "name": "Nike Air Max",
          "slug": "nike-air-max",
          "price": 450,
          "comparePrice": 600,
          "hasVariants": true,
          "inStock": true,
          "image": "https://..."
        },
        "variant": {
          "id": "uuid",
          "title": "40 / Black",
          "price": 450,
          "inStock": true
        }
      }
    ],
    "count": 5
  }
}
```

#### Add to Wishlist
```typescript
POST /api/customer/wishlist
Content-Type: application/json

{
  "productId": "uuid",
  "variantId": "uuid" // optional
}

// Response:
{
  "success": true,
  "message": "המוצר נוסף לרשימת המשאלות"
}
```

#### Toggle Wishlist
```typescript
PUT /api/customer/wishlist
Content-Type: application/json

{
  "productId": "uuid",
  "variantId": "uuid" // optional
}

// Response:
{
  "success": true,
  "inWishlist": true,
  "message": "המוצר נוסף לרשימת המשאלות"
}
```

#### Remove from Wishlist
```typescript
DELETE /api/customer/wishlist/[productId]?variantId=uuid

// Response:
{
  "success": true,
  "message": "המוצר הוסר מרשימת המשאלות"
}
```

---

### Customer Profile

**Authentication Required**: כל ה-endpoints האלה דורשים customer login.

#### Update Profile
```typescript
PUT /api/customer/update
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0501234567",
  "acceptsMarketing": true,
  "defaultAddress": {
    "address": "123 Main St",
    "city": "Tel Aviv",
    "zipCode": "12345",
    "country": "IL",
    "state": null
  }
}

// Response:
{
  "success": true,
  "message": "הפרטים עודכנו בהצלחה"
}
```

#### Get Addresses
```typescript
GET /api/customer/addresses

// Response:
{
  "success": true,
  "data": [
    {
      "id": "default",
      "isDefault": true,
      "address": "123 Main St",
      "city": "Tel Aviv",
      "zipCode": "12345",
      "country": "IL",
      "state": null
    }
  ]
}
```

---

### Push Notifications

**Authentication Required**: כל ה-endpoints האלה דורשים customer login.

#### Register Device
```typescript
POST /api/mobile/device/register
Content-Type: application/json

{
  "deviceToken": "ExponentPushToken[...]",
  "platform": "ios", // or "android"
  "deviceId": "unique-device-id"
}

// Response:
{
  "success": true,
  "message": "המכשיר נרשם בהצלחה"
}
```

#### Unregister Device
```typescript
DELETE /api/mobile/device/register?deviceId=unique-device-id

// Response:
{
  "success": true,
  "message": "המכשיר הוסר בהצלחה"
}
```

#### Get Notification Preferences
```typescript
GET /api/mobile/notifications/preferences

// Response:
{
  "success": true,
  "data": {
    "orderUpdates": true,
    "promotions": true,
    "backInStock": true
  }
}
```

#### Update Notification Preferences
```typescript
PUT /api/mobile/notifications/preferences
Content-Type: application/json

{
  "orderUpdates": true,
  "promotions": false,
  "backInStock": true
}

// Response:
{
  "success": true,
  "message": "הגדרות ההתראות עודכנו בהצלחה",
  "data": {
    "orderUpdates": true,
    "promotions": false,
    "backInStock": true
  }
}
```

---

## Error Handling

### Error Response Format

```typescript
{
  "success": false,
  "error": "הודעת שגיאה בעברית"
}
```

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error, missing fields)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

### Common Errors

```typescript
// Authentication Required
{
  "success": false,
  "error": "נדרש אימות"
}

// Invalid Credentials
{
  "success": false,
  "error": "אימייל או סיסמה שגויים"
}

// Resource Not Found
{
  "success": false,
  "error": "המוצר לא נמצא"
}

// Validation Error
{
  "success": false,
  "error": "חסרים פרטים נדרשים"
}
```

---

## TypeScript Types

כל ה-types זמינים ב-`src/types/api.ts`:

```typescript
import type {
  APIResponse,
  StorefrontConfig,
  StorefrontProduct,
  ProductDetail,
  StorefrontCategory,
  CustomerOrder,
  OrderDetail,
  WishlistData,
  Customer,
  NotificationPreferences,
  // ... and more
} from '@/types/api';
```

### Usage Example (React Native/Expo)

```typescript
import type { StorefrontProduct, APIResponse } from '@/types/api';

async function getProducts(storeSlug: string): Promise<StorefrontProduct[]> {
  const response = await fetch(
    `https://api.example.com/api/storefront/${storeSlug}/products`
  );
  
  const data: APIResponse<StorefrontProduct[]> = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data.data || [];
}
```

---

## Additional Endpoints (Already Existing)

### Checkout & Payments
```typescript
POST /api/payments/initiate - יצירת תשלום והזמנה
GET /api/payments/status/[reference] - סטטוס תשלום
POST /api/payments/webhook/[provider] - webhook מספק תשלום
```

### Shipping
```typescript
POST /api/storefront/[storeSlug]/shipping - חישוב אפשרויות משלוח
```

### Coupons
```typescript
POST /api/coupon/validate - אימות קוד קופון
```

### Search
```typescript
GET /api/search?storeId=xxx&q=nike - חיפוש מוצרים
```

### Reviews
```typescript
GET /api/reviews?productId=xxx - ביקורות מוצר
POST /api/reviews - הוספת ביקורת
```

### Waitlist
```typescript
POST /api/storefront/[storeSlug]/waitlist - רישום לרשימת המתנה למוצר
```

### Exchange Products
```typescript
GET /api/storefront/[storeSlug]/exchange-products?search=xxx - מוצרים זמינים להחלפה
```

---

## Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Store Domain (for API calls)
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Payment Providers (optional)
PAYPLUS_API_KEY="..."
PELECARD_TERMINAL="..."

# Email (optional)
RESEND_API_KEY="..."
```

### Mobile App Configuration

```typescript
// config.ts in mobile app
export const API_CONFIG = {
  baseUrl: 'https://your-domain.com',
  storeSlug: 'my-store', // Get from .env
  timeout: 30000,
};
```

---

## Rate Limiting

כרגע אין rate limiting. במידת הצורך, ניתן להוסיף middleware עם `express-rate-limit` או דומה.

---

## Pagination Best Practices

```typescript
// Always use pagination for lists
const page = 1;
const limit = 20;

const response = await fetch(
  `${API_URL}/products?page=${page}&limit=${limit}`
);

const { data, pagination } = await response.json();

// Check if there are more pages
if (pagination.hasNext) {
  // Load more...
}
```

---

## Support

לשאלות ותמיכה, פנו למפתחי הפרויקט.
