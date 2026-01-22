-- Add discount_details column to orders table
-- This stores detailed breakdown of all discounts applied to an order
-- Array of objects: { type, code, name, description, amount }

ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_details JSONB;

-- Add comment for documentation
COMMENT ON COLUMN orders.discount_details IS 'Detailed breakdown of discounts: [{type: coupon|auto|gift_card|credit|member, code?: string, name: string, description?: string, amount: number}]';




