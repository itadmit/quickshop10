CREATE TYPE "public"."popup_frequency" AS ENUM('once', 'once_per_session', 'always', 'every_x_days');--> statement-breakpoint
CREATE TYPE "public"."popup_position" AS ENUM('center', 'bottom_right', 'bottom_left', 'full_screen');--> statement-breakpoint
CREATE TYPE "public"."popup_target" AS ENUM('all', 'homepage', 'products', 'categories', 'custom');--> statement-breakpoint
CREATE TYPE "public"."popup_trigger" AS ENUM('on_load', 'exit_intent', 'scroll', 'time_delay');--> statement-breakpoint
CREATE TYPE "public"."popup_type" AS ENUM('image', 'text', 'form');--> statement-breakpoint
CREATE TABLE "analytics_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"date" date NOT NULL,
	"page_views" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0,
	"product_views" integer DEFAULT 0 NOT NULL,
	"add_to_cart" integer DEFAULT 0 NOT NULL,
	"begin_checkout" integer DEFAULT 0 NOT NULL,
	"purchases" integer DEFAULT 0 NOT NULL,
	"revenue" numeric(10, 2) DEFAULT '0' NOT NULL,
	"orders" integer DEFAULT 0 NOT NULL,
	"desktop_views" integer DEFAULT 0,
	"mobile_views" integer DEFAULT 0,
	"tablet_views" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popup_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"popup_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"form_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"page_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "popup_type" NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"trigger" "popup_trigger" DEFAULT 'on_load' NOT NULL,
	"trigger_value" integer DEFAULT 3,
	"position" "popup_position" DEFAULT 'center' NOT NULL,
	"frequency" "popup_frequency" DEFAULT 'once' NOT NULL,
	"frequency_days" integer DEFAULT 7,
	"target_pages" "popup_target" DEFAULT 'all' NOT NULL,
	"custom_target_urls" jsonb DEFAULT '[]'::jsonb,
	"show_on_desktop" boolean DEFAULT true NOT NULL,
	"show_on_mobile" boolean DEFAULT true NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"style" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_daily" ADD CONSTRAINT "analytics_daily_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popup_submissions" ADD CONSTRAINT "popup_submissions_popup_id_popups_id_fk" FOREIGN KEY ("popup_id") REFERENCES "public"."popups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popup_submissions" ADD CONSTRAINT "popup_submissions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popup_submissions" ADD CONSTRAINT "popup_submissions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popups" ADD CONSTRAINT "popups_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analytics_daily_store" ON "analytics_daily" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_daily_date" ON "analytics_daily" USING btree ("store_id","date");--> statement-breakpoint
CREATE INDEX "popup_submission_popup_idx" ON "popup_submissions" USING btree ("popup_id");--> statement-breakpoint
CREATE INDEX "popup_submission_store_idx" ON "popup_submissions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "popup_store_idx" ON "popups" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "popup_active_idx" ON "popups" USING btree ("store_id","is_active");