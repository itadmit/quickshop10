import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';
import * as schema from './schema';
import { sendOrderConfirmationEmail } from '../email';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local file explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

async function resendOrderEmail() {
  console.log('📧 מחפש את ההזמנה האחרונה של avitan.yogev@gmail.com...\n');

  // Find the latest order for this email
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerEmail, 'avitan.yogev@gmail.com'))
    .orderBy(desc(schema.orders.createdAt))
    .limit(1);

  if (!order) {
    console.error('❌ לא נמצאה הזמנה עבור avitan.yogev@gmail.com');
    process.exit(1);
  }

  console.log(`✅ נמצאה הזמנה: #${order.orderNumber}`);
  console.log(`   תאריך: ${order.createdAt}`);
  console.log(`   סכום: ₪${order.total}\n`);

  // Get store info
  const [store] = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.id, order.storeId))
    .limit(1);

  if (!store) {
    console.error('❌ לא נמצאה חנות עבור ההזמנה');
    process.exit(1);
  }

  console.log(`🏪 חנות: ${store.name} (${store.slug})\n`);

  // Get order items
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id));

  console.log(`📦 פריטים בהזמנה: ${items.length}`);
  items.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.name} x${item.quantity} - ₪${item.total}`);
  });

  // Prepare shipping address
  const shippingAddress = order.shippingAddress as {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    phone?: string;
  } | null;

  // Prepare payment info from paymentDetails
  const paymentDetails = order.paymentDetails as {
    lastFour?: string;
    brand?: string;
    approvalNum?: string;
  } | null;

  console.log('\n📧 שולח מייל...');

  // Send email
  const result = await sendOrderConfirmationEmail({
    orderNumber: order.orderNumber,
    customerName: order.customerName || 'לקוח יקר',
    customerEmail: order.customerEmail || 'avitan.yogev@gmail.com',
    items: items.map(item => ({
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price),
      variantTitle: item.variantTitle || undefined,
      image: item.imageUrl || undefined,
    })),
    subtotal: Number(order.subtotal),
    shippingAmount: Number(order.shippingAmount),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    shippingAddress: shippingAddress || undefined,
    storeName: store.name,
    storeSlug: store.slug,
    paymentInfo: paymentDetails ? {
      lastFour: paymentDetails.lastFour,
      brand: paymentDetails.brand,
      approvalNum: paymentDetails.approvalNum,
    } : undefined,
  });

  if (result.success) {
    console.log('✅ מייל נשלח בהצלחה!');
  } else {
    console.error('❌ שגיאה בשליחת מייל:', result.error);
    process.exit(1);
  }
}

// Run the script
resendOrderEmail()
  .then(() => {
    console.log('\n✨ הושלם בהצלחה!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ שגיאה:', error);
    process.exit(1);
  });

