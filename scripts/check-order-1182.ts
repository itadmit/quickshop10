/**
 * Script to check order 1182 in the database
 * Run with: npx tsx scripts/check-order-1182.ts
 */

import { db } from '../src/lib/db';
import { orders } from '../src/lib/db/schema';
import { eq, like } from 'drizzle-orm';

async function checkOrder() {
  try {
    // Find order by orderNumber
    const order = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        financialStatus: orders.financialStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        customStatus: orders.customStatus,
        archivedAt: orders.archivedAt,
        storeId: orders.storeId,
        customerName: orders.customerName,
        total: orders.total,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(like(orders.orderNumber, '%1182%'))
      .limit(10);

    console.log('Found orders:', JSON.stringify(order, null, 2));
    
    if (order.length === 0) {
      console.log('❌ Order 1182 not found in database');
    } else {
      console.log(`✅ Found ${order.length} order(s) with number containing 1182`);
      order.forEach((o, i) => {
        console.log(`\nOrder ${i + 1}:`);
        console.log(`  ID: ${o.id}`);
        console.log(`  Order Number: ${o.orderNumber}`);
        console.log(`  Status: ${o.status}`);
        console.log(`  Financial Status: ${o.financialStatus}`);
        console.log(`  Fulfillment Status: ${o.fulfillmentStatus}`);
        console.log(`  Custom Status: ${o.customStatus || 'null'}`);
        console.log(`  Archived: ${o.archivedAt ? 'Yes (' + o.archivedAt + ')' : 'No'}`);
        console.log(`  Store ID: ${o.storeId}`);
        console.log(`  Customer: ${o.customerName || 'N/A'}`);
        console.log(`  Total: ₪${o.total}`);
        console.log(`  Created: ${o.createdAt}`);
        console.log(`  Updated: ${o.updatedAt}`);
      });
    }
  } catch (error) {
    console.error('Error checking order:', error);
  } finally {
    process.exit(0);
  }
}

checkOrder();
