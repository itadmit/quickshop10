# 📋 אפיון מלא - מערכת רשימת המתנה (Waitlist)

## 🎯 סקירה כללית

מערכת מתקדמת לניהול רשימת המתנה למוצרים שאזל מלאיים, כולל שליחת התראות אוטומטיות, סטטיסטיקות ו-Webhook API.

---

## 📦 רכיבי המערכת

### 1️⃣ **טבלת Database**

```sql
CREATE TABLE product_waitlist (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID NULL,
  
  -- פרטי לקוח
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  phone VARCHAR(50),
  
  -- מעקב
  is_notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- אינדקסים ייחודיים למניעת כפילויות
CREATE UNIQUE INDEX ON product_waitlist 
  (store_id, product_id, email) 
  WHERE variant_id IS NULL;

CREATE UNIQUE INDEX ON product_waitlist 
  (store_id, variant_id, email) 
  WHERE variant_id IS NOT NULL;
```

---

### 2️⃣ **ממשק משתמש (פרונט)**

#### עמוד מוצר
- ✅ כשמוצר אזל - הצגת טופס רשימת המתנה במקום כפתור "הוסף לעגלה"
- ✅ שדות: אימייל (חובה), שם וטלפון (אופציונלי)
- ✅ הודעת הצלחה אחרי הרשמה
- ✅ תמיכה במוצרים עם וריאנטים

**קומפוננטות:**
- `ProductWaitlistForm` - טופס ההרשמה
- `ProductWithAddons` - משולב לטיפול במוצרים עם תוספות
- `VariantSelector` - משולב לטיפול בוריאנטים

**API Endpoint:**
```
POST /api/storefront/[storeSlug]/waitlist
```

---

### 3️⃣ **ממשק אדמין**

#### 📊 דף רשימת המתנה
**נתיב:** `/shops/[slug]/admin/waitlist`

**תכונות:**
- ✅ טבלה מלאה עם כל הממתינים
- ✅ פילטרים: הכל / ממתינים / נשלח
- ✅ חיפוש לפי: אימייל, שם, מוצר, טלפון
- ✅ קישורים ישירים למוצרים
- ✅ מחיקת רשומות
- ✅ סטטוס: ממתין / נשלח (עם תאריך)

**קומפוננטות:**
- `WaitlistDataTable` - טבלה אינטראקטיבית
- `page.tsx` - עמוד ראשי

---

#### 📈 דף סטטיסטיקות
**נתיב:** `/shops/[slug]/admin/waitlist/stats`

**תכונות:**
- ✅ כרטיסי סטטיסטיקה:
  - סה"כ ממתינים
  - ממתינים לעדכון
  - עודכנו (נשלחו מיילים)
- ✅ טבלת "המוצרים הכי מבוקשים":
  - דירוג (מקום 1-10)
  - תמונת מוצר
  - סה"כ ממתינים
  - כמה עודכנו
  - שיעור המרה (%)
- ✅ גרף התקדמות חזותי

---

#### ⚡ התראות בזמן אמת בדף מלאי
**נתיב:** `/shops/[slug]/admin/products/inventory`

**תכונות:**
- ✅ התראות מבדלות:
  - **ירוק** - מוצרים שחזרו למלאי (מוכנים לשליחה)
  - **כחול** - מוצרים שאזלו (אינפורמטיבי)
- ✅ כל התראה מציגה:
  - שם מוצר + וריאציה
  - מספר ממתינים
  - כפתור "שלח התראות"
- ✅ שליחה במקום עם Loader
- ✅ אפשרות לסגור התראות

**קומפוננטות:**
- `WaitlistAlerts` - קומפוננטת התראות
- `waitlist-queries.ts` - שאילתות DB

---

#### ⚙️ דף הגדרות
**נתיב:** `/shops/[slug]/admin/waitlist/settings`

**הגדרות:**
1. **שליחה אוטומטית** (checkbox)
   - כשמופעל: שולח מיילים אוטומטית כשהמלאי חוזר מ-0
   - ללא צורך באישור ידני

2. **סף מינימלי** (number)
   - שלח אוטומטית רק אם יש לפחות X ממתינים
   - למניעת שליחה ל-1 אדם בלבד
   - ברירת מחדל: 1

