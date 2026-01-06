# 🔌 QuickShop Public API v1

> API למפתחים חיצוניים לאינטגרציה עם חנויות QuickShop
> 
> **Base URL**: `https://my-quickshop.com/api/v1`

---

## 🔐 אימות (Authentication)

כל הקריאות דורשות API Key בכותרת:

```bash
curl -H "X-API-Key: qs_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
     https://my-quickshop.com/api/v1/orders
```

### יצירת API Key

1. היכנסו לאדמין של החנות
2. Settings → API Keys
3. לחצו "Create API Key"
4. בחרו את ה-Scopes הרלוונטיים
5. שמרו את המפתח - **הוא יוצג רק פעם אחת!**

### Scopes זמינים

| Scope | תיאור |
|-------|-------|
| `orders:read` | צפייה בהזמנות |
| `orders:write` | עדכון הזמנות |
| `products:read` | צפייה במוצרים |
| `products:write` | יצירה/עריכה/מחיקת מוצרים |
| `customers:read` | צפייה בלקוחות |
| `customers:write` | עדכון לקוחות |
| `inventory:read` | צפייה במלאי |
| `inventory:write` | עדכון מלאי |
| `discounts:read` | צפייה בהנחות |
| `discounts:write` | ניהול הנחות |
| `analytics:read` | צפייה באנליטיקס |
| `webhooks:read` | צפייה בוובהוקים |
| `webhooks:write` | ניהול וובהוקים |

---

## 📦 Orders API

### רשימת הזמנות

```http
GET /api/v1/orders
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | מספר עמוד (default: 1) |
| `limit` | number | מספר תוצאות (max: 100, default: 50) |
| `status` | string | `pending`, `processing`, `shipped`, `delivered`, `cancelled` |
| `fulfillment_status` | string | `unfulfilled`, `partial`, `fulfilled` |
| `financial_status` | string | `pending`, `paid`, `refunded`, `partially_refunded` |
| `created_at_min` | ISO date | הזמנות מתאריך |
| `created_at_max` | ISO date | הזמנות עד תאריך |
| `customer_id` | string | לפי לקוח |
| `sort_by` | string | `created_at`, `updated_at`, `total` |
| `sort_order` | string | `asc`, `desc` |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "order_number": "1001",
      "status": "processing",
      "financial_status": "paid",
      "fulfillment_status": "unfulfilled",
      "subtotal": 500.00,
      "discount_code": "SAVE10",
      "discount_amount": 50.00,
      "shipping_amount": 30.00,
      "tax_amount": 0,
      "total": 480.00,
      "currency": "ILS",
      "customer_id": "uuid",
      "customer_email": "customer@example.com",
      "customer_name": "ישראל ישראלי",
      "customer_phone": "050-1234567",
      "shipping_address": {
        "first_name": "ישראל",
        "last_name": "ישראלי",
        "address1": "הרצל 1",
        "city": "תל אביב",
        "country": "IL",
        "zip": "1234567"
      },
      "note": "הערת לקוח",
      "created_at": "2026-01-06T10:00:00Z",
      "updated_at": "2026-01-06T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### פרטי הזמנה

```http
GET /api/v1/orders/{id}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "order_number": "1001",
    "status": "processing",
    "financial_status": "paid",
    "fulfillment_status": "unfulfilled",
    "subtotal": 500.00,
    "discount_code": "SAVE10",
    "discount_amount": 50.00,
    "shipping_amount": 30.00,
    "tax_amount": 0,
    "credit_used": 0,
    "total": 480.00,
    "currency": "ILS",
    "customer_id": "uuid",
    "customer_email": "customer@example.com",
    "customer_name": "ישראל ישראלי",
    "customer_phone": "050-1234567",
    "shipping_address": { ... },
    "billing_address": { ... },
    "shipping_method": "standard",
    "payment_method": "credit_card",
    "note": "הערת לקוח",
    "internal_note": "הערה פנימית",
    "paid_at": "2026-01-06T10:05:00Z",
    "created_at": "2026-01-06T10:00:00Z",
    "updated_at": "2026-01-06T10:30:00Z",
    "line_items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "variant_id": "uuid",
        "name": "חולצה כחולה",
        "variant_title": "M / כחול",
        "sku": "SHIRT-BLUE-M",
        "quantity": 2,
        "price": 250.00,
        "total": 500.00,
        "image_url": "https://..."
      }
    ]
  }
}
```

### עדכון הזמנה

```http
PATCH /api/v1/orders/{id}
```

**Request Body:**

```json
{
  "status": "shipped",
  "fulfillment_status": "fulfilled",
  "internal_note": "נשלח עם חברת שליחויות X"
}
```

**Allowed Fields:**
- `status`
- `fulfillment_status`
- `note`
- `internal_note`

---

## 🛍️ Products API

### רשימת מוצרים

```http
GET /api/v1/products
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | מספר עמוד |
| `limit` | number | מספר תוצאות (max: 100) |
| `status` | string | `active`, `draft`, `all` |
| `category_id` | string | לפי קטגוריה |
| `query` | string | חיפוש בשם/SKU/ברקוד |
| `sort_by` | string | `created_at`, `updated_at`, `name`, `price`, `inventory` |
| `sort_order` | string | `asc`, `desc` |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "חולצה כחולה",
      "slug": "blue-shirt",
      "description": "חולצה איכותית...",
      "price": 250.00,
      "compare_price": 300.00,
      "sku": "SHIRT-001",
      "barcode": "7290000000001",
      "has_variants": true,
      "track_inventory": true,
      "inventory": null,
      "is_active": true,
      "is_featured": false,
      "category_id": "uuid",
      "images": [
        {
          "id": "uuid",
          "url": "https://...",
          "alt": "חולצה כחולה",
          "sort_order": 0,
          "is_primary": true
        }
      ],
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-05T12:00:00Z"
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

