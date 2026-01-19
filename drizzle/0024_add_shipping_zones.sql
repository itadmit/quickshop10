-- Shipping Zones & Methods Migration
-- Creates tables for advanced shipping configuration

-- Create shipping method type enum
DO $$ BEGIN
 CREATE TYPE "shipping_method_type" AS ENUM('flat_rate', 'free', 'weight_based', 'price_based', 'local_pickup');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Shipping Zones table
CREATE TABLE IF NOT EXISTS "shipping_zones" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "store_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "countries" jsonb DEFAULT '[]' NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Shipping Methods table
CREATE TABLE IF NOT EXISTS "shipping_methods" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "zone_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "type" "shipping_method_type" NOT NULL,
    "price" numeric(10, 2) DEFAULT '0' NOT NULL,
    "conditions" jsonb DEFAULT '{}',
    "estimated_days" varchar(100),
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Pickup Locations table
CREATE TABLE IF NOT EXISTS "pickup_locations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "store_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "address" text NOT NULL,
    "city" varchar(100) NOT NULL,
    "phone" varchar(50),
    "hours" varchar(255),
    "instructions" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Foreign key constraints
DO $$ BEGIN
 ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "pickup_locations" ADD CONSTRAINT "pickup_locations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_shipping_zones_store" ON "shipping_zones" ("store_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipping_methods_zone" ON "shipping_methods" ("zone_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pickup_locations_store" ON "pickup_locations" ("store_id");



