# 🧾 תוסף POS - קופה לסליקת לקוחות

## 📋 סקירה כללית

תוסף POS (Point of Sale) מאפשר לבעלי חנויות לסלוק לקוחות ישירות מממשק הניהול - בלי צורך לעבור דרך הפרונט. מושלם לעסקים עם נקודת מכירה פיזית, מכירות טלפוניות, או הזמנות מותאמות אישית.

### 🎯 מטרות
1. **מהירות** - יצירת הזמנה + סליקה ב-30 שניות
2. **גמישות** - מוצרים מהקטלוג + פריטים ידניים
3. **אינטגרציה** - הזמנות נשמרות באותו הפורמט בדיוק
4. **פשטות** - ממשק נקי ללא הסחות דעת

---

## 🏗️ ארכיטקטורה

### שימוש בתשתית קיימת
- ✅ אותה סכמת הזמנות (`orders`, `order_items`)
- ✅ אותו API לסליקה (`/api/payments/initiate`)
- ✅ אותם ספקי תשלום (Pelecard, PayPlus)
- ✅ אותו מעקב מלאי
- ✅ אינטגרציה לאנשי קשר/לקוחות

### מה חדש
- 📱 ממשק קופה ייעודי
- 🔍 חיפוש מהיר בלקוחות/אנשי קשר
- ➕ הוספת פריטים ידניים (ללא מוצר מהקטלוג)
- 🏷️ סימון `source: 'pos'` בהזמנה

---

## 📁 מבנה קבצים

```
src/
├── lib/
│   └── plugins/
│       └── registry.ts           # הוספת הגדרת התוסף
│
├── app/
│   └── shops/
│       └── [slug]/
│           └── admin/
│               └── plugins/
│                   └── pos/
│                       ├── page.tsx           # דף ראשי - הקופה
│                       ├── pos-terminal.tsx   # קומפוננטת הקופה (client)
│                       ├── product-search.tsx # חיפוש מוצרים
│                       ├── customer-search.tsx # חיפוש לקוחות
│                       ├── cart-items.tsx     # רשימת פריטים
│                       ├── manual-item.tsx    # הוספת פריט ידני
│                       └── actions.ts         # Server Actions
```

---

## 💻 עיצוב UI

### Layout - פריסת מסך

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⬅ חזרה לניהול              🧾 קופה               [שם החנות]                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │                                 │  │                                  │  │
│  │  🔍 חיפוש מוצר או ברקוד...     │  │     👤 פרטי לקוח                 │  │
│  │                                 │  │                                  │  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐       │  │  ┌────────────────────────────┐  │  │
│  │  │ 🛍️ │ │ 🛍️ │ │ 🛍️ │       │  │  │ 🔍 חיפוש לקוח / מזדמן     │  │  │
│  │  │ M  │ │ M  │ │ M  │       │  │  └────────────────────────────┘  │  │
│  │  │ ₪99 │ │₪149│ │ ₪79│       │  │                                  │  │
│  │  └─────┘ └─────┘ └─────┘       │  │  שם: _________________________  │  │
│  │                                 │  │  טלפון: ______________________  │  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐       │  │  אימייל: _____________________  │  │
│  │  │ 🛍️ │ │ 🛍️ │ │ 🛍️ │       │  │                                  │  │
│  │  │ M  │ │ M  │ │ M  │       │  │  📍 כתובת למשלוח (אופציונלי)    │  │
│  │  │₪199│ │ ₪59│ │₪129│       │  │  ☐ הלקוח יאסוף / ללא משלוח      │  │
│  │  └─────┘ └─────┘ └─────┘       │  │                                  │  │
│  │                                 │  └──────────────────────────────────┘  │
│  │  ┌────────────────────────┐    │                                        │
│  │  │ ➕ הוסף פריט ידני     │    │  ┌──────────────────────────────────┐  │
│  │  └────────────────────────┘    │  │                                  │  │
│  │                                 │  │     🛒 עגלה                      │  │
│  └─────────────────────────────────┘  │                                  │  │
│                                        │  ┌────────────────────────────┐  │  │
│                                        │  │ חולצה כחולה L    x1  ₪149 │  │  │
│                                        │  │ [מחק]              [+] [-] │  │  │
│                                        │  ├────────────────────────────┤  │  │
│                                        │  │ פריט ידני: תיקון  x1  ₪50  │  │  │
│                                        │  │ [מחק]              [+] [-] │  │  │
│                                        │  └────────────────────────────┘  │  │
│                                        │                                  │  │
│                                        │  ─────────────────────────────   │  │
│                                        │  סה״כ פריטים:          2        │  │
│                                        │  סכום ביניים:       ₪199        │  │
│                                        │  משלוח:               ₪0        │  │
│                                        │  ─────────────────────────────   │  │
│                                        │  לתשלום:            ₪199        │  │
│                                        │                                  │  │
│                                        │  🎟️ קוד קופון: [___________]   │  │
│                                        │                                  │  │
│                                        │  ┌────────────────────────────┐  │  │
│                                        │  │                            │  │  │
│                                        │  │   💳 המשך לתשלום          │  │  │
│                                        │  │                            │  │  │
│                                        │  └────────────────────────────┘  │  │
│                                        │                                  │  │
│                                        └──────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### עקרונות עיצוב
- **RTL מלא**
- **Responsive** - במובייל הפריסה עוברת לעמודה אחת
- **מהיר** - כל אינטראקציה חייבת להרגיש מיידית
- **מינימליסטי** - בלי קישוטים מיותרים, פוקוס על העבודה

