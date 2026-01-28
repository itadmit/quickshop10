-- ============================================
-- Email Packages System (חבילות דיוור)
-- מאפשר לחייב חנויות על שליחת מיילים מאוטומציות
-- ============================================

-- Enum for email subscription status
CREATE TYPE email_subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'expired');

-- Add email_package to invoice types
ALTER TYPE platform_invoice_type ADD VALUE IF NOT EXISTS 'email_package';

-- ============================================
-- Email Packages - הגדרות החבילות
-- ============================================
CREATE TABLE email_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  
  -- Package info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Limits
  monthly_emails INTEGER NOT NULL,
  
  -- Pricing (before VAT)
  monthly_price DECIMAL(10, 2) NOT NULL,
  
  -- Display
  icon VARCHAR(10),
  sort_order INTEGER DEFAULT 0 NOT NULL,
  is_popular BOOLEAN DEFAULT false NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_email_packages_slug ON email_packages(slug);
CREATE INDEX idx_email_packages_active ON email_packages(is_active);

-- ============================================
-- Store Email Subscriptions - מנוי דיוור לכל חנות
-- ============================================
CREATE TABLE store_email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  package_slug VARCHAR(50) NOT NULL,
  
  -- Status
  status email_subscription_status DEFAULT 'active' NOT NULL,
  
  -- Current period
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  
  -- Usage tracking
  emails_used_this_period INTEGER DEFAULT 0 NOT NULL,
  emails_limit INTEGER NOT NULL,
  
  -- Billing
  last_billing_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  
  -- Metadata
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_store_email_subscriptions_store ON store_email_subscriptions(store_id);
CREATE INDEX idx_store_email_subscriptions_status ON store_email_subscriptions(status);
CREATE INDEX idx_store_email_subscriptions_next_billing ON store_email_subscriptions(next_billing_date);

-- ============================================
-- Store Email Logs - לוג שליחות מיילים
-- ============================================
CREATE TABLE store_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
  
  -- Email details
  recipient_email VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  subject VARCHAR(500),
  
  -- Status
  status VARCHAR(20) DEFAULT 'sent' NOT NULL,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  -- Period tracking
  billing_period_start TIMESTAMP,
  billing_period_end TIMESTAMP,
  
  sent_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_store_email_logs_store ON store_email_logs(store_id);
CREATE INDEX idx_store_email_logs_automation ON store_email_logs(automation_id);
CREATE INDEX idx_store_email_logs_sent_at ON store_email_logs(sent_at);
CREATE INDEX idx_store_email_logs_period ON store_email_logs(store_id, billing_period_start, billing_period_end);

-- ============================================
-- Insert default packages
-- ============================================
INSERT INTO email_packages (slug, name, description, monthly_emails, monthly_price, icon, sort_order, is_popular) VALUES
  ('starter', '🐣 Starter', 'מושלם לחנויות קטנות שמתחילות עם אוטומציות', 500, 29.00, '🐣', 1, false),
  ('basic', '📈 Basic', 'לחנויות עם תעבורה בינונית', 1000, 49.00, '📈', 2, false),
  ('growth', '🚀 Growth', 'לחנויות בצמיחה עם הרבה לקוחות', 5000, 149.00, '🚀', 3, true),
  ('pro', '💼 Pro', 'לחנויות גדולות עם אוטומציות מרובות', 10000, 249.00, '💼', 4, false),
  ('scale', '📊 Scale', 'לחנויות ענק עם נפח מיילים גבוה', 25000, 499.00, '📊', 5, false);

