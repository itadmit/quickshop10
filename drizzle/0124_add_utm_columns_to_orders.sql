-- Add UTM columns to orders table for traffic source tracking
-- utm_source already exists, adding the rest

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_medium" varchar(100);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_campaign" varchar(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_content" varchar(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_term" varchar(255);

-- Create index for UTM reporting
CREATE INDEX IF NOT EXISTS "idx_orders_utm_full" ON "orders" ("store_id", "utm_source", "utm_medium", "utm_campaign");

