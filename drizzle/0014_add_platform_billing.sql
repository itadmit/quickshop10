-- Platform Billing System Migration
-- מערכת חיוב פלטפורמה - מנויים, עמלות ותוספים

-- ============ ENUMS ============

-- Add new enum values to store_plan (keeping old ones for compatibility)
DO $$
BEGIN
    -- Add 'trial' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'trial' AND enumtypid = 'store_plan'::regtype) THEN
        ALTER TYPE store_plan ADD VALUE 'trial';
    END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    -- Add 'branding' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'branding' AND enumtypid = 'store_plan'::regtype) THEN
        ALTER TYPE store_plan ADD VALUE 'branding';
    END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    -- Add 'quickshop' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'quickshop' AND enumtypid = 'store_plan'::regtype) THEN
        ALTER TYPE store_plan ADD VALUE 'quickshop';
    END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create subscription_status enum
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM (
        'trial',
        'active',
        'past_due',
        'cancelled',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create platform_invoice_type enum
DO $$ BEGIN
    CREATE TYPE platform_invoice_type AS ENUM (
        'subscription',
        'transaction_fee',
        'plugin'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create platform_invoice_status enum
DO $$ BEGIN
    CREATE TYPE platform_invoice_status AS ENUM (
        'draft',
        'pending',
        'paid',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============ TABLES ============

-- Store Subscriptions - מנויים של חנויות
CREATE TABLE IF NOT EXISTS store_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Plan info
    plan store_plan NOT NULL DEFAULT 'trial',
    status subscription_status NOT NULL DEFAULT 'trial',
    
    -- Trial info
    trial_ends_at TIMESTAMP,
    
    -- Current billing period
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    
    -- PayPlus payment info
    payplus_customer_uid VARCHAR(255),
    payplus_token_uid VARCHAR(255),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    card_expiry VARCHAR(7), -- MM/YYYY
    
    -- Billing details
    billing_email VARCHAR(255),
    billing_name VARCHAR(255),
    billing_phone VARCHAR(50),
    billing_address JSONB,
    vat_number VARCHAR(50), -- ח.פ / ע.מ
    
    -- Metadata
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Platform Invoices - חשבוניות פלטפורמה
CREATE TABLE IF NOT EXISTS platform_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES store_subscriptions(id) ON DELETE SET NULL,
    
    -- Invoice details
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    type platform_invoice_type NOT NULL,
    status platform_invoice_status NOT NULL DEFAULT 'draft',
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL DEFAULT 18,
    vat_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Period
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    
    -- Description
    description TEXT,
    
    -- PayPlus transaction details
    payplus_transaction_uid VARCHAR(255),
    payplus_invoice_number VARCHAR(100),
    payplus_invoice_url VARCHAR(500),
    
    -- Payment tracking
    charge_attempts INTEGER NOT NULL DEFAULT 0,
    last_charge_attempt TIMESTAMP,
    last_charge_error TEXT,
    
    -- Dates
    issued_at TIMESTAMP,
    due_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Platform Invoice Items - פריטי חשבונית
CREATE TABLE IF NOT EXISTS platform_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES platform_invoices(id) ON DELETE CASCADE,
    
    -- Item details
    description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Reference
    reference_type VARCHAR(50),
    reference_id VARCHAR(255),
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Store Transaction Fees - סיכום עסקאות לחיוב עמלות
CREATE TABLE IF NOT EXISTS store_transaction_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Transaction summary
    total_transactions_amount DECIMAL(12,2) NOT NULL,
    total_transactions_count INTEGER NOT NULL DEFAULT 0,
    
    -- Fee calculation
    fee_percentage DECIMAL(5,4) NOT NULL DEFAULT 0.005, -- 0.5%
    fee_amount DECIMAL(10,2) NOT NULL,
    
    -- Invoice link
    invoice_id UUID REFERENCES platform_invoices(id) ON DELETE SET NULL,
    
    -- Calculation metadata
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    order_ids JSONB NOT NULL DEFAULT '[]',
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Plugin Pricing - מחירי תוספים
CREATE TABLE IF NOT EXISTS plugin_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_slug VARCHAR(100) NOT NULL UNIQUE,
    
    -- Pricing
    monthly_price DECIMAL(10,2) NOT NULL,
    
    -- Trial
    trial_days INTEGER DEFAULT 14,
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_store_subscriptions_store ON store_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_status ON store_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_platform_invoices_store ON platform_invoices(store_id);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_status ON platform_invoices(status);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_type ON platform_invoices(type);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_created ON platform_invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_platform_invoice_items_invoice ON platform_invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_store_transaction_fees_store ON store_transaction_fees(store_id);
CREATE INDEX IF NOT EXISTS idx_store_transaction_fees_period ON store_transaction_fees(period_start, period_end);
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_transaction_fees_unique_period ON store_transaction_fees(store_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_plugin_pricing_slug ON plugin_pricing(plugin_slug);

-- ============ INITIAL PLUGIN PRICING DATA ============

INSERT INTO plugin_pricing (plugin_slug, monthly_price, trial_days) VALUES
    ('smart-advisor', 99.00, 14),
    ('product-stories', 49.00, 14),
    ('whatsapp-integration', 49.00, 7),
    ('loyalty-program', 79.00, 14),
    ('advanced-analytics', 59.00, 14)
ON CONFLICT (plugin_slug) DO NOTHING;

-- ============ FUNCTION: Generate Invoice Number ============

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    next_seq INTEGER;
    result VARCHAR(50);
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)
    ), 0) + 1
    INTO next_seq
    FROM platform_invoices
    WHERE invoice_number LIKE 'QS-' || current_year || '-%';
    
    result := 'QS-' || current_year || '-' || LPAD(next_seq::TEXT, 6, '0');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============ TRIGGER: Update updated_at ============

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_store_subscriptions_updated_at ON store_subscriptions;
CREATE TRIGGER update_store_subscriptions_updated_at
    BEFORE UPDATE ON store_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_invoices_updated_at ON platform_invoices;
CREATE TRIGGER update_platform_invoices_updated_at
    BEFORE UPDATE ON platform_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plugin_pricing_updated_at ON plugin_pricing;
CREATE TRIGGER update_plugin_pricing_updated_at
    BEFORE UPDATE ON plugin_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ CREATE SUBSCRIPTIONS FOR EXISTING STORES ============

-- Create trial subscriptions for existing stores that don't have one
INSERT INTO store_subscriptions (store_id, plan, status, trial_ends_at)
SELECT 
    s.id,
    CASE 
        WHEN s.plan = 'trial' THEN 'trial'::store_plan
        WHEN s.plan = 'branding' THEN 'branding'::store_plan
        ELSE 'quickshop'::store_plan
    END,
    'trial'::subscription_status,
    NOW() + INTERVAL '7 days'
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_subscriptions ss WHERE ss.store_id = s.id
)
ON CONFLICT (store_id) DO NOTHING;