**קומפוננטות:**
- `WaitlistSettingsForm` - טופס הגדרות
- `lib/waitlist-settings.ts` - ניהול הגדרות

---

### 4️⃣ **מערכת שליחת מיילים**

**קובץ:** `lib/waitlist-notifications.ts`

#### פונקציות:

**1. `sendWaitlistNotification(waitlistId)`**
- שליחה למשתמש בודד
- מייל מעוצב RTL עם:
  - תמונת מוצר
  - שם מוצר + וריאציה
  - מחיר
  - כפתור CTA לעמוד מוצר
  - ברכה אישית (אם יש שם)

**2. `notifyWaitlistForProduct(storeId, productId, variantId?)`**
- שליחה לכל הממתינים למוצר/וריאנט
- מחזיר: כמה נשלחו, כמה נכשלו

**תבנית המייל:**
```html
<!DOCTYPE html>
<html dir="rtl" lang="he">
  <body>
    <h1>שלום [שם],</h1>
    <p>המוצר שחיכית לו חזר למלאי! 🎉</p>
    
    <!-- Product Card -->
    <div class="product-card">
      <img src="[תמונה]">
      <h2>[שם מוצר]</h2>
      <p>[וריאציה]</p>
      <p class="price">[מחיר]</p>
      <a href="[קישור]">לצפייה במוצר</a>
    </div>
    
    <p>מספר היחידות מוגבל. מומלץ להזדרז! 🚀</p>
  </body>
</html>
```

---

### 5️⃣ **שילוב בעדכון מלאי**

**קובץ:** `src/app/shops/[slug]/admin/products/inventory/actions.ts`

**לוגיקה:**

```typescript
async function updateInventory(itemId, inventory, isVariant) {
  // 1. עדכון המלאי ב-DB
  
  // 2. בדיקה: האם המלאי חזר מ-0?
  if (previousInventory === 0 && inventory > 0) {
    
    // 3. ספירת ממתינים
    const waitlistCount = await countWaitlist(productId, variantId);
    
    // 4. טעינת הגדרות
    const settings = await getWaitlistSettings(storeId);
    
    // 5. בדיקה: האם לשלוח אוטומטית?
    if (settings.autoNotify && waitlistCount >= settings.notifyThreshold) {
      
      // 6. שליחה אוטומטית ברקע
      await notifyWaitlistForProduct(storeId, productId, variantId);
      
      console.log(`✅ Auto-notified ${waitlistCount} customers`);
    }
  }
  
  // 7. החזרת תוצאה
  return { 
    success: true, 
    waitlistCount // להצגת התראה למשתמש
  };
}
```

---

### 6️⃣ **Webhook API - עדכון מלאי מרחוק**

**Endpoint:** `POST /api/webhooks/inventory`

**אימות:** Bearer Token (API Key)

**Body:**
```json
{
  "sku": "PROD-123",           // או productId
  "inventory": 50,
  "type": "set",               // set | add | subtract
  "reason": "restock"
}
```

**Response:**
```json
{
  "success": true,
  "productId": "uuid",
  "variantId": null,
  "previousInventory": 0,
  "newInventory": 50,
  "waitlistNotified": true     // ✅ אם נשלחו מיילים
}
```

**תכונות:**
- ✅ תמיכה ב-SKU או productId או variantId
- ✅ 3 סוגי עדכון: set / add / subtract
- ✅ לוג אוטומטי לכל עדכון
- ✅ שילוב מלא עם רשימת המתנה
- ✅ שליחה אוטומטית (אם מופעל בהגדרות)

**שימושים:**
- סנכרון עם מערכת ERP
- עדכון מספק אוטומטי
- מערכת ברקוד במחסן
- אינטגרציה עם ספקים חיצוניים

**דוקומנטציה מלאה:** `docs/WEBHOOK_INVENTORY_API.md`

---

## 🔄 זרימות עבודה (Workflows)

### זרימה 1: לקוח נרשם לרשימת המתנה

