-- Add get_discount_percent to discounts and automatic_discounts tables
-- For buy_x_get_y: allows setting discount percentage on the Y item (100 = free, 50 = 50% off)

-- Add to discounts table (coupons)
ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "get_discount_percent" integer DEFAULT 100;

-- Add to automatic_discounts table
ALTER TABLE "automatic_discounts" ADD COLUMN IF NOT EXISTS "get_discount_percent" integer DEFAULT 100;





