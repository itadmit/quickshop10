-- Add option display type enum
CREATE TYPE "option_display_type" AS ENUM ('button', 'color', 'pattern', 'image');

-- Add display_type column to product_options
ALTER TABLE "product_options" ADD COLUMN IF NOT EXISTS "display_type" option_display_type DEFAULT 'button' NOT NULL;

-- Add metadata column to product_option_values
ALTER TABLE "product_option_values" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}';

-- Add allow_backorder column to product_variants
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "allow_backorder" boolean DEFAULT false NOT NULL;

