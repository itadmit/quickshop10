import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Starting seed...\n');

  // 0. Seed platform settings (default pricing)
  console.log('⚙️ Creating platform settings...');
  
  const platformDefaults = [
    { key: 'branding_plan_price', value: '299.00', description: 'מחיר מנוי מסלול תדמית (ש"ח)', category: 'billing' },
    { key: 'quickshop_plan_price', value: '399.00', description: 'מחיר מנוי קוויק שופ (ש"ח)', category: 'billing' },
    { key: 'trial_days', value: '7', description: 'ימי נסיון', category: 'billing' },
    { key: 'transaction_fee_rate', value: '0.005', description: 'אחוז עמלה מעסקאות (0.5%)', category: 'billing' },
    { key: 'vat_rate', value: '18', description: 'אחוז מע"מ', category: 'billing' },
    { key: 'min_charge_amount', value: '1.00', description: 'סכום מינימלי לחיוב (ש"ח)', category: 'billing' },
  ];
  
  let settingsCreated = 0;
  for (const setting of platformDefaults) {
    const existing = await db.select().from(schema.platformSettings).where(
      eq(schema.platformSettings.key, setting.key)
    ).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.platformSettings).values({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        category: setting.category,
      });
      settingsCreated++;
    }
  }
  console.log(`   ✓ Platform settings created: ${settingsCreated} new settings`);

  // 0.1 Seed plugin pricing defaults
  console.log('🔌 Creating plugin pricing defaults...');
  const pluginDefaults = [
    { pluginSlug: 'reviews', monthlyPrice: '29.00', trialDays: 14 },
    { pluginSlug: 'inventory-alerts', monthlyPrice: '19.00', trialDays: 14 },
    { pluginSlug: 'order-status-sms', monthlyPrice: '49.00', trialDays: 7 },
    { pluginSlug: 'product-advisor', monthlyPrice: '79.00', trialDays: 14 },
    { pluginSlug: 'abandoned-cart', monthlyPrice: '49.00', trialDays: 14 },
    { pluginSlug: 'wishlist', monthlyPrice: '19.00', trialDays: 14 },
    { pluginSlug: 'order-notes', monthlyPrice: '0.00', trialDays: 14 },
    { pluginSlug: 'digital-products', monthlyPrice: '39.00', trialDays: 14 },
    { pluginSlug: 'product-bundles', monthlyPrice: '29.00', trialDays: 14 },
  ];

  let pluginsCreated = 0;
  for (const plugin of pluginDefaults) {
    const existing = await db.select().from(schema.pluginPricing).where(
      eq(schema.pluginPricing.pluginSlug, plugin.pluginSlug)
    ).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.pluginPricing).values(plugin);
      pluginsCreated++;
    }
  }
  console.log(`   ✓ Plugin pricing defaults created: ${pluginsCreated} new plugins`);

  // 1. Create demo user (merchant) with password
  console.log('👤 Creating demo user...');
  const passwordHash = await bcrypt.hash('12345678', 12);
  const [user] = await db.insert(schema.users).values({
    email: 'admin@admin.com',
    passwordHash,
    name: 'ישראל ישראלי',
    role: 'merchant',
    emailVerifiedAt: new Date(),
  }).returning();
  console.log(`   ✓ User created: ${user.email}`);

  // 2. Create demo store - ZARA Style Fashion Store
  console.log('🏪 Creating demo store...');
  const [store] = await db.insert(schema.stores).values({
    ownerId: user.id,
    name: 'NOIR',
    slug: 'noir-fashion',
    currency: 'ILS',
    settings: {
      contactEmail: 'hello@noir.co.il',
      contactPhone: '03-9876543',
    },
    themeSettings: {
      primaryColor: '#000000',
      accentColor: '#8b7355',
    },
  }).returning();
  console.log(`   ✓ Store created: ${store.name}`);

  // 2.5 Create additional team members with different roles
  console.log('👥 Creating team members...');
  
  // Create additional users for different roles
  const teamUsersData = [
    {
      email: 'manager@demo.com',
      name: 'דן כהן',
      role: 'manager' as const,
      permissions: {
        products: true,
        orders: true,
        customers: true,
        discounts: true,
        reports: true,
        settings: true,
        team: true,
      },
    },
    {
      email: 'marketing@demo.com',
      name: 'מיכל לוי',
      role: 'marketing' as const,
      permissions: {
        products: true,
        orders: false,
        customers: true,
        discounts: true,
        reports: true,
        settings: false,
        team: false,
      },
    },
    {
      email: 'developer@demo.com',
      name: 'אורי גולן',
      role: 'developer' as const,
      permissions: {
        products: true,
        orders: true,
        customers: false,
        discounts: false,
        reports: false,
        settings: true,
        team: false,
      },
    },
    {
      email: 'influencer@demo.com',
      name: 'נועה מזרחי',
      role: 'influencer' as const,
      permissions: {
        products: false,
        orders: false,
        customers: false,
        discounts: true,
        reports: true,
        settings: false,
        team: false,
      },
    },
  ];

  for (const userData of teamUsersData) {
    const [teamUser] = await db.insert(schema.users).values({
      email: userData.email,
      passwordHash: await bcrypt.hash('12345678', 12),
      name: userData.name,
      role: 'merchant',
      emailVerifiedAt: new Date(),
    }).returning();

    await db.insert(schema.storeMembers).values({
      storeId: store.id,
      userId: teamUser.id,
      role: userData.role,
      permissions: userData.permissions,
      invitedBy: user.id,
      acceptedAt: new Date(),
    });

    console.log(`   ✓ Team member: ${userData.email} (${userData.role})`);
  }

  // 3. Create categories - Fashion categories with images
  console.log('📁 Creating categories...');
  const categoriesData = [
    { 
      name: 'נשים', 
      slug: 'women', 
      description: 'קולקציית נשים - שמלות, חולצות, מכנסיים ועוד',
      image: 'https://static.zara.net/assets/public/024c/0dd8/e19e4df78c61/f20fd99a35d2/02335629250-p/02335629250-p.jpg?ts=1752493031914&w=1230'
    },
    { 
      name: 'גברים', 
      slug: 'men', 
      description: 'קולקציית גברים - חולצות, מכנסיים, ג\'קטים',
      image: 'https://static.zara.net/assets/public/a132/8434/0ddd438dbcef/110f9ea930b3/05939539716-p/05939539716-p.jpg?ts=1758270012870&w=2560'
    },
    { 
      name: 'אקססוריז', 
      slug: 'accessories', 
      description: 'תיקים, צעיפים, כובעים ואקססוריז',
      image: 'https://static.zara.net/assets/public/37ee/81ce/ffdf4034b1d2/3c9f4df6f6e3/20210283999-e1/20210283999-e1.jpg?ts=1755858923353&w=980'
    },
    { 
      name: 'נעליים', 
      slug: 'shoes', 
      description: 'נעליים לנשים וגברים',
      image: 'https://static.zara.net/assets/public/5347/7726/fe614fdd88bd/cd30a6e6476c/12245620800-e1/12245620800-e1.jpg?ts=1758789586285&w=980'
    },
  ];

  const categories = await db.insert(schema.categories).values(
    categoriesData.map((cat, i) => ({
      storeId: store.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.image,
      sortOrder: i,
    }))
  ).returning();
  console.log(`   ✓ Created ${categories.length} categories`);

  // 4. Create products - Fashion products ZARA style
  console.log('📦 Creating products...');
  const productsData = [
    // Women
    {
      categorySlug: 'women',
      name: 'שמלת מידי סאטן',
      slug: 'satin-midi-dress',
      shortDescription: 'שמלת סאטן אלגנטית באורך מידי',
      description: 'שמלת סאטן איכותית עם מחשוף V ושרוולים קצרים. גזרה מחמיאה עם חגורה בד באותו הגוון. מושלמת לאירועים ולערבים מיוחדים.',
      price: '389.00',
      comparePrice: '489.00',
      inventory: 30,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
      isFeatured: true,
    },
    {
      categorySlug: 'women',
      name: 'בלייזר אוברסייז',
      slug: 'oversized-blazer',
      shortDescription: 'בלייזר רחב בגזרה גברית',
      description: 'בלייזר אוברסייז מבד איכותי עם רפידות כתפיים עדינות. כפתור יחיד וכיסים קדמיים. מתאים לשילוב עם ג\'ינס או מכנסי טיילור.',
      price: '549.00',
      comparePrice: null,
      inventory: 25,
      image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80',
      isFeatured: true,
    },
    {
      categorySlug: 'women',
      name: 'חולצת פשתן לבנה',
      slug: 'white-linen-shirt',
      shortDescription: 'חולצה קלאסית מפשתן טהור',
      description: 'חולצת פשתן 100% בגזרה רגועה. צווארון קלאסי וכפתורים מנצנצים. נשימתית ואידיאלית לימים חמים.',
      price: '259.00',
      comparePrice: '299.00',
      inventory: 50,
      image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&q=80',
      isFeatured: false,
    },
    // Men
    {
      categorySlug: 'men',
      name: 'מעיל צמר ארוך',
      slug: 'long-wool-coat',
      shortDescription: 'מעיל צמר איכותי באורך ברך',
      description: 'מעיל צמר מעורב באורך ברך. גזרה ישרה עם צווארון רחב וכפתורים כפולים. בטנה פנימית איכותית.',
      price: '799.00',
      comparePrice: '999.00',
      inventory: 15,
      image: 'https://image.hm.com/content/dam/global_campaigns/season_03/men/start-page-assets/wk01/Shirts-MCE-wk01-04-2x3.jpg?imwidth=1536',
      isFeatured: true,
    },
    {
      categorySlug: 'men',
      name: 'חולצת פולו כותנה',
      slug: 'cotton-polo-shirt',
      shortDescription: 'פולו קלאסי מכותנה פיקה',
      description: 'חולצת פולו מכותנה פיקה איכותית. גזרה רגילה עם צווארון מסורתי ושרוולים קצרים. לוגו רקום בחזה.',
      price: '189.00',
      comparePrice: null,
      inventory: 80,
      image: 'https://image.hm.com/assets/hm/6b/34/6b342493e1e59db80de24ba6917b69152d2a6227.jpg?imwidth=1260',
      isFeatured: false,
    },
    {
      categorySlug: 'men',
      name: 'מכנסי צ\'ינו',
      slug: 'chino-pants',
      shortDescription: 'מכנסי צ\'ינו בגזרה ישרה',
      description: 'מכנסי צ\'ינו מכותנה אלסטית נוחה. גזרה סלים-פיט עם כיסים צדדיים וכיסים אחוריים עם כפתור.',
      price: '279.00',
      comparePrice: '329.00',
      inventory: 60,
      image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
      isFeatured: false,
    },
    // Accessories
    {
      categorySlug: 'accessories',
      name: 'תיק צד מעור',
      slug: 'leather-crossbody-bag',
      shortDescription: 'תיק צד קומפקטי מעור אמיתי',
      description: 'תיק צד מעור בקר איכותי עם רצועה מתכווננת. תא עיקרי עם רוכסן ותא פנימי לכרטיסים. מידות: 22x15x6 ס"מ.',
      price: '459.00',
      comparePrice: null,
      inventory: 35,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
      isFeatured: true,
    },
    {
      categorySlug: 'accessories',
      name: 'צעיף צמר קשמיר',
      slug: 'cashmere-scarf',
      shortDescription: 'צעיף רך במיוחד מתערובת קשמיר',
      description: 'צעיף גדול מתערובת צמר וקשמיר. רך במיוחד ומחמם. מידות: 200x70 ס"מ. ניתן לכביסה ביד.',
      price: '349.00',
      comparePrice: '429.00',
      inventory: 40,
      image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80',
      isFeatured: false,
    },
    // Shoes
    {
      categorySlug: 'shoes',
      name: 'מגפי עור שחורים',
      slug: 'black-leather-boots',
      shortDescription: 'מגפי עור קלאסיים עם עקב בלוק',
      description: 'מגפי עור אמיתי עם עקב בלוק יציב בגובה 5 ס"מ. רוכסן צדדי ושרוכים קדמיים. סוליה גומי איכותית.',
      price: '599.00',
      comparePrice: '749.00',
      inventory: 20,
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
      isFeatured: true,
    },
    {
      categorySlug: 'shoes',
      name: 'סניקרס לבנים מינימליסטיים',
      slug: 'white-minimal-sneakers',
      shortDescription: 'סניקרס עור לבנים בעיצוב נקי',
      description: 'סניקרס מעור איכותי בעיצוב מינימליסטי. סוליה גמישה ומדרס מרופד. מתאימים לכל סגנון לבוש.',
      price: '429.00',
      comparePrice: null,
      inventory: 45,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
      isFeatured: false,
    },
  ];

  // Map category slugs to IDs
  const categoryMap = Object.fromEntries(
    categories.map(c => [c.slug, c.id])
  );

  const products = await db.insert(schema.products).values(
    productsData.map(p => ({
      storeId: store.id,
      categoryId: categoryMap[p.categorySlug],
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice,
      inventory: p.inventory,
      isFeatured: p.isFeatured,
      isActive: true,
    }))
  ).returning();
  console.log(`   ✓ Created ${products.length} products`);

  // 5. Create product images
  console.log('🖼️ Adding product images...');
  const productImages = await db.insert(schema.productImages).values(
    productsData.map((p, i) => ({
      productId: products[i].id,
      url: p.image,
      alt: p.name,
      isPrimary: true,
      sortOrder: 0,
    }))
  ).returning();
  console.log(`   ✓ Added ${productImages.length} product images`);

  // 5.5. Add variants to shoes
  console.log('🎨 Adding product variants...');
  
  // Find the shoes products
  const blackBoots = products.find(p => p.slug === 'black-leather-boots');
  const whiteSneakers = products.find(p => p.slug === 'white-minimal-sneakers');
  
  if (blackBoots) {
    // Mark as having variants
    await db.update(schema.products)
      .set({ hasVariants: true, inventory: null })
      .where(eq(schema.products.id, blackBoots.id));
    
    // Create options for boots
    const [sizeOption] = await db.insert(schema.productOptions).values({
      productId: blackBoots.id,
      name: 'מידה',
      sortOrder: 0,
    }).returning();
    
    const [colorOption] = await db.insert(schema.productOptions).values({
      productId: blackBoots.id,
      name: 'צבע',
      sortOrder: 1,
    }).returning();
    
    // Create option values
    await db.insert(schema.productOptionValues).values([
      { optionId: sizeOption.id, value: '36', sortOrder: 0 },
      { optionId: sizeOption.id, value: '37', sortOrder: 1 },
      { optionId: sizeOption.id, value: '38', sortOrder: 2 },
      { optionId: sizeOption.id, value: '39', sortOrder: 3 },
      { optionId: sizeOption.id, value: '40', sortOrder: 4 },
      { optionId: sizeOption.id, value: '41', sortOrder: 5 },
    ]);
    
    await db.insert(schema.productOptionValues).values([
      { optionId: colorOption.id, value: 'שחור', sortOrder: 0 },
      { optionId: colorOption.id, value: 'חום', sortOrder: 1 },
    ]);
    
    // Create variants (size x color combinations)
    const sizes = ['36', '37', '38', '39', '40', '41'];
    const colors = [
      { name: 'שחור', priceDiff: 0 },
      { name: 'חום', priceDiff: 50 },
    ];
    
    let variantOrder = 0;
    for (const color of colors) {
      for (const size of sizes) {
        await db.insert(schema.productVariants).values({
          productId: blackBoots.id,
          title: `${size} / ${color.name}`,
          price: (599 + color.priceDiff).toFixed(2),
          comparePrice: color.priceDiff === 0 ? '749.00' : null,
          inventory: Math.floor(Math.random() * 10) + 2,
          option1: size,
          option2: color.name,
          sortOrder: variantOrder++,
        });
      }
    }
    console.log(`   ✓ Added variants for: ${blackBoots.name}`);
  }
  
  if (whiteSneakers) {
    // Mark as having variants
    await db.update(schema.products)
      .set({ hasVariants: true, inventory: null })
      .where(eq(schema.products.id, whiteSneakers.id));
    
    // Create options for sneakers
    const [sizeOption] = await db.insert(schema.productOptions).values({
      productId: whiteSneakers.id,
      name: 'מידה',
      sortOrder: 0,
    }).returning();
    
    // Create option values
    await db.insert(schema.productOptionValues).values([
      { optionId: sizeOption.id, value: '40', sortOrder: 0 },
      { optionId: sizeOption.id, value: '41', sortOrder: 1 },
      { optionId: sizeOption.id, value: '42', sortOrder: 2 },
      { optionId: sizeOption.id, value: '43', sortOrder: 3 },
      { optionId: sizeOption.id, value: '44', sortOrder: 4 },
      { optionId: sizeOption.id, value: '45', sortOrder: 5 },
    ]);
    
    // Create variants (just sizes)
    const sizes = ['40', '41', '42', '43', '44', '45'];
    
    for (let i = 0; i < sizes.length; i++) {
      await db.insert(schema.productVariants).values({
        productId: whiteSneakers.id,
        title: sizes[i],
        price: '429.00',
        inventory: Math.floor(Math.random() * 15) + 3,
        option1: sizes[i],
        sortOrder: i,
      });
    }
    console.log(`   ✓ Added variants for: ${whiteSneakers.name}`);
  }

  // 6. Create discount codes
  console.log('🎟️ Creating discount codes...');
  
  const discountsData = [
    {
      code: 'WELCOME15',
      title: '15% הנחה להזמנה ראשונה',
      type: 'percentage' as const,
      value: '15',
      minimumAmount: '100',
      usageLimit: 1000,
      firstOrderOnly: true,
      oncePerCustomer: true,
    },
    {
      code: 'FREESHIP',
      title: 'משלוח חינם',
      type: 'free_shipping' as const,
      value: '0',
      minimumAmount: '200',
      usageLimit: 500,
    },
    {
      code: 'SAVE50',
      title: '₪50 הנחה',
      type: 'fixed_amount' as const,
      value: '50',
      minimumAmount: '300',
      usageLimit: 200,
    },
    {
      code: 'VIP20',
      title: '20% הנחה ללקוחות VIP',
      type: 'percentage' as const,
      value: '20',
      minimumAmount: '0',
      usageLimit: 100,
    },
    {
      code: 'SUMMER10',
      title: '10% הנחת קיץ',
      type: 'percentage' as const,
      value: '10',
      minimumAmount: '0',
      usageLimit: 999,
    },
  ];
  
  for (const discount of discountsData) {
    await db.insert(schema.discounts).values({
      storeId: store.id,
      ...discount,
      isActive: true,
    });
  }
  console.log(`   ✓ Created ${discountsData.length} discount codes`);

  // 6.5. Create automatic discounts
  console.log('🎁 Creating automatic discounts...');
  
  const automaticDiscountsData = [
    {
      name: 'הנחת חברי מועדון',
      description: '5% הנחה קבועה לחברי מועדון רשומים',
      type: 'percentage' as const,
      value: '5',
      appliesTo: 'member' as const,
      stackable: true,
      priority: 100, // High priority
    },
  ];
  
  for (const autoDiscount of automaticDiscountsData) {
    await db.insert(schema.automaticDiscounts).values({
      storeId: store.id,
      ...autoDiscount,
      isActive: true,
    });
  }
  console.log(`   ✓ Created ${automaticDiscountsData.length} automatic discounts`);

  // 7. Create demo customers
  console.log('👥 Creating demo customers...');
  
  const customersData = [
    {
      email: 'sarah.cohen@gmail.com',
      firstName: 'שרה',
      lastName: 'כהן',
      phone: '054-1234567',
      totalOrders: 5,
      totalSpent: '2847.00',
      acceptsMarketing: true,
    },
    {
      email: 'david.levi@gmail.com',
      firstName: 'דוד',
      lastName: 'לוי',
      phone: '052-9876543',
      totalOrders: 3,
      totalSpent: '1549.00',
      acceptsMarketing: true,
    },
    {
      email: 'michal.shapira@gmail.com',
      firstName: 'מיכל',
      lastName: 'שפירא',
      phone: '050-5555555',
      totalOrders: 8,
      totalSpent: '4120.00',
      acceptsMarketing: false,
    },
    {
      email: 'yossi.ben@gmail.com',
      firstName: 'יוסי',
      lastName: 'בן דוד',
      phone: '053-1112222',
      totalOrders: 1,
      totalSpent: '549.00',
      acceptsMarketing: true,
    },
    {
      email: 'dana.gold@gmail.com',
      firstName: 'דנה',
      lastName: 'גולד',
      phone: '054-3334444',
      totalOrders: 2,
      totalSpent: '1198.00',
      acceptsMarketing: true,
    },
  ];

  const customers = await db.insert(schema.customers).values(
    customersData.map(c => ({
      storeId: store.id,
      ...c,
    }))
  ).returning();
  console.log(`   ✓ Created ${customers.length} customers`);

  // 8. Create demo orders
  console.log('📦 Creating demo orders...');
  
  // Helper to create dates in the past
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const ordersData = [
    // Today's orders
    {
      customer: customers[0], // Sarah
      orderNumber: '1008',
      status: 'pending' as const,
      financialStatus: 'paid' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      subtotal: '799.00',
      discountAmount: '0',
      shippingAmount: '0',
      total: '799.00',
      createdAt: daysAgo(0),
      items: [{ productIndex: 3, quantity: 1 }], // Long wool coat
    },
    {
      customer: customers[1], // David
      orderNumber: '1007',
      status: 'confirmed' as const,
      financialStatus: 'paid' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      subtotal: '549.00',
      discountAmount: '82.35',
      discountCode: 'WELCOME15',
      shippingAmount: '29.00',
      total: '495.65',
      createdAt: daysAgo(0),
      items: [{ productIndex: 1, quantity: 1 }], // Oversized blazer
    },
    // Yesterday
    {
      customer: customers[2], // Michal
      orderNumber: '1006',
      status: 'processing' as const,
      financialStatus: 'paid' as const,
      fulfillmentStatus: 'partial' as const,
      subtotal: '1247.00',
      discountAmount: '0',
      shippingAmount: '0',
      total: '1247.00',
      createdAt: daysAgo(1),
      items: [
        { productIndex: 3, quantity: 1 }, // Coat
        { productIndex: 6, quantity: 1 }, // Bag
      ],
    },
    {
      customer: customers[3], // Yossi
      orderNumber: '1005',
      status: 'shipped' as const,
      financialStatus: 'paid' as const,
      fulfillmentStatus: 'fulfilled' as const,
      subtotal: '389.00',
      discountAmount: '0',
      shippingAmount: '0',
      total: '389.00',
      createdAt: daysAgo(1),
      items: [{ productIndex: 0, quantity: 1 }], // Satin dress
    },
    // This week
    {
      customer: customers[4], // Dana
      orderNumber: '1004',
      status: 'delivered' as const,
      financialStatus: 'paid' as const,
      fulfillmentStatus: 'fulfilled' as const,
      subtotal: '599.00',
      discountAmount: '50.00',
      discountCode: 'SAVE50',
      shippingAmount: '0',
      total: '549.00',
      createdAt: daysAgo(3),
      items: [{ productIndex: 8, quantity: 1 }], // Black boots
    },
    {
      customer: customers[0], // Sarah again
      orderNumber: '1003',
      status: 'delivered' as const,
      financialStatus: 'paid' as const,
      fulfillmentStatus: 'fulfilled' as const,
      subtotal: '648.00',
      discountAmount: '0',
      shippingAmount: '0',
      total: '648.00',
      createdAt: daysAgo(5),
      items: [
        { productIndex: 2, quantity: 1 }, // White linen shirt
        { productIndex: 0, quantity: 1 }, // Satin dress
      ],
    },
    // Last week
    {
      customer: customers[2], // Michal
      orderNumber: '1002',
      status: 'delivered' as const,
      financialStatus: 'paid' as const,
      fulfillmentStatus: 'fulfilled' as const,
      subtotal: '918.00',
      discountAmount: '91.80',
      discountCode: 'SUMMER10',
      shippingAmount: '0',
      total: '826.20',
      createdAt: daysAgo(8),
      items: [
        { productIndex: 1, quantity: 1 }, // Blazer
        { productIndex: 7, quantity: 1 }, // Scarf
      ],
    },
    {
      customer: customers[1], // David
      orderNumber: '1001',
      status: 'delivered' as const,
      financialStatus: 'paid' as const,
      fulfillmentStatus: 'fulfilled' as const,
      subtotal: '468.00',
      discountAmount: '0',
      shippingAmount: '0',
      total: '468.00',
      createdAt: daysAgo(10),
      items: [
        { productIndex: 4, quantity: 1 }, // Polo
        { productIndex: 5, quantity: 1 }, // Chino
      ],
    },
    // Cancelled order - first order!
    {
      customer: customers[4], // Dana
      orderNumber: '1000',
      status: 'cancelled' as const,
      financialStatus: 'refunded' as const,
      fulfillmentStatus: 'unfulfilled' as const,
      subtotal: '429.00',
      discountAmount: '0',
      shippingAmount: '29.00',
      total: '458.00',
      createdAt: daysAgo(12),
      items: [{ productIndex: 9, quantity: 1 }], // Sneakers
    },
  ];

  let orderCount = 0;
  for (const orderData of ordersData) {
    const shippingAddress = {
      firstName: orderData.customer.firstName,
      lastName: orderData.customer.lastName,
      address: 'רחוב הרצל 15',
      city: 'תל אביב',
      zipCode: '6120101',
      phone: orderData.customer.phone,
    };

    // Mark only older orders as read (orders from more than 2 days ago)
    const isOldOrder = orderData.createdAt < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    const [order] = await db.insert(schema.orders).values({
      storeId: store.id,
      customerId: orderData.customer.id,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      financialStatus: orderData.financialStatus,
      fulfillmentStatus: orderData.fulfillmentStatus,
      subtotal: orderData.subtotal,
      discountCode: orderData.discountCode || null,
      discountAmount: orderData.discountAmount,
      shippingAmount: orderData.shippingAmount,
      taxAmount: '0',
      total: orderData.total,
      currency: 'ILS',
      shippingAddress,
      billingAddress: shippingAddress,
      isRead: isOldOrder,
      readAt: isOldOrder ? orderData.createdAt : null,
      createdAt: orderData.createdAt,
    }).returning();

    // Create order items
    for (const item of orderData.items) {
      const product = products[item.productIndex];
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.price!,
        total: (Number(product.price) * item.quantity).toFixed(2),
      });
    }
    orderCount++;
  }
  console.log(`   ✓ Created ${orderCount} orders`);

  // Update store order counter (next order will be 1009)
  await db.update(schema.stores)
    .set({ orderCounter: 1009 })
    .where(eq(schema.stores.id, store.id));

  // 10. Create page sections for homepage
  console.log('📄 Creating page sections...');
  
  const sectionsData = [
    {
      page: 'home',
      type: 'hero' as const,
      title: 'NOIR',
      subtitle: 'קולקציית סתיו-חורף 2025',
      content: {
        imageUrl: 'https://static.zara.net/assets/public/7d17/93b6/642f4cafb9ab/b570acca9761/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0.jpg?ts=1760467352233&w=3420',
        buttonText: 'גלה את הקולקציה',
        buttonLink: '#products',
      },
      settings: { height: '90vh', overlay: 0.1 },
      sortOrder: 0,
    },
    {
      page: 'home',
      type: 'categories' as const,
      title: null,
      subtitle: null,
      content: { showAll: true, limit: 4 },
      settings: { columns: 4, gap: 8 },
      sortOrder: 1,
    },
    {
      page: 'home',
      type: 'products' as const,
      title: 'פריטים נבחרים',
      subtitle: 'הבחירות שלנו לעונה',
      content: { type: 'featured', limit: 4 },
      settings: { columns: 4, gap: 8 },
      sortOrder: 2,
    },
    {
      page: 'home',
      type: 'video_banner' as const,
      title: 'קולקציה חדשה',
      subtitle: 'חדש בחנות',
      content: {
        videoUrl: 'https://image.hm.com/content/dam/global_campaigns/season_02/women/9000d/9000D-W-6C-16x9-women-spoil.mp4',
        buttonText: 'לצפייה בקולקציה',
        buttonLink: '/category/women',
      },
      settings: { height: '80vh', overlay: 0.2 },
      sortOrder: 3,
    },
    {
      page: 'home',
      type: 'split_banner' as const,
      title: null,
      subtitle: null,
      content: {
        items: [
          {
            title: 'נשים',
            imageUrl: 'https://static.zara.net/assets/public/024c/0dd8/e19e4df78c61/f20fd99a35d2/02335629250-p/02335629250-p.jpg?ts=1752493031914&w=1230',
            link: '/category/women',
          },
          {
            title: 'גברים',
            imageUrl: 'https://static.zara.net/assets/public/a132/8434/0ddd438dbcef/110f9ea930b3/05939539716-p/05939539716-p.jpg?ts=1758270012870&w=2560',
            link: '/category/men',
          },
        ],
      },
      settings: { height: '70vh' },
      sortOrder: 4,
    },
    {
      page: 'home',
      type: 'products' as const,
      title: 'כל המוצרים',
      subtitle: null,
      content: { type: 'all', limit: 12 },
      settings: { columns: 4, gap: 8, showCount: true },
      sortOrder: 5,
    },
    {
      page: 'home',
      type: 'newsletter' as const,
      title: 'הצטרפו למועדון',
      subtitle: 'הרשמו לניוזלטר וקבלו 15% הנחה על ההזמנה הראשונה',
      content: { placeholder: 'כתובת אימייל', buttonText: 'הרשמה' },
      settings: { maxWidth: 'xl' },
      sortOrder: 6,
    },
  ];

  // NEW ARCHITECTURE: Store sections as JSON on stores table
  const homeSections = sectionsData.map((section, index) => ({
    id: crypto.randomUUID(),
    type: section.type,
    title: section.title,
    subtitle: section.subtitle,
    content: section.content,
    settings: section.settings,
    sortOrder: section.sortOrder ?? index,
    isActive: true,
  }));
  
  await db.update(schema.stores)
    .set({ homeSections })
    .where(eq(schema.stores.id, store.id));
  
  console.log(`   ✓ Created ${homeSections.length} home page sections`);

  // 14. Create gift cards
  console.log('\n🎁 Creating gift cards...');
  const giftCardsData = [
    {
      code: 'GIFT500',
      initialBalance: '500.00',
      currentBalance: '500.00',
      status: 'active' as const,
      recipientEmail: 'customer1@demo.com',
      recipientName: 'לקוח ישראל',
      senderName: 'חנות נואר פאשן',
      message: 'מתנה ממנהל החנות - תודה על הנאמנות!',
    },
    {
      code: 'GIFT200',
      initialBalance: '200.00',
      currentBalance: '150.00',
      status: 'active' as const,
      recipientEmail: 'customer2@demo.com',
      recipientName: 'לקוח שני',
      senderName: 'משפחת כהן',
      message: 'יום הולדת שמח!',
    },
    {
      code: 'GIFT100',
      initialBalance: '100.00',
      currentBalance: '0.00',
      status: 'used' as const,
      recipientEmail: 'customer3@demo.com',
      recipientName: 'לקוח שלישי',
      senderName: '',
      message: '',
    },
  ];

  for (const giftCard of giftCardsData) {
    await db.insert(schema.giftCards).values({
      storeId: store.id,
      ...giftCard,
    });
  }
  console.log(`   ✓ Created ${giftCardsData.length} gift cards`);

  console.log('\n✅ Seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Platform settings initialized`);
  console.log(`   - Plugin pricing defaults set`);
  console.log(`   - 5 Users (owner + 4 team members)`);
  console.log(`   - 1 Store (${store.name})`);
  console.log(`   - ${categories.length} Categories`);
  console.log(`   - ${products.length} Products`);
  console.log(`   - ${customers.length} Customers`);
  console.log(`   - ${orderCount} Orders`);
  console.log(`   - ${discountsData.length} Discount codes`);
  console.log(`   - ${giftCardsData.length} Gift cards`);
  console.log(`   - ${sectionsData.length} Page sections`);
  console.log(`\n🔗 Store URL: /shops/${store.slug}`);
  console.log(`🔗 Admin URL: /shops/${store.slug}/admin`);
  console.log(`\n👤 Demo Users (password: 12345678):`);
  console.log(`   - admin@admin.com (בעלים)`);
  console.log(`   - manager@demo.com (מנהל)`);
  console.log(`   - marketing@demo.com (שיווק)`);
  console.log(`   - developer@demo.com (מפתח)`);
  console.log(`   - influencer@demo.com (משפיען)`);
  console.log(`\n🎟️ Demo Coupons:`);
  discountsData.forEach(d => {
    console.log(`   - ${d.code}: ${d.title}${d.minimumAmount !== '0' ? ` (מינימום ₪${d.minimumAmount})` : ''}`);
  });
  console.log(`\n🎁 Demo Gift Cards:`);
  giftCardsData.forEach(g => {
    console.log(`   - ${g.code}: ₪${g.initialBalance} (יתרה: ₪${g.currentBalance})`);
  });
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
