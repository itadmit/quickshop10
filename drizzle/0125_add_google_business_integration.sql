-- Google Business Profile Integration
-- Stores OAuth tokens and business info for each store

CREATE TABLE IF NOT EXISTS "store_google_business" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  
  -- OAuth Tokens
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "token_expires_at" timestamp NOT NULL,
  "scope" text,
  
  -- Google Business Info
  "account_id" text NOT NULL,           -- Google account ID (accounts/{accountId})
  "location_id" text NOT NULL,          -- Google location ID (locations/{locationId})
  "business_name" text,
  "business_address" text,
  "business_phone" text,
  "business_website" text,
  "place_id" text,                      -- Google Place ID for reviews link
  
  -- Cached Stats
  "average_rating" decimal(2,1),        -- e.g., 4.5
  "total_reviews" integer DEFAULT 0,
  "last_synced_at" timestamp,           -- Last time reviews were fetched
  
  -- Timestamps
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  -- Unique constraint - one integration per store
  CONSTRAINT "store_google_business_store_id_unique" UNIQUE("store_id")
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS "store_google_business_store_id_idx" ON "store_google_business"("store_id");

-- Cached reviews table (to avoid hitting API limits)
CREATE TABLE IF NOT EXISTS "store_google_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "integration_id" uuid NOT NULL REFERENCES "store_google_business"("id") ON DELETE CASCADE,
  
  -- Review data from Google
  "google_review_id" text NOT NULL,     -- Unique ID from Google
  "author_name" text NOT NULL,
  "author_photo_url" text,
  "rating" integer NOT NULL,            -- 1-5 stars
  "comment" text,
  "relative_time" text,                 -- "2 weeks ago" etc.
  "review_time" timestamp,              -- Actual review timestamp
  "review_reply" text,                  -- Owner's reply
  "reply_time" timestamp,
  
  -- Display settings
  "is_visible" boolean DEFAULT true,    -- Allow hiding specific reviews
  "display_order" integer DEFAULT 0,    -- Custom ordering
  
  -- Timestamps
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  
  -- Unique constraint - one review per store
  CONSTRAINT "store_google_reviews_unique" UNIQUE("store_id", "google_review_id")
);

-- Index for fetching reviews
CREATE INDEX IF NOT EXISTS "store_google_reviews_store_id_idx" ON "store_google_reviews"("store_id");
CREATE INDEX IF NOT EXISTS "store_google_reviews_integration_id_idx" ON "store_google_reviews"("integration_id");

