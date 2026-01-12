-- Add custom_monthly_price to store_subscriptions
-- מאפשר מחיר חודשי מותאם אישית לכל חנות בנפרד

ALTER TABLE store_subscriptions 
ADD COLUMN IF NOT EXISTS custom_monthly_price NUMERIC(10, 2);

COMMENT ON COLUMN store_subscriptions.custom_monthly_price IS 'מחיר חודשי מותאם אישית (אופציונלי) - אם NULL משתמש במחיר הדיפולטי מההגדרות';

