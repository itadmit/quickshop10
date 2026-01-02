# אפיון דשבורד QuickShop Admin

## סקירה כללית

דשבורד ניהול לחנויות QuickShop בסגנון מינימליסטי (ZARA style).  
**עקרונות מנחים:** מהירות, פשטות, RTL מלא.

---

## 1. מבנה נתיבים

| נתיב | תיאור | סטטוס |
|------|-------|-------|
| `/shops/[slug]/admin` | Dashboard ראשי | ✅ |
| `/shops/[slug]/admin/orders` | רשימת הזמנות | ✅ |
| `/shops/[slug]/admin/orders/[id]` | פרטי הזמנה בודדת | ✅ |
| `/shops/[slug]/admin/products` | רשימת מוצרים | ✅ |
| `/shops/[slug]/admin/products/new` | יצירת מוצר חדש | ✅ |
| `/shops/[slug]/admin/products/[id]` | עריכת מוצר | ✅ |
| `/shops/[slug]/admin/products/inventory` | ניהול מלאי | ✅ |
| `/shops/[slug]/admin/categories` | ניהול קטגוריות | ✅ |
| `/shops/[slug]/admin/customers` | רשימת לקוחות | ✅ |
| `/shops/[slug]/admin/customers/[id]` | פרטי לקוח | ✅ |
| `/shops/[slug]/admin/discounts` | קופונים והנחות | ✅ |
| `/shops/[slug]/admin/discounts/new` | קופון חדש | ✅ (modal) |
| `/shops/[slug]/admin/reports` | דוחות ואנליטיקס | ✅ |
| `/shops/[slug]/admin/notifications` | מרכז התראות | ✅ |
| `/shops/[slug]/admin/settings` | הגדרות חנות | ✅ |
| `/shops/[slug]/admin/settings/team` | ניהול צוות | ✅ |
| `/shops/[slug]/admin/settings/tracking` | Pixels & Analytics | ✅ |
| `/shops/[slug]/admin/settings/webhooks` | אוטומציות Webhooks | ✅ |
| `/shops/[slug]/admin/settings/webhooks/[id]` | לוג webhook | ✅ |
| `/shops/[slug]/admin/settings/notifications` | הגדרות התראות | ✅ |
| `/shops/[slug]/admin/settings/shipping` | הגדרות משלוח | ✅ |
| `/shops/[slug]/admin/settings/checkout` | הגדרות Checkout | ✅ |
| `/shops/[slug]/admin/pages` | דפי תוכן | ✅ |
| `/shops/[slug]/admin/pages/new` | דף חדש | ✅ |
| `/shops/[slug]/admin/pages/[id]` | עריכת דף | ✅ |
| `/shops/[slug]/admin/navigation` | ניהול תפריטים | ✅ |
| `/shops/[slug]/admin/media` | ספריית מדיה | ✅ |
| `/shops/[slug]/admin/abandoned` | עגלות נטושות | ✅ |
| `/shops/[slug]/admin/activity` | לוג פעילות | ✅ |
| `/shops/[slug]/admin/orders/drafts` | הזמנות טיוטה | ✅ |
| `/shops/[slug]/admin/orders/drafts/new` | טיוטה חדשה | ✅ |
| `/shops/[slug]/admin/settings/tax` | הגדרות מיסים | ✅ |

---

## 2. שינויים נדרשים בסכמה

### 2.1 טבלה חדשה: `store_members`

```sql
-- קשר משתמשים לחנויות (many-to-many with role)
CREATE TABLE store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'manager', -- owner, manager, marketing, developer
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES users(id),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, user_id)
);
```

**סטטוס:** ✅ נוצר

### 2.2 טבלה חדשה: `team_invitations`

```sql
-- הזמנות לצוות
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'manager',
  invited_by UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**סטטוס:** ✅ נוצר

### 2.3 Enum חדש: `store_role`

```sql
CREATE TYPE store_role AS ENUM ('owner', 'manager', 'marketing', 'developer');
```

**סטטוס:** ✅ נוצר

### 2.4 טבלה חדשה: `pages` (דפי תוכן)

```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  content TEXT, -- HTML content
  template VARCHAR(50) DEFAULT 'default',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  seo_title VARCHAR(255),
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, slug)
);
```

**סטטוס:** ✅ נוצר

### 2.5 טבלאות חדשות: `menus` + `menu_items` (ניווט)

```sql
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  handle VARCHAR(50) NOT NULL, -- 'main', 'footer', 'mobile'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(store_id, handle)
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES menu_items(id),
  title VARCHAR(100) NOT NULL,
  link_type VARCHAR(20) NOT NULL, -- 'url', 'page', 'category', 'product'
  link_url VARCHAR(500),
  link_resource_id UUID,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

**סטטוס:** ✅ נוצר

### 2.6 טבלה חדשה: `media` (ספריית מדיה)

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  mime_type VARCHAR(100),
  size INTEGER, -- bytes
  width INTEGER,
  height INTEGER,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  alt VARCHAR(255),
  folder VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**סטטוס:** ✅ נוצר

### 2.7 טבלאות חדשות: `shipping_zones` + `shipping_rates` (משלוח)

```sql
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  countries JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2), -- free shipping threshold
  min_weight DECIMAL(10,3),
  max_weight DECIMAL(10,3),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

**סטטוס:** ✅ נוצר

### 2.8 טבלה חדשה: `abandoned_carts` (עגלות נטושות)

```sql
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  email VARCHAR(255),
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2),
  checkout_url VARCHAR(500),
  recovery_token VARCHAR(255) UNIQUE,
  recovered_at TIMESTAMP,
  order_id UUID REFERENCES orders(id),
  reminder_sent_at TIMESTAMP,
  reminder_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**סטטוס:** ✅ נוצר

### 2.9 טבלה חדשה: `activity_log` (לוג פעילות)

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  description TEXT,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**סטטוס:** ✅ נוצר

---

## 3. הרשאות לפי תפקיד

