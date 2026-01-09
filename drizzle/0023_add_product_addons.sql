-- Create addon field type enum
CREATE TYPE "addon_field_type" AS ENUM ('text', 'select', 'checkbox', 'radio', 'date');

-- Product Addons - Store-level addon templates
CREATE TABLE "product_addons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "field_type" addon_field_type NOT NULL,
  "placeholder" varchar(255),
  "options" jsonb DEFAULT '[]'::jsonb,
  "price_adjustment" decimal(10, 2) DEFAULT '0',
  "is_required" boolean DEFAULT false NOT NULL,
  "max_length" integer,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Product Addon Assignments - Links addons to products
CREATE TABLE "product_addon_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "addon_id" uuid NOT NULL REFERENCES "product_addons"("id") ON DELETE CASCADE,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_required" boolean,
  "price_override" decimal(10, 2)
);

-- Indexes
CREATE INDEX "idx_product_addons_store" ON "product_addons" ("store_id");
CREATE INDEX "idx_addon_assignments_product" ON "product_addon_assignments" ("product_id");
CREATE INDEX "idx_addon_assignments_addon" ON "product_addon_assignments" ("addon_id");
CREATE UNIQUE INDEX "idx_addon_assignments_unique" ON "product_addon_assignments" ("product_id", "addon_id");

