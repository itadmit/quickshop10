# 📦 QuickShop Product Import API

> תיעוד API להזנת מוצרים לחנות QuickShop

---

## 🔐 אימות (Authentication)

כל הבקשות דורשות `X-API-Key` בכותרת:

```http
X-API-Key: sk_live_xxxxxxxxxxxx
```

ה-API Key צריך להכיל את ה-scope: `products:write`

---

## 📊 מבנה הסכמה

### טבלאות עיקריות

| טבלה | תיאור |
|------|-------|
| `products` | מוצרים ראשיים |
| `product_images` | תמונות/סרטונים למוצר |
| `product_categories` | קטגוריות (Many-to-Many) |
| `product_options` | אפשרויות (מידה, צבע) |
| `product_option_values` | ערכי אפשרויות (S, M, L) |
| `product_variants` | וריאנטים (שילובי אפשרויות) |

---

## 📝 יצירת מוצר

### Endpoint

```http
POST /api/v1/products
Content-Type: application/json
X-API-Key: sk_live_xxxxxxxxxxxx
```

### Request Body - מוצר פשוט (ללא וריאנטים)

```json
{
  "name": "חולצת כותנה",
  "slug": "cotton-shirt",
  "short_description": "חולצה נוחה ואיכותית",
  "description": "<p>חולצת כותנה 100%</p>",
  "price": "89.90",
  "compare_price": "129.90",
  "cost": "35.00",
  "sku": "SHIRT-001",
  "barcode": "7290001234567",
  "weight": "0.250",
  "track_inventory": true,
  "inventory": 100,
  "allow_backorder": false,
  "is_active": true,
  "is_featured": false,
  "has_variants": false,
  "category_ids": ["uuid-of-category"],
  "images": [
    {
      "url": "https://cdn.example.com/shirt-front.jpg",
      "alt": "חולצה - מבט קדמי",
      "is_primary": true,
      "media_type": "image"
    },
    {
      "url": "https://cdn.example.com/shirt-back.jpg",
      "alt": "חולצה - מבט אחורי",
      "is_primary": false,
      "media_type": "image"
    }
  ],
  "seo_title": "חולצת כותנה איכותית | QuickShop",
  "seo_description": "חולצת כותנה 100% נוחה ואיכותית",
  "metadata": {
    "custom_field": "value"
  }
}
```

### Request Body - מוצר עם וריאנטים

```json
{
  "name": "חולצה עם מידות וצבעים",
  "slug": "shirt-variants",
  "short_description": "חולצה במגוון מידות וצבעים",
  "description": "<p>תיאור מפורט</p>",
  "weight": "0.250",
  "has_variants": true,
  "track_inventory": true,
  "is_active": true,
  "category_ids": ["uuid-of-category"],
  
  "options": [
    {
      "name": "מידה",
      "display_type": "button",
      "values": [
        { "value": "S" },
        { "value": "M" },
        { "value": "L" },
        { "value": "XL" }
      ]
    },
    {
      "name": "צבע",
      "display_type": "color",
      "values": [
        { "value": "לבן", "metadata": { "color": "#FFFFFF" } },
        { "value": "שחור", "metadata": { "color": "#000000" } },
        { "value": "כחול", "metadata": { "color": "#0066CC" } }
      ]
    }
  ],
  
  "variants": [
    {
      "title": "S / לבן",
      "sku": "SHIRT-S-WHITE",
      "price": "89.90",
      "compare_price": "129.90",
      "inventory": 25,
      "option1": "S",
      "option2": "לבן"
    },
    {
      "title": "S / שחור",
      "sku": "SHIRT-S-BLACK",
      "price": "89.90",
      "inventory": 30,
      "option1": "S",
      "option2": "שחור"
    },
    {
      "title": "M / לבן",
      "sku": "SHIRT-M-WHITE",
      "price": "89.90",
      "inventory": 40,
      "option1": "M",
      "option2": "לבן"
    }
  ],
  
  "images": [
    {
      "url": "https://cdn.example.com/shirt-white.jpg",
      "alt": "חולצה לבנה",
      "is_primary": true,
      "media_type": "image"
    }
  ]
}
```

---

## 📋 שדות המוצר (products)

### שדות חובה

| שדה | סוג | תיאור |
|-----|-----|-------|
| `name` | `string(255)` | שם המוצר |
| `slug` | `string(100)` | Slug ייחודי (נוצר אוטומטית אם לא סופק) |

### שדות אופציונליים - מידע בסיסי

| שדה | סוג | ברירת מחדל | תיאור |
|-----|-----|------------|-------|
| `short_description` | `string(500)` | `null` | תיאור קצר |
| `description` | `text` | `null` | תיאור מלא (תומך HTML) |
| `category_ids` | `uuid[]` | `[]` | מערך IDs של קטגוריות |

### שדות תמחור (למוצר ללא וריאנטים)