```
1. לקוח מגיע לעמוד מוצר
   ↓
2. רואה "אזל מהמלאי" → טופס רשימת המתנה
   ↓
3. ממלא אימייל (+ שם וטלפון אופציונלי)
   ↓
4. POST /api/storefront/[slug]/waitlist
   ↓
5. בדיקות:
   - מוצר קיים?
   - אכן אזל?
   - כפילות?
   ↓
6. שמירה ב-DB
   ↓
7. הצגת הודעת הצלחה ללקוח
```

---

### זרימה 2: מנהל מחזיר מלאי (ידני)

```
1. מנהל נכנס לניהול מלאי
   ↓
2. מעדכן מלאי מ-0 ל-50
   ↓
3. מערכת מזהה: יש 12 ממתינים
   ↓
4. בדיקת הגדרות:
   - שליחה אוטומטית? כן
   - סף מינימלי? 5
   - 12 >= 5? כן ✅
   ↓
5. שליחת 12 מיילים אוטומטית
   ↓
6. עדכון: isNotified = true, notifiedAt = now()
   ↓
7. הצגת הודעה למנהל: "נשלחו 12 הודעות"
```

---

### זרימה 3: עדכון דרך Webhook

```
1. מערכת ERP מזהה הגעת משלוח
   ↓
2. POST /api/webhooks/inventory
   Headers: Authorization: Bearer sk_...
   Body: { sku: "SHIRT-001", inventory: 30 }
   ↓
3. אימות API Key
   ↓
4. חיפוש מוצר לפי SKU
   ↓
5. עדכון מלאי: 0 → 30
   ↓
6. זיהוי: 8 ממתינים
   ↓
7. שליחה אוטומטית (אם מופעל)
   ↓
8. Response: { success: true, waitlistNotified: true }
   ↓
9. מערכת ERP מתעדכנת
```

---

### זרימה 4: מנהל צופה בסטטיסטיקות

```
1. מנהל נכנס לרשימת המתנה → סטטיסטיקות
   ↓
2. רואה כרטיסים:
   - 45 ממתינים סה"כ
   - 32 ממתינים לעדכון
   - 13 עודכנו
   ↓
3. רואה טבלת "המוצרים הכי מבוקשים":
   🥇 חולצת טי שחורה - 12 ממתינים
   🥈 ג'ינס קלאסי - 8 ממתינים
   🥉 נעלי ספורט - 6 ממתינים
   ↓
4. לוחץ על מוצר → מגיע לעריכת המוצר
   ↓
5. רואה התראה: "12 לקוחות מחכים למוצר זה"
   ↓
6. מחליט להזמין עוד מהספק
```

---

## 📊 טבלאות וסכמות

### טבלה: `product_waitlist`

| עמודה | סוג | תיאור |
|-------|-----|-------|
| id | UUID | מזהה ייחודי |
| store_id | UUID | החנות |
| product_id | UUID | המוצר |
| variant_id | UUID? | וריאנט (null למוצר פשוט) |
| email | VARCHAR | אימייל הלקוח |
| first_name | VARCHAR? | שם פרטי |
| phone | VARCHAR? | טלפון |
| is_notified | BOOLEAN | האם נשלח מייל |
| notified_at | TIMESTAMP? | מתי נשלח |
| created_at | TIMESTAMP | תאריך הרשמה |

### הגדרות: `stores.settings.waitlist`

```typescript
{
  autoNotify: boolean,        // שליחה אוטומטית
  notifyThreshold: number     // סף מינימלי
}
```

---

## 🎯 KPIs ומדדי הצלחה

### מדדים למעקב:

1. **Conversion Rate** - אחוז ממירים מרשימת המתנה לרכישה
   ```
   = (לקוחות שקנו / לקוחות שקיבלו מייל) × 100
   ```

2. **Time to Notify** - זמן ממוצע עד שליחת התראה
   ```
   = AVG(notified_at - created_at)
   ```

3. **Popular Products** - מוצרים מבוקשים
   ```
   = COUNT(waitlist) GROUP BY product_id ORDER BY count DESC
   ```

4. **Email Open Rate** - אחוז פתיחת מיילים (באינטגרציה עם SendGrid)

---

## 🔒 אבטחה ופרטיות