| פעולה | Owner | Manager | Marketing | Developer |
|-------|:-----:|:-------:|:---------:|:---------:|
| **הזמנות** |
| צפייה בהזמנות | ✅ | ✅ | ✅ | ❌ |
| עדכון סטטוס | ✅ | ✅ | ❌ | ❌ |
| ביטול הזמנה | ✅ | ✅ | ❌ | ❌ |
| החזר כספי | ✅ | ❌ | ❌ | ❌ |
| **מוצרים** |
| צפייה | ✅ | ✅ | ✅ | ❌ |
| יצירה/עריכה | ✅ | ✅ | ✅ | ❌ |
| מחיקה | ✅ | ✅ | ❌ | ❌ |
| ניהול מלאי | ✅ | ✅ | ✅ | ❌ |
| **לקוחות** |
| צפייה | ✅ | ✅ | ✅ | ❌ |
| עריכה | ✅ | ✅ | ❌ | ❌ |
| ייצוא | ✅ | ✅ | ✅ | ❌ |
| **קופונים** |
| צפייה | ✅ | ✅ | ✅ | ❌ |
| יצירה/עריכה | ✅ | ✅ | ✅ | ❌ |
| מחיקה | ✅ | ✅ | ❌ | ❌ |
| **הגדרות** |
| הגדרות חנות | ✅ | ✅ | ❌ | ❌ |
| ניהול צוות | ✅ | ❌ | ❌ | ❌ |
| Webhooks | ✅ | ❌ | ❌ | ✅ |
| API Keys | ✅ | ❌ | ❌ | ✅ |
| **אנליטיקס** |
| צפייה בדוחות | ✅ | ✅ | ✅ | ❌ |
| ייצוא נתונים | ✅ | ✅ | ❌ | ❌ |

---

## 4. קומפוננטות UI

### 4.1 Layout ראשי

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ NOIR      [🔍]  [🔔 2]  [store switcher ▼]  [👤 user]  ││
│  └─────────────────────────────────────────────────────────┘│
├────────────┬────────────────────────────────────────────────┤
│  Sidebar   │  Main Content                                  │
│  ┌────────┐│                                                │
│  │ 🏠 ראשי││                                                │
│  │ 📦 הזמנ││                                                │
│  │ 🛍️ מוצר││                                                │
│  │ 👥 לקוח││                                                │
│  │ 🎟️ קופו││                                                │
│  │ 📊 אנלי││                                                │
│  │────────││                                                │
│  │ ⚙️ הגדר││                                                │
│  └────────┘│                                                │
└────────────┴────────────────────────────────────────────────┘
```

**קומפוננטות נדרשות:**
- [x] `AdminLayout` - layout wrapper
- [x] `AdminSidebar` - תפריט צד
- [x] `AdminHeader` - header עם חיפוש, התראות, switcher
- [x] `StoreSwitcher` - בחירת חנות (אם יש יותר מאחת)
- [x] `NotificationBell` - פעמון התראות

### 4.2 Dashboard (Overview)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ברוך הבא, יוגב                                  01.01.2026 │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │  ₪12,450   │ │     23     │ │    156     │ │   3.2%     ││
│  │  מכירות    │ │   הזמנות   │ │  לקוחות    │ │  המרות     ││
│  │  היום      │ │  בהמתנה    │ │   חדשים    │ │            ││
│  │  ↑ 12%     │ │            │ │  החודש     │ │  ↓ 0.5%    ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘│
│                                                             │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐│
│  │ הזמנות אחרונות      כולן → │ │ התראות                  ││
│  │─────────────────────────────│ │─────────────────────────││
│  │ #1002  יוגב א.  ₪799  ⏳   │ │ ⚠️ מלאי נמוך: מעיל צמר ││
│  │ #1001  שרה כ.   ₪549  ✓    │ │ 🛒 הזמנה חדשה #1002    ││
│  │ #1000  דני ל.   ₪1,247 📦  │ │ 👤 לקוח חדש נרשם       ││
│  │ #999   מיכל ש.  ₪389  ✓    │ │                         ││
│  └─────────────────────────────┘ └─────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ גרף מכירות - 7 ימים אחרונים                             ││
│  │ [========================================]               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**קומפוננטות:**
- [x] `StatCard` - כרטיס סטטיסטיקה
- [x] `RecentOrders` - הזמנות אחרונות
- [x] `NotificationsList` - רשימת התראות
- [x] `SalesChart` - גרף מכירות

### 4.3 רשימת הזמנות

```
┌─────────────────────────────────────────────────────────────┐
│  הזמנות                                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [🔍 חיפוש לפי מס׳/שם/אימייל]    [תאריך ▼] [סטטוס ▼]   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  │ הכל (156) │ בהמתנה (5) │ שולם (23) │ נשלח (12) │ הושלם ││
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ □  מס׳      לקוח          סכום      סטטוס     תאריך     ││
│  │────────────────────────────────────────────────────────│ │
│  │ □  #1002   יוגב אביטן    ₪799     ⏳ בהמתנה  01.01    │ │
│  │ □  #1001   שרה כהן       ₪549     ✓ שולם    01.01    │ │
│  │ □  #1000   דני לוי       ₪1,247   📦 נשלח   01.01    │ │
│  │ □  #999    מיכל שמש      ₪389     ✅ הושלם  31.12    │ │
│  │ □  #998    יעל רון       ₪1,547   ✅ הושלם  31.12    │ │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [◀ הקודם]  עמוד 1 מתוך 16  [הבא ▶]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**קומפוננטות:**
- [x] `OrdersTable` - טבלת הזמנות
- [x] `OrderStatusBadge` - תג סטטוס
- [x] `OrderFilters` - סינון וחיפוש
- [x] `Pagination` - ניווט עמודים

### 4.4 פרטי הזמנה

