-- Add visibility settings to influencers table
-- These settings are managed by store admin, not the influencer

-- Remove default from commission_value (makes it optional)
ALTER TABLE "influencers" ALTER COLUMN "commission_value" DROP DEFAULT;

-- Add visibility settings columns
ALTER TABLE "influencers" ADD COLUMN "show_commission" boolean DEFAULT true NOT NULL;
ALTER TABLE "influencers" ADD COLUMN "show_customer_names" boolean DEFAULT true NOT NULL;
ALTER TABLE "influencers" ADD COLUMN "show_order_details" boolean DEFAULT true NOT NULL;



