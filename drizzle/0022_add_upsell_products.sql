-- Add upsell products field to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "upsell_product_ids" jsonb DEFAULT '[]';

