/**
 * Script to fix order numbers that have # prefix
 * This removes the # from order numbers in the database
 */
import { db } from '../src/lib/db';
import { orders } from '../src/lib/db/schema';
import { like, sql } from 'drizzle-orm';

async function fixOrderNumbers() {
  try {
    // Find all orders with # prefix
    const ordersWithHash = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        storeId: orders.storeId,
      })
      .from(orders)
      .where(like(orders.orderNumber, '#%'));

    console.log(`Found ${ordersWithHash.length} orders with # prefix`);

    if (ordersWithHash.length === 0) {
      console.log('No orders to fix');
      process.exit(0);
    }

    // Check for conflicts before updating
    for (const order of ordersWithHash) {
      const newOrderNumber = order.orderNumber.substring(1); // Remove #
      
      // Check if there's already an order with this number in the same store
      const existing = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
          sql`${orders.orderNumber} = ${newOrderNumber} AND ${orders.storeId} = ${order.storeId} AND ${orders.id} != ${order.id}`
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(`⚠️  Cannot fix order ${order.orderNumber} (ID: ${order.id}) - conflict with existing order ${newOrderNumber}`);
      } else {
        // Update the order number
        await db
          .update(orders)
          .set({ 
            orderNumber: newOrderNumber,
            updatedAt: new Date()
          })
          .where(sql`${orders.id} = ${order.id}`);
        
        console.log(`✅ Fixed: ${order.orderNumber} → ${newOrderNumber}`);
      }
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixOrderNumbers();