---

## 🔧 פרטי יישום

### 1. הגדרת התוסף (Registry)

```typescript
// src/lib/plugins/registry.ts
{
  slug: 'pos',
  name: 'קופה',
  description: 'ממשק קופה לסליקת לקוחות עם חיפוש מהיר, מוצרים מהקטלוג ופריטים ידניים',
  type: 'core',
  category: 'operations',
  version: '1.0.0',
  icon: 'receipt',
  author: 'QuickShop',
  isFree: false,
  price: 49.90,
  trialDays: 14,
  defaultConfig: {
    enabled: true,
    defaultShippingMethod: 'pickup', // 'pickup' | 'delivery'
    showRecentProducts: true,
    recentProductsCount: 12,
    allowManualItems: true,
    defaultCurrency: 'ILS',
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
  },
},
```

### 2. סוגי פריטים בעגלה

```typescript
// types.ts
interface POSCartItem {
  id: string; // UUID זמני
  type: 'product' | 'variant' | 'manual';
  
  // למוצר מהקטלוג
  productId?: string;
  variantId?: string;
  
  // תמיד נדרש
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  
  // לפריט ידני בלבד
  description?: string;
}

interface POSCustomer {
  type: 'existing' | 'new' | 'guest';
  customerId?: string;
  contactId?: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    postalCode?: string;
    apartment?: string;
  };
}

interface POSOrder {
  items: POSCartItem[];
  customer: POSCustomer;
  shippingMethod: 'pickup' | 'delivery';
  shippingAmount: number;
  discountCode?: string;
  discountAmount?: number;
  notes?: string;
  subtotal: number;
  total: number;
}
```

### 3. חיפוש מוצרים

```typescript
// product-search.tsx
// Server Action - חיפוש מהיר
export async function searchProducts(storeId: string, query: string) {
  // חיפוש לפי:
  // 1. שם מוצר (ILIKE)
  // 2. SKU (מדויק)
  // 3. ברקוד (מדויק)
  
  // מחזיר עד 20 תוצאות
  // ממוין לפי רלוונטיות
}

// רשימת מוצרים אחרונים - נטענת ב-Server
// מוצגת כברירת מחדל לפני חיפוש
export async function getRecentProducts(storeId: string, limit = 12) {
  // מוצרים אחרונים לפי updatedAt
  // עם תמונה ראשית
}
```

