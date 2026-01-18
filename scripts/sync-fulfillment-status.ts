/**
 * Script to sync fulfillmentStatus for orders that have shipments
 * 
 * This fixes orders where shipment was created but fulfillmentStatus wasn't updated
 * 
 * Run with: npx tsx scripts/sync-fulfillment-status.ts
 */

import 'dotenv/config';
import { db } from '../src/lib/db';
import { orders, shipments } from '../src/lib/db/schema';
import { eq, and, inArray, isNotNull, isNull, desc } from 'drizzle-orm';

async function syncFulfillmentStatus() {
  console.log('🔄 Checking orders status...\n');

  // 1. First show orders with shipment errors
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ Orders with shipment errors:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const ordersWithErrors = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      shipmentError: orders.shipmentError,
      shipmentErrorAt: orders.shipmentErrorAt,
      fulfillmentStatus: orders.fulfillmentStatus,
    })
    .from(orders)
    .where(isNotNull(orders.shipmentError))
    .orderBy(desc(orders.shipmentErrorAt))
    .limit(20);

  if (ordersWithErrors.length === 0) {
    console.log('  No orders with shipment errors found.\n');
  } else {
    for (const order of ordersWithErrors) {
      console.log(`  ${order.orderNumber}`);
      console.log(`    Error: ${order.shipmentError}`);
      console.log(`    At: ${order.shipmentErrorAt}`);
      console.log(`    Status: ${order.fulfillmentStatus}\n`);
    }
  }

  // 2. Find all orders that have shipments but fulfillmentStatus is not 'fulfilled'
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Orders with shipments but not marked as fulfilled:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const ordersWithShipments = await db
    .select({
      orderId: shipments.orderId,
      trackingNumber: shipments.trackingNumber,
    })
    .from(shipments)
    .where(isNotNull(shipments.trackingNumber));

  const orderIdsWithShipments = [...new Set(ordersWithShipments.map(s => s.orderId))];

  if (orderIdsWithShipments.length === 0) {
    console.log('  No orders with shipments found.\n');
    return;
  }

  console.log(`  Found ${orderIdsWithShipments.length} orders with shipments total.\n`);

  // Find orders that need updating (have shipment but not fulfilled)
  const ordersToUpdate = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      fulfillmentStatus: orders.fulfillmentStatus,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.id, orderIdsWithShipments),
        eq(orders.fulfillmentStatus, 'unfulfilled')
      )
    );

  if (ordersToUpdate.length === 0) {
    console.log('  ✅ All orders with shipments are already marked as fulfilled!\n');
    return;
  }

  console.log(`  📦 Found ${ordersToUpdate.length} orders to update:\n`);

  for (const order of ordersToUpdate) {
    console.log(`    - ${order.orderNumber}`);
  }

  console.log('\n  🔧 Updating orders...\n');

  // Update all orders
  const orderIds = ordersToUpdate.map(o => o.id);
  
  await db
    .update(orders)
    .set({
      fulfillmentStatus: 'fulfilled',
      updatedAt: new Date(),
    })
    .where(inArray(orders.id, orderIds));

  console.log(`  ✅ Successfully updated ${ordersToUpdate.length} orders to fulfilled status!\n`);
  
  // List updated orders
  console.log('  Updated orders:');
  for (const order of ordersToUpdate) {
    console.log(`    ✓ ${order.orderNumber}`);
  }
}

// Run the script
syncFulfillmentStatus()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

