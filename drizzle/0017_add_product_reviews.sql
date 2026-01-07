-- Product Reviews Plugin Tables

-- Product Reviews (ביקורות מוצרים)
CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
  "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE SET NULL,
  
  "rating" integer NOT NULL,
  "title" varchar(255),
  "content" text,
  "pros" text,
  "cons" text,
  
  "is_verified_purchase" boolean DEFAULT false NOT NULL,
  "badges" text[] DEFAULT '{}',
  "is_approved" boolean DEFAULT false NOT NULL,
  "is_featured" boolean DEFAULT false NOT NULL,
  
  "admin_reply" text,
  "admin_reply_at" timestamp,
  "admin_reply_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  
  "helpful_count" integer DEFAULT 0 NOT NULL,
  "not_helpful_count" integer DEFAULT 0 NOT NULL,
  
  "customer_name" varchar(100),
  "customer_email" varchar(255),
  
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  CONSTRAINT "rating_range" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- Review Media (תמונות/וידאו)
CREATE TABLE IF NOT EXISTS "review_media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "review_id" uuid NOT NULL REFERENCES "product_reviews"("id") ON DELETE CASCADE,
  "type" varchar(10) NOT NULL,
  "url" varchar(500) NOT NULL,
  "thumbnail_url" varchar(500),
  "public_id" varchar(255),
  "width" integer,
  "height" integer,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Review Votes (הצבעות "מועיל")
CREATE TABLE IF NOT EXISTS "review_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "review_id" uuid NOT NULL REFERENCES "product_reviews"("id") ON DELETE CASCADE,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
  "session_id" varchar(100),
  "is_helpful" boolean NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Product Review Summary (Denormalized for O(1) lookups)
CREATE TABLE IF NOT EXISTS "product_review_summary" (
  "product_id" uuid PRIMARY KEY REFERENCES "products"("id") ON DELETE CASCADE,
  "total_reviews" integer DEFAULT 0 NOT NULL,
  "average_rating" numeric(2, 1) DEFAULT '0' NOT NULL,
  "rating_1_count" integer DEFAULT 0 NOT NULL,
  "rating_2_count" integer DEFAULT 0 NOT NULL,
  "rating_3_count" integer DEFAULT 0 NOT NULL,
  "rating_4_count" integer DEFAULT 0 NOT NULL,
  "rating_5_count" integer DEFAULT 0 NOT NULL,
  "with_media_count" integer DEFAULT 0 NOT NULL,
  "verified_count" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_reviews_store_product" ON "product_reviews" ("store_id", "product_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_customer" ON "product_reviews" ("customer_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_approved" ON "product_reviews" ("store_id", "is_approved");
CREATE INDEX IF NOT EXISTS "idx_review_media_review" ON "review_media" ("review_id");
CREATE INDEX IF NOT EXISTS "idx_review_votes_review" ON "review_votes" ("review_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_review_votes_unique" ON "review_votes" ("review_id", "customer_id") WHERE "customer_id" IS NOT NULL;

