-- Add utm_source field to orders table for traffic source filtering
-- This allows filtering orders by their traffic source (google, facebook, instagram, etc.)

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON orders(store_id, utm_source);








