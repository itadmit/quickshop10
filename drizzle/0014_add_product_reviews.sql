CREATE TYPE "public"."gamification_prize_type" AS ENUM('coupon_percentage', 'coupon_fixed', 'free_shipping', 'gift_product', 'extra_spin', 'no_prize');--> statement-breakpoint
CREATE TYPE "public"."gamification_type" AS ENUM('wheel', 'scratch');--> statement-breakpoint
CREATE TYPE "public"."mobile_platform" AS ENUM('ios', 'android');--> statement-breakpoint
CREATE TYPE "public"."platform_invoice_status" AS ENUM('draft', 'pending', 'paid', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."platform_invoice_type" AS ENUM('subscription', 'transaction_fee', 'plugin');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'past_due', 'cancelled', 'expired');--> statement-breakpoint
ALTER TYPE "public"."store_plan" ADD VALUE 'trial';--> statement-breakpoint
ALTER TYPE "public"."store_plan" ADD VALUE 'branding';--> statement-breakpoint
ALTER TYPE "public"."store_plan" ADD VALUE 'quickshop';--> statement-breakpoint
CREATE TABLE "api_key_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"method" varchar(10) NOT NULL,
	"endpoint" varchar(500) NOT NULL,
	"status_code" integer NOT NULL,
	"response_time_ms" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"key_prefix" varchar(10) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"last_four" varchar(4) NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rate_limit" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"description" text,
	"allowed_ips" jsonb,
	"allowed_origins" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamification_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "gamification_type" NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"title" varchar(255) DEFAULT 'נסה את מזלך!' NOT NULL,
	"subtitle" varchar(500),
	"button_text" varchar(100) DEFAULT 'סובב עכשיו' NOT NULL,
	"primary_color" varchar(7) DEFAULT '#e91e63' NOT NULL,
	"secondary_color" varchar(7) DEFAULT '#9c27b0' NOT NULL,
	"background_color" varchar(7) DEFAULT '#ffffff' NOT NULL,
	"text_color" varchar(7) DEFAULT '#333333' NOT NULL,
	"collect_name" boolean DEFAULT true NOT NULL,
	"collect_email" boolean DEFAULT true NOT NULL,
	"collect_phone" boolean DEFAULT true NOT NULL,
	"collect_birthday" boolean DEFAULT false NOT NULL,
	"require_marketing_consent" boolean DEFAULT true NOT NULL,
	"require_privacy_consent" boolean DEFAULT true NOT NULL,
	"privacy_policy_url" varchar(500),
	"terms_url" varchar(500),
	"max_plays_per_email" integer DEFAULT 1 NOT NULL,
	"max_plays_per_day" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"trigger" "popup_trigger" DEFAULT 'on_load' NOT NULL,
	"trigger_value" integer DEFAULT 3,
	"frequency" "popup_frequency" DEFAULT 'once' NOT NULL,
	"frequency_days" integer DEFAULT 7,
	"target_pages" "popup_target" DEFAULT 'all' NOT NULL,
	"custom_target_urls" jsonb DEFAULT '[]'::jsonb,
	"show_on_desktop" boolean DEFAULT true NOT NULL,
	"show_on_mobile" boolean DEFAULT true NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"plays" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamification_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"phone" varchar(20),
	"birthday" date,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"privacy_consent" boolean DEFAULT false NOT NULL,
	"customer_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamification_prizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "gamification_prize_type" NOT NULL,
	"value" numeric(10, 2),
	"gift_product_id" uuid,
	"color" varchar(7) DEFAULT '#FF6B6B' NOT NULL,
	"icon" varchar(50),
	"probability" numeric(5, 2) NOT NULL,
	"total_available" integer,
	"total_won" integer DEFAULT 0 NOT NULL,
	"coupon_prefix" varchar(20),
	"coupon_valid_days" integer DEFAULT 30,
	"coupon_min_purchase" numeric(10, 2),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamification_wins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"prize_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"coupon_code" varchar(50),
	"discount_id" uuid,
	"is_claimed" boolean DEFAULT false NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"order_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mobile_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid,
	"device_id" varchar(255) NOT NULL,
	"push_token" varchar(500),
	"platform" "mobile_platform" NOT NULL,
	"app_version" varchar(50),
	"os_version" varchar(50),
	"device_name" varchar(255),
	"session_token" varchar(255) NOT NULL,
	"refresh_token" varchar(255),
	"expires_at" timestamp NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"notify_new_orders" boolean DEFAULT true NOT NULL,
	"notify_low_stock" boolean DEFAULT true NOT NULL,
	"notify_returns" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mobile_devices_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "mobile_devices_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "platform_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" varchar(500) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"subscription_id" uuid,
	"invoice_number" varchar(50) NOT NULL,
	"type" "platform_invoice_type" NOT NULL,
	"status" "platform_invoice_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(5, 2) DEFAULT '18' NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"description" text,
	"payplus_transaction_uid" varchar(255),
	"payplus_invoice_number" varchar(100),
	"payplus_invoice_url" varchar(500),
	"charge_attempts" integer DEFAULT 0 NOT NULL,
	"last_charge_attempt" timestamp,
	"last_charge_error" text,
	"issued_at" timestamp,
	"due_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "plugin_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_slug" varchar(100) NOT NULL,
	"monthly_price" numeric(10, 2) NOT NULL,
	"trial_days" integer DEFAULT 14,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plugin_pricing_plugin_slug_unique" UNIQUE("plugin_slug")
);
--> statement-breakpoint
CREATE TABLE "product_review_summary" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(2, 1) DEFAULT '0' NOT NULL,
	"rating_1_count" integer DEFAULT 0 NOT NULL,
	"rating_2_count" integer DEFAULT 0 NOT NULL,
	"rating_3_count" integer DEFAULT 0 NOT NULL,
	"rating_4_count" integer DEFAULT 0 NOT NULL,
	"rating_5_count" integer DEFAULT 0 NOT NULL,
	"with_media_count" integer DEFAULT 0 NOT NULL,
	"verified_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_id" uuid,
	"variant_id" uuid,
	"rating" integer NOT NULL,
	"title" varchar(255),
	"content" text,
	"pros" text,
	"cons" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"badges" text[] DEFAULT '{}',
	"is_approved" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"admin_reply" text,
	"admin_reply_at" timestamp,
	"admin_reply_by" uuid,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"not_helpful_count" integer DEFAULT 0 NOT NULL,
	"customer_name" varchar(100),
	"customer_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"type" varchar(10) NOT NULL,
	"url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"public_id" varchar(255),
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"customer_id" uuid,
	"session_id" varchar(100),
	"is_helpful" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"plan" "store_plan" DEFAULT 'trial' NOT NULL,
	"status" "subscription_status" DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"payplus_customer_uid" varchar(255),
	"payplus_token_uid" varchar(255),
	"card_last_four" varchar(4),
	"card_brand" varchar(50),
	"card_expiry" varchar(7),
	"billing_email" varchar(255),
	"billing_name" varchar(255),
	"billing_phone" varchar(50),
	"billing_address" jsonb,
	"vat_number" varchar(50),
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_subscriptions_store_id_unique" UNIQUE("store_id")
);
--> statement-breakpoint
CREATE TABLE "store_transaction_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_transactions_amount" numeric(12, 2) NOT NULL,
	"total_transactions_count" integer DEFAULT 0 NOT NULL,
	"fee_percentage" numeric(5, 4) DEFAULT '0.005' NOT NULL,
	"fee_amount" numeric(10, 2) NOT NULL,
	"invoice_id" uuid,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"order_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_categories" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "api_key_logs" ADD CONSTRAINT "api_key_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_logs" ADD CONSTRAINT "api_key_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_campaigns" ADD CONSTRAINT "gamification_campaigns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_entries" ADD CONSTRAINT "gamification_entries_campaign_id_gamification_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."gamification_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_entries" ADD CONSTRAINT "gamification_entries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_entries" ADD CONSTRAINT "gamification_entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_prizes" ADD CONSTRAINT "gamification_prizes_campaign_id_gamification_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."gamification_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_prizes" ADD CONSTRAINT "gamification_prizes_gift_product_id_products_id_fk" FOREIGN KEY ("gift_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_wins" ADD CONSTRAINT "gamification_wins_entry_id_gamification_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."gamification_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_wins" ADD CONSTRAINT "gamification_wins_prize_id_gamification_prizes_id_fk" FOREIGN KEY ("prize_id") REFERENCES "public"."gamification_prizes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_wins" ADD CONSTRAINT "gamification_wins_campaign_id_gamification_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."gamification_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_wins" ADD CONSTRAINT "gamification_wins_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamification_wins" ADD CONSTRAINT "gamification_wins_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_devices" ADD CONSTRAINT "mobile_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_devices" ADD CONSTRAINT "mobile_devices_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_invoice_items" ADD CONSTRAINT "platform_invoice_items_invoice_id_platform_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."platform_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_subscription_id_store_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."store_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_review_summary" ADD CONSTRAINT "product_review_summary_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_admin_reply_by_users_id_fk" FOREIGN KEY ("admin_reply_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_media" ADD CONSTRAINT "review_media_review_id_product_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."product_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_product_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."product_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_transaction_fees" ADD CONSTRAINT "store_transaction_fees_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_transaction_fees" ADD CONSTRAINT "store_transaction_fees_invoice_id_platform_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."platform_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_key_logs_key" ON "api_key_logs" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "idx_api_key_logs_store" ON "api_key_logs" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_api_key_logs_created" ON "api_key_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_api_keys_store" ON "api_keys" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_hash" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "gamification_campaign_store_idx" ON "gamification_campaigns" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "gamification_campaign_active_idx" ON "gamification_campaigns" USING btree ("store_id","is_active");--> statement-breakpoint
CREATE INDEX "gamification_entry_campaign_idx" ON "gamification_entries" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "gamification_entry_email_idx" ON "gamification_entries" USING btree ("campaign_id","email");--> statement-breakpoint
CREATE INDEX "gamification_entry_store_idx" ON "gamification_entries" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "gamification_prize_campaign_idx" ON "gamification_prizes" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "gamification_prize_sort_idx" ON "gamification_prizes" USING btree ("campaign_id","sort_order");--> statement-breakpoint
CREATE INDEX "gamification_win_entry_idx" ON "gamification_wins" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "gamification_win_prize_idx" ON "gamification_wins" USING btree ("prize_id");--> statement-breakpoint
CREATE INDEX "gamification_win_campaign_idx" ON "gamification_wins" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gamification_win_coupon_idx" ON "gamification_wins" USING btree ("coupon_code");--> statement-breakpoint
CREATE INDEX "idx_mobile_devices_user" ON "mobile_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mobile_devices_store" ON "mobile_devices" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_mobile_devices_token" ON "mobile_devices" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_mobile_devices_push" ON "mobile_devices" USING btree ("push_token");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_mobile_devices_user_device" ON "mobile_devices" USING btree ("user_id","device_id");--> statement-breakpoint
CREATE INDEX "idx_platform_invoice_items_invoice" ON "platform_invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_platform_invoices_store" ON "platform_invoices" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_platform_invoices_status" ON "platform_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_platform_invoices_type" ON "platform_invoices" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_platform_invoices_created" ON "platform_invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_plugin_pricing_slug" ON "plugin_pricing" USING btree ("plugin_slug");--> statement-breakpoint
CREATE INDEX "idx_reviews_store_product" ON "product_reviews" USING btree ("store_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_customer" ON "product_reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_approved" ON "product_reviews" USING btree ("store_id","is_approved");--> statement-breakpoint
CREATE INDEX "idx_review_media_review" ON "review_media" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "idx_review_votes_review" ON "review_votes" USING btree ("review_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_review_votes_unique" ON "review_votes" USING btree ("review_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_store_subscriptions_store" ON "store_subscriptions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_store_subscriptions_status" ON "store_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_store_transaction_fees_store" ON "store_transaction_fees" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_store_transaction_fees_period" ON "store_transaction_fees" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_store_transaction_fees_unique_period" ON "store_transaction_fees" USING btree ("store_id","period_start","period_end");