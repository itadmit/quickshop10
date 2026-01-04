CREATE TYPE "public"."resolution_type" AS ENUM('exchange', 'store_credit', 'refund', 'partial_refund');--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('wrong_size', 'defective', 'not_as_described', 'changed_mind', 'wrong_item', 'damaged_shipping', 'other');--> statement-breakpoint
CREATE TYPE "public"."return_request_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'awaiting_shipment', 'item_received', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."return_request_type" AS ENUM('return', 'exchange');--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid,
	"request_number" varchar(20) NOT NULL,
	"type" "return_request_type" NOT NULL,
	"status" "return_request_status" DEFAULT 'pending' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb,
	"reason" "return_reason" NOT NULL,
	"reason_details" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"requested_resolution" "resolution_type" NOT NULL,
	"final_resolution" "resolution_type",
	"resolution_details" jsonb,
	"total_value" numeric(10, 2) NOT NULL,
	"refund_amount" numeric(10, 2),
	"credit_issued" numeric(10, 2),
	"exchange_order_id" uuid,
	"return_tracking_number" varchar(100),
	"return_carrier" varchar(50),
	"item_received_at" timestamp,
	"internal_notes" text,
	"customer_notes" text,
	"processed_by_id" uuid,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_exchange_order_id_orders_id_fk" FOREIGN KEY ("exchange_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_processed_by_id_users_id_fk" FOREIGN KEY ("processed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_return_requests_store" ON "return_requests" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_order" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_customer" ON "return_requests" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_return_requests_status" ON "return_requests" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "idx_return_requests_created" ON "return_requests" USING btree ("store_id","created_at");