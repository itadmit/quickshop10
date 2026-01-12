CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shipping_provider" AS ENUM('focus', 'cheetah', 'hfd', 'boxit', 'baldar', 'manual');--> statement-breakpoint
ALTER TYPE "public"."popup_type" ADD VALUE 'combined';--> statement-breakpoint
ALTER TYPE "public"."section_type" ADD VALUE 'contact' BEFORE 'hero_slider';--> statement-breakpoint
CREATE TABLE "page_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"thumbnail_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" varchar(500),
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" "shipping_provider" NOT NULL,
	"provider_shipment_id" varchar(100),
	"tracking_number" varchar(100),
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"status_description" text,
	"label_url" text,
	"recipient_name" varchar(255),
	"recipient_phone" varchar(50),
	"recipient_address" jsonb,
	"package_weight" numeric(6, 2),
	"package_dimensions" jsonb,
	"estimated_delivery" timestamp,
	"actual_delivery" timestamp,
	"picked_up_at" timestamp,
	"tracking_events" jsonb DEFAULT '[]'::jsonb,
	"provider_response" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"provider" "shipping_provider" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"display_name" varchar(100),
	"test_mode" boolean DEFAULT true NOT NULL,
	"credentials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_providers" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payment_transactions" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pending_payments" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_provider";--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('payplus', 'pelecard', 'quick_payments');--> statement-breakpoint
ALTER TABLE "payment_providers" ALTER COLUMN "provider" SET DATA TYPE "public"."payment_provider" USING "provider"::"public"."payment_provider";--> statement-breakpoint
ALTER TABLE "payment_transactions" ALTER COLUMN "provider" SET DATA TYPE "public"."payment_provider" USING "provider"::"public"."payment_provider";--> statement-breakpoint
ALTER TABLE "pending_payments" ALTER COLUMN "provider" SET DATA TYPE "public"."payment_provider" USING "provider"::"public"."payment_provider";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "hide_out_of_stock" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "move_out_of_stock_to_bottom" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "activates_coupon_codes" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipment_error" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipment_error_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_source" varchar(100);--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "sections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "media_type" "media_type" DEFAULT 'image' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "thumbnail_url" varchar(500);--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "store_subscriptions" ADD COLUMN "custom_monthly_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "home_sections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "coming_soon_sections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "page_templates" ADD CONSTRAINT "page_templates_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_providers" ADD CONSTRAINT "shipping_providers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_page_templates_store" ON "page_templates" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_platform_settings_key" ON "platform_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_platform_settings_category" ON "platform_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_shipments_store" ON "shipments" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_shipments_order" ON "shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_shipments_tracking" ON "shipments" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX "idx_shipments_status" ON "shipments" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "idx_shipping_providers_store" ON "shipping_providers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_shipping_providers_active" ON "shipping_providers" USING btree ("store_id","is_active");