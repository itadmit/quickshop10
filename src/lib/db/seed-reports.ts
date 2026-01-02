import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql } from 'drizzle-orm';
import * as schema from './schema';
import 'dotenv/config';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

// Helper functions
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min: number, max: number, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (days: number, hoursOffset = 0) => 
  new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000);

// Traffic sources data
const trafficSources = {
  utm: [
    { source: 'google', medium: 'cpc', campaign: 'brand_search' },
    { source: 'google', medium: 'organic', campaign: null },
    { source: 'facebook', medium: 'paid', campaign: 'retargeting_jan' },
    { source: 'facebook', medium: 'social', campaign: null },
    { source: 'instagram', medium: 'paid', campaign: 'influencer_noa' },
    { source: 'instagram', medium: 'social', campaign: null },
    { source: 'tiktok', medium: 'paid', campaign: 'viral_challenge' },
    { source: 'email', medium: 'newsletter', campaign: 'weekly_deals' },
    { source: 'direct', medium: null, campaign: null },
    { source: 'referral', medium: null, campaign: null },
  ],
  referrers: [
    { domain: 'google.com', url: 'https://www.google.com/search?q=noir+fashion' },
    { domain: 'facebook.com', url: 'https://www.facebook.com/' },
    { domain: 'instagram.com', url: 'https://www.instagram.com/' },
    { domain: 'ynet.co.il', url: 'https://www.ynet.co.il/lifestyle/fashion' },
    { domain: null, url: null },
  ],
  landingPages: ['/', '/category/women', '/category/men', '/category/accessories', '/products/satin-midi-dress'],
};

// Device & Browser data
const devices = {
  types: [
    { type: 'mobile' as const, weight: 65 },
    { type: 'desktop' as const, weight: 30 },
    { type: 'tablet' as const, weight: 5 },
  ],
  browsers: [
    { name: 'Chrome', version: '120', os: 'Windows', osVersion: '11' },
    { name: 'Chrome', version: '120', os: 'Android', osVersion: '14' },
    { name: 'Safari', version: '17', os: 'iOS', osVersion: '17.2' },
    { name: 'Safari', version: '17', os: 'macOS', osVersion: '14' },
  ],
};

// Location data (Israel)
const locations = [
  { city: 'תל אביב', region: 'מרכז', weight: 30 },
  { city: 'ירושלים', region: 'ירושלים', weight: 15 },
  { city: 'חיפה', region: 'צפון', weight: 12 },
  { city: 'ראשון לציון', region: 'מרכז', weight: 8 },
  { city: 'אשדוד', region: 'דרום', weight: 6 },
  { city: 'נתניה', region: 'שרון', weight: 5 },
  { city: 'באר שבע', region: 'דרום', weight: 5 },
];

// Search queries data
const searchTerms = [
  { query: 'שמלה', weight: 15 },
  { query: 'מעיל', weight: 12 },
  { query: 'חולצה לבנה', weight: 10 },
  { query: 'בלייזר', weight: 8 },
  { query: 'תיק', weight: 8 },
  { query: 'מגפיים', weight: 7 },
];

// Weighted random selection
function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}

