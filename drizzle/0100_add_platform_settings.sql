-- Platform Settings - הגדרות פלטפורמה (מחירים, עמלות וכו')
-- This table stores configurable platform settings that can be managed by super admin

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description VARCHAR(500),
  category VARCHAR(50) DEFAULT 'general' NOT NULL,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON platform_settings(category);

-- Insert default settings
INSERT INTO platform_settings (key, value, description, category) VALUES
  -- Subscription Pricing
  ('subscription_branding_price', '299', 'מחיר מסלול תדמית (לפני מע"מ)', 'subscription'),
  ('subscription_quickshop_price', '399', 'מחיר מסלול קוויק שופ (לפני מע"מ)', 'subscription'),
  ('subscription_trial_days', '7', 'ימי נסיון', 'subscription'),
  
  -- Transaction Fees
  ('transaction_fee_rate', '0.005', 'אחוז עמלת עסקאות (0.5% = 0.005)', 'fees'),
  
  -- VAT
  ('vat_rate', '0.18', 'אחוז מע"מ (18% = 0.18)', 'fees')
ON CONFLICT (key) DO NOTHING;

-- Update plugin_pricing table with any missing plugins from registry
INSERT INTO plugin_pricing (plugin_slug, monthly_price, trial_days, is_active) VALUES
  ('product-stories', 39.90, 14, true),
  ('smart-advisor', 49.90, 14, true),
  ('wheel-of-fortune', 29.90, 14, true),
  ('scratch-card', 29.90, 14, true),
  ('loyalty-program', 79.90, 14, true),
  ('product-reviews', 49.90, 14, true)
ON CONFLICT (plugin_slug) DO NOTHING;

