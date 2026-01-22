# 🔗 Webhook API - עדכון מלאי מרחוק

## סקירה כללית

ה-Webhook API מאפשר לעדכן מלאי מוצרים מבחוץ, לשילוב עם מערכות ERP, מחסן, ספקים וכו'.

## 🔐 אימות (Authentication)

כל בקשה חייבת לכלול **Bearer Token** ב-header:

```http
Authorization: Bearer YOUR_API_KEY_HERE
```

ניתן ליצור API Key בהגדרות החנות: **הגדרות** → **מפתחות API**

---

## 📍 Endpoint: עדכון מלאי

```
POST /api/webhooks/inventory
```

### Headers

| שם | ערך | חובה |
|----|-----|------|
| `Authorization` | `Bearer {api_key}` | ✅ |
| `Content-Type` | `application/json` | ✅ |

### Body Parameters

| פרמטר | סוג | חובה | תיאור |
|-------|-----|------|-------|
| `sku` | string | לא* | מק"ט המוצר |
| `productId` | string (UUID) | לא* | מזהה המוצר |
| `variantId` | string (UUID) | לא | מזהה הוריאנט (למוצרים עם וריאציות) |
| `inventory` | number | ✅ | כמות המלאי |
| `type` | enum | לא | `set` (ברירת מחדל), `add`, `subtract` |
| `reason` | string | לא | סיבה לעדכון (לתיעוד) |

\* חובה לספק לפחות אחד: `sku` או `productId`

### סוגי עדכון (`type`)

| ערך | תיאור | דוגמה |
|-----|-------|-------|
| `set` | קבע מלאי מדויק | `inventory: 50` → מלאי יהיה 50 |
| `add` | הוסף למלאי הקיים | `inventory: 10` → מלאי+10 |
| `subtract` | הפחת מהמלאי הקיים | `inventory: 5` → מלאי-5 |

---

## 📤 דוגמאות שימוש

### 1️⃣ עדכון מלאי לפי מק"ט (SKU)

```bash
curl -X POST https://yourstore.quickshop.co.il/api/webhooks/inventory \
  -H "Authorization: Bearer sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SHIRT-001",
    "inventory": 50,
    "type": "set",
    "reason": "restock"
  }'
```

### 2️⃣ הוספת מלאי לוריאנט

```bash
curl -X POST https://yourstore.quickshop.co.il/api/webhooks/inventory \
  -H "Authorization: Bearer sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "variantId": "550e8400-e29b-41d4-a716-446655440000",
    "inventory": 20,
    "type": "add",
    "reason": "shipment_received"
  }'
```

### 3️⃣ הפחתת מלאי (לאחר מכירה)

```bash
curl -X POST https://yourstore.quickshop.co.il/api/webhooks/inventory \
  -H "Authorization: Bearer sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PANTS-002",
    "inventory": 1,
    "type": "subtract",
    "reason": "sold"
  }'
```

### 4️⃣ Node.js Example

```javascript
const updateInventory = async (sku, inventory) => {
  const response = await fetch('https://yourstore.quickshop.co.il/api/webhooks/inventory', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.QUICKSHOP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sku,
      inventory,
      type: 'set',
      reason: 'sync',
    }),
  });

  const data = await response.json();
  
  if (data.success) {
    console.log(`✅ Inventory updated: ${data.newInventory}`);
    if (data.waitlistNotified) {
      console.log('📧 Waitlist customers were notified');
    }
  } else {
    console.error(`❌ Error: ${data.error}`);
  }
};
```

### 5️⃣ Python Example

```python
import requests

def update_inventory(sku, inventory, reason='restock'):
    url = 'https://yourstore.quickshop.co.il/api/webhooks/inventory'
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {
        'sku': sku,
        'inventory': inventory,
        'type': 'set',
        'reason': reason
    }
    
    response = requests.post(url, json=payload, headers=headers)
    data = response.json()
    
    if data['success']:
        print(f"✅ Inventory updated: {data['newInventory']}")
        if data.get('waitlistNotified'):
            print('📧 Waitlist customers notified')
    else:
        print(f"❌ Error: {data['error']}")

# Usage
update_inventory('SHIRT-001', 50)
```

