-- Add product_categories table for many-to-many relationship
CREATE TABLE IF NOT EXISTS "product_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS "idx_product_categories_unique" ON "product_categories" ("product_id", "category_id");
CREATE INDEX IF NOT EXISTS "idx_product_categories_product" ON "product_categories" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_categories_category" ON "product_categories" ("category_id");

-- Migrate existing categoryId data to the new table
INSERT INTO "product_categories" ("product_id", "category_id")
SELECT "id", "category_id" FROM "products" WHERE "category_id" IS NOT NULL
ON CONFLICT DO NOTHING;



