-- Category Addon Assignments - Links addons to categories (all products in category get these addons)
CREATE TABLE "category_addon_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "addon_id" uuid NOT NULL REFERENCES "product_addons"("id") ON DELETE CASCADE,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_required" boolean,
  "price_override" decimal(10, 2)
);

-- Indexes
CREATE INDEX "idx_category_addon_assignments_category" ON "category_addon_assignments" ("category_id");
CREATE INDEX "idx_category_addon_assignments_addon" ON "category_addon_assignments" ("addon_id");
CREATE UNIQUE INDEX "idx_category_addon_assignments_unique" ON "category_addon_assignments" ("category_id", "addon_id");

