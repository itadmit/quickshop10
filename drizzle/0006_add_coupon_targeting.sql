-- Add coupon targeting fields (applies to, category/product selection, exclusions)
ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "applies_to" discount_applies_to DEFAULT 'all' NOT NULL;
ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "category_ids" jsonb DEFAULT '[]';
ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "product_ids" jsonb DEFAULT '[]';
ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "exclude_category_ids" jsonb DEFAULT '[]';
ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "exclude_product_ids" jsonb DEFAULT '[]';