```
┌─────────────────────────────────────────────────────────────┐
│  ← חזרה להזמנות                                             │
│                                                             │
│  הזמנה #1002                                    01.01.2026 │
│                                                             │
│  ┌────────────────────┐  ┌──────────────────────────────────┤
│  │ סטטוס              │  │ פעולות                           │
│  │ ┌────────────────┐ │  │ ┌──────────────────────────────┐ │
│  │ │ [בהמתנה ▼]     │ │  │ │ [📧 שלח אישור] [🖨️ הדפס]   │ │
│  │ └────────────────┘ │  │ │ [❌ בטל הזמנה]               │ │
│  │                    │  │ └──────────────────────────────┘ │
│  │ תשלום: ✓ שולם     │  │                                  │
│  │ משלוח: ⏳ ממתין   │  │                                  │
│  └────────────────────┘  └──────────────────────────────────┘
│                                                             │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐│
│  │ פרטי לקוח                   │ │ כתובת משלוח             ││
│  │─────────────────────────────│ │─────────────────────────││
│  │ יוגב אביטן                  │ │ יוגב אביטן              ││
│  │ itadmit@gmail.com           │ │ רחוב הרצל 15            ││
│  │ 054-2284283                 │ │ תל אביב 6520000         ││
│  │ [→ צפה בלקוח]              │ │                         ││
│  └─────────────────────────────┘ └─────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ פריטים                                                  ││
│  │─────────────────────────────────────────────────────────││
│  │ [IMG] מעיל צמר ארוך        36 / שחור      1 × ₪799     ││
│  │─────────────────────────────────────────────────────────││
│  │                                    סכום ביניים: ₪799   ││
│  │                                    הנחה (15%): -₪120   ││
│  │                                    משלוח: ₪0           ││
│  │                                    ───────────────────  ││
│  │                                    סה״כ: ₪679          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ היסטוריה                                                ││
│  │─────────────────────────────────────────────────────────││
│  │ 01.01 16:54  הזמנה נוצרה                               ││
│  │ 01.01 16:54  תשלום התקבל                               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**קומפוננטות:**
- [x] `OrderDetails` - תצוגת הזמנה מלאה
- [x] `OrderStatusSelect` - שינוי סטטוס
- [x] `OrderItems` - רשימת פריטים
- [x] `OrderTimeline` - היסטוריית הזמנה
- [x] `CustomerCard` - כרטיס לקוח מקוצר

### 4.5 רשימת מוצרים

```
┌─────────────────────────────────────────────────────────────┐
│  מוצרים                                       [+ מוצר חדש] │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [🔍 חיפוש]    [קטגוריה ▼] [מלאי ▼] [פעיל ▼]           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ □  תמונה    שם               קטגוריה   מחיר   מלאי     ││
│  │────────────────────────────────────────────────────────│ │
│  │ □  [IMG]   מעיל צמר ארוך     גברים    ₪799   15  ✓   │ │
│  │ □  [IMG]   שמלת מידי סאטן    נשים     ₪389   30  ✓   │ │
│  │ □  [IMG]   בלייזר אוברסייז   נשים     ₪549   25  ✓   │ │
│  │ □  [IMG]   תיק צד מעור       אקססוריז ₪459   35  ✓   │ │
│  │ □  [IMG]   מגפי עור שחורים   נעליים   ₪599   ⚠️3 ✓   │ │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  פעולות נבחרים: [📋 שכפל] [🗑️ מחק] [👁️ הסתר]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**קומפוננטות:**
- [x] `ProductsTable` - טבלת מוצרים
- [x] `ProductFilters` - סינון
- [x] `BulkActions` - פעולות מרובות
- [x] `InventoryBadge` - תג מלאי

### 4.6 עריכת מוצר

```
┌─────────────────────────────────────────────────────────────┐
│  ← חזרה                                    [שמור] [תצוגה] │
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────────┤
│  │ תמונות              │  │ פרטים                           │
│  │ ┌─────┐ ┌─────┐     │  │                                 │
│  │ │ IMG │ │ IMG │     │  │ שם המוצר *                      │
│  │ │ ⭐  │ │     │     │  │ ┌─────────────────────────────┐ │
│  │ └─────┘ └─────┘     │  │ │ מעיל צמר ארוך              │ │
│  │ [+ הוסף תמונות]     │  │ └─────────────────────────────┘ │
│  │                     │  │                                 │
│  │ סטטוס               │  │ תיאור קצר                       │
│  │ [✓] פעיל            │  │ ┌─────────────────────────────┐ │
│  │ [✓] מוצר מומלץ      │  │ │ מעיל צמר איכותי באורך...  │ │
│  │                     │  │ └─────────────────────────────┘ │
│  │ קטגוריה             │  │                                 │
│  │ ┌─────────────────┐ │  │ תיאור מלא                       │
│  │ │ גברים        ▼ │ │  │ ┌─────────────────────────────┐ │
│  │ └─────────────────┘ │  │ │                             │ │
│  └─────────────────────┘  │ │                             │ │
│                           │ └─────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┤
│  │ תמחור                                                   │
│  │                                                         │
│  │ מחיר *              מחיר השוואה       עלות              │
│  │ ┌──────────┐        ┌──────────┐      ┌──────────┐      │
│  │ │ ₪799     │        │ ₪999     │      │ ₪350     │      │
│  │ └──────────┘        └──────────┘      └──────────┘      │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ מלאי                                                    ││
│  │                                                         ││
│  │ [✓] עקוב אחר מלאי                                       ││
│  │                                                         ││
│  │ SKU                 ברקוד              כמות במלאי       ││
│  │ ┌──────────┐        ┌──────────┐      ┌──────────┐      ││
│  │ │ COAT-001 │        │          │      │ 15       │      ││
│  │ └──────────┘        └──────────┘      └──────────┘      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ וריאנטים                                   [+ וריאנט]  ││
│  │─────────────────────────────────────────────────────────││
│  │ [✓] למוצר זה יש וריאנטים (מידות, צבעים וכו׳)           ││
│  │                                                         ││
│  │ אפשרויות: [מידה ▼] [צבע ▼] [+ אפשרות]                  ││
│  │                                                         ││
│  │ מידה/צבע         מחיר     מלאי   SKU                   ││
│  │ 36 / שחור       ₪599     5      BOOT-36-BLK            ││
│  │ 37 / שחור       ₪599     8      BOOT-37-BLK            ││
│  │ 36 / חום        ₪649     3      BOOT-36-BRN            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ SEO                                                     ││
│  │                                                         ││
│  │ כותרת SEO                                               ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ מעיל צמר ארוך | NOIR                                │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ תיאור SEO                                               ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ מעיל צמר איכותי באורך ברך. גזרה ישרה...            │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**קומפוננטות:**
- [x] `ProductForm` - טופס מוצר מלא
- [x] `ImageUploader` - העלאת תמונות (drag & drop)
- [x] `VariantsManager` - ניהול וריאנטים
- [x] `RichTextEditor` - עורך תיאור
- [x] `PriceInput` - שדה מחיר

### 4.7 ניהול קופונים

```
┌─────────────────────────────────────────────────────────────┐
│  קופונים והנחות                              [+ קופון חדש] │
│                                                             │
│  │ קופונים │ הנחות אוטומטיות │                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ קוד          סוג       ערך      שימושים   סטטוס        ││
│  │────────────────────────────────────────────────────────│ │
│  │ WELCOME15   אחוז      15%      45/1000   ✓ פעיל       │ │
│  │ FREESHIP    משלוח     חינם     12/500    ✓ פעיל       │ │
│  │ SAVE50      קבוע      ₪50      8/200     ✓ פעיל       │ │
│  │ VIP20       אחוז      20%      3/100     ✓ פעיל       │ │
│  │ SUMMER10    אחוז      10%      156/999   ⏸️ מושהה     │ │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**קומפוננטות:**
- [x] `DiscountsTable` - טבלת קופונים
- [x] `DiscountForm` - טופס קופון
- [x] `AutoDiscountForm` - טופס הנחה אוטומטית

