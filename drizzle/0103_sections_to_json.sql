-- ============================================
-- Migration: Move sections from separate table to JSON fields
-- This improves performance (single query) and ensures atomic operations
-- ============================================

-- Step 1: Add sections field to pages table (for internal pages)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb NOT NULL;

-- Step 2: Add home and coming_soon sections to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS home_sections jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS coming_soon_sections jsonb DEFAULT '[]'::jsonb NOT NULL;

-- Step 3: Migrate data from page_sections to the new JSON fields

-- 3a: Migrate internal pages sections (pages/*)
WITH page_sections_json AS (
  SELECT 
    ps.store_id,
    SUBSTRING(ps.page FROM 7) as page_slug, -- Remove 'pages/' prefix
    jsonb_agg(
      jsonb_build_object(
        'id', ps.id,
        'type', ps.type,
        'title', ps.title,
        'subtitle', ps.subtitle,
        'content', COALESCE(ps.content, '{}'::jsonb),
        'settings', COALESCE(ps.settings, '{}'::jsonb),
        'sortOrder', ps.sort_order,
        'isActive', ps.is_active
      ) ORDER BY ps.sort_order
    ) as sections_json
  FROM page_sections ps
  WHERE ps.page LIKE 'pages/%'
  GROUP BY ps.store_id, SUBSTRING(ps.page FROM 7)
)
UPDATE pages p
SET sections = psj.sections_json
FROM page_sections_json psj
WHERE p.store_id = psj.store_id 
  AND p.slug = psj.page_slug;

-- 3b: Migrate home page sections
WITH home_sections_json AS (
  SELECT 
    ps.store_id,
    jsonb_agg(
      jsonb_build_object(
        'id', ps.id,
        'type', ps.type,
        'title', ps.title,
        'subtitle', ps.subtitle,
        'content', COALESCE(ps.content, '{}'::jsonb),
        'settings', COALESCE(ps.settings, '{}'::jsonb),
        'sortOrder', ps.sort_order,
        'isActive', ps.is_active
      ) ORDER BY ps.sort_order
    ) as sections_json
  FROM page_sections ps
  WHERE ps.page = 'home'
  GROUP BY ps.store_id
)
UPDATE stores s
SET home_sections = hsj.sections_json
FROM home_sections_json hsj
WHERE s.id = hsj.store_id;

-- 3c: Migrate coming soon page sections
WITH coming_soon_sections_json AS (
  SELECT 
    ps.store_id,
    jsonb_agg(
      jsonb_build_object(
        'id', ps.id,
        'type', ps.type,
        'title', ps.title,
        'subtitle', ps.subtitle,
        'content', COALESCE(ps.content, '{}'::jsonb),
        'settings', COALESCE(ps.settings, '{}'::jsonb),
        'sortOrder', ps.sort_order,
        'isActive', ps.is_active
      ) ORDER BY ps.sort_order
    ) as sections_json
  FROM page_sections ps
  WHERE ps.page = 'coming_soon'
  GROUP BY ps.store_id
)
UPDATE stores s
SET coming_soon_sections = cssj.sections_json
FROM coming_soon_sections_json cssj
WHERE s.id = cssj.store_id;

-- Step 4: Create indexes for JSON queries (optional, for future querying)
CREATE INDEX IF NOT EXISTS idx_pages_sections ON pages USING gin(sections);
CREATE INDEX IF NOT EXISTS idx_stores_home_sections ON stores USING gin(home_sections);

-- Note: We keep page_sections table for now as a backup
-- After verification, run: DROP TABLE page_sections;

