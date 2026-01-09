-- Inventory Logs table for tracking all inventory changes
CREATE TABLE IF NOT EXISTS "inventory_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE CASCADE,
  "previous_quantity" integer NOT NULL,
  "new_quantity" integer NOT NULL,
  "change_amount" integer NOT NULL,
  "reason" varchar(50) NOT NULL,
  "note" varchar(255),
  "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
  "changed_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "changed_by_name" varchar(100),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS "idx_inventory_logs_product" ON "inventory_logs" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_inventory_logs_variant" ON "inventory_logs" ("variant_id");
CREATE INDEX IF NOT EXISTS "idx_inventory_logs_store" ON "inventory_logs" ("store_id");
CREATE INDEX IF NOT EXISTS "idx_inventory_logs_created" ON "inventory_logs" ("store_id", "created_at");