### 4.8 הגדרות חנות

```
┌─────────────────────────────────────────────────────────────┐
│  הגדרות                                                     │
│                                                             │
│  │ כללי │ עיצוב │ משלוח │ תשלום │ צוות │ Webhooks │        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ פרטי החנות                                              ││
│  │                                                         ││
│  │ שם החנות *                                              ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ NOIR                                                │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ כתובת URL                                               ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ quickshop.co.il/shops/noir-fashion                  │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ דומיין מותאם אישית                                      ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ www.noir.co.il                                      │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │ [הגדר דומיין]                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ פרטי קשר                                                ││
│  │                                                         ││
│  │ אימייל                       טלפון                      ││
│  │ ┌────────────────────┐      ┌────────────────────┐      ││
│  │ │ hello@noir.co.il   │      │ 03-9876543         │      ││
│  │ └────────────────────┘      └────────────────────┘      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                                    [שמור]  │
└─────────────────────────────────────────────────────────────┘
```

### 4.9 ניהול צוות

```
┌─────────────────────────────────────────────────────────────┐
│  צוות                                        [+ הזמן חבר]  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ חברי צוות פעילים                                        ││
│  │─────────────────────────────────────────────────────────││
│  │ [👤] demo@zarastyle.co.il         בעלים       הצטרף אתמול│
│  │ [👤] manager@noir.co.il           מנהל        הצטרף 01.01│
│  │ [👤] marketing@noir.co.il         שיווק       הצטרף 01.01│
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ הזמנות ממתינות                                          ││
│  │─────────────────────────────────────────────────────────││
│  │ dev@agency.co.il                  מפתח       פג תוקף    │
│  │ [שלח שוב] [בטל]                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. API Routes

### 5.1 Auth

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| POST | `/api/admin/auth/login` | התחברות | ⬜ |
| POST | `/api/admin/auth/logout` | התנתקות | ⬜ |
| GET | `/api/admin/auth/me` | משתמש נוכחי | ⬜ |

### 5.2 Orders

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| GET | `/api/admin/orders` | רשימת הזמנות | ⬜ |
| GET | `/api/admin/orders/[id]` | פרטי הזמנה | ⬜ |
| PATCH | `/api/admin/orders/[id]` | עדכון הזמנה | ⬜ |
| POST | `/api/admin/orders/[id]/cancel` | ביטול | ⬜ |
| POST | `/api/admin/orders/[id]/fulfill` | סימון כנשלח | ⬜ |

### 5.3 Products

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| GET | `/api/admin/products` | רשימת מוצרים | ⬜ |
| POST | `/api/admin/products` | יצירת מוצר | ⬜ |
| GET | `/api/admin/products/[id]` | פרטי מוצר | ⬜ |
| PUT | `/api/admin/products/[id]` | עדכון מוצר | ⬜ |
| DELETE | `/api/admin/products/[id]` | מחיקת מוצר | ⬜ |
| POST | `/api/admin/products/[id]/duplicate` | שכפול | ⬜ |

### 5.4 Customers

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| GET | `/api/admin/customers` | רשימת לקוחות | ⬜ |
| GET | `/api/admin/customers/[id]` | פרטי לקוח | ⬜ |
| PUT | `/api/admin/customers/[id]` | עדכון לקוח | ⬜ |
| GET | `/api/admin/customers/export` | ייצוא CSV | ⬜ |

### 5.5 Discounts

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| GET | `/api/admin/discounts` | רשימת קופונים | ⬜ |
| POST | `/api/admin/discounts` | יצירת קופון | ⬜ |
| PUT | `/api/admin/discounts/[id]` | עדכון קופון | ⬜ |
| DELETE | `/api/admin/discounts/[id]` | מחיקת קופון | ⬜ |

### 5.6 Analytics

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| GET | `/api/admin/analytics/overview` | סיכום | ⬜ |
| GET | `/api/admin/analytics/sales` | מכירות | ⬜ |
| GET | `/api/admin/analytics/products` | מוצרים פופולריים | ⬜ |

### 5.7 Settings & Team

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| GET | `/api/admin/settings` | הגדרות חנות | ⬜ |
| PUT | `/api/admin/settings` | עדכון הגדרות | ⬜ |
| GET | `/api/admin/team` | חברי צוות | ⬜ |
| POST | `/api/admin/team/invite` | הזמנת חבר | ⬜ |
| DELETE | `/api/admin/team/[id]` | הסרת חבר | ⬜ |

### 5.8 Notifications

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| GET | `/api/admin/notifications` | רשימת התראות | ⬜ |
| POST | `/api/admin/notifications/mark-read` | סימון כנקרא | ⬜ |

### 5.9 Upload

| Method | Route | תיאור | סטטוס |
|--------|-------|-------|-------|
| POST | `/api/admin/upload` | העלאת תמונה | ⬜ |

---

## 6. Server Actions

| Action | תיאור | סטטוס |
|--------|-------|-------|
| `getAdminStats()` | סטטיסטיקות dashboard | ✅ |
| `getOrders()` | הזמנות עם pagination | ✅ |
| `updateOrderStatus()` | עדכון סטטוס הזמנה | ✅ |
| `getProducts()` | מוצרים עם pagination | ✅ |
| `createProduct()` | יצירת מוצר | ✅ |
| `updateProduct()` | עדכון מוצר | ✅ |
| `deleteProduct()` | מחיקת מוצר | ✅ |
| `getCustomers()` | לקוחות | ✅ |
| `getDiscounts()` | קופונים | ✅ |
| `createDiscount()` | יצירת קופון | ✅ |
| `updateDiscount()` | עדכון קופון | ✅ |
| `getNotifications()` | התראות | ✅ |
| `markNotificationRead()` | סימון כנקרא | ✅ |
| `inviteTeamMember()` | הזמנת חבר צוות | ✅ |
| `removeTeamMember()` | הסרת חבר צוות | ✅ |

---

## 7. Middleware & Auth

### 7.1 Middleware נדרש

```typescript
// middleware.ts - לבדיקת auth בנתיבי admin
matcher: ['/shops/:slug/admin/:path*']

