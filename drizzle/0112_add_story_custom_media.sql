-- Add custom media support for product stories
-- Allows uploading custom images or videos instead of using the product image

ALTER TABLE "product_stories" ADD COLUMN "custom_media_url" VARCHAR(500);
ALTER TABLE "product_stories" ADD COLUMN "custom_media_type" VARCHAR(20);

-- custom_media_type can be: 'image', 'video', or NULL (uses product image)

COMMENT ON COLUMN "product_stories"."custom_media_url" IS 'Custom image or video URL for the story (overrides product image)';
COMMENT ON COLUMN "product_stories"."custom_media_type" IS 'Type of custom media: image or video';