### הגנות מובנות:
- ✅ אינדקסים ייחודיים למניעת כפילויות
- ✅ ולידציה של אימייל (regex)
- ✅ בדיקת מלאי לפני הרשמה
- ✅ CSRF protection (Next.js built-in)
- ✅ Rate limiting ב-API (TODO: להוסיף)

### GDPR Compliance:
- ✅ הודעה: "לא נשתף את הפרטים עם גורם שלישי"
- ✅ אפשרות למחוק רשומות
- ✅ שליחה רק למי שביקש
- ✅ אפשרות להסרה (Unsubscribe) במייל

---

## 🚀 שיפורים עתידיים (Roadmap)

### Phase 2:
- [ ] Rate limiting ב-Webhook API
- [ ] SMS notifications (בנוסף למייל)
- [ ] A/B testing למיילים
- [ ] דו"ח "Waitlist to Purchase" מפורט
- [ ] אינטגרציה עם Google Analytics

### Phase 3:
- [ ] AI-powered: חיזוי מתי לחזיר מלאי
- [ ] Multi-language support למיילים
- [ ] Waitlist widget למשפיענים
- [ ] אפליקציית מובייל למנהלים

---

## 📚 קבצים חשובים

### Frontend:
- `src/components/product-waitlist-form.tsx`
- `src/components/product-with-addons.tsx`
- `src/components/variant-selector.tsx`
- `src/app/api/storefront/[storeSlug]/waitlist/route.ts`

### Admin:
- `src/app/shops/[slug]/admin/waitlist/page.tsx`
- `src/app/shops/[slug]/admin/waitlist/stats/page.tsx`
- `src/app/shops/[slug]/admin/waitlist/actions.ts`
- `src/components/admin/waitlist-settings-form.tsx`
- `src/components/admin/waitlist-alert.tsx`

### Backend Logic:
- `src/lib/waitlist-notifications.ts`
- `src/lib/waitlist-settings.ts`
- `src/app/shops/[slug]/admin/products/inventory/actions.ts`
- `src/app/api/webhooks/inventory/route.ts`

### Database:
- `src/lib/db/schema.ts` (טבלת `productWaitlist`)
- `drizzle/0018_mixed_sumo.sql` (migration)

### Documentation:
- `docs/WEBHOOK_INVENTORY_API.md`
- `docs/WAITLIST_SPEC.md` (זה הקובץ)

---

## 🎓 הדרכה למפתחים

### הוספת פיצ'ר חדש:

1. **עדכון סכמה:**
   ```typescript
   // src/lib/db/schema.ts
   export const productWaitlist = pgTable(...)
   ```

2. **יצירת migration:**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

3. **יצירת API:**
   ```typescript
   // src/app/api/.../route.ts
   export async function POST(request) { ... }
   ```

4. **קומפוננטה:**
   ```typescript
   // src/components/...
   'use client';
   export function MyComponent() { ... }
   ```

5. **שילוב בעמוד:**
   ```typescript
   // src/app/.../page.tsx
   import { MyComponent } from '@/components/...';
   ```

---

## ✅ בדיקות (Testing Checklist)

### בדיקות פונקציונליות:
- [ ] לקוח יכול להירשם לרשימת המתנה
- [ ] אין כפילויות (אותו אימייל פעמיים)
- [ ] כשהמלאי חוזר - נשלח מייל
- [ ] שליחה אוטומטית עובדת
- [ ] Webhook API מעדכן מלאי
- [ ] סטטיסטיקות מציגות נתונים נכונים
- [ ] התראות בעמוד מלאי עובדות

### בדיקות אבטחה:
- [ ] API Key לא תקין נדחה
- [ ] אימייל לא תקין נדחה
- [ ] לא ניתן להירשם למוצר זמין
- [ ] לא ניתן לגשת לנתונים של חנות אחרת

### בדיקות ביצועים:
- [ ] 1000 ממתינים - שליחה מסיימת תוך 30 שניות
- [ ] עמוד רשימת המתנה נטען תוך 1 שניה
- [ ] Webhook API עונה תוך 200ms

---

**תאריך עדכון:** ינואר 2026  
**גרסה:** 1.0.0  
**מפתח:** QuickShop Team










