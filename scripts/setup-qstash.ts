/**
 * QStash Schedules Setup Script
 * 
 * This script manages QStash schedules:
 * 1. Lists all existing schedules
 * 2. Deletes old/unwanted schedules
 * 3. Creates new schedules for our cron jobs
 * 
 * Run with: npx tsx scripts/setup-qstash.ts
 */

import 'dotenv/config';

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const BASE_URL = 'https://qstash.upstash.io/v2';

// Production domain - HARDCODED for reliability
const APP_DOMAIN = 'https://my-quickshop.com';

console.log(`🌐 Using domain: ${APP_DOMAIN}\n`);

// Our cron schedules
const SCHEDULES = [
  {
    destination: `${APP_DOMAIN}/api/cron/aggregate-analytics`,
    cron: '0 * * * *', // Every hour
    name: 'aggregate-analytics',
  },
  {
    destination: `${APP_DOMAIN}/api/cron/abandoned-carts`,
    cron: '*/15 * * * *', // Every 15 minutes
    name: 'abandoned-carts',
  },
];

// Old schedules to remove (by path patterns)
const OLD_SCHEDULE_PATTERNS = [
  '/api/cron/cleanup-otp-codes',
  '/api/cron/update-discounts-status',
  '/api/cron/archive-products',
  '/api/cron/sync-visitors',
  'quickshop3.vercel.app',
];

async function qstashRequest(path: string, options: RequestInit = {}, expectJson = true) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QStash API error: ${response.status} - ${error}`);
  }

  if (!expectJson) {
    return { success: true };
  }

  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

async function listSchedules() {
  console.log('📋 Fetching existing schedules...\n');
  const schedules = await qstashRequest('/schedules');
  return schedules;
}

async function deleteSchedule(scheduleId: string) {
  console.log(`   🗑️  Deleting schedule: ${scheduleId}`);
  await qstashRequest(`/schedules/${scheduleId}`, { method: 'DELETE' }, false);
}

async function createSchedule(schedule: typeof SCHEDULES[0]) {
  console.log(`   ➕ Creating schedule: ${schedule.name}`);
  console.log(`      Destination: ${schedule.destination}`);
  console.log(`      Cron: ${schedule.cron}`);
  
  // Method 1: POST to /v2/schedules with body
  const response = await fetch(`${BASE_URL}/schedules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      destination: schedule.destination,
      cron: schedule.cron,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    
    // Try method 2 if method 1 fails
    console.log(`   ⚠️  Method 1 failed, trying method 2...`);
    
    const response2 = await fetch(`${BASE_URL}/publish/${schedule.destination}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Upstash-Cron': schedule.cron,
      },
    });
    
    if (!response2.ok) {
      const error2 = await response2.text();
      throw new Error(`QStash API error: ${response2.status} - ${error2}`);
    }
    
    const text2 = await response2.text();
    return text2 ? JSON.parse(text2) : { scheduleId: 'created' };
  }

  const text = await response.text();
  return text ? JSON.parse(text) : { scheduleId: 'created' };
}

async function main() {
  if (!QSTASH_TOKEN) {
    console.error('❌ QSTASH_TOKEN not found in environment variables');
    process.exit(1);
  }

  console.log('🚀 QStash Schedules Setup\n');
  console.log('='.repeat(50));

  try {
    // 1. List all schedules
    const schedules = await listSchedules();
    console.log(`Found ${schedules.length} existing schedules:\n`);
    
    for (const schedule of schedules) {
      console.log(`   - ${schedule.destination}`);
      console.log(`     Cron: ${schedule.cron}`);
      console.log(`     ID: ${schedule.scheduleId}\n`);
    }

    // 2. Find and delete old schedules
    console.log('\n🧹 Cleaning up old schedules...\n');
    let deletedCount = 0;
    
    for (const schedule of schedules) {
      const shouldDelete = OLD_SCHEDULE_PATTERNS.some(pattern => 
        schedule.destination.includes(pattern)
      );
      
      if (shouldDelete) {
        await deleteSchedule(schedule.scheduleId);
        deletedCount++;
      }
    }
    
    if (deletedCount === 0) {
      console.log('   No old schedules to delete.\n');
    } else {
      console.log(`\n   Deleted ${deletedCount} old schedules.\n`);
    }

    // 3. Check which schedules already exist
    console.log('✨ Creating new schedules...\n');
    const updatedSchedules = await listSchedules();
    
    for (const newSchedule of SCHEDULES) {
      const exists = updatedSchedules.some((s: { destination: string }) => 
        s.destination === newSchedule.destination
      );
      
      if (exists) {
        console.log(`   ⏭️  Schedule already exists: ${newSchedule.name}`);
      } else {
        const result = await createSchedule(newSchedule);
        console.log(`   ✅ Created: ${newSchedule.name} (ID: ${result.scheduleId})`);
      }
    }

    // 4. Final status
    console.log('\n' + '='.repeat(50));
    console.log('📊 Final Schedule Status:\n');
    
    const finalSchedules = await listSchedules();
    for (const schedule of finalSchedules) {
      console.log(`   ✅ ${schedule.destination}`);
      console.log(`      Cron: ${schedule.cron}\n`);
    }

    console.log('✅ Setup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
