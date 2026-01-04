CREATE TYPE "public"."contact_status" AS ENUM('active', 'unsubscribed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('newsletter', 'club_member', 'contact_form', 'popup_form');--> statement-breakpoint
ALTER TYPE "public"."discount_type" ADD VALUE 'buy_x_pay_y';--> statement-breakpoint
ALTER TYPE "public"."discount_type" ADD VALUE 'buy_x_get_y';--> statement-breakpoint
ALTER TYPE "public"."discount_type" ADD VALUE 'gift_product';--> statement-breakpoint
ALTER TYPE "public"."discount_type" ADD VALUE 'quantity_discount';--> statement-breakpoint
ALTER TYPE "public"."discount_type" ADD VALUE 'spend_x_pay_y';--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone" varchar(50),
	"type" "contact_type" NOT NULL,
	"status" "contact_status" DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" varchar(100),
	"source_url" text,
	"popup_id" uuid,
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"customer_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "buy_quantity" integer;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "pay_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "get_quantity" integer;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "gift_product_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "gift_same_product" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "quantity_tiers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "spend_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "exclude_category_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "exclude_product_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "applies_to" "discount_applies_to" DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "category_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "product_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "exclude_category_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "exclude_product_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "buy_quantity" integer;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "pay_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "get_quantity" integer;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "gift_product_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "gift_same_product" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "quantity_tiers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "spend_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_popup_id_popups_id_fk" FOREIGN KEY ("popup_id") REFERENCES "public"."popups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contacts_store" ON "contacts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_contacts_store_type" ON "contacts" USING btree ("store_id","type");--> statement-breakpoint
CREATE INDEX "idx_contacts_store_email" ON "contacts" USING btree ("store_id","email");--> statement-breakpoint
CREATE INDEX "idx_contacts_unread" ON "contacts" USING btree ("store_id","is_read");