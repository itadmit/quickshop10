-- Migration: Add Localization Support
-- Adds multi-language support to stores with performance-first approach:
-- - Only active when store has multiple locales
-- - Hebrew-only stores have ZERO overhead

-- ============================================
-- 1. Add locale fields to stores table
-- ============================================

-- Default locale for the store (what the store was created in)
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS default_locale VARCHAR(5) DEFAULT 'he' NOT NULL;

-- List of supported locales (Hebrew by default, can add more)
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS supported_locales VARCHAR(5)[] DEFAULT ARRAY['he']::VARCHAR(5)[];

-- Whether store has customized Hebrew strings (changed "הוסף לסל" to "הוסף לעגלה")
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS has_custom_translations BOOLEAN DEFAULT false NOT NULL;

-- ============================================
-- 2. Create store_translations table
-- ============================================
-- Stores UI string overrides per locale
-- Only created when store adds additional languages or customizes Hebrew

CREATE TABLE IF NOT EXISTS store_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  
  -- UI strings (checkout, cart, product, general, etc.)
  -- Structure matches UITranslations type
  ui_strings JSONB DEFAULT '{}' NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- One translation record per locale per store
  UNIQUE(store_id, locale)
);

-- Fast lookup index
CREATE INDEX IF NOT EXISTS idx_store_translations_lookup 
  ON store_translations(store_id, locale);

-- ============================================
-- 3. Create content_translations table
-- ============================================
-- Stores translations for products, categories, pages, etc.
-- Only used when store has multiple locales

CREATE TABLE IF NOT EXISTS content_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- What entity is being translated
  entity_type VARCHAR(50) NOT NULL,  -- 'product', 'category', 'page', 'menu_item', 'collection'
  entity_id UUID NOT NULL,
  locale VARCHAR(5) NOT NULL,
  
  -- The translated fields (flexible structure)
  -- Product: { "name": "...", "description": "...", "shortDescription": "..." }
  -- Category: { "name": "...", "description": "..." }
  -- Page: { "title": "...", "content": "..." }
  translations JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- One translation per entity per locale
  UNIQUE(store_id, entity_type, entity_id, locale)
);

-- Fast lookup for single entity translation
CREATE INDEX IF NOT EXISTS idx_content_translations_lookup 
  ON content_translations(store_id, entity_type, entity_id, locale);

-- Index for fetching all translations of an entity type (e.g., all product translations)
CREATE INDEX IF NOT EXISTS idx_content_translations_type 
  ON content_translations(store_id, entity_type, locale);

-- ============================================
-- 4. Comments for documentation
-- ============================================

COMMENT ON COLUMN stores.default_locale IS 'Primary language of the store (he, en, ar, ru)';
COMMENT ON COLUMN stores.supported_locales IS 'Array of supported locales. Hebrew-only = ARRAY[he]';
COMMENT ON COLUMN stores.has_custom_translations IS 'True if store customized default Hebrew strings';

COMMENT ON TABLE store_translations IS 'UI string overrides per store per locale. Only created when needed.';
COMMENT ON TABLE content_translations IS 'Product/category/page translations. Only used for multi-language stores.';

