ALTER TABLE "media" ADD COLUMN "public_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "archived_at" timestamp;