---

## ✅ תגובה מוצלחת (Success Response)

```json
{
  "success": true,
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "variantId": null,
  "previousInventory": 0,
  "newInventory": 50,
  "waitlistNotified": true
}
```

### שדות בתגובה

| שדה | סוג | תיאור |
|-----|-----|-------|
| `success` | boolean | האם הפעולה הצליחה |
| `productId` | string | מזהה המוצר שעודכן |
| `variantId` | string\|null | מזהה הוריאנט (או null למוצר פשוט) |
| `previousInventory` | number | מלאי לפני העדכון |
| `newInventory` | number | מלאי אחרי העדכון |
| `waitlistNotified` | boolean | האם נשלחו התראות לרשימת המתנה |

---

## ❌ שגיאות (Error Responses)

### 401 Unauthorized - API Key לא תקין

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

### 400 Bad Request - פרמטרים חסרים

```json
{
  "success": false,
  "error": "Either sku or productId is required"
}
```

### 404 Not Found - מוצר לא נמצא

```json
{
  "success": false,
  "error": "Product not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 🔔 רשימת המתנה (Waitlist Integration)

כאשר המלאי חוזר מ-**0 למעל 0**, המערכת:

1. ✅ בודקת אם יש לקוחות ברשימת המתנה למוצר
2. ✅ אם **שליחה אוטומטית** מופעלת בהגדרות
3. ✅ שולחת מיילים אוטומטית לכל הממתינים
4. ✅ מעדכנת `waitlistNotified: true` בתגובה

### הגדרת שליחה אוטומטית

עבור אל: **ניהול** → **רשימת המתנה** → **הגדרות**

- ☑️ **שליחה אוטומטית** - שלח מיילים אוטומטית כשהמלאי חוזר
- 🔢 **סף מינימלי** - שלח רק אם יש לפחות X ממתינים

---

## 🚀 שימושים נפוצים

### 1. סנכרון עם מערכת ERP

```javascript
// כל 5 דקות - סנכרן מלאי מה-ERP
setInterval(async () => {
  const erpProducts = await getProductsFromERP();
  
  for (const product of erpProducts) {
    await updateInventory(product.sku, product.inventory);
  }
}, 5 * 60 * 1000);
```

### 2. עדכון אוטומטי מספק

```python
# Webhook מהספק כשמשלוח מגיע
@app.route('/supplier/webhook', methods=['POST'])
def supplier_webhook():
    data = request.json
    
    for item in data['items']:
        update_inventory(
            sku=item['sku'],
            inventory=item['quantity'],
            reason='supplier_delivery'
        )
    
    return {'status': 'ok'}
```

### 3. סנכרון עם מחסן פיזי

```javascript
// מערכת ברקוד - כל סריקה מעדכנת מלאי
const onBarcodeScanned = async (barcode, action) => {
  await updateInventory({
    sku: barcode,
    inventory: 1,
    type: action === 'add' ? 'add' : 'subtract',
    reason: 'warehouse_scan'
  });
};
```

---

## 🔒 אבטחה (Security)

- ✅ **API Key** שמור בצורה מאובטחת (לא לשתף בקוד פומבי)
- ✅ השתמש ב-**HTTPS** בלבד
- ✅ סובב (Rotate) את ה-API Key מדי פעם
- ✅ הגבל גישה ל-IP ספציפיים (בהגדרות)
- ✅ עקוב אחרי לוגים ל-API calls חשודים

---

## 📊 Monitoring & Logs

כל עדכון מלאי דרך ה-Webhook נרשם ב:

- **ניהול** → **מוצרים** → **ניהול מלאי** → **היסטוריה**
- מופיע עם התווית: **API Webhook**
- כולל סיבה (`reason`) ותאריך

---

## 🆘 תמיכה

שאלות? בעיות? צור קשר:
- 📧 support@quickshop.co.il
- 💬 צ'אט בחנות: quickshop.co.il/support