### 4. חיפוש לקוחות

```typescript
// customer-search.tsx
export async function searchCustomers(storeId: string, query: string) {
  // חיפוש ב:
  // 1. customers - לקוחות רשומים
  // 2. contacts - אנשי קשר
  
  // חיפוש לפי:
  // - שם (firstName, lastName)
  // - אימייל
  // - טלפון
  
  // מחזיר עד 10 תוצאות
  // ממוין לפי totalOrders (לקוחות חוזרים קודם)
}
```

### 5. יצירת הזמנה

```typescript
// actions.ts
'use server';

export async function createPOSOrder(
  storeId: string,
  order: POSOrder
): Promise<{ success: boolean; orderId?: string; paymentUrl?: string; error?: string }> {
  
  // 1. ולידציה
  if (order.items.length === 0) {
    return { success: false, error: 'העגלה ריקה' };
  }
  
  if (!order.customer.name || !order.customer.email || !order.customer.phone) {
    return { success: false, error: 'חסרים פרטי לקוח' };
  }
  
  // 2. יצירת/עדכון לקוח
  let customerId = order.customer.customerId;
  if (!customerId && order.customer.type === 'new') {
    // יצירת לקוח חדש
    customerId = await createCustomer(storeId, order.customer);
  }
  
  // 3. מספר הזמנה
  const orderNumber = await generateOrderNumber(storeId);
  
  // 4. יצירת הזמנה ב-DB
  const [newOrder] = await db.insert(orders).values({
    storeId,
    customerId,
    orderNumber,
    status: 'pending',
    financialStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    subtotal: String(order.subtotal),
    discountCode: order.discountCode,
    discountAmount: String(order.discountAmount || 0),
    shippingAmount: String(order.shippingAmount),
    total: String(order.total),
    customerEmail: order.customer.email,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    shippingAddress: order.shippingMethod === 'delivery' ? order.customer.address : null,
    shippingMethod: order.shippingMethod === 'pickup' ? 'איסוף עצמי' : 'משלוח',
    notes: order.notes,
    // 🔑 סימון מקור
    utmSource: 'pos',
    utmMedium: 'internal',
  }).returning();
  
  // 5. הוספת פריטים
  for (const item of order.items) {
    await db.insert(orderItems).values({
      orderId: newOrder.id,
      productId: item.productId || null,
      variantId: item.variantId || null,
      name: item.name,
      price: String(item.price),
      quantity: item.quantity,
      // לפריט ידני - שמירת metadata
      metadata: item.type === 'manual' ? { 
        isManual: true, 
        description: item.description 
      } : null,
    });
  }
  
  // 6. יצירת לינק תשלום
  const paymentResult = await initiatePayment({
    storeId,
    orderReference: newOrder.id,
    amount: order.total,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
    },
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shops/${storeSlug}/admin/orders/${newOrder.id}?payment=success`,
    failureUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shops/${storeSlug}/admin/plugins/pos?payment=failed`,
  });
  
  return {
    success: true,
    orderId: newOrder.id,
    paymentUrl: paymentResult.paymentUrl,
  };
}
```

---

## ⚡ אופטימיזציות ביצועים

### 1. Server Components
- רשימת מוצרים אחרונים - Server Component
- פרטי חנות - Server Component
- קופה עצמה - Client Component (מינימלי)

### 2. Optimistic UI
```typescript
// בלחיצה על מוצר:
1. מיד מוסיפים לעגלה (UI)
2. לא מחכים לשרת
3. אין צורך ב-API call להוספה לעגלה
4. הכל מתנהל ב-state מקומי
```

### 3. חיפוש Debounced
```typescript
// 300ms debounce על חיפוש
// לא מעמיס על ה-DB
```

### 4. טעינה עצלה
```typescript
// מודל פריט ידני - נטען רק בלחיצה
// חיפוש לקוחות - נטען רק בפוקוס
```

---

## 🔄 זרימת תהליך

