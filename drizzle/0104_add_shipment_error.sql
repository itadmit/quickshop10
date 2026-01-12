-- Add shipment error tracking to orders table
-- This tracks auto-send failures so merchants can see which orders failed to send

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_error_at TIMESTAMP;

-- Index for finding orders with shipment errors
CREATE INDEX IF NOT EXISTS idx_orders_shipment_error ON orders(store_id) WHERE shipment_error IS NOT NULL;

