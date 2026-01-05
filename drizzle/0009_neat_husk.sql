CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "influencers" ALTER COLUMN "commission_value" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "automatic_discounts" ADD COLUMN "usage_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "show_commission" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "show_customer_names" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "show_order_details" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_product_categories_unique" ON "product_categories" USING btree ("product_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_product_categories_product" ON "product_categories" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_categories_category" ON "product_categories" USING btree ("category_id");