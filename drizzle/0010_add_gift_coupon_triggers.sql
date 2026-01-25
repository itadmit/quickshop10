-- Add minimum_quantity and trigger_coupon_codes to discounts table
-- for gift_product type coupons with quantity conditions and coupon triggers

-- Add minimum_quantity column (for gift product conditions)
ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "minimum_quantity" integer;

-- Add trigger_coupon_codes column (array of coupon codes that trigger this gift)
-- When any of these coupon codes is applied, this gift product coupon is automatically activated
ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "trigger_coupon_codes" jsonb DEFAULT '[]';





