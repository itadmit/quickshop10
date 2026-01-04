# 🎯 מערכת הנחות וקופונים - QuickShop

## סקירה כללית

מערכת ההנחות של QuickShop תומכת במגוון רחב של סוגי הנחות, כולל קופונים ידניים והנחות אוטומטיות.
המערכת בנויה לביצועים גבוהים (< 1ms לחישוב) ותומכת בתרחישים מורכבים.

---

## 📊 סוגי הנחות

### הנחות בסיסיות

| סוג | תיאור | דוגמה |
|-----|--------|--------|
| `percentage` | אחוז הנחה מהסכום | 10% הנחה |
| `fixed_amount` | סכום קבוע בש"ח | 50₪ הנחה |
| `free_shipping` | משלוח חינם | משלוח חינם מעל 100₪ |

### הנחות מתקדמות

| סוג | תיאור | דוגמה |
|-----|--------|--------|
| `buy_x_pay_y` | קנה X מוצרים שלם סכום קבוע | קנה 3 חולצות שלם 100₪ |
| `buy_x_get_y` | קנה X קבל Y במתנה | קנה 2 קבל 1 חינם |
| `quantity_discount` | הנחות כמות מדורגות | קנה 2 = 10%, קנה 3 = 20% |
| `spend_x_pay_y` | קנה בסכום מסוים שלם פחות | קנה ב-200₪ שלם 100₪ |

---

## 🎫 קופונים (Coupons)

קופונים הם הנחות שמופעלות על ידי הלקוח באמצעות קוד.

### שדות קופון

| שדה | תיאור | חובה |
|-----|--------|------|
| `code` | קוד הקופון (למשל SAVE10) | ✅ |
| `title` | שם ההנחה להצגה | ❌ |
| `type` | סוג ההנחה | ✅ |
| `value` | ערך ההנחה (אחוז או סכום) | ✅* |
| `minimumAmount` | מינימום סכום הזמנה | ❌ |
| `usageLimit` | מגבלת שימושים כוללת | ❌ |
| `oncePerCustomer` | פעם אחת ללקוח | ❌ |
| `firstOrderOnly` | רק להזמנה ראשונה | ❌ |
| `stackable` | ניתן לשילוב עם הנחות אחרות | ❌ |
| `startsAt` | תאריך תחילה | ❌ |
| `endsAt` | תאריך סיום | ❌ |
| `isActive` | האם פעיל | ✅ |

*נדרש לסוגי הנחות percentage ו-fixed_amount

### על מה הקופון חל

| ערך | תיאור |
|-----|--------|
| `all` | כל המוצרים |
| `category` | קטגוריות ספציפיות |
| `product` | מוצרים ספציפיים |
| `member` | רק לחברי מועדון רשומים |

### החרגות

ניתן להחריג מוצרים או קטגוריות מהקופון:
- `excludeCategoryIds` - קטגוריות שלא יקבלו את ההנחה
- `excludeProductIds` - מוצרים שלא יקבלו את ההנחה

### שדות לסוגי הנחות מתקדמים

| שדה | סוגים רלוונטיים | תיאור |
|-----|-----------------|--------|
| `buyQuantity` | buy_x_pay_y, buy_x_get_y | כמות לקנייה |
| `payAmount` | buy_x_pay_y, spend_x_pay_y | סכום לתשלום |
| `getQuantity` | buy_x_get_y | כמות מוצרים במתנה |
| `giftProductIds` | buy_x_get_y | מזהי מוצרים במתנה |
| `giftSameProduct` | buy_x_get_y | האם המתנה היא אותו מוצר |
| `quantityTiers` | quantity_discount | מדרגות כמות |
| `spendAmount` | spend_x_pay_y | סכום להוצאה |

### מדרגות כמות (quantityTiers)

```typescript
interface QuantityTier {
  minQuantity: number;     // כמות מינימלית
  discountPercent: number; // אחוז הנחה
}

// דוגמה:
[
  { minQuantity: 2, discountPercent: 10 },  // קנה 2 = 10% הנחה
  { minQuantity: 3, discountPercent: 15 },  // קנה 3 = 15% הנחה
  { minQuantity: 5, discountPercent: 20 },  // קנה 5+ = 20% הנחה
]
```

