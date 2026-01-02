CREATE TYPE "public"."analytics_event_type" AS ENUM('page_view', 'product_view', 'category_view', 'search', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase');--> statement-breakpoint
CREATE TYPE "public"."credit_transaction_type" AS ENUM('credit', 'debit', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('desktop', 'mobile', 'tablet');--> statement-breakpoint
CREATE TYPE "public"."discount_applies_to" AS ENUM('all', 'category', 'product', 'member');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('order.created', 'order.paid', 'order.fulfilled', 'order.cancelled', 'customer.created', 'customer.updated', 'product.low_stock', 'product.out_of_stock', 'discount.used');--> statement-breakpoint
CREATE TYPE "public"."financial_status" AS ENUM('pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('unfulfilled', 'partial', 'fulfilled');--> statement-breakpoint
CREATE TYPE "public"."gift_card_status" AS ENUM('active', 'used', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."menu_link_type" AS ENUM('url', 'page', 'category', 'product');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('new_order', 'low_stock', 'out_of_stock', 'new_customer', 'order_cancelled', 'system');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."section_type" AS ENUM('hero', 'banner', 'split_banner', 'video_banner', 'categories', 'products', 'newsletter', 'custom');--> statement-breakpoint
CREATE TYPE "public"."store_plan" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."store_role" AS ENUM('owner', 'manager', 'marketing', 'developer');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'merchant');--> statement-breakpoint
CREATE TABLE "abandoned_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"customer_id" uuid,
	"email" varchar(255),
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"checkout_step" varchar(50),
	"recovery_token" varchar(100),
	"reminder_sent_at" timestamp,
	"reminder_count" integer DEFAULT 0,
	"recovered_at" timestamp,
	"recovered_order_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "abandoned_carts_recovery_token_unique" UNIQUE("recovery_token")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" integer,
	"token_type" varchar(50),
	"scope" varchar(255),
	"id_token" text
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" uuid,
	"description" text,
	"changes" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"customer_id" uuid,
	"event_type" "analytics_event_type" NOT NULL,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(255),
	"utm_content" varchar(255),
	"utm_term" varchar(255),
	"referrer" varchar(500),
	"referrer_domain" varchar(255),
	"page_url" varchar(500) NOT NULL,
	"page_path" varchar(255) NOT NULL,
	"page_title" varchar(255),
	"landing_page" varchar(500),
	"product_id" uuid,
	"product_name" varchar(255),
	"category_id" uuid,
	"category_name" varchar(255),
	"order_id" uuid,
	"order_value" numeric(10, 2),
	"device_type" "device_type",
	"browser" varchar(100),
	"browser_version" varchar(50),
	"os" varchar(100),
	"os_version" varchar(50),
	"screen_width" integer,
	"screen_height" integer,
	"country" varchar(2),
	"city" varchar(100),
	"region" varchar(100),
	"time_on_page" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automatic_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"type" "discount_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"applies_to" "discount_applies_to" NOT NULL,
	"category_ids" jsonb DEFAULT '[]'::jsonb,
	"product_ids" jsonb DEFAULT '[]'::jsonb,
	"minimum_amount" numeric(10, 2),
	"minimum_quantity" integer,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"priority" integer DEFAULT 0 NOT NULL,
	"stackable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"type" "credit_transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"balance_after" numeric(10, 2) NOT NULL,
	"reason" text,
	"order_id" uuid,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(50),
	"default_address" jsonb,
	"notes" text,
	"total_orders" integer DEFAULT 0,
	"total_spent" numeric(10, 2) DEFAULT '0',
	"credit_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"accepts_marketing" boolean DEFAULT false,
	"email_verified_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" varchar(255),
	"type" "discount_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"minimum_amount" numeric(10, 2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"once_per_customer" boolean DEFAULT false NOT NULL,
	"first_order_only" boolean DEFAULT false NOT NULL,
	"stackable" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_card_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_card_id" uuid NOT NULL,
	"order_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"balance_after" numeric(10, 2) NOT NULL,
	"note" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"initial_balance" numeric(10, 2) NOT NULL,
	"current_balance" numeric(10, 2) NOT NULL,
	"status" "gift_card_status" DEFAULT 'active' NOT NULL,
	"recipient_email" varchar(255),
	"recipient_name" varchar(255),
	"sender_name" varchar(255),
	"message" text,
	"purchased_by_id" uuid,
	"purchased_order_id" uuid,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "influencer_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"influencer_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"order_total" numeric(10, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"commission_paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "influencers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"instagram_handle" varchar(100),
	"instagram_followers" integer,
	"tiktok_handle" varchar(100),
	"tiktok_followers" integer,
	"youtube_channel" varchar(100),
	"youtube_subscribers" integer,
	"commission_type" "discount_type" DEFAULT 'percentage',
	"commission_value" numeric(10, 2) DEFAULT '10',
	"coupon_code" varchar(50),
	"discount_id" uuid,
	"total_sales" numeric(10, 2) DEFAULT '0',
	"total_commission" numeric(10, 2) DEFAULT '0',
	"total_orders" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255),
	"mime_type" varchar(100),
	"size" integer,
	"width" integer,
	"height" integer,
	"url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"alt" varchar(255),
	"folder" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" varchar(100) NOT NULL,
	"link_type" "menu_link_type" NOT NULL,
	"link_url" varchar(500),
	"link_resource_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"handle" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"resource_id" uuid,
	"resource_type" varchar(50),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"push_sent" boolean DEFAULT false,
	"push_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"name" varchar(255) NOT NULL,
	"variant_title" varchar(255),
	"sku" varchar(100),
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"image_url" varchar(500),
	"properties" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_number" varchar(50) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"financial_status" "financial_status" DEFAULT 'pending' NOT NULL,
	"fulfillment_status" "fulfillment_status" DEFAULT 'unfulfilled' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_code" varchar(50),
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"credit_used" numeric(10, 2) DEFAULT '0',
	"shipping_amount" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'ILS' NOT NULL,
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"shipping_method" varchar(100),
	"note" text,
	"internal_note" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"page" varchar(50) DEFAULT 'home' NOT NULL,
	"type" "section_type" NOT NULL,
	"title" varchar(255),
	"subtitle" varchar(500),
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"content" text,
	"template" varchar(50) DEFAULT 'default',
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"seo_title" varchar(255),
	"seo_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"alt" varchar(255),
	"sort_order" integer DEFAULT 0,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"option_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"sku" varchar(100),
	"barcode" varchar(100),
	"price" numeric(10, 2) NOT NULL,
	"compare_price" numeric(10, 2),
	"cost" numeric(10, 2),
	"inventory" integer DEFAULT 0,
	"weight" numeric(10, 3),
	"image_url" varchar(500),
	"option1" varchar(100),
	"option2" varchar(100),
	"option3" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"price" numeric(10, 2),
	"compare_price" numeric(10, 2),
	"cost" numeric(10, 2),
	"sku" varchar(100),
	"barcode" varchar(100),
	"weight" numeric(10, 3),
	"has_variants" boolean DEFAULT false NOT NULL,
	"track_inventory" boolean DEFAULT true NOT NULL,
	"inventory" integer DEFAULT 0,
	"allow_backorder" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb,
	"refund_method" varchar(50),
	"store_credits_issued" numeric(10, 2) DEFAULT '0',
	"processed_by_id" uuid,
	"processed_at" timestamp,
	"internal_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"customer_id" uuid,
	"query" varchar(255) NOT NULL,
	"results_count" integer DEFAULT 0,
	"clicked_product_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "store_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"resource_id" uuid,
	"resource_type" varchar(50),
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "store_role" DEFAULT 'manager' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"invited_by" uuid,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"custom_domain" varchar(255),
	"logo_url" varchar(500),
	"favicon_url" varchar(500),
	"currency" varchar(3) DEFAULT 'ILS' NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Jerusalem',
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"theme_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"plan" "store_plan" DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp,
	"order_counter" integer DEFAULT 1000 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "store_role" DEFAULT 'manager' NOT NULL,
	"invited_by" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"name" varchar(255),
	"phone" varchar(50),
	"avatar_url" varchar(500),
	"role" "user_role" DEFAULT 'merchant' NOT NULL,
	"email_verified_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event_id" uuid,
	"status_code" integer,
	"response_body" text,
	"error" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(500) NOT NULL,
	"secret" varchar(255),
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"headers" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp,
	"failure_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_recovered_order_id_orders_id_fk" FOREIGN KEY ("recovered_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD CONSTRAINT "automatic_discounts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_transactions" ADD CONSTRAINT "customer_credit_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_transactions" ADD CONSTRAINT "customer_credit_transactions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_transactions" ADD CONSTRAINT "customer_credit_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_transactions" ADD CONSTRAINT "customer_credit_transactions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_otp_codes" ADD CONSTRAINT "customer_otp_codes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchased_by_id_customers_id_fk" FOREIGN KEY ("purchased_by_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchased_order_id_orders_id_fk" FOREIGN KEY ("purchased_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_sales" ADD CONSTRAINT "influencer_sales_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_sales" ADD CONSTRAINT "influencer_sales_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencers" ADD CONSTRAINT "influencers_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_product_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_id_users_id_fk" FOREIGN KEY ("processed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_clicked_product_id_products_id_fk" FOREIGN KEY ("clicked_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_events" ADD CONSTRAINT "store_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_event_id_store_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."store_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_abandoned_store" ON "abandoned_carts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_abandoned_created" ON "abandoned_carts" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_abandoned_email" ON "abandoned_carts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_activity_log_store" ON "activity_log" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_user" ON "activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_log_created" ON "activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_store" ON "analytics_events" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_session" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_created" ON "analytics_events" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_event_type" ON "analytics_events" USING btree ("store_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_analytics_utm" ON "analytics_events" USING btree ("store_id","utm_source","utm_medium");--> statement-breakpoint
CREATE INDEX "idx_analytics_product" ON "analytics_events" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_automatic_discounts_store" ON "automatic_discounts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_automatic_discounts_applies_to" ON "automatic_discounts" USING btree ("store_id","applies_to");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_categories_store_slug" ON "categories" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "idx_categories_store" ON "categories" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_credit_transactions_customer" ON "customer_credit_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_credit_transactions_store" ON "customer_credit_transactions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_customer_otp_customer" ON "customer_otp_codes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_sessions_customer" ON "customer_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_sessions_token" ON "customer_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customers_store_email" ON "customers" USING btree ("store_id","email");--> statement-breakpoint
CREATE INDEX "idx_customers_store" ON "customers" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_discounts_store_code" ON "discounts" USING btree ("store_id","code");--> statement-breakpoint
CREATE INDEX "idx_discounts_store" ON "discounts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_gift_card_transactions_card" ON "gift_card_transactions" USING btree ("gift_card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_gift_cards_store_code" ON "gift_cards" USING btree ("store_id","code");--> statement-breakpoint
CREATE INDEX "idx_gift_cards_store" ON "gift_cards" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_influencer_sales_influencer" ON "influencer_sales" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "idx_influencer_sales_order" ON "influencer_sales" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_influencers_store" ON "influencers" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_influencers_coupon" ON "influencers" USING btree ("store_id","coupon_code");--> statement-breakpoint
CREATE INDEX "idx_media_store" ON "media" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_media_folder" ON "media" USING btree ("store_id","folder");--> statement-breakpoint
CREATE INDEX "idx_menu_items_menu" ON "menu_items" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "idx_menu_items_parent" ON "menu_items" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_menus_store_handle" ON "menus" USING btree ("store_id","handle");--> statement-breakpoint
CREATE INDEX "idx_menus_store" ON "menus" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_store" ON "notifications" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_unread" ON "notifications" USING btree ("store_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_store_number" ON "orders" USING btree ("store_id","order_number");--> statement-breakpoint
CREATE INDEX "idx_orders_store" ON "orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_unread" ON "orders" USING btree ("store_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_page_sections_store" ON "page_sections" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_page_sections_store_page" ON "page_sections" USING btree ("store_id","page");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pages_store_slug" ON "pages" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "idx_pages_store" ON "pages" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_product_images_product" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_option_values_option" ON "product_option_values" USING btree ("option_id");--> statement-breakpoint
CREATE INDEX "idx_product_options_product" ON "product_options" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_variants_product" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_variants_sku" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_products_store_slug" ON "products" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "idx_products_store" ON "products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_store" ON "refunds" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_order" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_refunds_created" ON "refunds" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_search_store" ON "search_queries" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_search_created" ON "search_queries" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_search_query" ON "search_queries" USING btree ("store_id","query");--> statement-breakpoint
CREATE INDEX "idx_store_events_store" ON "store_events" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_store_events_type" ON "store_events" USING btree ("store_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_store_events_created" ON "store_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_store_members_unique" ON "store_members" USING btree ("store_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_store_members_store" ON "store_members" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_store_members_user" ON "store_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_stores_custom_domain" ON "stores" USING btree ("custom_domain");--> statement-breakpoint
CREATE INDEX "idx_team_invitations_store" ON "team_invitations" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_team_invitations_email" ON "team_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_webhook" ON "webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "idx_webhooks_store" ON "webhooks" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_webhooks_active" ON "webhooks" USING btree ("store_id","is_active");