```
┌─────────────────┐
│ כניסה לקופה    │
└────────┬────────┘
         ↓
┌─────────────────┐     ┌─────────────────┐
│ חיפוש/בחירת    │────→│ הוספת פריט     │
│ מוצרים         │     │ ידני            │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ↓                       ↓
┌─────────────────────────────────────────┐
│            עדכון עגלה                   │
│  (כמויות, מחיקה, קופון)                │
└────────────────────┬────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│         הזנת פרטי לקוח                  │
│  (חיפוש קיים / מזדמן / חדש)            │
└────────────────────┬────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│      בחירת אופציית משלוח               │
│  (איסוף עצמי / משלוח + כתובת)          │
└────────────────────┬────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│         לחיצה על "המשך לתשלום"         │
│  → יצירת הזמנה ב-DB                    │
│  → הפניה לעמוד סליקה                   │
└────────────────────┬────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│           עמוד תשלום                    │
│  (Pelecard / PayPlus iframe)           │
└────────────────────┬────────────────────┘
                     ↓
      ┌──────────────┴───────────────┐
      ↓                              ↓
┌───────────┐                ┌───────────────┐
│ הצלחה     │                │ כישלון        │
│           │                │               │
│ → חזרה    │                │ → חזרה לקופה  │
│   להזמנה  │                │   עם הודעה    │
└───────────┘                └───────────────┘
```

---

## 📋 שדות הזמנה

ההזמנה שנוצרת מכילה:

| שדה | ערך |
|-----|-----|
| `status` | `pending` → `processing` (אחרי תשלום) |
| `financialStatus` | `pending` → `paid` |
| `fulfillmentStatus` | `unfulfilled` |
| `shippingMethod` | `איסוף עצמי` / `משלוח` |
| `utmSource` | `pos` |
| `utmMedium` | `internal` |
| `paymentMethod` | `pelecard` / `payplus` |

---

## 🔐 הרשאות

- נדרשת גישה לאדמין של החנות
- לא נגיש מהפרונט
- אין צורך ב-authentication נפרד

---

## 📊 דוחות

ניתן לסנן בדוחות לפי:
- `utmSource = 'pos'` - כל ההזמנות מהקופה
- מעקב ביצועים נפרד למכירות POS vs Online

---

## 🚀 שלבי פיתוח

### Phase 1 - MVP (2-3 ימים)
- [ ] הגדרת תוסף ב-Registry
- [ ] דף קופה בסיסי
- [ ] חיפוש והוספת מוצרים
- [ ] עגלה + סיכום
- [ ] פרטי לקוח (ידני)
- [ ] יצירת הזמנה + לינק תשלום
- [ ] הפניה לסליקה

### Phase 2 - שיפורים (1-2 ימים)
- [ ] חיפוש לקוחות קיימים
- [ ] פריט ידני (מודל)
- [ ] קופונים
- [ ] בחירת שיטת משלוח

### Phase 3 - Polish
- [ ] מובייל responsive
- [ ] קיצורי מקלדת
- [ ] סריקת ברקוד (מצלמה)
- [ ] היסטוריית הזמנות אחרונות

---

## 🎨 סגנון עיצוב

```css
/* צבעים */
--pos-bg: #f8fafc;           /* רקע כללי */
--pos-card: #ffffff;         /* כרטיסים */
--pos-primary: #3b82f6;      /* כפתור ראשי */
--pos-success: #22c55e;      /* הצלחה */
--pos-danger: #ef4444;       /* מחיקה */
--pos-text: #1e293b;         /* טקסט ראשי */
--pos-muted: #64748b;        /* טקסט משני */

/* צללים */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);

/* מעברים */
transition: all 0.15s ease;
```

---

## ✅ Checklist לפני השקה

- [ ] תוסף מותקן ופעיל
- [ ] ספק סליקה מוגדר בחנות
- [ ] בדיקת יצירת הזמנה מלאה
- [ ] בדיקת callback מהסליקה
- [ ] בדיקת עדכון מלאי
- [ ] בדיקה במובייל

