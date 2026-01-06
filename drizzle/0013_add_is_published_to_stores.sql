ALTER TABLE "automatic_discounts" ADD COLUMN "get_discount_percent" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "get_discount_percent" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "minimum_quantity" integer;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "trigger_coupon_codes" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "discount_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;