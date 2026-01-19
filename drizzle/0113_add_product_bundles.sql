-- Product Bundles Migration
-- Allows products to be composed of other products (like Shopify Bundles)

-- Enum for bundle type
DO $$ BEGIN
  CREATE TYPE bundle_type AS ENUM ('fixed', 'mix_match');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum for bundle pricing type
DO $$ BEGIN
  CREATE TYPE bundle_pricing_type AS ENUM ('fixed', 'calculated', 'discount_percentage', 'discount_fixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add is_bundle column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false NOT NULL;

-- Main bundle settings table
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Bundle type
  bundle_type bundle_type NOT NULL DEFAULT 'fixed',
  
  -- Mix & Match settings
  min_selections INTEGER DEFAULT 1,
  max_selections INTEGER,
  
  -- Pricing
  pricing_type bundle_pricing_type NOT NULL DEFAULT 'fixed',
  discount_value DECIMAL(10,2),
  
  -- Display settings
  show_components_in_cart BOOLEAN DEFAULT true NOT NULL,
  show_components_on_page BOOLEAN DEFAULT true NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_bundle_per_product UNIQUE (product_id)
);

-- Bundle components table - products that make up the bundle
CREATE TABLE IF NOT EXISTS bundle_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  
  -- The component product
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  
  -- Quantity of this component in the bundle
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Mix & Match options
  is_default BOOLEAN DEFAULT true NOT NULL,
  is_required BOOLEAN DEFAULT false NOT NULL,
  
  -- Optional price override for this component
  price_override DECIMAL(10,2),
  
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_bundles_product ON product_bundles(product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_components_bundle ON bundle_components(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_components_product ON bundle_components(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bundle_component_unique ON bundle_components(bundle_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Index on products for bundle filtering
CREATE INDEX IF NOT EXISTS idx_products_is_bundle ON products(store_id, is_bundle) WHERE is_bundle = true;

