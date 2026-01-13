-- Add product_page_sections column to stores table
-- This enables fully editable product pages (like home page)
-- Sections are stored as JSONB for maximum performance

ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS product_page_sections jsonb DEFAULT '[]'::jsonb NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN stores.product_page_sections IS 'Product page sections (V2) - fully editable like home page. Array of section objects with type, content, settings.';

