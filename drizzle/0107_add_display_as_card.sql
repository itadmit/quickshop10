-- Add displayAsCard field to product_images for video card display
-- When true, video thumbnail will be shown in category pages and homepage product sections

ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "display_as_card" boolean DEFAULT false NOT NULL;








