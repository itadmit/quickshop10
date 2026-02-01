-- Payment Providers Migration
-- Add support for modular payment gateway integration

-- Enums for payment system
DO $$ BEGIN
    CREATE TYPE "payment_provider" AS ENUM('payplus', 'placard', 'quick_payments');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "payment_transaction_type" AS ENUM('charge', 'refund', 'void', 'authorization');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "payment_transaction_status" AS ENUM('pending', 'processing', 'success', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment providers configuration per store
CREATE TABLE IF NOT EXISTS "payment_providers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
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

-- Payment transactions log
CREATE TABLE IF NOT EXISTS "payment_transactions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
    "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
    "provider_id" uuid REFERENCES "payment_providers"("id") ON DELETE SET NULL,
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

-- Pending payments (for redirect flow)
CREATE TABLE IF NOT EXISTS "pending_payments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "store_id" uuid NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "provider" "payment_provider" NOT NULL,
    "provider_request_id" varchar(255) NOT NULL,
    "order_data" jsonb NOT NULL,
    "cart_items" jsonb NOT NULL,
    "customer_email" varchar(255),
    "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
    "amount" numeric(10, 2) NOT NULL,
    "currency" varchar(3) DEFAULT 'ILS' NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "discount_code" varchar(50),
    "discount_amount" numeric(10, 2) DEFAULT '0',
    "influencer_id" uuid REFERENCES "influencers"("id") ON DELETE SET NULL,
    "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
    "transaction_id" uuid,
    "expires_at" timestamp NOT NULL,
    "completed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for payment_providers
CREATE UNIQUE INDEX IF NOT EXISTS "idx_payment_providers_store_provider" ON "payment_providers" ("store_id", "provider");
CREATE INDEX IF NOT EXISTS "idx_payment_providers_store" ON "payment_providers" ("store_id");

-- Indexes for payment_transactions
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_store" ON "payment_transactions" ("store_id");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_order" ON "payment_transactions" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_provider_tx" ON "payment_transactions" ("provider_transaction_id");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_provider_req" ON "payment_transactions" ("provider_request_id");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_status" ON "payment_transactions" ("store_id", "status");
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_created" ON "payment_transactions" ("store_id", "created_at");

-- Indexes for pending_payments
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pending_payments_provider_req" ON "pending_payments" ("provider_request_id");
CREATE INDEX IF NOT EXISTS "idx_pending_payments_store" ON "pending_payments" ("store_id");
CREATE INDEX IF NOT EXISTS "idx_pending_payments_status" ON "pending_payments" ("status");
CREATE INDEX IF NOT EXISTS "idx_pending_payments_expires" ON "pending_payments" ("expires_at");











