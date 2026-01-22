-- CRM Plugin Migration
-- Adds support for: customer tags, CRM notes, CRM tasks, and order creator tracking

-- 1. Add createdByUserId to orders (for tracking who created the order, e.g., POS agent)
ALTER TABLE "orders" ADD COLUMN "created_by_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL;
CREATE INDEX "idx_orders_created_by" ON "orders" ("created_by_user_id");

-- 2. Add tags to customers (JSONB array of tag IDs)
ALTER TABLE "customers" ADD COLUMN "tags" JSONB DEFAULT '[]';

-- 3. Add CRM tags definition to stores (store-specific tag definitions)
-- Array of { id: string, label: string, color: string, isDefault?: boolean }
ALTER TABLE "stores" ADD COLUMN "crm_tags" JSONB DEFAULT '[]';

-- 4. Create CRM Notes table
CREATE TABLE "crm_notes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" UUID NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "customer_id" UUID NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX "idx_crm_notes_store" ON "crm_notes" ("store_id");
CREATE INDEX "idx_crm_notes_customer" ON "crm_notes" ("customer_id");

-- 5. Create CRM Tasks table
CREATE TYPE "crm_task_priority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "crm_task_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE "crm_tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_id" UUID NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
  "customer_id" UUID REFERENCES "customers"("id") ON DELETE SET NULL,
  "order_id" UUID REFERENCES "orders"("id") ON DELETE SET NULL,
  "assigned_to" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "due_date" TIMESTAMP,
  "priority" "crm_task_priority" DEFAULT 'medium' NOT NULL,
  "status" "crm_task_status" DEFAULT 'pending' NOT NULL,
  "completed_at" TIMESTAMP,
  "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX "idx_crm_tasks_store" ON "crm_tasks" ("store_id");
CREATE INDEX "idx_crm_tasks_customer" ON "crm_tasks" ("customer_id");
CREATE INDEX "idx_crm_tasks_order" ON "crm_tasks" ("order_id");
CREATE INDEX "idx_crm_tasks_assigned" ON "crm_tasks" ("assigned_to");
CREATE INDEX "idx_crm_tasks_status" ON "crm_tasks" ("store_id", "status");
CREATE INDEX "idx_crm_tasks_due_date" ON "crm_tasks" ("store_id", "due_date");