// בדיקות:
// 1. האם יש session תקין
// 2. האם המשתמש משויך לחנות
// 3. האם יש לו הרשאה לנתיב הספציפי
```

**סטטוס:** ✅ נוצר (NextAuth + middleware)

### 7.2 Auth Flow

```
1. משתמש נכנס ל /shops/noir-fashion/admin
2. Middleware בודק session cookie
3. אם אין → redirect ל /admin/login?redirect=/shops/noir-fashion/admin
4. אם יש → בודק שהמשתמש משויך לחנות noir-fashion
5. אם לא משויך → 403 Forbidden
6. אם משויך → בודק הרשאות לנתיב
7. אם אין הרשאה → 403 Forbidden
8. אם יש → מאפשר גישה
```

---

## 8. Store Switcher Logic

```typescript
// אם למשתמש יותר מחנות אחת
const userStores = await db.query.storeMembers.findMany({
  where: eq(storeMembers.userId, userId),
  with: { store: true }
});

// בדשבורד יופיע switcher עם:
// - רשימת חנויות
// - יצירת חנות חדשה (אם מותר בתוכנית)
```

---

## 9. רשימת משימות להקמה

### Phase 0: סכמה ו-Seed (לפני הדשבורד)
- [x] הוספת טבלאות לסכמה:
  - [x] `store_members` + `team_invitations`
  - [x] `pages`
  - [x] `menus` + `menu_items`
  - [x] `media`
  - [x] `shipping_zones` + `shipping_rates`
  - [x] `activity_log`
- [x] מיגרציה לDB
- [x] עדכון seed:
  - [x] owner ראשוני ל-store_members
  - [x] דפי מערכת (about, terms, privacy, etc)
  - [x] תפריט ראשי + footer
  - [x] אזור משלוח ישראל עם תעריפים

### Phase 1: תשתית (Foundation)
- [x] Admin layout בסיסי (sidebar, header)
- [x] Middleware auth לנתיבי admin
- [x] Login page
- [x] Store switcher (אם יש יותר מחנות)

### Phase 2: Dashboard & Orders
- [x] Dashboard page עם stats
- [x] Orders list עם filters
- [x] Order details page
- [x] Update order status
- [x] Order timeline

### Phase 3: Products & Inventory
- [x] Products list
- [x] Product form (create/edit)
- [x] Image upload (+ media library)
- [x] Variants manager
- [x] Categories management
- [x] Inventory page (low stock view)

### Phase 4: Customers & Discounts
- [x] Customers list
- [x] Customer details + order history
- [x] Discounts list (coupons)
- [x] Discount form (create/edit)
- [x] Automatic discounts

### Phase 5: Content & Navigation
- [x] Pages list
- [x] Page editor (WYSIWYG)
- [x] Navigation/Menu editor
- [x] Media library

### Phase 6: Settings
- [x] Store settings (name, logo, contact)
- [x] Shipping zones & rates
- [x] Checkout settings
- [x] Tracking pixels (FB, GA, GTM)
- [x] Notifications settings
- [x] Webhooks management
- [x] Team management + invites

### Phase 7: Analytics
- [x] Overview stats
- [x] Sales charts (7d, 30d, custom)
- [x] Products performance
- [x] Customer analytics
- [x] Export reports

### Phase 8: Advanced (עתידי)
- [x] Abandoned carts + recovery emails
- [x] Activity log
- [x] Draft orders
- [x] Gift cards (סכמה בלבד)
- [ ] Multi-language
- [ ] Mobile app notifications

---

## 10. מערכות קיימות (כבר מומשו בפרונט)

### 10.1 מערכת Tracking Pixels (קיים בדף תודה)

**מה קיים:**
- `PurchaseTracking` component (`src/components/purchase-tracking.tsx`)
- תמיכה ב-Facebook Pixel (fbq)
- תמיכה ב-Google Analytics 4 (gtag)
- תמיכה ב-GTM dataLayer

**מה צריך בדשבורד:**
```
┌─────────────────────────────────────────────────────────────┐
│  הגדרות > Tracking & Analytics                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Facebook Pixel                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Pixel ID                                                ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │ 1234567890123456                                  │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  │ [✓] מופעל                                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Google Analytics                                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Measurement ID                                          ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │ G-XXXXXXXXXX                                      │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  │ [✓] מופעל                                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Google Tag Manager                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Container ID                                            ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │ GTM-XXXXXXX                                       │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  │ [✓] מופעל                                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  TikTok Pixel (עתידי)                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Pixel ID                                                ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │                                                   │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  │ [ ] מופעל                                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                                    [שמור]  │
└─────────────────────────────────────────────────────────────┘
```

**שדות בסכמה (להוסיף ל-stores.settings):**
```typescript
settings: {
  // Tracking
  facebookPixelId?: string;
  facebookPixelEnabled?: boolean;
  googleAnalyticsId?: string;
  googleAnalyticsEnabled?: boolean;
  gtmContainerId?: string;
  gtmEnabled?: boolean;
  tiktokPixelId?: string;
  tiktokPixelEnabled?: boolean;
}
```

**סטטוס:** ✅ מושלם

### 10.2 מערכת מלאי (קיים ב-createOrder)

**מה קיים:**
- עדכון מלאי אוטומטי ברכישה (`src/app/actions/order.ts`)
- תמיכה במלאי מוצר ומלאי וריאנט
- שדות: `products.inventory`, `productVariants.inventory`
- שדות: `products.trackInventory`, `products.allowBackorder`

**מה צריך בדשבורד:**

```
┌─────────────────────────────────────────────────────────────┐
│  מוצרים > ניהול מלאי                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  │ הכל │ מלאי נמוך (3) │ אזל (1) │                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ מוצר                SKU          מלאי      פעולות       ││
│  │────────────────────────────────────────────────────────│ │
│  │ מעיל צמר ארוך       COAT-001     15        [עדכן]      │ │
│  │ שמלת מידי סאטן      DRESS-001    30        [עדכן]      │ │
│  │ ⚠️ מגפי עור שחורים  BOOT-*       3         [עדכן]      │ │
│  │ ❌ סניקרס לבנים     SNKR-42      0         [עדכן]      │ │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  הגדרות מלאי                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ סף התראה למלאי נמוך: [5] יחידות                         ││
│  │ [✓] שלח התראה כשמלאי נמוך                               ││
│  │ [✓] שלח התראה כשמוצר אזל                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**עדכון מלאי מהיר (modal):**
```
┌─────────────────────────────────────┐
│  עדכון מלאי - מגפי עור שחורים      │
├─────────────────────────────────────┤
│                                     │
│  וריאנט          נוכחי    חדש       │
│  36 / שחור       2        [___]     │
│  37 / שחור       0        [___]     │
│  38 / שחור       1        [___]     │
│  36 / חום        0        [___]     │
│                                     │
│           [בטל]  [שמור]             │
└─────────────────────────────────────┘
```

