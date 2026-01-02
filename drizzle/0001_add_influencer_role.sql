ALTER TYPE "public"."store_role" ADD VALUE 'influencer';--> statement-breakpoint
CREATE TABLE "draft_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"customer_email" varchar(255),
	"customer_name" varchar(255),
	"customer_phone" varchar(50),
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"discount" numeric(10, 2) DEFAULT '0',
	"shipping" numeric(10, 2) DEFAULT '0',
	"tax" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0',
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"order_id" uuid,
	"completed_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "influencer_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"influencer_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_sales" numeric(10, 2) NOT NULL,
	"total_orders" integer NOT NULL,
	"total_refunds" numeric(10, 2) DEFAULT '0',
	"gross_commission" numeric(10, 2) NOT NULL,
	"net_commission" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"payment_method" varchar(50),
	"payment_reference" varchar(255),
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "influencer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"influencer_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "influencer_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate" numeric(5, 3) NOT NULL,
	"country" varchar(2),
	"region" varchar(100),
	"include_in_price" boolean DEFAULT true,
	"apply_to_shipping" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "influencers" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "influencer_sales" ADD COLUMN "refund_amount" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "influencer_sales" ADD COLUMN "net_commission" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "influencer_sales" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "automatic_discount_id" uuid;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "total_refunds" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "draft_orders" ADD CONSTRAINT "draft_orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_orders" ADD CONSTRAINT "draft_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_orders" ADD CONSTRAINT "draft_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_orders" ADD CONSTRAINT "draft_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_payouts" ADD CONSTRAINT "influencer_payouts_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_payouts" ADD CONSTRAINT "influencer_payouts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_payouts" ADD CONSTRAINT "influencer_payouts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_sessions" ADD CONSTRAINT "influencer_sessions_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_draft_orders_store" ON "draft_orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_draft_orders_customer" ON "draft_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_influencer_payouts_influencer" ON "influencer_payouts" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "idx_influencer_payouts_store" ON "influencer_payouts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_influencer_payouts_status" ON "influencer_payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_influencer_sessions_influencer" ON "influencer_sessions" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "idx_influencer_sessions_token" ON "influencer_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_tax_rates_store" ON "tax_rates" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_tax_rates_country" ON "tax_rates" USING btree ("store_id","country");--> statement-breakpoint
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_automatic_discount_id_automatic_discounts_id_fk" FOREIGN KEY ("automatic_discount_id") REFERENCES "public"."automatic_discounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_influencer_sales_status" ON "influencer_sales" USING btree ("influencer_id","status");--> statement-breakpoint
CREATE INDEX "idx_influencers_user" ON "influencers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_influencers_email" ON "influencers" USING btree ("store_id","email");