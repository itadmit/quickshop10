CREATE TYPE "public"."discount_change_action" AS ENUM('created', 'updated', 'activated', 'deactivated', 'extended', 'expired');--> statement-breakpoint
ALTER TYPE "public"."shipping_provider" ADD VALUE 'cargo' BEFORE 'cheetah';--> statement-breakpoint
CREATE TABLE "customer_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"device_token" varchar(500) NOT NULL,
	"platform" varchar(10) NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"discount_id" uuid,
	"automatic_discount_id" uuid,
	"user_id" uuid,
	"user_name" varchar(255),
	"action" "discount_change_action" NOT NULL,
	"field_name" varchar(100),
	"old_value" text,
	"new_value" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "notification_preferences" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "customer_devices" ADD CONSTRAINT "customer_devices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_changes" ADD CONSTRAINT "discount_changes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_changes" ADD CONSTRAINT "discount_changes_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_changes" ADD CONSTRAINT "discount_changes_automatic_discount_id_automatic_discounts_id_fk" FOREIGN KEY ("automatic_discount_id") REFERENCES "public"."automatic_discounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_changes" ADD CONSTRAINT "discount_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customer_devices_customer" ON "customer_devices" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customer_devices_device_id" ON "customer_devices" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_customer_devices_active" ON "customer_devices" USING btree ("customer_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_discount_changes_discount" ON "discount_changes" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "idx_discount_changes_auto_discount" ON "discount_changes" USING btree ("automatic_discount_id");--> statement-breakpoint
CREATE INDEX "idx_discount_changes_store" ON "discount_changes" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_discount_changes_created" ON "discount_changes" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD CONSTRAINT "automatic_discounts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;