| שדה | סוג | ברירת מחדל | תיאור |
|-----|-----|------------|-------|
| `price` | `decimal(10,2)` | `null` | מחיר מכירה |
| `compare_price` | `decimal(10,2)` | `null` | מחיר לפני הנחה |
| `cost` | `decimal(10,2)` | `null` | עלות המוצר |

### שדות מלאי (למוצר ללא וריאנטים)

| שדה | סוג | ברירת מחדל | תיאור |
|-----|-----|------------|-------|
| `sku` | `string(100)` | `null` | מק"ט |
| `barcode` | `string(100)` | `null` | ברקוד |
| `weight` | `decimal(10,3)` | `null` | משקל בק"ג |
| `track_inventory` | `boolean` | `true` | עקוב אחרי מלאי |
| `inventory` | `integer` | `0` | כמות במלאי |
| `allow_backorder` | `boolean` | `false` | אפשר הזמנה ללא מלאי |

### שדות סטטוס

| שדה | סוג | ברירת מחדל | תיאור |
|-----|-----|------------|-------|
| `is_active` | `boolean` | `true` | מוצר פעיל (מוצג בחנות) |
| `is_featured` | `boolean` | `false` | מוצר מודגש |
| `has_variants` | `boolean` | `false` | יש למוצר וריאנטים |

### שדות SEO

| שדה | סוג | ברירת מחדל | תיאור |
|-----|-----|------------|-------|
| `seo_title` | `string(255)` | `null` | כותרת SEO |
| `seo_description` | `text` | `null` | תיאור SEO |

### שדות מתקדמים

| שדה | סוג | ברירת מחדל | תיאור |
|-----|-----|------------|-------|
| `metadata` | `jsonb` | `{}` | מידע מותאם אישית |
| `upsell_product_ids` | `uuid[]` | `[]` | מוצרים משלימים |
| `is_bundle` | `boolean` | `false` | האם מוצר הוא חבילה |

---

## 🖼️ תמונות (product_images)

```json
{
  "images": [
    {
      "url": "https://cdn.example.com/image.jpg",
      "alt": "תיאור התמונה",
      "is_primary": true,
      "media_type": "image",
      "thumbnail_url": null,
      "display_as_card": false
    }
  ]
}
```

| שדה | סוג | חובה | תיאור |
|-----|-----|------|-------|
| `url` | `string(500)` | ✅ | URL של התמונה/סרטון |
| `alt` | `string(255)` | ❌ | טקסט חלופי |
| `is_primary` | `boolean` | ❌ | תמונה ראשית (ברירת מחדל: הראשונה) |
| `media_type` | `'image' \| 'video'` | ❌ | סוג המדיה (ברירת מחדל: `image`) |
| `thumbnail_url` | `string(500)` | ❌ | תמונה ממוזערת (לסרטונים) |
| `display_as_card` | `boolean` | ❌ | הצג כתמונת קטגוריה |

---

## ⚙️ אפשרויות (product_options)

```json
{
  "options": [
    {
      "name": "מידה",
      "display_type": "button",
      "values": [
        { "value": "S" },
        { "value": "M" },
        { "value": "L" }
      ]
    },
    {
      "name": "צבע",
      "display_type": "color",
      "values": [
        { "value": "אדום", "metadata": { "color": "#FF0000" } },
        { "value": "כחול", "metadata": { "color": "#0000FF" } }
      ]
    }
  ]
}
```

### סוגי תצוגה (display_type)

| ערך | תיאור | metadata נדרש |
|-----|-------|---------------|
| `button` | כפתור טקסט רגיל | - |
| `color` | עיגול צבעוני | `{ "color": "#HEX" }` |
| `pattern` | דוגמה/פטרן | `{ "pattern": "dots", "color": "#HEX" }` |
| `image` | תמונה | `{ "imageUrl": "https://..." }` |

---

## 📦 וריאנטים (product_variants)

```json
{
  "variants": [
    {
      "title": "S / אדום",
      "sku": "PROD-S-RED",
      "barcode": "7290001234567",
      "price": "99.90",
      "compare_price": "149.90",
      "cost": "40.00",
      "weight": "0.300",
      "inventory": 50,
      "allow_backorder": false,
      "option1": "S",
      "option2": "אדום",
      "option3": null,
      "image_url": "https://cdn.example.com/variant-red.jpg"
    }
  ]
}
```

| שדה | סוג | חובה | תיאור |
|-----|-----|------|-------|
| `title` | `string(255)` | ✅ | כותרת הווריאנט |
| `price` | `decimal(10,2)` | ✅ | מחיר |
| `sku` | `string(100)` | ❌ | מק"ט |
| `barcode` | `string(100)` | ❌ | ברקוד |
| `compare_price` | `decimal(10,2)` | ❌ | מחיר לפני הנחה |
| `cost` | `decimal(10,2)` | ❌ | עלות |
| `weight` | `decimal(10,3)` | ❌ | משקל |
| `inventory` | `integer` | ❌ | מלאי (ברירת מחדל: 0) |
| `allow_backorder` | `boolean` | ❌ | אפשר הזמנה ללא מלאי |
| `option1` | `string(100)` | ❌ | ערך אפשרות 1 |
| `option2` | `string(100)` | ❌ | ערך אפשרות 2 |
| `option3` | `string(100)` | ❌ | ערך אפשרות 3 |
| `image_url` | `string(500)` | ❌ | תמונת וריאנט |

