-- Migration: Order number assigned AFTER payment (like Shopify)
-- This change ensures order numbers are sequential by payment completion time
-- 
-- BEFORE: orderNumber assigned when checkout starts (causes out-of-order numbers)
-- AFTER: orderNumber assigned when payment succeeds (sequential by completion time)
--
-- SAFETY: Existing orders with orderNumber are NOT affected
-- Only new orders will get this behavior

-- Step 1: Make orderNumber nullable
-- PostgreSQL allows ALTER COLUMN DROP NOT NULL on columns with existing data
ALTER TABLE orders ALTER COLUMN order_number DROP NOT NULL;

-- Step 2: The unique index on (store_id, order_number) remains intact
-- In PostgreSQL, unique indexes ignore NULL values, so multiple rows
-- can have order_number = NULL without violating uniqueness
-- Only non-NULL values must be unique per store

-- Note: No data migration needed - existing orders keep their order_number
-- New orders will start with order_number = NULL until payment succeeds

