/**
 * Setup QStash Schedules for Billing
 * 
 * Run with: npx tsx scripts/setup-billing-cron.ts
 * 
 * Creates the following schedules:
 * 1. Trial expiration check - Daily at 00:00
 * 2. Subscription renewal - Daily at 02:00
 * 3. Transaction fees - 1st and 15th of month at 03:00
 * 4. Plugin fees - 1st of month at 04:00
 */

import 'dotenv/config';

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com';

if (!QSTASH_TOKEN) {
  console.error('❌ QSTASH_TOKEN not found in environment');
  process.exit(1);
}

interface Schedule {
  name: string;
  destination: string;
  cron: string;
}

const schedules: Schedule[] = [
  {
    name: 'billing-trial-expiration',
    destination: `${APP_URL}/api/cron/billing/trial-expiration`,
    cron: '0 0 * * *', // Daily at 00:00
  },
  {
    name: 'billing-subscription-renewal',
    destination: `${APP_URL}/api/cron/billing/subscription-renewal`,
    cron: '0 2 * * *', // Daily at 02:00
  },
  {
    name: 'billing-transaction-fees',
    destination: `${APP_URL}/api/cron/billing/transaction-fees`,
    cron: '0 3 1,15 * *', // 1st and 15th of month at 03:00
  },
  {
    name: 'billing-plugin-fees',
    destination: `${APP_URL}/api/cron/billing/plugin-fees`,
    cron: '0 4 1 * *', // 1st of month at 04:00
  },
];

async function createSchedule(schedule: Schedule) {
  try {
    // QStash v2 API: POST to /v2/schedules/{destination}
    const url = `https://qstash.upstash.io/v2/schedules/${schedule.destination}`;
    console.log(`   Creating: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Upstash-Cron': schedule.cron,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create schedule: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Created schedule: ${schedule.name}`);
    console.log(`   Cron: ${schedule.cron}`);
    console.log(`   URL: ${schedule.destination}`);
    console.log(`   Schedule ID: ${result.scheduleId}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to create ${schedule.name}:`, error);
    throw error;
  }
}

async function listSchedules() {
  const response = await fetch('https://qstash.upstash.io/v2/schedules', {
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to list schedules');
  }

  return response.json();
}

async function deleteSchedule(scheduleId: string) {
  const response = await fetch(`https://qstash.upstash.io/v2/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
    },
  });

  return response.ok;
}

async function main() {
  console.log('🔧 Setting up QStash billing schedules...\n');
  console.log(`App URL: ${APP_URL}\n`);

  // List existing schedules
  console.log('📋 Checking existing schedules...');
  const existing = await listSchedules();
  
  // Delete existing billing schedules
  for (const schedule of existing) {
    if (schedule.destination?.includes('/api/cron/billing/')) {
      console.log(`   Deleting existing: ${schedule.destination}`);
      await deleteSchedule(schedule.scheduleId);
    }
  }

  console.log('\n📅 Creating new schedules...\n');

  // Create new schedules
  for (const schedule of schedules) {
    await createSchedule(schedule);
    console.log('');
  }

  console.log('✨ Done! All billing schedules are set up.\n');
  console.log('📊 Schedule Summary:');
  console.log('   • Trial expiration: Daily at midnight');
  console.log('   • Subscription renewal: Daily at 2 AM');
  console.log('   • Transaction fees (0.5%): 1st & 15th of month');
  console.log('   • Plugin fees: 1st of month');
}

main().catch(console.error);