### פרטי מוצר

```http
GET /api/v1/products/{id}
```

**Response includes:**
- פרטי מוצר מלאים
- תמונות
- אופציות (צבע, מידה)
- וריאנטים

### עדכון מוצר

```http
PATCH /api/v1/products/{id}
```

**Request Body:**

```json
{
  "name": "שם חדש",
  "price": 199.99,
  "compare_price": 249.99,
  "inventory": 50,
  "is_active": true,
  "is_featured": true,
  "sku": "NEW-SKU",
  "seo_title": "כותרת SEO",
  "seo_description": "תיאור SEO"
}
```

---

## 📦 Inventory API

### צפייה במלאי

```http
GET /api/v1/inventory/{id}?type=product
GET /api/v1/inventory/{id}?type=variant
```

**Response (Product):**

```json
{
  "data": {
    "type": "product",
    "id": "uuid",
    "name": "חולצה",
    "sku": "SHIRT-001",
    "has_variants": true,
    "track_inventory": true,
    "inventory": null,
    "variants": [
      { "id": "uuid", "title": "S / כחול", "sku": "SHIRT-S-BLUE", "inventory": 10 },
      { "id": "uuid", "title": "M / כחול", "sku": "SHIRT-M-BLUE", "inventory": 15 }
    ]
  }
}
```

### עדכון מלאי

```http
PATCH /api/v1/inventory/{id}
```

**Request Body (Set absolute value):**

```json
{
  "type": "product",
  "inventory": 50
}
```

**Request Body (Adjustment):**

```json
{
  "type": "variant",
  "adjustment": -5
}
```

**Response:**

```json
{
  "data": {
    "type": "product",
    "id": "uuid",
    "previous_inventory": 55,
    "inventory": 50,
    "adjustment": -5
  }
}
```

---

## 👥 Customers API

### רשימת לקוחות

```http
GET /api/v1/customers
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | מספר עמוד |
| `limit` | number | מספר תוצאות |
| `query` | string | חיפוש באימייל/שם/טלפון |
| `has_orders` | boolean | רק לקוחות עם הזמנות |
| `created_at_min` | ISO date | לקוחות מתאריך |
| `sort_by` | string | `created_at`, `name`, `total_spent`, `total_orders` |
| `sort_order` | string | `asc`, `desc` |

---

## ⚠️ Error Handling

כל השגיאות מוחזרות בפורמט אחיד:

```json
{
  "error": {
    "code": "not_found",
    "message": "Order not found"
  }
}
```

**Error Codes:**

| Code | Status | Description |
|------|--------|-------------|
| `unauthorized` | 401 | API key לא תקין או חסר |
| `forbidden` | 403 | אין הרשאה (scope חסר) |
| `not_found` | 404 | משאב לא נמצא |
| `invalid_request` | 400 | בקשה לא תקינה |
| `rate_limited` | 429 | חריגה ממגבלת קריאות |
| `internal_error` | 500 | שגיאת שרת |

---

## 🚦 Rate Limiting

- **Default**: 100 requests/minute per API key
- Header `X-RateLimit-Remaining` מציין כמה קריאות נשארו
- Header `X-RateLimit-Reset` מציין מתי יתאפס המונה

---

## 📞 Webhooks (Coming Soon)

אירועים זמינים:
- `order.created`
- `order.updated`
- `order.fulfilled`
- `order.cancelled`
- `product.created`
- `product.updated`
- `product.deleted`
- `inventory.low`
- `customer.created`

---

## 💡 Code Examples

### Node.js

```javascript
const API_KEY = 'qs_live_xxxx';
const BASE_URL = 'https://my-quickshop.com/api/v1';

async function getOrders() {
  const response = await fetch(`${BASE_URL}/orders`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  
  const { data, meta } = await response.json();
  return data;
}

async function updateInventory(productId, adjustment) {
  const response = await fetch(`${BASE_URL}/inventory/${productId}`, {
    method: 'PATCH',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'product',
      adjustment,
    }),
  });
  
  return response.json();
}
```

### Python

```python
import requests

API_KEY = 'qs_live_xxxx'
BASE_URL = 'https://my-quickshop.com/api/v1'
HEADERS = {'X-API-Key': API_KEY}

def get_orders(page=1, limit=50):
    response = requests.get(
        f'{BASE_URL}/orders',
        headers=HEADERS,
        params={'page': page, 'limit': limit}
    )
    return response.json()['data']

def update_order_status(order_id, status):
    response = requests.patch(
        f'{BASE_URL}/orders/{order_id}',
        headers=HEADERS,
        json={'status': status}
    )
    return response.json()
```

### cURL

```bash
# Get orders
curl -X GET "https://my-quickshop.com/api/v1/orders?limit=10" \
  -H "X-API-Key: qs_live_xxxx"

# Update order status
curl -X PATCH "https://my-quickshop.com/api/v1/orders/order-uuid" \
  -H "X-API-Key: qs_live_xxxx" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'

# Update inventory
curl -X PATCH "https://my-quickshop.com/api/v1/inventory/product-uuid" \
  -H "X-API-Key: qs_live_xxxx" \
  -H "Content-Type: application/json" \
  -d '{"type": "product", "adjustment": -10}'
```

---

## 📧 תמיכה

- Email: developers@my-quickshop.com
- Discord: [QuickShop Developers](https://discord.gg/quickshop)
- GitHub: [quickshop-api-examples](https://github.com/quickshop/api-examples)

