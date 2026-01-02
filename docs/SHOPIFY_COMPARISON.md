# השוואה לשופיפיי - מה יש ומה חסר

## סיכום מהיר

| קטגוריה | שופיפיי | QuickShop | סטטוס |
|---------|---------|-----------|-------|
| הזמנות | ✅ | ✅ | ✅ מושלם |
| מוצרים | ✅ | ✅ | ✅ מושלם |
| וריאנטים | ✅ | ✅ | ✅ יש |
| קטגוריות | ✅ | ✅ | ✅ מושלם |
| לקוחות | ✅ | ✅ | ✅ מושלם |
| קופונים | ✅ | ✅ | ✅ מושלם |
| הנחות אוטומטיות | ✅ | ✅ | ✅ יש |
| עגלות נטושות | ✅ | ✅ | ✅ מושלם |
| הזמנות טיוטה | ✅ | ✅ | ✅ מושלם |
| דפי תוכן | ✅ | ✅ | ✅ מושלם |
| תפריטים | ✅ | ✅ | ✅ מושלם |
| ספריית מדיה | ✅ | ✅ | ✅ מושלם |
| כרטיסי מתנה | ✅ | ✅ | ✅ יש בסכמה |
| החזרים | ✅ | ✅ | ✅ יש בסכמה |
| הגדרות משלוח | ✅ | ✅ | ✅ מושלם |
| הגדרות מס | ✅ | ✅ | ✅ מושלם |
| Activity Log | ✅ | ✅ | ✅ מושלם |
| Analytics/Reports | ✅ | ✅ | ✅ מושלם |
| Team Management | ✅ | ✅ | ✅ מושלם |
| Webhooks | ✅ | ✅ | ✅ מושלם |
| Tracking Pixels | ✅ | ✅ | ✅ מושלם |

---

## פירוט מה חסר ומה צריך להוסיף

### 1. עגלות נטושות (Abandoned Checkouts) ⭐ חשוב

**מה זה:**
- שמירת עגלות שלא הושלמו
- אימייל אוטומטי לשחזור עגלה
- סטטיסטיקות על עגלות נטושות

**טבלה חדשה נדרשת:**
```sql
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  customer_id UUID REFERENCES customers(id),
  email VARCHAR(255),
  items JSONB NOT NULL, -- cart items
  subtotal DECIMAL(10,2),
  checkout_url VARCHAR(500), -- recovery URL with token
  recovery_token VARCHAR(255) UNIQUE,
  recovered_at TIMESTAMP, -- if order was completed
  order_id UUID REFERENCES orders(id),
  reminder_sent_at TIMESTAMP, -- email sent
  reminder_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**UI בדשבורד:**
- רשימת עגלות נטושות
- שליחת אימייל שחזור
- סטטיסטיקות שחזור

---

### 2. דפי תוכן (Pages) ⭐ חשוב

**מה זה:**
- דפים סטטיים (אודות, צור קשר, תקנון)
- עורך WYSIWYG
- SEO לכל דף

**טבלה חדשה נדרשת:**
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  content TEXT, -- HTML content
  template VARCHAR(50) DEFAULT 'default', -- page template
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  seo_title VARCHAR(255),
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, slug)
);
```

**דפים מובנים (system pages):**
- about - אודות
- contact - צור קשר
- terms - תנאי שימוש
- privacy - מדיניות פרטיות
- shipping - מדיניות משלוחים
- returns - מדיניות החזרות

---

### 3. תפריטים וניווט (Navigation/Menus) ⭐ חשוב

**מה זה:**
- ניהול תפריט ראשי
- ניהול תפריט footer
- קישורים לקטגוריות, דפים, מוצרים

