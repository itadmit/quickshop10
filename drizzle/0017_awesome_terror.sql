CREATE TYPE "public"."loyalty_progression_type" AS ENUM('total_spent', 'total_orders', 'points_earned');--> statement-breakpoint
CREATE TYPE "public"."loyalty_transaction_type" AS ENUM('earn', 'redeem', 'expire', 'adjust', 'bonus', 'refund');--> statement-breakpoint
CREATE TABLE "loyalty_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"contact_id" uuid,
	"current_tier_id" uuid,
	"total_points_earned" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_points_redeemed" numeric(12, 2) DEFAULT '0' NOT NULL,
	"current_points" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_spent_qualifying" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_orders_qualifying" integer DEFAULT 0 NOT NULL,
	"tier_updated_at" timestamp DEFAULT now() NOT NULL,
	"points_expire_at" timestamp,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"name" varchar(255) DEFAULT 'מועדון לקוחות' NOT NULL,
	"points_enabled" boolean DEFAULT true NOT NULL,
	"points_per_ils" numeric(10, 2) DEFAULT '1' NOT NULL,
	"points_redemption_rate" numeric(10, 4) DEFAULT '0.1' NOT NULL,
	"min_points_to_redeem" integer DEFAULT 100 NOT NULL,
	"points_expire_days" integer,
	"progression_type" "loyalty_progression_type" DEFAULT 'total_spent' NOT NULL,
	"show_progress_bar" boolean DEFAULT true NOT NULL,
	"show_points_in_header" boolean DEFAULT true NOT NULL,
	"welcome_bonus" integer DEFAULT 0 NOT NULL,
	"birthday_bonus" integer DEFAULT 0 NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_tier_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"tier_price" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"level" integer NOT NULL,
	"color" varchar(7) DEFAULT '#CD7F32' NOT NULL,
	"icon" varchar(50),
	"min_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"points_multiplier" numeric(3, 2) DEFAULT '1.0' NOT NULL,
	"discount_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"free_shipping_threshold" numeric(10, 2),
	"description" text,
	"benefits_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"type" "loyalty_transaction_type" NOT NULL,
	"points" numeric(12, 2) NOT NULL,
	"order_id" uuid,
	"discount_id" uuid,
	"description" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "loyalty_members" ADD CONSTRAINT "loyalty_members_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_members" ADD CONSTRAINT "loyalty_members_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_members" ADD CONSTRAINT "loyalty_members_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_members" ADD CONSTRAINT "loyalty_members_current_tier_id_loyalty_tiers_id_fk" FOREIGN KEY ("current_tier_id") REFERENCES "public"."loyalty_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_tier_products" ADD CONSTRAINT "loyalty_tier_products_tier_id_loyalty_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."loyalty_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_tier_products" ADD CONSTRAINT "loyalty_tier_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_tiers" ADD CONSTRAINT "loyalty_tiers_program_id_loyalty_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."loyalty_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_member_id_loyalty_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."loyalty_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_members_store_customer_idx" ON "loyalty_members" USING btree ("store_id","customer_id");--> statement-breakpoint
CREATE INDEX "loyalty_members_store_contact_idx" ON "loyalty_members" USING btree ("store_id","contact_id");--> statement-breakpoint
CREATE INDEX "loyalty_members_store_idx" ON "loyalty_members" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "loyalty_members_tier_idx" ON "loyalty_members" USING btree ("current_tier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_programs_store_idx" ON "loyalty_programs" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_tier_products_unique_idx" ON "loyalty_tier_products" USING btree ("tier_id","product_id");--> statement-breakpoint
CREATE INDEX "loyalty_tier_products_tier_idx" ON "loyalty_tier_products" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "loyalty_tier_products_product_idx" ON "loyalty_tier_products" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_tiers_program_level_idx" ON "loyalty_tiers" USING btree ("program_id","level");--> statement-breakpoint
CREATE INDEX "loyalty_tiers_program_idx" ON "loyalty_tiers" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "loyalty_transactions_member_idx" ON "loyalty_transactions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "loyalty_transactions_order_idx" ON "loyalty_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "loyalty_transactions_type_idx" ON "loyalty_transactions" USING btree ("member_id","type");--> statement-breakpoint
CREATE INDEX "loyalty_transactions_created_idx" ON "loyalty_transactions" USING btree ("member_id","created_at");