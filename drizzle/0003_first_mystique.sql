CREATE TYPE "public"."payment_provider" AS ENUM('payplus', 'placard', 'quick_payments');--> statement-breakpoint
CREATE TYPE "public"."payment_transaction_status" AS ENUM('pending', 'processing', 'success', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_transaction_type" AS ENUM('charge', 'refund', 'void', 'authorization');--> statement-breakpoint
CREATE TYPE "public"."plugin_category" AS ENUM('marketing', 'loyalty', 'analytics', 'payment', 'inventory', 'communication', 'operations', 'customization');--> statement-breakpoint
CREATE TYPE "public"."plugin_subscription_status" AS ENUM('active', 'trial', 'cancelled', 'expired', 'pending');--> statement-breakpoint
CREATE TABLE "payment_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"display_name" varchar(100),
	"test_mode" boolean DEFAULT true NOT NULL,
	"credentials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_transactions" integer DEFAULT 0 NOT NULL,
	"total_volume" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid,
	"customer_id" uuid,
	"provider_id" uuid,
	"provider" "payment_provider" NOT NULL,
	"type" "payment_transaction_type" NOT NULL,
	"status" "payment_transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'ILS' NOT NULL,
	"provider_transaction_id" varchar(255),
	"provider_request_id" varchar(255),
	"provider_approval_num" varchar(100),
	"parent_transaction_id" uuid,
	"provider_response" jsonb DEFAULT '{}'::jsonb,
	"error_code" varchar(50),
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_request_id" varchar(255) NOT NULL,
	"order_data" jsonb NOT NULL,
	"cart_items" jsonb NOT NULL,
	"customer_email" varchar(255),
	"customer_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'ILS' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"discount_code" varchar(50),
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"influencer_id" uuid,
	"order_id" uuid,
	"transaction_id" uuid,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_plugins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"plugin_slug" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"subscription_status" "plugin_subscription_status" DEFAULT 'active',
	"trial_ends_at" timestamp,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"last_billing_date" timestamp,
	"next_billing_date" timestamp,
	"cancelled_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"visitor_id" varchar(255),
	"customer_id" uuid,
	"author_name" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"visitor_id" varchar(255) NOT NULL,
	"customer_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"visitor_id" varchar(255) NOT NULL,
	"customer_id" uuid,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_email" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_details" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "influencer_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_providers" ADD CONSTRAINT "payment_providers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stories" ADD CONSTRAINT "product_stories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stories" ADD CONSTRAINT "product_stories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_plugins" ADD CONSTRAINT "store_plugins_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_comments" ADD CONSTRAINT "story_comments_story_id_product_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."product_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_comments" ADD CONSTRAINT "story_comments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_story_id_product_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."product_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_story_id_product_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."product_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payment_providers_store_provider" ON "payment_providers" USING btree ("store_id","provider");--> statement-breakpoint
CREATE INDEX "idx_payment_providers_store" ON "payment_providers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_store" ON "payment_transactions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_order" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_provider_tx" ON "payment_transactions" USING btree ("provider_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_provider_req" ON "payment_transactions" USING btree ("provider_request_id");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_status" ON "payment_transactions" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_created" ON "payment_transactions" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pending_payments_provider_req" ON "pending_payments" USING btree ("provider_request_id");--> statement-breakpoint
CREATE INDEX "idx_pending_payments_store" ON "pending_payments" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_pending_payments_status" ON "pending_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pending_payments_expires" ON "pending_payments" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "story_store_product_unique_idx" ON "product_stories" USING btree ("store_id","product_id");--> statement-breakpoint
CREATE INDEX "story_store_position_idx" ON "product_stories" USING btree ("store_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "store_plugin_unique_idx" ON "store_plugins" USING btree ("store_id","plugin_slug");--> statement-breakpoint
CREATE INDEX "store_plugin_active_idx" ON "store_plugins" USING btree ("store_id","is_active");--> statement-breakpoint
CREATE INDEX "story_comment_approved_idx" ON "story_comments" USING btree ("story_id","is_approved");--> statement-breakpoint
CREATE UNIQUE INDEX "story_like_unique_idx" ON "story_likes" USING btree ("story_id","visitor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "story_visitor_unique_idx" ON "story_views" USING btree ("story_id","visitor_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_influencer" ON "orders" USING btree ("influencer_id");