---

## 🗂️ קטגוריות (categories)

### קבלת רשימת קטגוריות

```http
GET /api/v1/categories
X-API-Key: sk_live_xxxxxxxxxxxx
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "חולצות",
      "slug": "shirts",
      "parent_id": null
    },
    {
      "id": "uuid-2",
      "name": "חולצות טי",
      "slug": "t-shirts",
      "parent_id": "uuid-1"
    }
  ]
}
```

---

## ✅ Response - הצלחה

```json
{
  "success": true,
  "data": {
    "id": "product-uuid",
    "name": "חולצת כותנה",
    "slug": "cotton-shirt",
    "created_at": "2026-01-29T12:00:00.000Z"
  }
}
```

## ❌ Response - שגיאה

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "שם המוצר חסר",
    "field": "name"
  }
}
```

### קודי שגיאה נפוצים

| קוד | HTTP Status | תיאור |
|-----|-------------|-------|
| `validation_error` | 400 | שדה חסר או לא תקין |
| `unauthorized` | 401 | API Key חסר או לא תקין |
| `forbidden` | 403 | אין הרשאה ל-scope הנדרש |
| `duplicate_slug` | 409 | Slug כבר קיים |
| `internal_error` | 500 | שגיאת שרת |

---

## 🔄 עדכון מוצר

```http
PATCH /api/v1/products/{product_id}
Content-Type: application/json
X-API-Key: sk_live_xxxxxxxxxxxx
```

ניתן לשלוח רק את השדות לעדכון:

```json
{
  "price": "99.90",
  "inventory": 150,
  "is_active": true
}
```

---

## 🗑️ מחיקת מוצר

```http
DELETE /api/v1/products/{product_id}
X-API-Key: sk_live_xxxxxxxxxxxx
```

---

## 📥 Bulk Import (יבוא מרובה)

```http
POST /api/v1/products/bulk
Content-Type: application/json
X-API-Key: sk_live_xxxxxxxxxxxx
```

```json
{
  "products": [
    { "name": "מוצר 1", "price": "50.00", ... },
    { "name": "מוצר 2", "price": "75.00", ... }
  ],
  "options": {
    "skip_duplicates": true,
    "update_existing": false,
    "match_by": "sku"
  }
}
```

| אפשרות | תיאור |
|--------|-------|
| `skip_duplicates` | דלג על מוצרים קיימים |
| `update_existing` | עדכן מוצרים קיימים |
| `match_by` | שדה לזיהוי כפילויות: `sku`, `barcode`, `name` |

---

## 💡 דוגמאות קוד

### JavaScript/TypeScript

```typescript
const createProduct = async (product: ProductData) => {
  const response = await fetch('https://your-store.quickshop.co.il/api/v1/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'sk_live_xxxxxxxxxxxx'
    },
    body: JSON.stringify(product)
  });
  
  return response.json();
};

// דוגמה לשימוש
const product = {
  name: 'חולצה חדשה',
  slug: 'new-shirt',
  price: '89.90',
  inventory: 100,
  is_active: true,
  images: [
    { url: 'https://...', is_primary: true }
  ]
};

const result = await createProduct(product);
console.log(result);
```

### Python

```python
import requests

API_KEY = "sk_live_xxxxxxxxxxxx"
BASE_URL = "https://your-store.quickshop.co.il/api/v1"

def create_product(product):
    response = requests.post(
        f"{BASE_URL}/products",
        json=product,
        headers={"X-API-Key": API_KEY}
    )
    return response.json()

# דוגמה לשימוש
product = {
    "name": "חולצה חדשה",
    "slug": "new-shirt",
    "price": "89.90",
    "inventory": 100,
    "is_active": True,
    "images": [
        {"url": "https://...", "is_primary": True}
    ]
}

result = create_product(product)
print(result)
```

### cURL

```bash
curl -X POST "https://your-store.quickshop.co.il/api/v1/products" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_xxxxxxxxxxxx" \
  -d '{
    "name": "חולצה חדשה",
    "slug": "new-shirt",
    "price": "89.90",
    "inventory": 100,
    "is_active": true
  }'
```

---

## ⚠️ מגבלות

| מגבלה | ערך |
|-------|-----|
| Rate limit | 100 requests/minute |
| גודל בקשה מקסימלי | 10MB |
| תמונות למוצר | עד 20 |
| וריאנטים למוצר | עד 100 |
| אפשרויות למוצר | עד 3 |

---

## 📞 תמיכה

לשאלות נוספות: support@quickshop.co.il



