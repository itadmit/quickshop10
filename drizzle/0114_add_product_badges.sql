-- Product Badges (מדבקות למוצרים)
CREATE TABLE IF NOT EXISTS "product_badges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  
  -- Content
  "name" varchar(50) NOT NULL,
  "text" varchar(30) NOT NULL,
  
  -- Styling
  "background_color" varchar(20) DEFAULT '#000000' NOT NULL,
  "text_color" varchar(20) DEFAULT '#FFFFFF' NOT NULL,
  "position" varchar(20) DEFAULT 'top-right' NOT NULL,
  
  -- Auto-apply rules
  "applies_to" varchar(20) DEFAULT 'manual' NOT NULL,
  "category_ids" uuid[] DEFAULT '{}',
  "new_product_days" integer DEFAULT 14,
  
  -- Meta
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Badge assignments to products (for manual badges)
CREATE TABLE IF NOT EXISTS "product_badge_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "badge_id" uuid NOT NULL REFERENCES "product_badges"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_product_badges_store" ON "product_badges" ("store_id");
CREATE INDEX IF NOT EXISTS "idx_badge_assignments_product" ON "product_badge_assignments" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_badge_assignments_badge" ON "product_badge_assignments" ("badge_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_badge_assignments_unique" ON "product_badge_assignments" ("product_id", "badge_id");

