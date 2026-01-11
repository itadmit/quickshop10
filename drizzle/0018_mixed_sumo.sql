CREATE TYPE "public"."addon_field_type" AS ENUM('text', 'select', 'checkbox', 'radio', 'date');--> statement-breakpoint
CREATE TYPE "public"."option_display_type" AS ENUM('button', 'color', 'pattern', 'image');--> statement-breakpoint
CREATE TYPE "public"."shipping_method_type" AS ENUM('flat_rate', 'free', 'weight_based', 'price_based', 'local_pickup');--> statement-breakpoint
CREATE TABLE "inventory_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"previous_quantity" integer NOT NULL,
	"new_quantity" integer NOT NULL,
	"change_amount" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"note" varchar(255),
	"order_id" uuid,
	"changed_by_user_id" uuid,
	"changed_by_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"phone" varchar(50),
	"hours" varchar(255),
	"instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_addon_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_required" boolean,
	"price_override" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "product_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"field_type" "addon_field_type" NOT NULL,
	"placeholder" varchar(255),
	"options" jsonb DEFAULT '[]'::jsonb,
	"price_adjustment" numeric(10, 2) DEFAULT '0',
	"is_required" boolean DEFAULT false NOT NULL,
	"max_length" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"phone" varchar(50),
	"notified_at" timestamp,
	"is_notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "shipping_method_type" NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb,
	"estimated_days" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advisor_answers" ADD COLUMN "total_selections" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_details" jsonb;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "product_options" ADD COLUMN "display_type" "option_display_type" DEFAULT 'button' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "allow_backorder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "upsell_product_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_locations" ADD CONSTRAINT "pickup_locations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addon_assignments" ADD CONSTRAINT "product_addon_assignments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addon_assignments" ADD CONSTRAINT "product_addon_assignments_addon_id_product_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."product_addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_waitlist" ADD CONSTRAINT "product_waitlist_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_waitlist" ADD CONSTRAINT "product_waitlist_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_waitlist" ADD CONSTRAINT "product_waitlist_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_inventory_logs_product" ON "inventory_logs" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_logs_variant" ON "inventory_logs" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_logs_store" ON "inventory_logs" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_logs_created" ON "inventory_logs" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pickup_locations_store" ON "pickup_locations" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_addon_assignments_product" ON "product_addon_assignments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_addon_assignments_addon" ON "product_addon_assignments" USING btree ("addon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_addon_assignments_unique" ON "product_addon_assignments" USING btree ("product_id","addon_id");--> statement-breakpoint
CREATE INDEX "idx_product_addons_store" ON "product_addons" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_waitlist_product" ON "product_waitlist" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_waitlist_variant" ON "product_waitlist" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_waitlist_store" ON "product_waitlist" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_waitlist_email" ON "product_waitlist" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_waitlist_unique_product" ON "product_waitlist" USING btree ("store_id","product_id","email") WHERE variant_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_waitlist_unique_variant" ON "product_waitlist" USING btree ("store_id","variant_id","email") WHERE variant_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_shipping_methods_zone" ON "shipping_methods" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "idx_shipping_zones_store" ON "shipping_zones" USING btree ("store_id");