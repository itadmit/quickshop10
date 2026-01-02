# 🗄️ Database Schema - QuickShop

## 📊 השוואה מלאה לשופיפיי

| פיצ'ר | Shopify | QuickShop | שלב |
|-------|---------|-----------|-----|
| **Core** |
| Users (Merchants) | ✅ | ✅ | MVP |
| Stores/Shops | ✅ | ✅ | MVP |
| Products | ✅ | ✅ | MVP |
| Categories | ✅ collections | ✅ | MVP |
| Customers | ✅ | ✅ | MVP |
| Orders | ✅ | ✅ | MVP |
| Order Items | ✅ line_items | ✅ | MVP |
| **מוצרים מתקדם** |
| Product Variants | ✅ | ✅ | Phase 2 |
| Product Options | ✅ | ✅ | Phase 2 |
| Product Images | ✅ | ✅ | MVP |
| Product Tags | ✅ | ✅ | Phase 2 |
| Inventory Management | ✅ | ✅ | Phase 2 |
| **שיווק** |
| Discounts/Coupons | ✅ | ✅ | Phase 2 |
| Gift Cards | ✅ | ❌ | Phase 4 |
| Abandoned Carts | ✅ | ✅ | Phase 3 |
| Influencers/Affiliates | ✅ (Collabs) | ✅ | Phase 2 |
| **תשלום ומשלוח** |
| Payments/Transactions | ✅ | ✅ | Phase 3 |
| Shipping Zones | ✅ | ✅ | Phase 3 |
| Tax Settings | ✅ | ✅ | Phase 3 |
| **תוכן** |
| Pages (CMS) | ✅ | ✅ | Phase 2 |
| Blog | ✅ | ❌ | Phase 4 |
| Navigation/Menus | ✅ | ✅ | Phase 2 |
| **מתקדם** |
| Metafields | ✅ | JSONB | ✅ |
| Webhooks | ✅ | ✅ | Phase 4 |
| API Access | ✅ | ✅ | Phase 4 |
| Reviews | ✅ (app) | ✅ | Phase 3 |

---

## 📐 ERD - Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              PLATFORM LEVEL                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐        │
│  │    users    │────────►│   stores    │────────►│  templates  │        │
│  │  (merchants)│         │             │         │             │        │
│  └─────────────┘         └──────┬──────┘         └─────────────┘        │
│                                 │                                        │
│                                 │ 1:N                                    │
│                                 ▼                                        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              STORE LEVEL                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐        │
│  │ categories  │◄────────│  products   │────────►│product_images│       │
│  └─────────────┘         └──────┬──────┘         └─────────────┘        │
│                                 │                                        │
│                    ┌────────────┼────────────┐                          │
│                    │            │            │                          │
│                    ▼            ▼            ▼                          │
│           ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│           │product_opts │ │product_vars │ │product_tags │               │
│           └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                          │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐        │
│  │  discounts  │         │   pages     │         │   menus     │        │
│  └─────────────┘         └─────────────┘         └──────┬──────┘        │
│                                                         │               │
│                                                         ▼               │
│                                                  ┌─────────────┐        │
│                                                  │ menu_items  │        │
│                                                  └─────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              ORDER LEVEL                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐        │
│  │  customers  │────────►│   orders    │────────►│ order_items │        │
│  └─────────────┘         └──────┬──────┘         └─────────────┘        │
│                                 │                                        │
│                    ┌────────────┼────────────┐                          │
│                    │            │            │                          │
│                    ▼            ▼            ▼                          │
│           ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│           │transactions │ │  shipping   │ │   reviews   │               │
│           └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                          │
│  ┌─────────────┐         ┌─────────────┐                                │
│  │    carts    │────────►│ cart_items  │                                │
│  │ (abandoned) │         └─────────────┘                                │
│  └─────────────┘                                                        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              SETTINGS                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐        │
│  │shipping_zone│────────►│shipping_rate│         │ tax_settings│        │
│  └─────────────┘         └─────────────┘         └─────────────┘        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 טבלאות מפורטות

### 🔐 Authentication & Users