---

## 🤖 הנחות אוטומטיות (Automatic Discounts)

הנחות שמופעלות אוטומטית על העגלה ללא צורך בקוד.

### שדות נוספים להנחות אוטומטיות

| שדה | תיאור |
|-----|--------|
| `name` | שם ההנחה (חובה) |
| `description` | תיאור להצגה ללקוח |
| `priority` | סדר עדיפות (גבוה = קודם) |
| `minimumQuantity` | כמות מינימום להפעלה |

### סוגי הנחות זמינים

הנחות אוטומטיות תומכות ב**כל סוגי ההנחות** הזמינים בקופונים:

| סוג | תיאור |
|-----|--------|
| `percentage` | אחוז הנחה |
| `fixed_amount` | סכום קבוע |
| `free_shipping` | משלוח חינם |
| `buy_x_pay_y` | קנה X שלם Y |
| `buy_x_get_y` | קנה X קבל Y חינם |
| `quantity_discount` | הנחות כמות מדורגות |
| `spend_x_pay_y` | קנה ב-X שלם Y |

### החרגות

גם הנחות אוטומטיות תומכות בהחרגות:
- `excludeCategoryIds` - קטגוריות שלא יקבלו את ההנחה
- `excludeProductIds` - מוצרים שלא יקבלו את ההנחה

---

## 🔗 שיוך למשפיעניות

ניתן לשייך קופון למשפיענית לצורך מעקב אחר מכירות:

```
קופון (NOAPROMOTE20) ← משויך ל → משפיענית (נועה)
```

כאשר לקוח משתמש בקופון, המכירה נרשמת למשפיענית והיא יכולה לעקוב אחר הביצועים שלה בדשבורד ייעודי.

---

## 🧮 מנוע החישוב (Discount Engine)

### קובץ ראשי
`src/lib/discount-engine.ts`

### פונקציות עיקריות

#### `calculateDiscounts(items, discounts, options)`
חישוב כל ההנחות על הסל.

```typescript
const result = calculateDiscounts(
  cartItems,      // פריטי העגלה
  discounts,      // רשימת הנחות
  {
    isMember: true,      // האם חבר מועדון
    shippingAmount: 30,  // עלות משלוח
  }
);

// תוצאה:
{
  originalTotal: 810,       // סכום מקורי
  discountTotal: 81,        // סה"כ הנחות
  finalTotal: 729,          // סכום לתשלום
  freeShipping: false,      // משלוח חינם
  appliedDiscounts: [...],  // פירוט הנחות
  giftItems: [...],         // מוצרים במתנה
  errors: [],               // שגיאות
}
```

#### `validateDiscount(discount)`
בדיקת תקינות הנחה לפני שמירה.

```typescript
const errors = validateDiscount({
  type: 'percentage',
  value: 150, // לא תקין!
});
// errors = ['אחוז ההנחה חייב להיות בין 1 ל-100']
```

#### `dbDiscountToEngine(dbDiscount)`
המרת הנחה מה-DB לפורמט המנוע.

#### `getDiscountDescription(discount)`
קבלת תיאור ההנחה בעברית.

---

## 🌐 API Endpoint

### `POST /api/discount/calculate`

חישוב הנחות דרך API.

#### Request

```json
{
  "storeId": "uuid",
  "items": [
    {
      "id": "item-1",
      "productId": "prod-1",
      "categoryId": "cat-1",
      "name": "חולצה",
      "price": 100,
      "quantity": 2
    }
  ],
  "couponCode": "SAVE10",
  "customerEmail": "user@example.com",
  "shippingAmount": 30
}
```

#### Response

```json
{
  "success": true,
  "result": {
    "originalTotal": 200,
    "discountTotal": 20,
    "finalTotal": 180,
    "freeShipping": false,
    "appliedDiscounts": [
      {
        "discountId": "uuid",
        "code": "SAVE10",
        "type": "percentage",
        "amount": 20,
        "description": "10% הנחה"
      }
    ],
    "giftItems": [],
    "errors": []
  }
}
```

### `GET /api/discount/calculate`

תיעוד ה-API.

---

## ⚡ ביצועים

המערכת מותאמת לביצועים גבוהים:

