/**
 * Migration script for Automations tables
 * Run: npx tsx scripts/migrate-automations.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = neon(databaseUrl);
  const db = drizzle(client);

  console.log('Running automations migration...');

  try {
    // Create enums
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE automation_trigger_type AS ENUM (
          'order.created',
          'order.paid',
          'order.fulfilled',
          'order.cancelled',
          'customer.created',
          'customer.updated',
          'customer.tag_added',
          'customer.tag_removed',
          'product.low_stock',
          'product.out_of_stock',
          'cart.abandoned',
          'schedule.daily',
          'schedule.weekly'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Created automation_trigger_type enum');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE automation_action_type AS ENUM (
          'send_email',
          'send_sms',
          'change_order_status',
          'add_customer_tag',
          'remove_customer_tag',
          'update_marketing_consent',
          'webhook_call',
          'crm.create_task',
          'crm.add_note'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Created automation_action_type enum');

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE automation_run_status AS ENUM (
          'pending',
          'scheduled',
          'running',
          'completed',
          'failed',
          'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Created automation_run_status enum');

    // Create automations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger_type automation_trigger_type NOT NULL,
        trigger_conditions JSONB DEFAULT '{}' NOT NULL,
        action_type automation_action_type NOT NULL,
        action_config JSONB DEFAULT '{}' NOT NULL,
        delay_minutes INTEGER DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        is_built_in BOOLEAN DEFAULT false NOT NULL,
        total_runs INTEGER DEFAULT 0 NOT NULL,
        total_successes INTEGER DEFAULT 0 NOT NULL,
        total_failures INTEGER DEFAULT 0 NOT NULL,
        last_run_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✓ Created automations table');

    // Create automation_runs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS automation_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        trigger_event_id UUID REFERENCES store_events(id) ON DELETE SET NULL,
        trigger_data JSONB DEFAULT '{}' NOT NULL,
        resource_id UUID,
        resource_type VARCHAR(50),
        status automation_run_status DEFAULT 'pending' NOT NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        result JSONB,
        error TEXT,
        scheduled_for TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✓ Created automation_runs table');

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_automations_store ON automations(store_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_automations_store_trigger ON automations(store_id, trigger_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_automations_active ON automations(store_id, is_active)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs(automation_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_automation_runs_store ON automation_runs(store_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_automation_runs_scheduled ON automation_runs(scheduled_for)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_automation_runs_created ON automation_runs(created_at)`);
    console.log('✓ Created indexes');

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

