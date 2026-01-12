-- Add index for fast video card lookup (displayAsCard + mediaType)
-- Per REQUIREMENTS.md: "מהיר כמו PHP" - optimized queries
CREATE INDEX IF NOT EXISTS "idx_product_images_video_card" 
ON "product_images" ("product_id", "display_as_card", "media_type");