async function seedReportsData() {
  console.log('📊 Starting reports seed...\n');

  // Get existing store and data
  const [store] = await db.select().from(schema.stores).limit(1);
  if (!store) {
    console.error('❌ No store found. Run seed.ts first.');
    process.exit(1);
  }

  const products = await db.select().from(schema.products).where(eq(schema.products.storeId, store.id));
  const categories = await db.select().from(schema.categories).where(eq(schema.categories.storeId, store.id));
  const existingCustomers = await db.select().from(schema.customers).where(eq(schema.customers.storeId, store.id));
  const existingOrders = await db.select().from(schema.orders).where(eq(schema.orders.storeId, store.id));
  const discounts = await db.select().from(schema.discounts).where(eq(schema.discounts.storeId, store.id));

  console.log(`📍 Using store: ${store.name}`);
  console.log(`📦 Found ${products.length} products, ${categories.length} categories\n`);

  // ============================================
  // 1. CREATE ADDITIONAL CUSTOMERS
  // ============================================
  console.log('👥 Creating additional customers...');
  
  const newCustomersData = [
    { email: 'vip1@example.com', firstName: 'רונית', lastName: 'גולדשטיין', phone: '050-1111111', totalOrders: 15, totalSpent: '8500.00', acceptsMarketing: true, daysAgo: 90 },
    { email: 'vip2@example.com', firstName: 'עמית', lastName: 'ברקוביץ', phone: '052-2222222', totalOrders: 12, totalSpent: '6200.00', acceptsMarketing: true, daysAgo: 60 },
    { email: 'return1@example.com', firstName: 'יעל', lastName: 'פרידמן', phone: '050-4444444', totalOrders: 4, totalSpent: '2100.00', acceptsMarketing: true, daysAgo: 30 },
    { email: 'return2@example.com', firstName: 'אלון', lastName: 'מזרחי', phone: '052-5555555', totalOrders: 3, totalSpent: '1450.00', acceptsMarketing: false, daysAgo: 25 },
    { email: 'atrisk1@example.com', firstName: 'אורי', lastName: 'לוי', phone: '050-7777777', totalOrders: 2, totalSpent: '890.00', acceptsMarketing: true, daysAgo: 120 },
    { email: 'atrisk2@example.com', firstName: 'תמר', lastName: 'אברהם', phone: '052-8888888', totalOrders: 1, totalSpent: '450.00', acceptsMarketing: false, daysAgo: 150 },
    { email: 'new1@example.com', firstName: 'ליאור', lastName: 'נחמני', phone: '050-1010101', totalOrders: 1, totalSpent: '389.00', acceptsMarketing: true, daysAgo: 3 },
    { email: 'new2@example.com', firstName: 'הילה', lastName: 'ביטון', phone: '052-1212121', totalOrders: 1, totalSpent: '549.00', acceptsMarketing: true, daysAgo: 5 },
    { email: 'new3@example.com', firstName: 'עידן', lastName: 'סגל', phone: '054-1313131', totalOrders: 0, totalSpent: '0', acceptsMarketing: true, daysAgo: 1 },
  ];

  const newCustomers = await db.insert(schema.customers).values(
    newCustomersData.map(c => ({
      storeId: store.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      totalOrders: c.totalOrders,
      totalSpent: c.totalSpent,
      acceptsMarketing: c.acceptsMarketing,
      createdAt: daysAgo(c.daysAgo),
    }))
  ).returning();
  console.log(`   ✓ Created ${newCustomers.length} additional customers`);

  const allCustomers = [...existingCustomers, ...newCustomers];

  // ============================================
  // 2. CREATE ADDITIONAL ORDERS (30 days)
  // ============================================
  console.log('📦 Creating additional orders...');

  const maxOrderNum = Math.max(...existingOrders.map(o => parseInt(o.orderNumber)));
  let orderCounter = maxOrderNum + 1;
  const ordersToInsert: schema.NewOrder[] = [];
  const orderItemsToInsert: { orderId: string; productId: string; name: string; quantity: number; price: string; total: string }[] = [];

  for (let day = 0; day < 30; day++) {
    const ordersToday = day < 7 ? randomInt(4, 8) : randomInt(2, 5);

    for (let i = 0; i < ordersToday; i++) {
      const customer = randomItem(allCustomers);
      const product = randomItem(products);
      const quantity = randomInt(1, 2);
      const price = parseFloat(product.price || '389');
      const subtotal = price * quantity;
      
      const useDiscount = Math.random() < 0.3;
      const discount = useDiscount && discounts.length > 0 ? randomItem(discounts) : null;
      let discountAmount = 0;
      if (discount) {
        discountAmount = discount.type === 'percentage' 
          ? subtotal * parseFloat(discount.value) / 100 
          : parseFloat(discount.value);
      }

      const shippingAmount = subtotal > 200 ? 0 : 29;
      const total = subtotal - discountAmount + shippingAmount;
      const location = weightedRandom(locations);

      const statuses = day > 7 
        ? ['delivered'] 
        : day > 3 
          ? ['shipped', 'delivered'] 
          : ['pending', 'confirmed', 'processing'];
      const status = randomItem(statuses) as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
      const orderId = crypto.randomUUID();

      ordersToInsert.push({
        id: orderId,
        storeId: store.id,
        customerId: customer.id,
        orderNumber: String(orderCounter++),
        status,
        financialStatus: 'paid' as const,
        fulfillmentStatus: status === 'delivered' || status === 'shipped' ? 'fulfilled' as const : 'unfulfilled' as const,
        subtotal: subtotal.toFixed(2),
        discountCode: discount?.code || null,
        discountAmount: discountAmount.toFixed(2),
        shippingAmount: shippingAmount.toFixed(2),
        taxAmount: '0',
        total: total.toFixed(2),
        currency: 'ILS',
        shippingAddress: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          address: `רחוב ${randomInt(1, 100)}`,
          city: location.city,
          region: location.region,
          zipCode: `${randomInt(1000000, 9999999)}`,
          phone: customer.phone,
        },
        billingAddress: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          address: `רחוב ${randomInt(1, 100)}`,
          city: location.city,
          zipCode: `${randomInt(1000000, 9999999)}`,
          phone: customer.phone,
        },
        isRead: day > 2,
        createdAt: daysAgo(day, randomInt(0, 23)),
      });

      orderItemsToInsert.push({
        orderId,
        productId: product.id,
        name: product.name,
        quantity,
        price: price.toFixed(2),
        total: (price * quantity).toFixed(2),
      });
    }
  }

  // Batch insert orders
  if (ordersToInsert.length > 0) {
    await db.insert(schema.orders).values(ordersToInsert);
    await db.insert(schema.orderItems).values(orderItemsToInsert);
    await db.update(schema.stores).set({ orderCounter }).where(eq(schema.stores.id, store.id));
  }
  console.log(`   ✓ Created ${ordersToInsert.length} additional orders`);

  // Get all orders for analytics
  const allOrders = await db.select().from(schema.orders).where(eq(schema.orders.storeId, store.id));

  // ============================================
  // 3. CREATE ANALYTICS EVENTS (batch)
  // ============================================
  console.log('📈 Creating analytics events...');

  const analyticsToInsert: schema.NewAnalyticsEvent[] = [];

  // Generate analytics for 14 days (reduced from 30)
  for (let day = 0; day < 14; day++) {
    const sessionsToday = day < 7 ? randomInt(50, 100) : randomInt(30, 60);

    for (let s = 0; s < sessionsToday; s++) {
      const sessionId = `sess_${day}_${s}_${randomInt(1000, 9999)}`;
      const customer = Math.random() < 0.3 ? randomItem(allCustomers) : null;
      const trafficSource = randomItem(trafficSources.utm);
      const referrerData = Math.random() < 0.4 ? randomItem(trafficSources.referrers) : { domain: null, url: null };
      const landingPage = randomItem(trafficSources.landingPages);
      const deviceData = weightedRandom(devices.types);
      const browserData = randomItem(devices.browsers);
      const location = weightedRandom(locations);
      const sessionTime = daysAgo(day, randomInt(0, 23));

      // Page view
      analyticsToInsert.push({
        storeId: store.id,
        sessionId,
        customerId: customer?.id || null,
        eventType: 'page_view',
        utmSource: trafficSource.source,
        utmMedium: trafficSource.medium,
        utmCampaign: trafficSource.campaign,
        referrer: referrerData.url,
        referrerDomain: referrerData.domain,
        pageUrl: `https://noir-fashion.quickshop.co.il${landingPage}`,
        pagePath: landingPage,
        landingPage: `https://noir-fashion.quickshop.co.il${landingPage}`,
        deviceType: deviceData.type,
        browser: browserData.name,
        os: browserData.os,
        country: 'IL',
        city: location.city,
        region: location.region,
        timeOnPage: randomInt(10, 180),
        createdAt: sessionTime,
      });

      // Product view (50% of sessions)
      if (Math.random() < 0.5) {
        const product = randomItem(products);
        analyticsToInsert.push({
          storeId: store.id,
          sessionId,
          customerId: customer?.id || null,
          eventType: 'product_view',
          utmSource: trafficSource.source,
          utmMedium: trafficSource.medium,
          pageUrl: `https://noir-fashion.quickshop.co.il/products/${product.slug}`,
          pagePath: `/products/${product.slug}`,
          productId: product.id,
          productName: product.name,
          deviceType: deviceData.type,
          browser: browserData.name,
          os: browserData.os,
          country: 'IL',
          city: location.city,
          region: location.region,
          createdAt: new Date(sessionTime.getTime() + 60000),
        });

        // Add to cart (30%)
        if (Math.random() < 0.3) {
          analyticsToInsert.push({
            storeId: store.id,
            sessionId,
            customerId: customer?.id || null,
            eventType: 'add_to_cart',
            pageUrl: `https://noir-fashion.quickshop.co.il/products/${product.slug}`,
            pagePath: `/products/${product.slug}`,
            productId: product.id,
            productName: product.name,
            deviceType: deviceData.type,
            browser: browserData.name,
            os: browserData.os,
            country: 'IL',
            city: location.city,
            region: location.region,
            createdAt: new Date(sessionTime.getTime() + 120000),
          });

          // Begin checkout (60% of add to cart)
          if (Math.random() < 0.6) {
            analyticsToInsert.push({
              storeId: store.id,
              sessionId,
              customerId: customer?.id || null,
              eventType: 'begin_checkout',
              pageUrl: `https://noir-fashion.quickshop.co.il/checkout`,
              pagePath: `/checkout`,
              productId: product.id,
              productName: product.name,
              deviceType: deviceData.type,
              browser: browserData.name,
              os: browserData.os,
              country: 'IL',
              city: location.city,
              region: location.region,
              createdAt: new Date(sessionTime.getTime() + 180000),
            });
          }
        }
      }
    }
  }

  // Add purchase events for orders
  for (const order of allOrders) {
    const location = weightedRandom(locations);
    const deviceData = weightedRandom(devices.types);
    const browserData = randomItem(devices.browsers);

    analyticsToInsert.push({
      storeId: store.id,
      sessionId: `sess_order_${order.id.slice(0, 8)}`,
      customerId: order.customerId,
      eventType: 'purchase',
      pageUrl: 'https://noir-fashion.quickshop.co.il/checkout/thank-you',
      pagePath: '/checkout/thank-you',
      orderId: order.id,
      orderValue: order.total,
      deviceType: deviceData.type,
      browser: browserData.name,
      os: browserData.os,
      country: 'IL',
      city: location.city,
      region: location.region,
      createdAt: order.createdAt,
    });
  }

  // Batch insert analytics in chunks
  const BATCH_SIZE = 100;
  for (let i = 0; i < analyticsToInsert.length; i += BATCH_SIZE) {
    const batch = analyticsToInsert.slice(i, i + BATCH_SIZE);
    await db.insert(schema.analyticsEvents).values(batch);
  }
  console.log(`   ✓ Created ${analyticsToInsert.length} analytics events`);

  // ============================================
  // 4. CREATE SEARCH QUERIES (batch)
  // ============================================
  console.log('🔍 Creating search queries...');

  const searchesToInsert: schema.NewSearchQuery[] = [];
  for (let day = 0; day < 14; day++) {
    const searchesToday = day < 7 ? randomInt(15, 30) : randomInt(8, 20);
    for (let i = 0; i < searchesToday; i++) {
      const searchTerm = weightedRandom(searchTerms);
      searchesToInsert.push({
        storeId: store.id,
        sessionId: `sess_search_${day}_${i}`,
        query: searchTerm.query,
        resultsCount: randomInt(0, 15),
        createdAt: daysAgo(day, randomInt(0, 23)),
      });
    }
  }
  await db.insert(schema.searchQueries).values(searchesToInsert);
  console.log(`   ✓ Created ${searchesToInsert.length} search queries`);

  // ============================================
  // 5. CREATE ABANDONED CARTS
  // ============================================
  console.log('🛒 Creating abandoned carts...');

  const abandonedToInsert: schema.NewAbandonedCart[] = [];
  for (let day = 0; day < 14; day++) {
    const abandonedToday = day < 7 ? randomInt(3, 6) : randomInt(1, 4);
    for (let i = 0; i < abandonedToday; i++) {
      const customer = Math.random() < 0.4 ? randomItem(allCustomers) : null;
      const product = randomItem(products);
      const price = parseFloat(product.price || '389');

      abandonedToInsert.push({
        storeId: store.id,
        sessionId: `sess_abandoned_${day}_${i}`,
        customerId: customer?.id || null,
        email: customer?.email || `visitor${randomInt(1000, 9999)}@example.com`,
        items: [{ productId: product.id, productName: product.name, quantity: 1, price }],
        subtotal: price.toFixed(2),
        checkoutStep: randomItem(['cart', 'shipping', 'payment']),
        recoveryToken: `recover_${day}_${i}_${randomInt(10000, 99999)}`,
        reminderCount: Math.random() < 0.5 ? 1 : 0,
        createdAt: daysAgo(day, randomInt(0, 23)),
      });
    }
  }
  await db.insert(schema.abandonedCarts).values(abandonedToInsert);
  console.log(`   ✓ Created ${abandonedToInsert.length} abandoned carts`);

  // ============================================
  // 6. CREATE GIFT CARDS
  // ============================================
  console.log('🎁 Creating gift cards...');

  const giftCardsData = [
    { code: 'GIFT100', initialBalance: '100.00', currentBalance: '45.00', recipientEmail: 'gift1@example.com', recipientName: 'יעל כהן', senderName: 'מיכל לוי', message: 'יום הולדת שמח!' },
    { code: 'GIFT200', initialBalance: '200.00', currentBalance: '200.00', recipientEmail: 'gift2@example.com', recipientName: 'דני אברהם', senderName: 'רונית שרון', message: 'לחג שמח!' },
    { code: 'GIFT300', initialBalance: '300.00', currentBalance: '0', recipientEmail: 'gift3@example.com', recipientName: 'שירה גולד', senderName: 'אבי גולד', message: 'באהבה' },
    { code: 'GIFT500', initialBalance: '500.00', currentBalance: '312.00', recipientEmail: 'vip1@example.com', recipientName: 'רונית גולדשטיין', senderName: 'החנות', message: 'תודה על הנאמנות!' },
  ];

  const giftCards = await db.insert(schema.giftCards).values(
    giftCardsData.map(gc => ({
      storeId: store.id,
      code: gc.code,
      initialBalance: gc.initialBalance,
      currentBalance: gc.currentBalance,
      status: gc.currentBalance === '0' ? 'used' as const : 'active' as const,
      recipientEmail: gc.recipientEmail,
      recipientName: gc.recipientName,
      senderName: gc.senderName,
      message: gc.message,
      expiresAt: daysAgo(-365),
      createdAt: daysAgo(randomInt(30, 90)),
    }))
  ).returning();
  console.log(`   ✓ Created ${giftCards.length} gift cards`);

  // ============================================
  // 7. CREATE INFLUENCERS
  // ============================================
  console.log('👑 Creating influencers...');

  const influencersData = [
    { name: 'נועה קירש', email: 'noa@influencer.com', instagramHandle: '@noakirsh', instagramFollowers: 245000, couponCode: 'NOA20', commissionValue: '15', totalSales: '12500.00', totalCommission: '1875.00', totalOrders: 28 },
    { name: 'מיקה ניסים', email: 'mika@influencer.com', instagramHandle: '@mikanissim', instagramFollowers: 89000, couponCode: 'MIKA15', commissionValue: '12', totalSales: '6800.00', totalCommission: '816.00', totalOrders: 15 },
    { name: 'דנה רז', email: 'dana@influencer.com', instagramHandle: '@danaraz', instagramFollowers: 320000, couponCode: 'DANA25', commissionValue: '20', totalSales: '28400.00', totalCommission: '5680.00', totalOrders: 52 },
  ];

  for (const inf of influencersData) {
    const [discount] = await db.insert(schema.discounts).values({
      storeId: store.id,
      code: inf.couponCode,
      title: `קוד של ${inf.name}`,
      type: 'percentage',
      value: inf.commissionValue,
      usageLimit: 1000,
      usageCount: inf.totalOrders,
      isActive: true,
    }).returning();

    await db.insert(schema.influencers).values({
      storeId: store.id,
      name: inf.name,
      email: inf.email,
      instagramHandle: inf.instagramHandle,
      instagramFollowers: inf.instagramFollowers,
      commissionType: 'percentage',
      commissionValue: inf.commissionValue,
      couponCode: inf.couponCode,
      discountId: discount.id,
      totalSales: inf.totalSales,
      totalCommission: inf.totalCommission,
      totalOrders: inf.totalOrders,
      isActive: true,
    });
  }
  console.log(`   ✓ Created ${influencersData.length} influencers`);

  // ============================================
  // 8. CREATE REFUNDS
  // ============================================
  console.log('💸 Creating refunds...');

  const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
  const refundsToCreate = Math.min(8, Math.floor(deliveredOrders.length * 0.1));
  const reasons = ['מוצר פגום', 'לא מתאים למידות', 'הזמנה בטעות', 'איחור במשלוח'];
  const refundMethods = ['original_payment', 'store_credit'];

  const refundsToInsert: schema.NewRefund[] = [];
  for (let i = 0; i < refundsToCreate; i++) {
    const order = deliveredOrders[i % deliveredOrders.length];
    refundsToInsert.push({
      storeId: store.id,
      orderId: order.id,
      customerId: order.customerId,
      amount: randomDecimal(50, parseFloat(order.total)).toFixed(2),
      reason: randomItem(reasons),
      status: randomItem(['pending', 'approved', 'completed']) as 'pending' | 'approved' | 'completed',
      items: [],
      refundMethod: randomItem(refundMethods),
      createdAt: daysAgo(randomInt(1, 20)),
    });
  }
  if (refundsToInsert.length > 0) {
    await db.insert(schema.refunds).values(refundsToInsert);
  }
  console.log(`   ✓ Created ${refundsToInsert.length} refunds`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✅ Reports seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${newCustomers.length} additional customers`);
  console.log(`   - ${ordersToInsert.length} additional orders`);
  console.log(`   - ${analyticsToInsert.length} analytics events`);
  console.log(`   - ${searchesToInsert.length} search queries`);
  console.log(`   - ${abandonedToInsert.length} abandoned carts`);
  console.log(`   - ${giftCards.length} gift cards`);
  console.log(`   - ${influencersData.length} influencers`);
  console.log(`   - ${refundsToInsert.length} refunds`);

  console.log('\n📈 Available Reports Data:');
  console.log('   ✓ תנועה ומקורות - UTM, referrers, landing pages');
  console.log('   ✓ מכירות - לפי תאריך, מוצר, קטגוריה, מיקום');
  console.log('   ✓ לקוחות - חדשים, חוזרים, VIP, בסיכון');
  console.log('   ✓ התנהגות - משפך המרה, עגלות נטושות, חיפושים');
  console.log('   ✓ מכשירים - mobile, desktop, tablet + browsers');
  console.log('   ✓ פיננסים - גיפט קארדים, משפיענים, החזרים');
}

seedReportsData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Reports seed failed:', error);
    process.exit(1);
  });
