import { db } from '@/lib/db';
import { 
  pages, 
  pageSections, 
  menus, 
  menuItems, 
  categories, 
  products, 
  productImages,
  productCategories,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// Default Pages, Menus & Demo Content for Stores
// Created automatically when a store is created
// Also used for store reset functionality
// ============================================

// Default pages configuration
const DEFAULT_PAGES = [
  {
    title: 'אודות',
    slug: 'about',
    seoTitle: 'אודות | {storeName}',
    seoDescription: 'למדו עוד על {storeName}',
    content: {
      text: `<h2>אודות {storeName}</h2>
<p>ברוכים הבאים לחנות שלנו!</p>
<p>אנחנו גאים להציע לכם את המוצרים האיכותיים ביותר עם שירות מעולה.</p>
<p>נשמח לעמוד לשירותכם בכל שאלה.</p>`,
    },
  },
  {
    title: 'צור קשר',
    slug: 'contact',
    seoTitle: 'צור קשר | {storeName}',
    seoDescription: 'צרו איתנו קשר - {storeName}',
    content: {
      text: `<h2>צור קשר</h2>
<p>נשמח לשמוע מכם!</p>
<p><strong>אימייל:</strong> contact@example.com</p>
<p><strong>טלפון:</strong> 03-1234567</p>
<p><strong>שעות פעילות:</strong> ימים א'-ה' 9:00-18:00</p>`,
    },
  },
  {
    title: 'משלוחים',
    slug: 'shipping',
    seoTitle: 'מדיניות משלוחים | {storeName}',
    seoDescription: 'מידע על משלוחים ומשלוח חינם',
    content: {
      text: `<h2>מדיניות משלוחים</h2>
<h3>זמני משלוח</h3>
<p>משלוחים מגיעים תוך 3-5 ימי עסקים.</p>
<h3>עלויות משלוח</h3>
<p>משלוח רגיל: ₪30</p>
<p>משלוח מהיר (1-2 ימי עסקים): ₪50</p>
<h3>משלוח חינם</h3>
<p>בהזמנות מעל ₪300 - משלוח חינם!</p>`,
    },
  },
  {
    title: 'מדיניות הנגשה',
    slug: 'accessibility',
    seoTitle: 'הצהרת נגישות | {storeName}',
    seoDescription: 'מידע על נגישות האתר',
    content: {
      text: `<h2>הצהרת נגישות</h2>
<p>אנו מחויבים להנגשת האתר לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות.</p>
<p>האתר תוכנן ונבנה בהתאם להנחיות הנגישות WCAG 2.1 ברמה AA.</p>
<h3>פעולות שננקטו</h3>
<ul>
<li>התאמה לקוראי מסך</li>
<li>ניגודיות צבעים מותאמת</li>
<li>תמיכה בניווט מקלדת</li>
<li>טקסט חלופי לתמונות</li>
</ul>
<p>לכל שאלה או בעיה בנגישות, אנא צרו קשר.</p>`,
    },
  },
  {
    title: 'מדיניות פרטיות',
    slug: 'privacy',
    seoTitle: 'מדיניות פרטיות | {storeName}',
    seoDescription: 'מידע על איסוף ושימוש בנתונים',
    content: {
      text: `<h2>מדיניות פרטיות</h2>
<p>אנו מכבדים את פרטיותכם ומחויבים להגן על המידע האישי שלכם.</p>
<h3>איזה מידע אנו אוספים?</h3>
<p>שם, כתובת אימייל, כתובת למשלוח, ופרטי תשלום לצורך ביצוע הזמנות.</p>
<h3>כיצד אנו משתמשים במידע?</h3>
<p>המידע משמש לעיבוד הזמנות, שירות לקוחות, ושיפור חווית הקנייה.</p>
<h3>אבטחת מידע</h3>
<p>אנו משתמשים בטכנולוגיות הצפנה מתקדמות להגנה על המידע שלכם.</p>`,
    },
  },
];

/**
 * Create default pages for a new store
 * Creates both the pages records and their initial text_block sections
 */
export async function createDefaultPages(storeId: string, storeName: string) {
  const createdPages: Array<{ id: string; slug: string; title: string }> = [];

  for (const pageData of DEFAULT_PAGES) {
    // Replace {storeName} placeholder
    const title = pageData.title;
    const seoTitle = pageData.seoTitle.replace('{storeName}', storeName);
    const seoDescription = pageData.seoDescription.replace('{storeName}', storeName);
    const text = pageData.content.text.replace(/{storeName}/g, storeName);

    // Create page record
    const [page] = await db.insert(pages).values({
      storeId,
      title,
      slug: pageData.slug,
      isPublished: true, // Published by default
      seoTitle,
      seoDescription,
    }).returning();

    createdPages.push({ id: page.id, slug: page.slug, title: page.title });

    // Create page section (text_block)
    const pageIdentifier = `pages/${pageData.slug}`;
    await db.insert(pageSections).values({
      storeId,
      page: pageIdentifier,
      type: 'text_block',
      title: null,
      subtitle: null,
      content: { text },
      settings: {
        maxWidth: 'lg',
        textAlign: 'right',
        paddingY: 'large',
      },
      sortOrder: 0,
      isActive: true,
    });
  }

  return createdPages;
}

/**
 * Create default menus for a new store
 * Creates a footer menu with links to default pages
 */
export async function createDefaultMenus(storeId: string, createdPages: Array<{ id: string; slug: string; title: string }>) {
  // Create footer menu
  const [footerMenu] = await db.insert(menus).values({
    storeId,
    name: 'תפריט תחתון',
    handle: 'footer',
  }).returning();

  // Create menu items linking to the default pages
  const pageSlugOrder = ['about', 'contact', 'shipping', 'privacy', 'accessibility'];
  
  const menuItemsToCreate = pageSlugOrder
    .map((slug, index) => {
      const page = createdPages.find(p => p.slug === slug);
      if (!page) return null;
      return {
        menuId: footerMenu.id,
        title: page.title,
        linkType: 'page' as const,
        linkResourceId: page.id,
        sortOrder: index,
        isActive: true,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (menuItemsToCreate.length > 0) {
    await db.insert(menuItems).values(menuItemsToCreate);
  }

  // Also create main menu (empty, user will customize)
  await db.insert(menus).values({
    storeId,
    name: 'תפריט ראשי',
    handle: 'main',
  });

  return footerMenu.id;
}

/**
 * Initialize default content for a new store
 * Call this after store creation
 */
export async function initializeStoreDefaults(storeId: string, storeName: string) {
  // Create default pages
  const createdPages = await createDefaultPages(storeId, storeName);
  
  // Create default menus with links to pages
  await createDefaultMenus(storeId, createdPages);
  
  return { pagesCreated: createdPages.length };
}

// ============================================
// Demo Content Configuration
// ============================================

// Section types for type safety
type SectionType = 'hero' | 'banner' | 'split_banner' | 'video_banner' | 'categories' | 'products' | 'newsletter' | 'custom' | 'reviews' | 'image_text' | 'features' | 'banner_small' | 'gallery' | 'text_block' | 'logos' | 'faq' | 'hero_slider' | 'series_grid' | 'quote_banner' | 'hero_premium' | 'featured_items';

// Homepage sections (Noir template style)
function getDefaultHomeSections(storeId: string, storeName: string) {
  return [
    {
      storeId,
      page: 'home',
      type: 'hero' as SectionType,
      title: storeName.toUpperCase(),
      subtitle: 'ברוכים הבאים לחנות שלנו',
      content: {
        imageUrl: 'https://static.zara.net/assets/public/7d17/93b6/642f4cafb9ab/b570acca9761/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0.jpg?ts=1760467352233&w=3420',
        buttonLink: '#products',
        buttonText: 'גלה את הקולקציה',
      },
      settings: { height: '90vh', overlay: 0.1 },
      sortOrder: 0,
      isActive: true,
    },
    {
      storeId,
      page: 'home',
      type: 'categories' as SectionType,
      title: null,
      subtitle: null,
      content: { showAll: true, categoryIds: [] },
      settings: { gap: 8, columns: 4 },
      sortOrder: 1,
      isActive: true,
    },
    {
      storeId,
      page: 'home',
      type: 'products' as SectionType,
      title: 'פריטים נבחרים',
      subtitle: 'הבחירות שלנו לעונה',
      content: { type: 'all', limit: 4 },
      settings: { gap: 8, columns: 4 },
      sortOrder: 2,
      isActive: true,
    },
    {
      storeId,
      page: 'home',
      type: 'video_banner' as SectionType,
      title: 'קולקציה חדשה',
      subtitle: 'חדש בחנות',
      content: {
        videoUrl: 'https://image.hm.com/content/dam/global_campaigns/season_02/women/9000d/9000D-W-6C-16x9-women-spoil.mp4',
        buttonLink: '/products',
        buttonText: 'לצפייה בקולקציה',
      },
      settings: { height: '80vh', overlay: 0.2 },
      sortOrder: 3,
      isActive: true,
    },
    {
      storeId,
      page: 'home',
      type: 'split_banner' as SectionType,
      title: null,
      subtitle: null,
      content: {
        items: [
          { link: '/products', title: 'נשים', imageUrl: 'https://static.zara.net/assets/public/024c/0dd8/e19e4df78c61/f20fd99a35d2/02335629250-p/02335629250-p.jpg?ts=1752493031914&w=1230' },
          { link: '/products', title: 'גברים', imageUrl: 'https://static.zara.net/assets/public/a132/8434/0ddd438dbcef/110f9ea930b3/05939539716-p/05939539716-p.jpg?ts=1758270012870&w=2560' },
        ],
      },
      settings: { height: '70vh' },
      sortOrder: 4,
      isActive: true,
    },
    {
      storeId,
      page: 'home',
      type: 'products' as SectionType,
      title: 'כל המוצרים',
      subtitle: null,
      content: { type: 'all', limit: 8 },
      settings: { gap: 8, columns: 4, showCount: true },
      sortOrder: 5,
      isActive: true,
    },
    {
      storeId,
      page: 'home',
      type: 'newsletter' as SectionType,
      title: 'הצטרפו למועדון',
      subtitle: 'הרשמו לניוזלטר וקבלו 15% הנחה על ההזמנה הראשונה',
      content: { buttonText: 'הרשמה', placeholder: 'כתובת אימייל' },
      settings: { maxWidth: 'xl' },
      sortOrder: 6,
      isActive: true,
    },
  ];
}

// Coming Soon page sections
function getDefaultComingSoonSections(storeId: string, storeName: string) {
  return [
    {
      storeId,
      page: 'coming_soon',
      type: 'hero' as SectionType,
      title: 'Coming Soon',
      subtitle: storeName,
      content: {
        imageUrl: 'https://static.zara.net/assets/public/7d17/93b6/642f4cafb9ab/b570acca9761/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0.jpg?ts=1760467352233&w=3420',
        buttonText: '',
        buttonLink: '',
      },
      settings: { height: '100vh', overlay: 0.6 },
      sortOrder: 0,
      isActive: true,
    },
    {
      storeId,
      page: 'coming_soon',
      type: 'newsletter' as SectionType,
      title: 'הישארו מעודכנים',
      subtitle: 'אנחנו עובדים על משהו מיוחד. השאירו את האימייל שלכם ונעדכן אתכם כשנפתח.',
      content: { placeholder: 'כתובת אימייל', buttonText: 'עדכנו אותי' },
      settings: { maxWidth: '500px' },
      sortOrder: 1,
      isActive: true,
    },
  ];
}

// Demo categories
const DEMO_CATEGORIES = [
  { name: 'נשים', slug: 'women', description: 'קולקציית נשים - שמלות, חולצות, מכנסיים ועוד', image: 'https://static.zara.net/assets/public/024c/0dd8/e19e4df78c61/f20fd99a35d2/02335629250-p/02335629250-p.jpg?ts=1752493031914&w=1230' },
  { name: 'גברים', slug: 'men', description: 'קולקציית גברים - חולצות, מכנסיים, ג\'קטים', image: 'https://static.zara.net/assets/public/a132/8434/0ddd438dbcef/110f9ea930b3/05939539716-p/05939539716-p.jpg?ts=1758270012870&w=2560' },
  { name: 'אקססוריז', slug: 'accessories', description: 'תיקים, צעיפים, כובעים ואקססוריז', image: 'https://static.zara.net/assets/public/37ee/81ce/ffdf4034b1d2/3c9f4df6f6e3/20210283999-e1/20210283999-e1.jpg?ts=1755858923353&w=980' },
  { name: 'נעליים', slug: 'shoes', description: 'נעליים לנשים וגברים', image: 'https://static.zara.net/assets/public/5347/7726/fe614fdd88bd/cd30a6e6476c/12245620800-e1/12245620800-e1.jpg?ts=1758789586285&w=980' },
];

// Demo products
const DEMO_PRODUCTS = [
  { categorySlug: 'women', name: 'שמלת מידי סאטן', slug: 'satin-midi-dress', shortDescription: 'שמלת סאטן אלגנטית באורך מידי', description: 'שמלת סאטן איכותית עם מחשוף V ושרוולים קצרים.', price: '389.00', comparePrice: '489.00', inventory: 30, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80' },
  { categorySlug: 'men', name: 'מעיל צמר ארוך', slug: 'long-wool-coat', shortDescription: 'מעיל צמר איכותי באורך ברך', description: 'מעיל צמר מעורב באורך ברך. גזרה ישרה עם צווארון רחב.', price: '799.00', comparePrice: '999.00', inventory: 15, image: 'https://image.hm.com/content/dam/global_campaigns/season_03/men/start-page-assets/wk01/Shirts-MCE-wk01-04-2x3.jpg?imwidth=1536' },
  { categorySlug: 'accessories', name: 'תיק צד מעור', slug: 'leather-crossbody-bag', shortDescription: 'תיק צד קומפקטי מעור אמיתי', description: 'תיק צד מעור בקר איכותי עם רצועה מתכווננת.', price: '459.00', comparePrice: null, inventory: 35, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80' },
  { categorySlug: 'shoes', name: 'מגפי עור שחורים', slug: 'black-leather-boots', shortDescription: 'מגפי עור קלאסיים עם עקב בלוק', description: 'מגפי עור אמיתי עם עקב בלוק יציב בגובה 5 ס"מ.', price: '599.00', comparePrice: '749.00', inventory: 20, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80' },
];

/**
 * Create default home page sections
 */
export async function createDefaultHomeSections(storeId: string, storeName: string) {
  const sections = getDefaultHomeSections(storeId, storeName);
  await db.insert(pageSections).values(sections);
}

/**
 * Create Coming Soon page sections
 */
export async function createDefaultComingSoonSections(storeId: string, storeName: string) {
  const sections = getDefaultComingSoonSections(storeId, storeName);
  await db.insert(pageSections).values(sections);
}

/**
 * Create demo categories
 */
export async function createDemoCategories(storeId: string) {
  const createdCategories = await db.insert(categories).values(
    DEMO_CATEGORIES.map((cat, i) => ({
      storeId,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.image,
      sortOrder: i,
      isActive: true,
    }))
  ).returning();

  return Object.fromEntries(createdCategories.map(c => [c.slug, c.id]));
}

/**
 * Create demo products
 */
export async function createDemoProducts(
  storeId: string, 
  categoryMap: Record<string, string>, 
  userId: string
) {
  const demoProducts = await db.insert(products).values(
    DEMO_PRODUCTS.map(p => ({
      storeId,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice,
      inventory: p.inventory,
      isFeatured: true,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    }))
  ).returning();

  // Create product-category relationships
  await db.insert(productCategories).values(
    DEMO_PRODUCTS.map((p, i) => ({
      productId: demoProducts[i].id,
      categoryId: categoryMap[p.categorySlug],
    }))
  );

  // Create product images
  await db.insert(productImages).values(
    DEMO_PRODUCTS.map((p, i) => ({
      productId: demoProducts[i].id,
      url: p.image,
      alt: p.name,
      isPrimary: true,
      sortOrder: 0,
    }))
  );

  return demoProducts;
}

/**
 * Create all default content for a store
 * Used by both store creation and store reset
 */
export async function createAllStoreDefaults(
  storeId: string, 
  storeName: string, 
  userId: string
) {
  // 1. Create home page sections
  await createDefaultHomeSections(storeId, storeName);

  // 2. Create coming soon sections
  await createDefaultComingSoonSections(storeId, storeName);

  // 3. Create default internal pages (about, contact, etc.) and footer menu
  const createdPages = await createDefaultPages(storeId, storeName);
  await createDefaultMenus(storeId, createdPages);

  // 4. Create demo categories
  const categoryMap = await createDemoCategories(storeId);

  // 5. Create demo products
  await createDemoProducts(storeId, categoryMap, userId);

  return { 
    pagesCreated: createdPages.length,
    categoriesCreated: DEMO_CATEGORIES.length,
    productsCreated: DEMO_PRODUCTS.length,
  };
}

/**
 * Reset store to defaults - deletes existing content and recreates defaults
 * WARNING: This is destructive! Only use when user explicitly requests reset
 */
export async function resetStoreToDefaults(
  storeId: string, 
  storeName: string, 
  userId: string
) {
  // Delete existing content in order (respecting foreign keys)
  // Note: We don't delete orders, customers, or other business data
  
  // 1. Delete menu items first (references menus)
  const existingMenus = await db.query.menus.findMany({
    where: eq(menus.storeId, storeId),
    columns: { id: true },
  });
  for (const menu of existingMenus) {
    await db.delete(menuItems).where(eq(menuItems.menuId, menu.id));
  }
  
  // 2. Delete menus
  await db.delete(menus).where(eq(menus.storeId, storeId));

  // 3. Delete product images (references products)
  const existingProducts = await db.query.products.findMany({
    where: eq(products.storeId, storeId),
    columns: { id: true },
  });
  for (const product of existingProducts) {
    await db.delete(productImages).where(eq(productImages.productId, product.id));
    await db.delete(productCategories).where(eq(productCategories.productId, product.id));
  }
  
  // 4. Delete products
  await db.delete(products).where(eq(products.storeId, storeId));

  // 5. Delete categories
  await db.delete(categories).where(eq(categories.storeId, storeId));

  // 6. Delete page sections
  await db.delete(pageSections).where(eq(pageSections.storeId, storeId));

  // 7. Delete pages
  await db.delete(pages).where(eq(pages.storeId, storeId));

  // Now recreate all defaults
  const result = await createAllStoreDefaults(storeId, storeName, userId);

  return result;
}

