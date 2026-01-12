-- Allow influencer to have multiple discounts
-- Change discountId (single UUID) to discountIds (JSONB array)

-- Add new column for multiple discount IDs
ALTER TABLE "influencers" ADD COLUMN IF NOT EXISTS "discount_ids" jsonb DEFAULT '[]';

-- Migrate existing data: if discountId exists, put it in the array
UPDATE "influencers" 
SET "discount_ids" = CASE 
  WHEN "discount_id" IS NOT NULL THEN jsonb_build_array("discount_id"::text)
  ELSE '[]'
END
WHERE "discount_ids" = '[]' OR "discount_ids" IS NULL;

-- Note: We keep the old column for backwards compatibility, can be removed later


