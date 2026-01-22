-- Add custom order statuses support
-- Allows stores to define their own workflow statuses (e.g., "הועבר למתפרה", "בתפירה", "בהכנה")

-- Add customOrderStatuses to stores (array of {id, name, color})
ALTER TABLE "stores" ADD COLUMN "custom_order_statuses" jsonb DEFAULT '[]'::jsonb;

-- Add customStatus to orders (references store's custom status id)
ALTER TABLE "orders" ADD COLUMN "custom_status" varchar(50);