| מדד | יעד | תוצאה בפועל |
|-----|-----|-------------|
| זמן חישוב (100 פריטים, 20 הנחות) | < 1ms | ~0.1ms |
| זמן תגובת API | < 100ms | ~50ms |

### עקרונות אופטימיזציה

1. **חישובים בצד השרת** - אין JavaScript כבד בצד הלקוח
2. **אלגוריתמים יעילים** - O(n) לרוב הפעולות
3. **מינימום קריאות DB** - שליפה אחת של כל ההנחות
4. **Caching** - שימוש ב-ISR לדפים סטטיים

---

## 🗃️ סכמת Database

### טבלת `discounts` (קופונים)

```sql
CREATE TABLE discounts (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  type discount_type NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  minimum_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  once_per_customer BOOLEAN DEFAULT false,
  first_order_only BOOLEAN DEFAULT false,
  stackable BOOLEAN DEFAULT true,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- על מה חל
  applies_to applies_to_enum DEFAULT 'all',
  category_ids JSONB DEFAULT '[]',
  product_ids JSONB DEFAULT '[]',
  
  -- החרגות
  exclude_category_ids JSONB DEFAULT '[]',
  exclude_product_ids JSONB DEFAULT '[]',
  
  -- שדות מתקדמים
  buy_quantity INTEGER,
  pay_amount DECIMAL(10,2),
  get_quantity INTEGER,
  gift_product_ids JSONB DEFAULT '[]',
  gift_same_product BOOLEAN DEFAULT true,
  quantity_tiers JSONB DEFAULT '[]',
  spend_amount DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### טבלת `automatic_discounts`

אותו מבנה כמו `discounts`, עם שדות נוספים:
- `name` - שם חובה
- `description` - תיאור
- `priority` - עדיפות
- `minimum_quantity` - כמות מינימלית

---

## 🎨 ממשק ניהול

### עמוד יצירת/עריכת קופון

נתיב: `/shops/[slug]/admin/discounts/new` או `/shops/[slug]/admin/discounts/[id]`

ה-UI כולל:
- בחירת סוג הנחה עם optgroups (בסיסיות/מתקדמות)
- שדות דינמיים לכל סוג הנחה
- בחירת מוצרים וקטגוריות עם חיפוש
- הגדרת החרגות
- תנאים וזמנים

### צבעי UI לפי סוג

| סוג | צבע רקע |
|-----|---------|
| buy_x_pay_y | כחול (blue-50) |
| buy_x_get_y | ירוק (green-50) |
| quantity_discount | סגול (purple-50) |
| spend_x_pay_y | כתום (orange-50) |

---

## 📋 תרחישי שימוש

### 1. הנחת השקה
```
סוג: percentage
ערך: 20%
appliesTo: all
firstOrderOnly: true
startsAt: 01/01/2026
endsAt: 31/01/2026
```

### 2. מבצע קנה 2 קבל 1
```
סוג: buy_x_get_y
buyQuantity: 2
getQuantity: 1
appliesTo: category
categoryIds: ['cat-shirts']
giftSameProduct: true
```

### 3. הנחת כמות מדורגת
```
סוג: quantity_discount
appliesTo: product
productIds: ['prod-xyz']
quantityTiers: [
  { minQuantity: 3, discountPercent: 10 },
  { minQuantity: 5, discountPercent: 15 },
  { minQuantity: 10, discountPercent: 25 }
]
```

### 4. קנה ב-200 שלם 150
```
סוג: spend_x_pay_y
spendAmount: 200
payAmount: 150
appliesTo: category
categoryIds: ['cat-electronics']
```

### 5. הנחת חברי מועדון
```
סוג: percentage
ערך: 5%
appliesTo: member
stackable: true
```

---

## 🔧 פיתוח עתידי

1. **הנחות מדורגות לפי סכום** - קנה ב-500₪ קבל 5%, קנה ב-1000₪ קבל 10%
2. **הנחות זמן מוגבל** - Flash Sale
3. **הנחות משולבות** - קנה מקטגוריה A וגם מקטגוריה B
4. **נקודות נאמנות** - צבירה ומימוש
5. **קופון חד פעמי אוטומטי** - נוצר לאחר פעולה (הרשמה, רכישה)