**סטטוס:** ✅ מושלם

### 10.3 מערכת התראות (קיים בסכמה)

**מה קיים:**
- טבלת `notifications` (סכמה)
- טבלת `store_events` (סכמה)
- פונקציות יצירת התראות (`src/lib/events.ts`)
- סוגי התראות: `new_order`, `low_stock`, `out_of_stock`, `new_customer`, `order_cancelled`, `system`

**מה צריך בדשבורד:**

```
┌─────────────────────────────────────────────────────────────┐
│  מרכז התראות                           [סמן הכל כנקרא]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  │ הכל │ הזמנות │ מלאי │ לקוחות │ מערכת │                  │
│                                                             │
│  היום                                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ● 🛒 הזמנה חדשה #1002 התקבלה - ₪799          16:54    ││
│  │   → יוגב אביטן | מעיל צמר ארוך                         ││
│  │                                                         ││
│  │ ● ⚠️ מלאי נמוך: מגפי עור שחורים                 16:30    ││
│  │   → נותרו 3 יחידות                                      ││
│  │                                                         ││
│  │ ○ 👤 לקוח חדש נרשם                              14:22    ││
│  │   → sarah@example.com                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  אתמול                                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ○ 🛒 הזמנה חדשה #1001 התקבלה - ₪549          23:15    ││
│  │ ○ ✅ הזמנה #999 הושלמה                        18:30    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [טען עוד]                                                  │
└─────────────────────────────────────────────────────────────┘
```

**פעמון התראות בheader:**
```
┌──────────────────────┐
│ 🔔 2                 │  ← badge עם מספר
├──────────────────────┤
│ התראות חדשות        │
│──────────────────────│
│ 🛒 הזמנה #1002      │
│ ⚠️ מלאי נמוך        │
│──────────────────────│
│ [צפה בכל ההתראות]   │
└──────────────────────┘
```

