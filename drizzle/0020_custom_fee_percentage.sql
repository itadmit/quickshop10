CREATE TABLE "help_guide_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "help_guide_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "help_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_number" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_link" varchar(500);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "display_as_card" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "store_subscriptions" ADD COLUMN "custom_fee_percentage" numeric(5, 4);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "product_page_sections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "help_guides" ADD CONSTRAINT "help_guides_category_id_help_guide_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."help_guide_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_product_images_video_card" ON "product_images" USING btree ("product_id","display_as_card","media_type");