#### 1. users (משתמשי פלטפורמה - בעלי חנויות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי |
| `email` | VARCHAR(255) | אימייל (unique) |
| `password_hash` | VARCHAR(255) | סיסמה מוצפנת |
| `name` | VARCHAR(255) | שם מלא |
| `phone` | VARCHAR(50) | טלפון |
| `avatar_url` | VARCHAR(500) | תמונת פרופיל |
| `role` | ENUM | 'admin' / 'merchant' |
| `email_verified_at` | TIMESTAMP | תאריך אימות |
| `last_login_at` | TIMESTAMP | התחברות אחרונה |
| `created_at` | TIMESTAMP | תאריך יצירה |
| `updated_at` | TIMESTAMP | תאריך עדכון |

#### 2. sessions (NextAuth)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `user_id` | UUID (FK) | המשתמש |
| `session_token` | VARCHAR(255) | טוקן (unique) |
| `expires` | TIMESTAMP | תפוגה |

#### 3. accounts (OAuth providers)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `user_id` | UUID (FK) | המשתמש |
| `type` | VARCHAR(50) | סוג |
| `provider` | VARCHAR(50) | ספק (google, etc) |
| `provider_account_id` | VARCHAR(255) | מזהה בספק |
| `access_token` | TEXT | - |
| `refresh_token` | TEXT | - |
| `expires_at` | INT | - |

---

### 🏪 Stores

#### 4. stores (חנויות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי |
| `owner_id` | UUID (FK) | בעל החנות |
| `name` | VARCHAR(255) | שם החנות |
| `slug` | VARCHAR(100) | subdomain (unique) |
| `custom_domain` | VARCHAR(255) | דומיין מותאם |
| `template_id` | UUID (FK) | תבנית |
| `logo_url` | VARCHAR(500) | לוגו |
| `favicon_url` | VARCHAR(500) | favicon |
| `currency` | VARCHAR(3) | מטבע (ILS) |
| `timezone` | VARCHAR(50) | אזור זמן |
| `settings` | JSONB | הגדרות כלליות |
| `theme_settings` | JSONB | הגדרות עיצוב |
| `seo_settings` | JSONB | הגדרות SEO |
| `plan` | ENUM | free/basic/pro/enterprise |
| `plan_expires_at` | TIMESTAMP | תוקף מנוי |
| `is_active` | BOOLEAN | פעילה |
| `created_at` | TIMESTAMP | תאריך יצירה |
| `updated_at` | TIMESTAMP | תאריך עדכון |

**settings JSONB:**
```json
{
  "contact_email": "store@example.com",
  "contact_phone": "050-1234567",
  "address": "תל אביב, ישראל",
  "social": {
    "facebook": "https://...",
    "instagram": "https://...",
    "whatsapp": "972501234567"
  },
  "checkout": {
    "require_phone": true,
    "require_address": true,
    "guest_checkout": true
  }
}
```

**theme_settings JSONB:**
```json
{
  "primary_color": "#3b82f6",
  "secondary_color": "#1e40af",
  "accent_color": "#f59e0b",
  "font_heading": "Heebo",
  "font_body": "Heebo",
  "border_radius": "md"
}
```

**seo_settings JSONB:**
```json
{
  "meta_title": "החנות שלי",
  "meta_description": "תיאור החנות",
  "og_image": "https://..."
}
```

#### 5. templates (תבניות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `name` | VARCHAR(100) | שם התבנית |
| `slug` | VARCHAR(50) | slug (unique) |
| `description` | TEXT | תיאור |
| `thumbnail_url` | VARCHAR(500) | תמונה לתצוגה |
| `preview_url` | VARCHAR(500) | לינק לדמו |
| `default_settings` | JSONB | הגדרות ברירת מחדל |
| `is_active` | BOOLEAN | זמינה לבחירה |
| `is_premium` | BOOLEAN | בתשלום |
| `created_at` | TIMESTAMP | תאריך יצירה |

---

### 📦 Products

#### 6. categories (קטגוריות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי |
| `store_id` | UUID (FK) | החנות |
| `parent_id` | UUID (FK) | קטגוריית אב (nullable) |
| `name` | VARCHAR(255) | שם |
| `slug` | VARCHAR(100) | slug |
| `description` | TEXT | תיאור |
| `image_url` | VARCHAR(500) | תמונה |
| `sort_order` | INT | סדר |
| `is_active` | BOOLEAN | פעילה |
| `created_at` | TIMESTAMP | תאריך יצירה |

