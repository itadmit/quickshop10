-- Help Guide Categories
CREATE TABLE IF NOT EXISTS "help_guide_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "description" text,
  "icon" text,
  "sort_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Help Guides
CREATE TABLE IF NOT EXISTS "help_guides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid REFERENCES "help_guide_categories"("id") ON DELETE CASCADE,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "content" text NOT NULL,
  "sort_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "help_guides_category_idx" ON "help_guides"("category_id");
CREATE UNIQUE INDEX IF NOT EXISTS "help_guides_category_slug_idx" ON "help_guides"("category_id", "slug");

