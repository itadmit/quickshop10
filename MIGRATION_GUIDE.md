# Migration Guide for Mobile API

## טבלאות חדשות שנוספו

### 1. `customer_devices` - מכשירים לדחיפת התראות

```sql
CREATE TABLE customer_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  device_token VARCHAR(500) NOT NULL,
  platform VARCHAR(10) NOT NULL,
  device_id VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_devices_customer ON customer_devices(customer_id);
CREATE UNIQUE INDEX idx_customer_devices_device_id ON customer_devices(device_id);
CREATE INDEX idx_customer_devices_active ON customer_devices(customer_id, is_active);
```

### 2. שדה חדש ב-`customers` - העדפות התראות

```sql
ALTER TABLE customers 
ADD COLUMN notification_preferences JSONB DEFAULT '{}'::jsonb;
```

## הרצת Migration

### אופציה 1: Drizzle Kit (מומלץ)

```bash
# יצירת migration
npx drizzle-kit generate

# הרצת migration
npx drizzle-kit push
```

### אופציה 2: ידני דרך SQL

1. התחבר ל-Neon console
2. העתק והרץ את ה-SQL למעלה

## אימות Migration

בדוק שהטבלאות נוצרו:

```sql
-- בדוק שהטבלה קיימת
SELECT * FROM customer_devices LIMIT 1;

-- בדוק שהשדה נוסף
SELECT notification_preferences FROM customers LIMIT 1;
```

## Rollback (במקרה של צורך)

```sql
-- הסרת הטבלה
DROP TABLE IF EXISTS customer_devices CASCADE;

-- הסרת השדה
ALTER TABLE customers DROP COLUMN IF EXISTS notification_preferences;
```

## הערות חשובות

1. **Backup**: עשה backup למסד הנתונים לפני הרצת migration
2. **Testing**: בדוק על staging environment לפני production
3. **Zero Downtime**: ה-migration הזה לא משבש נתונים קיימים
4. **Indexes**: ה-indexes משפרים ביצועים עבור queries נפוצים

## שימוש ב-API החדש

לאחר ה-migration, ה-endpoints הבאים זמינים:

- `POST /api/mobile/device/register` - רישום מכשיר
- `DELETE /api/mobile/device/register?deviceId=xxx` - הסרת מכשיר
- `GET /api/mobile/notifications/preferences` - קבלת העדפות
- `PUT /api/mobile/notifications/preferences` - עדכון העדפות