**הגדרות התראות:**
```
┌─────────────────────────────────────────────────────────────┐
│  הגדרות > התראות                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  התראות בדשבורד                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [✓] הזמנה חדשה                                          ││
│  │ [✓] מלאי נמוך                                           ││
│  │ [✓] מוצר אזל                                            ││
│  │ [✓] לקוח חדש                                            ││
│  │ [✓] ביטול הזמנה                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  התראות באימייל                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [✓] הזמנה חדשה                                          ││
│  │ [✓] מלאי נמוך                                           ││
│  │ [✓] מוצר אזל                                            ││
│  │ [ ] לקוח חדש                                            ││
│  │ [✓] ביטול הזמנה                                         ││
│  │                                                         ││
│  │ שלח אל: hello@noir.co.il                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  התראות Push (אפליקציה - עתידי)                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [ ] מופעל                                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**סטטוס:** ✅ מושלם

### 10.4 מערכת Webhooks ואוטומציות (קיים בסכמה)

**מה קיים:**
- טבלת `webhooks` (סכמה)
- טבלת `webhook_deliveries` (לוג)
- טבלת `store_events` (אירועים)
- פונקציות שליחת webhooks (`src/lib/events.ts`)
- סוגי events: `order.created`, `order.paid`, `order.fulfilled`, `order.cancelled`, `customer.created`, `customer.updated`, `product.low_stock`, `product.out_of_stock`, `discount.used`

**מה צריך בדשבורד:**

```
┌─────────────────────────────────────────────────────────────┐
│  הגדרות > Webhooks                            [+ webhook]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Webhooks פעילים                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ שם              URL                  אירועים   סטטוס    ││
│  │────────────────────────────────────────────────────────│ │
│  │ Zapier          https://hooks.za...  3        ✓ פעיל   │ │
│  │ └─ 156 שליחות | אחרון: לפני 5 דק | [לוג] [ערוך] [מחק] │ │
│  │                                                         ││
│  │ Make.com        https://hook.eu...   2        ✓ פעיל   │ │
│  │ └─ 42 שליחות | אחרון: לפני שעה | [לוג] [ערוך] [מחק]   │ │
│  │                                                         ││
│  │ Custom CRM      https://api.cust...  5        ⚠️ שגיאות│ │
│  │ └─ 12 שליחות | 3 נכשלו | [לוג] [ערוך] [מחק]          │ │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**יצירת/עריכת webhook:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← חזרה                                           [שמור]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  פרטי Webhook                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ שם                                                      ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │ Zapier Integration                                │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │ URL *                                                   ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │ https://hooks.zapier.com/hooks/catch/123/abc      │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │ Secret (לחתימת HMAC)                                    ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │ ••••••••••••••••                    [הצג] [חדש]  │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  אירועים לשליחה                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ הזמנות                                                  ││
│  │ [✓] order.created    - הזמנה נוצרה                      ││
│  │ [✓] order.paid       - תשלום התקבל                      ││
│  │ [ ] order.fulfilled  - הזמנה נשלחה                      ││
│  │ [ ] order.cancelled  - הזמנה בוטלה                      ││
│  │                                                         ││
│  │ לקוחות                                                  ││
│  │ [✓] customer.created - לקוח חדש                         ││
│  │ [ ] customer.updated - לקוח עודכן                       ││
│  │                                                         ││
│  │ מלאי                                                    ││
│  │ [ ] product.low_stock    - מלאי נמוך                    ││
│  │ [ ] product.out_of_stock - אזל מהמלאי                   ││
│  │                                                         ││
│  │ הנחות                                                   ││
│  │ [ ] discount.used    - קופון מומש                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Headers מותאמים אישית (אופציונלי)                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ┌─────────────┐  ┌─────────────────────────┐  [הסר]    ││
│  │ │ X-API-Key   │  │ my-secret-key           │           ││
│  │ └─────────────┘  └─────────────────────────┘           ││
│  │ [+ הוסף header]                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [✓] Webhook פעיל                                           │
│                                                             │
│  [בדוק חיבור]                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**לוג שליחות webhook:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← חזרה                         Zapier - לוג שליחות         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  סינון: [אירוע ▼] [סטטוס ▼] [תאריך ▼]                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ תאריך           אירוע          סטטוס     זמן תגובה      ││
│  │────────────────────────────────────────────────────────│ │
│  │ 01.01 16:54    order.created   ✓ 200     45ms         │ │
│  │ 01.01 16:54    order.paid      ✓ 200     52ms         │ │
│  │ 01.01 14:22    customer.created✓ 200     38ms         │ │
│  │ 31.12 23:15    order.created   ✓ 200     41ms         │ │
│  │ 31.12 18:30    order.created   ❌ 500    timeout      │ │
│  │ └─ שגיאה: Connection timeout                           │ │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [◀ הקודם]  עמוד 1 מתוך 5  [הבא ▶]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**פרטי שליחה בודדת (modal/expand):**
```
┌─────────────────────────────────────────────────────────────┐
│  שליחה - 01.01.2026 16:54                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  סטטוס: ✓ 200 OK                                            │
│  זמן תגובה: 45ms                                            │
│  אירוע: order.created                                       │
│                                                             │
│  Request Body:                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ {                                                       ││
│  │   "event": "order.created",                             ││
│  │   "timestamp": "2026-01-01T16:54:00.000Z",              ││
│  │   "data": {                                             ││
│  │     "orderNumber": "1002",                              ││
│  │     "customerEmail": "itadmit@gmail.com",               ││
│  │     "total": 679,                                       ││
│  │     "itemCount": 1                                      ││
│  │   }                                                     ││
│  │ }                                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Response:                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ {"success": true}                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                          [שלח שוב] [סגור]  │
└─────────────────────────────────────────────────────────────┘
```

**סטטוס:** ✅ מושלם

### 10.5 הגדרות משלוח (נוסף לסכמה)

```
┌─────────────────────────────────────────────────────────────┐
│  הגדרות > משלוח                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  אזורי משלוח                                   [+ אזור]    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ישראל (ברירת מחדל)                          [ערוך]     ││
│  │─────────────────────────────────────────────────────────││
│  │ שיטה              מחיר     תנאי         זמן משלוח      ││
│  │ משלוח רגיל        ₪29      -            3-5 ימים       ││
│  │ משלוח מהיר        ₪49      -            1-2 ימים       ││
│  │ משלוח חינם        ₪0       מעל ₪200     3-5 ימים       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**סטטוס:** ✅ מושלם

### 10.6 דפי תוכן (נוסף לסכמה)

```
┌─────────────────────────────────────────────────────────────┐
│  דפים                                          [+ דף חדש]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ כותרת            סלאג          סטטוס      פעולות       ││
│  │────────────────────────────────────────────────────────│ │
│  │ אודות            /about        ✓ פורסם    [ערוך]      │ │
│  │ צור קשר          /contact      ✓ פורסם    [ערוך]      │ │
│  │ תנאי שימוש        /terms        ✓ פורסם    [ערוך]      │ │
│  │ מדיניות פרטיות   /privacy      ○ טיוטה    [ערוך]      │ │
│  │ מדיניות משלוחים  /shipping     ✓ פורסם    [ערוך]      │ │
│  │ החזרות והחלפות   /returns      ✓ פורסם    [ערוך]      │ │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**עורך דף:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← חזרה                                [שמור טיוטה] [פרסם] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  כותרת *                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ אודות NOIR                                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  כתובת URL                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ /about                                                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  תוכן                                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [B] [I] [U] | [H1] [H2] | [Link] [Image] | [Code]       ││
│  │─────────────────────────────────────────────────────────││
│  │                                                         ││
│  │ NOIR הוקמה ב-2020 מתוך אהבה לאופנה מינימליסטית...      ││
│  │                                                         ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  SEO                                                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ כותרת SEO                                               ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │ אודות | NOIR - אופנה מינימליסטית                  │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  │ תיאור SEO                                               ││
│  │ ┌───────────────────────────────────────────────────┐   ││
│  │ │ NOIR - חנות אופנה מינימליסטית. קולקציות...        │   ││
│  │ └───────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**סטטוס:** ✅ מושלם

### 10.7 ניהול תפריטים (נוסף לסכמה)

