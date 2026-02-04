/**
 * Script to check for duplicate order numbers
 */
import { db } from '../src/lib/db';
import { orders } from '../src/lib/db/schema';
import { like, sql } from 'drizzle-orm';

async function checkDuplicates() {
  try {
    // Get all orders with 1182
    const result = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        storeId: orders.storeId,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(like(orders.orderNumber, '%1182%'))
      .orderBy(orders.createdAt);

    console.log('All orders with 1182:');
    result.forEach((o, i) => {
      console.log(`${i+1}. Order Number: '${o.orderNumber}' | Status: ${o.status} | Store: ${o.storeId.substring(0,8)}... | Created: ${o.createdAt}`);
    });

    // Check for exact duplicates (same orderNumber and storeId)
    const duplicates = await db
      .select({
        orderNumber: orders.orderNumber,
        storeId: orders.storeId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(orders)
      .where(like(orders.orderNumber, '%1182%'))
      .groupBy(orders.orderNumber, orders.storeId)
      .having(sql`COUNT(*) > 1`);

    console.log('\nDuplicate order numbers (same number in same store):');
    if (duplicates.length === 0) {
      console.log('No exact duplicates found (same orderNumber + storeId)');
    } else {
      duplicates.forEach(d => {
        console.log(`Order '${d.orderNumber}' in store ${d.storeId.substring(0,8)}... appears ${d.count} times`);
      });
    }

    // Check for similar numbers (with/without #)
    console.log('\nChecking for similar numbers (with/without #):');
    const allNumbers = result.map(o => o.orderNumber);
    const uniqueNumbers = [...new Set(allNumbers)];
    uniqueNumbers.forEach(num => {
      const withHash = num.startsWith('#') ? num : `#${num}`;
      const withoutHash = num.startsWith('#') ? num.substring(1) : num;
      const hasBoth = allNumbers.includes(withHash) && allNumbers.includes(withoutHash);
      if (hasBoth) {
        console.log(`⚠️  Found both '${withHash}' and '${withoutHash}'`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDuplicates();
