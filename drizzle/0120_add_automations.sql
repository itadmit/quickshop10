-- Automations System
-- Allows stores to create "if this then that" automation rules
-- Built-in automations (like abandoned cart recovery) come pre-configured

-- Trigger types enum
CREATE TYPE automation_trigger_type AS ENUM (
  -- Order events
  'order.created',
  'order.paid',
  'order.fulfilled',
  'order.cancelled',
  -- Customer events
  'customer.created',
  'customer.updated',
  'customer.tag_added',
  'customer.tag_removed',
  -- Product events
  'product.low_stock',
  'product.out_of_stock',
  -- Cart events
  'cart.abandoned',
  -- Time-based
  'schedule.daily',
  'schedule.weekly'
);

-- Action types enum
-- CORE ACTIONS - available to all stores
-- CRM ACTIONS - only available with CRM plugin
CREATE TYPE automation_action_type AS ENUM (
  -- Core system actions (available to all)
  'send_email',
  'send_sms',
  'change_order_status',
  'add_customer_tag',
  'remove_customer_tag',
  'update_marketing_consent',
  'webhook_call',
  -- CRM Plugin actions (require CRM plugin)
  'crm.create_task',
  'crm.add_note'
);

-- Automations table
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger configuration
  trigger_type automation_trigger_type NOT NULL,
  trigger_conditions JSONB DEFAULT '{}' NOT NULL, -- e.g., { "minOrderTotal": 100 }
  
  -- Action configuration
  action_type automation_action_type NOT NULL,
  action_config JSONB DEFAULT '{}' NOT NULL, -- e.g., { "template": "abandoned_cart", "delay": 60 }
  
  -- Timing
  delay_minutes INTEGER DEFAULT 0 NOT NULL, -- delay before executing action
  
  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_built_in BOOLEAN DEFAULT false NOT NULL, -- true for system automations like abandoned cart
  
  -- Stats
  total_runs INTEGER DEFAULT 0 NOT NULL,
  total_successes INTEGER DEFAULT 0 NOT NULL,
  total_failures INTEGER DEFAULT 0 NOT NULL,
  last_run_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Automation runs log (for debugging and analytics)
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Trigger info
  trigger_event_id UUID REFERENCES store_events(id) ON DELETE SET NULL,
  trigger_data JSONB DEFAULT '{}' NOT NULL, -- snapshot of trigger data
  
  -- Target info
  resource_id UUID, -- order_id, customer_id, etc.
  resource_type VARCHAR(50), -- 'order', 'customer', etc.
  
  -- Execution
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, running, completed, failed, cancelled
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Result
  result JSONB, -- { success: true, emailSent: true, ... }
  error TEXT,
  
  -- Scheduling (for delayed automations)
  scheduled_for TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX idx_automations_store ON automations(store_id);
CREATE INDEX idx_automations_store_trigger ON automations(store_id, trigger_type) WHERE is_active = true;
CREATE INDEX idx_automations_active ON automations(store_id, is_active);

CREATE INDEX idx_automation_runs_automation ON automation_runs(automation_id);
CREATE INDEX idx_automation_runs_store ON automation_runs(store_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status) WHERE status IN ('pending', 'running');
CREATE INDEX idx_automation_runs_scheduled ON automation_runs(scheduled_for) WHERE status = 'pending' AND scheduled_for IS NOT NULL;
CREATE INDEX idx_automation_runs_created ON automation_runs(created_at);

-- ============ BUILT-IN ABANDONED CART AUTOMATION ============
-- This function creates the default abandoned cart automation for new stores
-- Called when a store is created or when they enable the feature

CREATE OR REPLACE FUNCTION create_default_abandoned_cart_automation(p_store_id UUID)
RETURNS UUID AS $$
DECLARE
  v_automation_id UUID;
BEGIN
  -- Check if already exists
  SELECT id INTO v_automation_id
  FROM automations
  WHERE store_id = p_store_id
    AND trigger_type = 'cart.abandoned'
    AND is_built_in = true
  LIMIT 1;
  
  IF v_automation_id IS NOT NULL THEN
    RETURN v_automation_id;
  END IF;
  
  -- Create default abandoned cart automation
  INSERT INTO automations (
    store_id,
    name,
    description,
    trigger_type,
    trigger_conditions,
    action_type,
    action_config,
    delay_minutes,
    is_active,
    is_built_in
  ) VALUES (
    p_store_id,
    'שחזור עגלות נטושות',
    'שליחת אימייל אוטומטית ללקוחות שנטשו את העגלה',
    'cart.abandoned',
    '{"minCartValue": 0}'::jsonb,
    'send_email',
    '{"template": "abandoned_cart", "subject": "שכחת משהו? הפריטים שלך עדיין בעגלה 🛒"}'::jsonb,
    60, -- 60 minutes delay
    false, -- disabled by default, user enables it
    true
  ) RETURNING id INTO v_automation_id;
  
  RETURN v_automation_id;
END;
$$ LANGUAGE plpgsql;

