/**
 * Script to check order 1182 details - where did the # come from?
 */
import { db } from '../src/lib/db';
import { orders } from '../src/lib/db/schema';
import { like, eq, and } from 'drizzle-orm';

async function checkDetails() {
  try {
    // Get the specific order with #1182
    const orderWithHash = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        utmSource: orders.utmSource,
        storeId: orders.storeId,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.orderNumber, '#1182'))
      .limit(1);

    console.log('Order with #1182:');
    if (orderWithHash.length > 0) {
      const o = orderWithHash[0];
      console.log(JSON.stringify(o, null, 2));
      console.log(`\nCreated: ${o.createdAt}`);
      console.log(`Updated: ${o.updatedAt}`);
      console.log(`UTM Source: ${o.utmSource || 'null'}`);
    } else {
      console.log('Not found');
    }

    // Get the order with 1182 (without #)
    const orderWithoutHash = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        utmSource: orders.utmSource,
        storeId: orders.storeId,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(
        eq(orders.orderNumber, '1182'),
        eq(orders.storeId, 'd3c2b245-26c6-41c4-975a-a29f733c83a9') // The store with both orders
      ))
      .limit(1);

    console.log('\n\nOrder with 1182 (no #) in same store:');
    if (orderWithoutHash.length > 0) {
      const o = orderWithoutHash[0];
      console.log(JSON.stringify(o, null, 2));
      console.log(`\nCreated: ${o.createdAt}`);
      console.log(`Updated: ${o.updatedAt}`);
      console.log(`UTM Source: ${o.utmSource || 'null'}`);
    } else {
      console.log('Not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDetails();
