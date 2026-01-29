-- Add UTM columns to orders table for traffic source tracking
-- utm_source already exists, adding the rest

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_medium" varchar(100);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_campaign" varchar(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_content" varchar(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "utm_term" varchar(255);

-- Add device type tracking
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "device_type" device_type;

-- Create indexes for reporting
CREATE INDEX IF NOT EXISTS "idx_orders_utm_full" ON "orders" ("store_id", "utm_source", "utm_medium", "utm_campaign");
CREATE INDEX IF NOT EXISTS "idx_orders_device" ON "orders" ("store_id", "device_type");