```
┌─────────────────────────────────────────────────────────────┐
│  ניווט                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  │ תפריט ראשי │ תפריט תחתון │                              │
│                                                             │
│  תפריט ראשי                                    [+ פריט]    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⋮⋮ דף הבית              /                   [ערוך] [×] ││
│  │ ⋮⋮ נשים                 /category/women     [ערוך] [×] ││
│  │    └─ שמלות             /category/dresses   [ערוך] [×] ││
│  │    └─ חולצות            /category/tops      [ערוך] [×] ││
│  │ ⋮⋮ גברים                /category/men       [ערוך] [×] ││
│  │ ⋮⋮ אקססוריז             /category/acc       [ערוך] [×] ││
│  │ ⋮⋮ אודות                /about              [ערוך] [×] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  גרור כדי לשנות סדר | גרור ימינה ליצירת תת-פריט            │
│                                                             │
│                                                    [שמור]  │
└─────────────────────────────────────────────────────────────┘
```

**סטטוס:** ✅ מושלם

### 10.8 ספריית מדיה (נוסף לסכמה)

```
┌─────────────────────────────────────────────────────────────┐
│  ספריית מדיה                           [העלה קבצים]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [🔍 חיפוש]     [תיקייה ▼] [סוג ▼]                         │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │  IMG   │ │  IMG   │ │  IMG   │ │  IMG   │ │  IMG   │    │
│  │        │ │        │ │        │ │        │ │        │    │
│  │ coat.jpg│ │dress.jpg│ │bag.jpg │ │logo.png│ │hero.jpg│    │
│  │ 245KB  │ │ 180KB  │ │ 120KB  │ │ 15KB   │ │ 890KB  │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐                          │
│  │  IMG   │ │  IMG   │ │  IMG   │                          │
│  │        │ │        │ │        │                          │
│  │boot.jpg │ │snkr.jpg │ │scarf.jpg│                          │
│  │ 210KB  │ │ 195KB  │ │ 88KB   │                          │
│  └────────┘ └────────┘ └────────┘                          │
│                                                             │
│  56 קבצים | 12.4MB משומש                                    │
└─────────────────────────────────────────────────────────────┘
```

**סטטוס:** ⬜ צריך סכמה + UI

### 10.9 עגלות נטושות (חדש - חסר בסכמה)

```
┌─────────────────────────────────────────────────────────────┐
│  עגלות נטושות                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │    23    │ │   ₪4,520 │ │   17%    │                    │
│  │  עגלות   │ │   ערך    │ │  שחזור  │                    │
│  │  נטושות  │ │  פוטנציאלי│ │          │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
│  │ הכל │ לא נשלח │ נשלח │ שוחזר │                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ לקוח            פריטים    סכום     תאריך      פעולות   ││
│  │────────────────────────────────────────────────────────│ │
│  │ test@test.com   3 פריטים  ₪1,247   לפני שעה   [שלח]   │ │
│  │ user@gmail.com  1 פריט    ₪549     לפני 3 ש׳  [שלח]   │ │
│  │ another@ex.com  2 פריטים  ₪798     אתמול      [נשלח ✓]│ │
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**סטטוס:** ✅ מושלם

### 10.10 לוג פעילות (נוסף לסכמה)

```
┌─────────────────────────────────────────────────────────────┐
│  לוג פעילות                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [סינון: משתמש ▼] [פעולה ▼] [תאריך ▼]                      │
│                                                             │
│  היום                                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 16:54  יוגב א.    עדכן סטטוס הזמנה #1002 → נשלח        ││
│  │ 16:30  יוגב א.    עדכן מלאי: מעיל צמר (15 → 14)        ││
│  │ 14:22  מערכת      לקוח חדש נרשם: sarah@example.com     ││
│  │ 12:00  יוגב א.    יצר קופון: WINTER20                   ││
│  │ 11:45  יוגב א.    עדכן מוצר: שמלת מידי סאטן            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  אתמול                                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 23:15  מערכת      הזמנה #1001 נוצרה                     ││
│  │ 18:30  יוגב א.    עדכן הגדרות חנות                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [טען עוד]                                                  │
└─────────────────────────────────────────────────────────────┘
```

**סטטוס:** ⬜ צריך סכמה + UI

---

## 11. מבנה stores.settings המלא

```typescript
settings: {
  // Contact Info
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  
  // Social Media
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  
  // Tracking Pixels
  facebookPixelId?: string;
  facebookPixelEnabled?: boolean;
  googleAnalyticsId?: string;
  googleAnalyticsEnabled?: boolean;
  gtmContainerId?: string;
  gtmEnabled?: boolean;
  tiktokPixelId?: string;
  tiktokPixelEnabled?: boolean;
  
  // Checkout Settings
  checkout?: {
    requirePhone?: boolean;
    requireCompany?: boolean;
    allowNotes?: boolean;
    termsRequired?: boolean;
    termsPageId?: string;
    successMessage?: string;
    emailNotifications?: boolean;
  };
  
  // Notification Settings
  notifications?: {
    emailOnOrder?: boolean;
    emailOnLowStock?: boolean;
    emailOnOutOfStock?: boolean;
    lowStockThreshold?: number; // default 5
    notificationEmail?: string;
  };
  
  // Inventory Settings
  inventory?: {
    trackInventory?: boolean;
    allowBackorders?: boolean;
    lowStockThreshold?: number;
  };
}
```

---

## 12. עקרונות טכניים

### מהירות (כמו הפרונט)
- ISR/SSG where possible
- Server Components by default
- Client Components only when needed
- Optimistic updates
- Skeleton loaders

### RTL & עברית
- כל הטקסטים בעברית
- dir="rtl" על כל הדשבורד
- Tailwind RTL utilities

### עיצוב
- מינימליסטי כמו ZARA
- צבעים: שחור, לבן, אפורים
- פונטים: Heebo / Assistant
- Spacing consistent
- No emojis in UI (icons only)

---

---

## קבצי תיעוד נוספים

- [השוואה לשופיפיי](./SHOPIFY_COMPARISON.md) - מה יש ומה חסר

---

**עודכן לאחרונה:** 02.01.2026