**טבלאות חדשות:**
```sql
-- Menu groups
CREATE TABLE menus (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  name VARCHAR(100) NOT NULL, -- 'main', 'footer', 'mobile'
  handle VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, handle)
);

-- Menu items (hierarchical)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES menu_items(id),
  title VARCHAR(100) NOT NULL,
  link_type VARCHAR(20) NOT NULL, -- 'url', 'page', 'category', 'product'
  link_url VARCHAR(500),
  link_resource_id UUID, -- page_id, category_id, product_id
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

---

### 4. ספריית מדיה (Media Library) ⭐ חשוב

**מה זה:**
- העלאת תמונות מרכזית
- שימוש חוזר בתמונות
- ניהול קבצים

**טבלה חדשה:**
```sql
CREATE TABLE media (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  mime_type VARCHAR(100),
  size INTEGER, -- bytes
  width INTEGER,
  height INTEGER,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  alt VARCHAR(255),
  folder VARCHAR(100), -- for organization
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 5. הגדרות משלוח (Shipping Settings) ⭐ חשוב

**מה זה:**
- אזורי משלוח
- שיטות משלוח
- תעריפים

**טבלאות חדשות:**
```sql
-- Shipping zones
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  name VARCHAR(100) NOT NULL,
  countries JSONB DEFAULT '[]', -- ["IL", "US"]
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shipping rates
CREATE TABLE shipping_rates (
  id UUID PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "משלוח רגיל", "משלוח מהיר"
  description VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2), -- free shipping above
  min_weight DECIMAL(10,3),
  max_weight DECIMAL(10,3),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

**הגדרות נוכחיות (hardcoded):**
```typescript
// כרגע בקוד:
const shipping = cartTotal >= 200 ? 0 : 29;
```
צריך להפוך לדינמי!

---

### 6. Activity Log (לוג פעילות)

**מה יש:**
- `store_events` - אירועים על הזמנות, לקוחות, מלאי

**מה חסר:**
- לוג פעולות משתמשים בדשבורד
- מי עשה מה ומתי

**טבלה חדשה:**
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'product.created', 'order.updated', etc.
  resource_type VARCHAR(50), -- 'product', 'order', 'customer'
  resource_id UUID,
  description TEXT,
  changes JSONB, -- { before: {}, after: {} }
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 7. הגדרות Checkout

**מה חסר:**
- שדות חובה בטופס
- הודעות מותאמות
- תנאים והסכמות

**להוסיף ל-stores.settings:**
```typescript
settings: {
  checkout: {
    requirePhone: boolean;
    requireCompany: boolean;
    orderNotes: boolean; // allow notes
    termsRequired: boolean;
    termsPageId: string; // link to terms page
    successMessage: string;
    emailNotifications: boolean;
  }
}
```

---

### 8. Analytics בסיסי

**מה חסר:**
- גרף מכירות
- מוצרים פופולריים
- לקוחות חוזרים

**לא צריך טבלה חדשה** - נשלוף מהנתונים הקיימים:
- `orders` - לגרף מכירות
- `order_items` - למוצרים פופולריים
- `customers` - ללקוחות חוזרים

---

## סיכום שינויים נדרשים בסכמה

### טבלאות חדשות (Phase 1 - חובה):
1. `abandoned_carts` - עגלות נטושות
2. `pages` - דפי תוכן
3. `menus` - תפריטים
4. `menu_items` - פריטי תפריט
5. `media` - ספריית מדיה
6. `shipping_zones` - אזורי משלוח
7. `shipping_rates` - תעריפי משלוח
8. `store_members` - צוות (כבר באפיון)
9. `team_invitations` - הזמנות צוות (כבר באפיון)
10. `activity_log` - לוג פעילות

### טבלאות עתידיות (Phase 2):
- `draft_orders` - הזמנות טיוטה
- `gift_cards` - כרטיסי מתנה
- `refunds` - החזרים
- `tax_rates` - שיעורי מס

### עדכונים לטבלאות קיימות:
- `stores.settings` - הוספת הגדרות checkout, tracking

---

## סיד נדרש

### דפים מובנים:
```typescript
const systemPages = [
  { slug: 'about', title: 'אודות', template: 'default' },
  { slug: 'contact', title: 'צור קשר', template: 'contact' },
  { slug: 'terms', title: 'תנאי שימוש', template: 'legal' },
  { slug: 'privacy', title: 'מדיניות פרטיות', template: 'legal' },
  { slug: 'shipping-policy', title: 'מדיניות משלוחים', template: 'legal' },
  { slug: 'returns', title: 'החזרות והחלפות', template: 'legal' },
];
```

### תפריטים:
```typescript
const menus = [
  { handle: 'main', name: 'תפריט ראשי' },
  { handle: 'footer', name: 'תפריט תחתון' },
];

const mainMenuItems = [
  { title: 'דף הבית', link_type: 'url', link_url: '/' },
  { title: 'נשים', link_type: 'category', link_resource_id: categoryId },
  { title: 'גברים', link_type: 'category', link_resource_id: categoryId },
  { title: 'אודות', link_type: 'page', link_resource_id: aboutPageId },
];
```

### אזורי משלוח:
```typescript
const shippingZones = [
  {
    name: 'ישראל',
    countries: ['IL'],
    is_default: true,
    rates: [
      { name: 'משלוח רגיל', price: 29, min_order_amount: null, estimated_days: '3-5' },
      { name: 'משלוח מהיר', price: 49, min_order_amount: null, estimated_days: '1-2' },
      { name: 'משלוח חינם', price: 0, min_order_amount: 200, estimated_days: '3-5' },
    ]
  }
];
```

---

## סדר עדיפויות

### חובה (לפני דשבורד):
1. ✅ `shipping_zones` + `shipping_rates` - הכי חשוב, משפיע על checkout
2. ✅ `pages` - דפי תוכן בסיסיים
3. ✅ `store_members` + `team_invitations` - צוות

### חשוב (עם דשבורד):
4. ✅ `menus` + `menu_items` - ניווט
5. ✅ `media` - ספריית מדיה
6. ✅ `activity_log` - לוג פעילות

### עתידי:
7. ✅ `abandoned_carts` - עגלות נטושות
8. ✅ `draft_orders` - הזמנות טיוטה
9. ✅ `gift_cards` - כרטיסי מתנה (סכמה בלבד)
10. ✅ `tax_rates` - הגדרות מיסים