#### 7. products (מוצרים)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי |
| `store_id` | UUID (FK) | החנות |
| `category_id` | UUID (FK) | קטגוריה ראשית |
| `name` | VARCHAR(255) | שם |
| `slug` | VARCHAR(100) | slug |
| `description` | TEXT | תיאור מלא (HTML) |
| `short_description` | VARCHAR(500) | תיאור קצר |
| `price` | DECIMAL(10,2) | מחיר (אם אין וריאנטים) |
| `compare_price` | DECIMAL(10,2) | מחיר לפני הנחה |
| `cost` | DECIMAL(10,2) | עלות |
| `sku` | VARCHAR(100) | מק"ט |
| `barcode` | VARCHAR(100) | ברקוד |
| `weight` | DECIMAL(10,3) | משקל (ק"ג) |
| `has_variants` | BOOLEAN | יש וריאנטים |
| `track_inventory` | BOOLEAN | עקוב אחרי מלאי |
| `inventory` | INT | מלאי (אם אין וריאנטים) |
| `allow_backorder` | BOOLEAN | אפשר הזמנה ללא מלאי |
| `is_active` | BOOLEAN | פעיל |
| `is_featured` | BOOLEAN | מודגש |
| `seo_title` | VARCHAR(255) | כותרת SEO |
| `seo_description` | TEXT | תיאור SEO |
| `metadata` | JSONB | מידע נוסף |
| `created_at` | TIMESTAMP | תאריך יצירה |
| `updated_at` | TIMESTAMP | תאריך עדכון |

#### 8. product_images (תמונות מוצר)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `product_id` | UUID (FK) | המוצר |
| `url` | VARCHAR(500) | URL התמונה |
| `alt` | VARCHAR(255) | טקסט חלופי |
| `sort_order` | INT | סדר |
| `is_primary` | BOOLEAN | תמונה ראשית |
| `created_at` | TIMESTAMP | תאריך יצירה |

#### 9. product_options (אפשרויות - צבע, מידה)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `product_id` | UUID (FK) | המוצר |
| `name` | VARCHAR(100) | שם (צבע, מידה) |
| `position` | INT | סדר |
| `values` | JSONB | ערכים ["S", "M", "L"] |

#### 10. product_variants (וריאנטים)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `product_id` | UUID (FK) | המוצר |
| `sku` | VARCHAR(100) | מק"ט ייחודי |
| `barcode` | VARCHAR(100) | ברקוד |
| `price` | DECIMAL(10,2) | מחיר |
| `compare_price` | DECIMAL(10,2) | מחיר השוואה |
| `cost` | DECIMAL(10,2) | עלות |
| `inventory` | INT | מלאי |
| `weight` | DECIMAL(10,3) | משקל |
| `option_values` | JSONB | {"צבע": "אדום", "מידה": "L"} |
| `image_url` | VARCHAR(500) | תמונה ייעודית |
| `is_active` | BOOLEAN | פעיל |
| `created_at` | TIMESTAMP | תאריך יצירה |

#### 11. product_tags (תגיות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `name` | VARCHAR(100) | שם התגית |
| `slug` | VARCHAR(100) | slug |

#### 12. product_to_tags (Many-to-Many)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `product_id` | UUID (FK) | המוצר |
| `tag_id` | UUID (FK) | התגית |

---

### 🛒 Orders & Customers

#### 13. customers (לקוחות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `email` | VARCHAR(255) | אימייל |
| `password_hash` | VARCHAR(255) | סיסמה (אופציונלי) |
| `first_name` | VARCHAR(100) | שם פרטי |
| `last_name` | VARCHAR(100) | שם משפחה |
| `phone` | VARCHAR(50) | טלפון |
| `default_address` | JSONB | כתובת ברירת מחדל |
| `tags` | TEXT[] | תגיות |
| `notes` | TEXT | הערות |
| `total_orders` | INT | סה"כ הזמנות |
| `total_spent` | DECIMAL(10,2) | סה"כ קניות |
| `accepts_marketing` | BOOLEAN | מסכים לשיווק |
| `created_at` | TIMESTAMP | תאריך יצירה |
| `updated_at` | TIMESTAMP | עדכון |

#### 14. customer_addresses (כתובות לקוח)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `customer_id` | UUID (FK) | הלקוח |
| `first_name` | VARCHAR(100) | שם פרטי |
| `last_name` | VARCHAR(100) | שם משפחה |
| `company` | VARCHAR(255) | חברה |
| `address1` | VARCHAR(255) | כתובת שורה 1 |
| `address2` | VARCHAR(255) | כתובת שורה 2 |
| `city` | VARCHAR(100) | עיר |
| `province` | VARCHAR(100) | מחוז/אזור |
| `postal_code` | VARCHAR(20) | מיקוד |
| `country` | VARCHAR(2) | ארץ (IL) |
| `phone` | VARCHAR(50) | טלפון |
| `is_default` | BOOLEAN | ברירת מחדל |

#### 15. orders (הזמנות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `customer_id` | UUID (FK) | הלקוח |
| `discount_id` | UUID (FK) | קופון |
| `order_number` | VARCHAR(50) | מספר הזמנה (#1001) |
| `status` | ENUM | סטטוס |
| `financial_status` | ENUM | סטטוס כספי |
| `fulfillment_status` | ENUM | סטטוס מימוש |
| `subtotal` | DECIMAL(10,2) | סכום ביניים |
| `discount_amount` | DECIMAL(10,2) | הנחה |
| `shipping_amount` | DECIMAL(10,2) | משלוח |
| `tax_amount` | DECIMAL(10,2) | מע"מ |
| `total` | DECIMAL(10,2) | סה"כ |
| `currency` | VARCHAR(3) | מטבע |
| `shipping_address` | JSONB | כתובת משלוח |
| `billing_address` | JSONB | כתובת חיוב |
| `shipping_method` | VARCHAR(100) | שיטת משלוח |
| `note` | TEXT | הערות לקוח |
| `internal_note` | TEXT | הערות פנימיות |
| `ip_address` | VARCHAR(45) | IP |
| `user_agent` | TEXT | דפדפן |
| `checkout_token` | VARCHAR(100) | טוקן צ'קאאוט |
| `created_at` | TIMESTAMP | תאריך |
| `updated_at` | TIMESTAMP | עדכון |

**Order Status:** pending, confirmed, processing, shipped, delivered, cancelled, refunded

**Financial Status:** pending, paid, partially_paid, refunded, partially_refunded

**Fulfillment Status:** unfulfilled (לא נשלח), partial (נשלח חלקית), fulfilled (נשלח)

#### 16. order_items (פריטי הזמנה)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `order_id` | UUID (FK) | ההזמנה |
| `product_id` | UUID (FK) | המוצר |
| `variant_id` | UUID (FK) | הוריאנט |
| `name` | VARCHAR(255) | שם (snapshot) |
| `variant_title` | VARCHAR(255) | שם וריאנט |
| `sku` | VARCHAR(100) | מק"ט |
| `quantity` | INT | כמות |
| `price` | DECIMAL(10,2) | מחיר ליחידה |
| `total` | DECIMAL(10,2) | סה"כ |
| `image_url` | VARCHAR(500) | תמונה (snapshot) |
| `properties` | JSONB | מאפיינים נוספים |

#### 17. transactions (עסקאות תשלום)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `order_id` | UUID (FK) | ההזמנה |
| `type` | ENUM | charge/refund/void |
| `status` | ENUM | pending/success/failed |
| `amount` | DECIMAL(10,2) | סכום |
| `currency` | VARCHAR(3) | מטבע |
| `gateway` | VARCHAR(50) | ספק תשלום |
| `gateway_transaction_id` | VARCHAR(255) | מזהה חיצוני |
| `error_message` | TEXT | הודעת שגיאה |
| `metadata` | JSONB | מידע נוסף |
| `created_at` | TIMESTAMP | תאריך |

---

### 🏷️ Marketing

#### 18. discounts (קופונים והנחות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `code` | VARCHAR(50) | קוד (SUMMER20) |
| `title` | VARCHAR(255) | שם פנימי |
| `type` | ENUM | percentage/fixed_amount/free_shipping |
| `value` | DECIMAL(10,2) | ערך |
| `minimum_amount` | DECIMAL(10,2) | מינימום הזמנה |
| `minimum_quantity` | INT | מינימום פריטים |
| `usage_limit` | INT | מקסימום שימושים |
| `usage_count` | INT | כמה נוצל |
| `usage_limit_per_customer` | INT | מקסימום ללקוח |
| `applies_to` | ENUM | all/products/categories |
| `applies_to_ids` | UUID[] | מזהי מוצרים/קטגוריות |
| `starts_at` | TIMESTAMP | תחילת תוקף |
| `ends_at` | TIMESTAMP | סוף תוקף |
| `is_active` | BOOLEAN | פעיל |
| `created_at` | TIMESTAMP | תאריך יצירה |

#### 19. carts (עגלות - לעגלות נטושות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `customer_id` | UUID (FK) | לקוח (nullable) |
| `email` | VARCHAR(255) | אימייל |
| `token` | VARCHAR(100) | טוקן ייחודי |
| `subtotal` | DECIMAL(10,2) | סכום |
| `recovery_email_sent_at` | TIMESTAMP | נשלח אימייל |
| `completed_at` | TIMESTAMP | הושלם |
| `created_at` | TIMESTAMP | תאריך יצירה |
| `updated_at` | TIMESTAMP | עדכון |

#### 20. cart_items (פריטי עגלה)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `cart_id` | UUID (FK) | העגלה |
| `product_id` | UUID (FK) | מוצר |
| `variant_id` | UUID (FK) | וריאנט |
| `quantity` | INT | כמות |
| `price` | DECIMAL(10,2) | מחיר |

---

### 📄 Content

#### 21. pages (דפי תוכן)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `title` | VARCHAR(255) | כותרת |
| `slug` | VARCHAR(100) | slug |
| `content` | TEXT | תוכן (HTML) |
| `seo_title` | VARCHAR(255) | כותרת SEO |
| `seo_description` | TEXT | תיאור SEO |
| `is_active` | BOOLEAN | פעיל |
| `created_at` | TIMESTAMP | תאריך יצירה |
| `updated_at` | TIMESTAMP | עדכון |

#### 22. menus (תפריטים)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `title` | VARCHAR(100) | שם (header, footer) |
| `handle` | VARCHAR(50) | מזהה פנימי |
| `created_at` | TIMESTAMP | תאריך |

#### 23. menu_items (פריטי תפריט)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `menu_id` | UUID (FK) | התפריט |
| `parent_id` | UUID (FK) | פריט אב |
| `title` | VARCHAR(100) | טקסט |
| `url` | VARCHAR(500) | קישור |
| `resource_type` | VARCHAR(50) | סוג (page/category/product) |
| `resource_id` | UUID | מזהה המשאב |
| `sort_order` | INT | סדר |

---

### 🚚 Shipping & Tax

#### 24. shipping_zones (אזורי משלוח)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `name` | VARCHAR(100) | שם (מרכז, צפון) |
| `countries` | TEXT[] | ארצות ["IL"] |
| `provinces` | TEXT[] | אזורים |
| `created_at` | TIMESTAMP | תאריך |

#### 25. shipping_rates (תעריפי משלוח)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `zone_id` | UUID (FK) | האזור |
| `name` | VARCHAR(100) | שם (משלוח רגיל) |
| `price` | DECIMAL(10,2) | מחיר |
| `min_order_amount` | DECIMAL(10,2) | מינימום הזמנה |
| `max_order_amount` | DECIMAL(10,2) | מקסימום הזמנה |
| `is_active` | BOOLEAN | פעיל |

#### 26. tax_settings (הגדרות מע"מ)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `country` | VARCHAR(2) | ארץ |
| `province` | VARCHAR(100) | אזור |
| `rate` | DECIMAL(5,2) | אחוז (17) |
| `name` | VARCHAR(50) | שם (מע"מ) |
| `is_active` | BOOLEAN | פעיל |

---

### ⭐ Reviews

#### 27. reviews (ביקורות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `store_id` | UUID (FK) | החנות |
| `product_id` | UUID (FK) | המוצר |
| `customer_id` | UUID (FK) | הלקוח |
| `order_id` | UUID (FK) | ההזמנה |
| `rating` | INT | דירוג (1-5) |
| `title` | VARCHAR(255) | כותרת |
| `content` | TEXT | תוכן |
| `is_verified` | BOOLEAN | רכישה מאומתת |
| `is_approved` | BOOLEAN | אושר |
| `created_at` | TIMESTAMP | תאריך |

---

### 👑 Influencers (משפיענים)

#### 28. influencers (משפיענים)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי |
| `store_id` | UUID (FK) | החנות |
| `user_id` | UUID (FK) | חשבון משתמש (להתחברות) |
| `name` | VARCHAR(255) | שם מלא |
| `email` | VARCHAR(255) | אימייל |
| `phone` | VARCHAR(50) | טלפון |
| `instagram_handle` | VARCHAR(100) | @username |
| `instagram_followers` | INT | מספר עוקבים |
| `tiktok_handle` | VARCHAR(100) | @username |
| `tiktok_followers` | INT | מספר עוקבים |
| `youtube_channel` | VARCHAR(100) | ערוץ YouTube |
| `youtube_subscribers` | INT | מנויים |
| `commission_type` | ENUM | percentage/fixed_amount |
| `commission_value` | DECIMAL(10,2) | ערך העמלה |
| `coupon_code` | VARCHAR(50) | קוד קופון ייחודי |
| `discount_id` | UUID (FK) | קופון מקושר |
| `automatic_discount_id` | UUID (FK) | הנחה אוטומטית מקושרת |
| `total_sales` | DECIMAL(10,2) | סה"כ מכירות |
| `total_commission` | DECIMAL(10,2) | סה"כ עמלות |
| `total_orders` | INT | סה"כ הזמנות |
| `is_active` | BOOLEAN | פעיל |
| `notes` | TEXT | הערות פנימיות |
| `created_at` | TIMESTAMP | תאריך יצירה |
| `updated_at` | TIMESTAMP | תאריך עדכון |

#### 29. influencer_sales (מכירות משפיענים)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `influencer_id` | UUID (FK) | המשפיען |
| `order_id` | UUID (FK) | ההזמנה |
| `order_total` | DECIMAL(10,2) | סכום ההזמנה |
| `commission_amount` | DECIMAL(10,2) | העמלה שהורווחה |
| `commission_paid_at` | TIMESTAMP | תאריך תשלום העמלה |
| `created_at` | TIMESTAMP | תאריך |

#### 30. influencer_commissions (עמלות משפיענים)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה |
| `influencer_id` | UUID (FK) | המשפיען |
| `period_start` | DATE | תחילת תקופה |
| `period_end` | DATE | סוף תקופה |
| `total_sales` | DECIMAL(10,2) | סה"כ מכירות בתקופה |
| `total_orders` | INT | מספר הזמנות |
| `total_refunds` | DECIMAL(10,2) | החזרים בתקופה |
| `gross_commission` | DECIMAL(10,2) | עמלה ברוטו |
| `net_commission` | DECIMAL(10,2) | עמלה נטו (אחרי החזרים) |
| `status` | ENUM | pending/paid/cancelled |
| `paid_at` | TIMESTAMP | תאריך תשלום |
| `payment_method` | VARCHAR(50) | אמצעי תשלום |
| `payment_reference` | VARCHAR(255) | אסמכתא |
| `notes` | TEXT | הערות |
| `created_at` | TIMESTAMP | תאריך יצירה |

---

## 🔗 אינדקסים

```sql
-- Stores
CREATE UNIQUE INDEX idx_stores_slug ON stores(slug);
CREATE UNIQUE INDEX idx_stores_custom_domain ON stores(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_stores_owner ON stores(owner_id);

-- Products
CREATE INDEX idx_products_store ON products(store_id);
CREATE UNIQUE INDEX idx_products_store_slug ON products(store_id, slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(store_id, is_active) WHERE is_active = true;
CREATE INDEX idx_products_featured ON products(store_id, is_featured) WHERE is_featured = true;

-- Variants
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE UNIQUE INDEX idx_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;

-- Orders
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_store_status ON orders(store_id, status);
CREATE INDEX idx_orders_store_date ON orders(store_id, created_at DESC);
CREATE UNIQUE INDEX idx_orders_number ON orders(store_id, order_number);

-- Customers
CREATE INDEX idx_customers_store ON customers(store_id);
CREATE UNIQUE INDEX idx_customers_store_email ON customers(store_id, email);

-- Categories
CREATE INDEX idx_categories_store ON categories(store_id);
CREATE UNIQUE INDEX idx_categories_store_slug ON categories(store_id, slug);

-- Discounts
CREATE INDEX idx_discounts_store ON discounts(store_id);
CREATE UNIQUE INDEX idx_discounts_store_code ON discounts(store_id, code);

-- Carts (abandoned)
CREATE INDEX idx_carts_store ON carts(store_id);
CREATE INDEX idx_carts_email ON carts(store_id, email);
CREATE INDEX idx_carts_abandoned ON carts(store_id, created_at) WHERE completed_at IS NULL;
```

---

## 📊 Drizzle Schema - Preview

```typescript
// src/lib/db/schema.ts

import { 
  pgTable, uuid, varchar, text, decimal, integer,
  boolean, timestamp, jsonb, pgEnum, uniqueIndex, index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ ENUMS ============

export const userRoleEnum = pgEnum('user_role', ['admin', 'merchant']);
export const storePlanEnum = pgEnum('store_plan', ['free', 'basic', 'pro', 'enterprise']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
]);
export const financialStatusEnum = pgEnum('financial_status', [
  'pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded'
]);
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'unfulfilled', 'partial', 'fulfilled'
]);
export const discountTypeEnum = pgEnum('discount_type', [
  'percentage', 'fixed_amount', 'free_shipping'
]);
export const transactionTypeEnum = pgEnum('transaction_type', ['charge', 'refund', 'void']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'success', 'failed']);

// ============ USERS & AUTH ============

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  role: userRoleEnum('role').default('merchant').notNull(),
  emailVerifiedAt: timestamp('email_verified_at'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ STORES ============

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  customDomain: varchar('custom_domain', { length: 255 }),
  templateId: uuid('template_id'),
  logoUrl: varchar('logo_url', { length: 500 }),
  faviconUrl: varchar('favicon_url', { length: 500 }),
  currency: varchar('currency', { length: 3 }).default('ILS').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Jerusalem'),
  settings: jsonb('settings').default({}).notNull(),
  themeSettings: jsonb('theme_settings').default({}).notNull(),
  seoSettings: jsonb('seo_settings').default({}).notNull(),
  plan: storePlanEnum('plan').default('free').notNull(),
  planExpiresAt: timestamp('plan_expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customDomainIdx: uniqueIndex('idx_stores_custom_domain').on(table.customDomain),
}));

// ============ PRODUCTS ============

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  categoryId: uuid('category_id'),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  price: decimal('price', { precision: 10, scale: 2 }),
  comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  weight: decimal('weight', { precision: 10, scale: 3 }),
  hasVariants: boolean('has_variants').default(false).notNull(),
  trackInventory: boolean('track_inventory').default(true).notNull(),
  inventory: integer('inventory').default(0),
  allowBackorder: boolean('allow_backorder').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  storeSlugIdx: uniqueIndex('idx_products_store_slug').on(table.storeId, table.slug),
  storeIdx: index('idx_products_store').on(table.storeId),
  categoryIdx: index('idx_products_category').on(table.categoryId),
}));

// ... שאר הטבלאות באותו סגנון
```

---

## ✅ סיכום

### MVP (Phase 1):
- users, sessions, accounts
- stores, templates
- categories, products, product_images
- customers, orders, order_items

### Phase 2:
- product_options, product_variants
- product_tags, product_to_tags
- discounts
- pages, menus, menu_items

### Phase 3:
- transactions
- shipping_zones, shipping_rates
- tax_settings
- carts, cart_items (abandoned)
- reviews

---

**הסכמה מוכנה! תגיד "קדימה" ונתחיל לבנות** 🚀
