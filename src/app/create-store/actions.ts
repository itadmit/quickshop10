'use server';

import { db } from '@/lib/db';
import { stores, pageSections, categories, products, productImages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface CreateStoreInput {
  userId: string;
  userEmail: string;
  storeName: string;
}

export async function createStoreForUser({ userId, userEmail, storeName }: CreateStoreInput) {
  try {
    // Validate store name
    const storeNameRegex = /^[a-zA-Z0-9\s_-]+$/;
    if (!storeNameRegex.test(storeName)) {
      return { success: false, error: 'שם החנות יכול להכיל רק אותיות אנגליות, מספרים, רווחים, מקפים ותווים תחתונים' };
    }

    // Generate store slug
    const baseSlug = storeName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug exists and add suffix if needed
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const [existingStore] = await db
        .select()
        .from(stores)
        .where(eq(stores.slug, slug))
        .limit(1);
      
      if (!existingStore) break;
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    // Create store
    const [newStore] = await db.insert(stores).values({
      ownerId: userId,
      name: storeName,
      slug,
      currency: 'ILS',
      isPublished: false,
      settings: {
        contact_email: userEmail,
      },
      themeSettings: {
        primary_color: '#1a1a1a',
        secondary_color: '#666666',
      },
      seoSettings: {
        meta_title: storeName,
      },
    }).returning();

    // Create homepage sections (Noir template)
    await db.insert(pageSections).values([
      {
        storeId: newStore.id,
        page: 'home',
        type: 'hero',
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
        storeId: newStore.id,
        page: 'home',
        type: 'categories',
        title: null,
        subtitle: null,
        content: { showAll: true, categoryIds: [] },
        settings: { gap: 8, columns: 4 },
        sortOrder: 1,
        isActive: true,
      },
      {
        storeId: newStore.id,
        page: 'home',
        type: 'products',
        title: 'פריטים נבחרים',
        subtitle: 'הבחירות שלנו לעונה',
        content: { type: 'all', limit: 4 },
        settings: { gap: 8, columns: 4 },
        sortOrder: 2,
        isActive: true,
      },
      {
        storeId: newStore.id,
        page: 'home',
        type: 'video_banner',
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
        storeId: newStore.id,
        page: 'home',
        type: 'split_banner',
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
        storeId: newStore.id,
        page: 'home',
        type: 'products',
        title: 'כל המוצרים',
        subtitle: null,
        content: { type: 'all', limit: 8 },
        settings: { gap: 8, columns: 4, showCount: true },
        sortOrder: 5,
        isActive: true,
      },
      {
        storeId: newStore.id,
        page: 'home',
        type: 'newsletter',
        title: 'הצטרפו למועדון',
        subtitle: 'הרשמו לניוזלטר וקבלו 15% הנחה על ההזמנה הראשונה',
        content: { buttonText: 'הרשמה', placeholder: 'כתובת אימייל' },
        settings: { maxWidth: 'xl' },
        sortOrder: 6,
        isActive: true,
      },
    ]);

    // Create Coming Soon page sections
    await db.insert(pageSections).values([
      {
        storeId: newStore.id,
        page: 'coming_soon',
        type: 'hero',
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
        storeId: newStore.id,
        page: 'coming_soon',
        type: 'newsletter',
        title: 'הישארו מעודכנים',
        subtitle: 'אנחנו עובדים על משהו מיוחד. השאירו את האימייל שלכם ונעדכן אתכם כשנפתח.',
        content: { placeholder: 'כתובת אימייל', buttonText: 'עדכנו אותי' },
        settings: { maxWidth: '500px' },
        sortOrder: 1,
        isActive: true,
      },
    ]);

    // Create 4 demo categories
    const demoCategoriesData = [
      { name: 'נשים', slug: 'women', description: 'קולקציית נשים - שמלות, חולצות, מכנסיים ועוד', image: 'https://static.zara.net/assets/public/024c/0dd8/e19e4df78c61/f20fd99a35d2/02335629250-p/02335629250-p.jpg?ts=1752493031914&w=1230' },
      { name: 'גברים', slug: 'men', description: 'קולקציית גברים - חולצות, מכנסיים, ג\'קטים', image: 'https://static.zara.net/assets/public/a132/8434/0ddd438dbcef/110f9ea930b3/05939539716-p/05939539716-p.jpg?ts=1758270012870&w=2560' },
      { name: 'אקססוריז', slug: 'accessories', description: 'תיקים, צעיפים, כובעים ואקססוריז', image: 'https://static.zara.net/assets/public/37ee/81ce/ffdf4034b1d2/3c9f4df6f6e3/20210283999-e1/20210283999-e1.jpg?ts=1755858923353&w=980' },
      { name: 'נעליים', slug: 'shoes', description: 'נעליים לנשים וגברים', image: 'https://static.zara.net/assets/public/5347/7726/fe614fdd88bd/cd30a6e6476c/12245620800-e1/12245620800-e1.jpg?ts=1758789586285&w=980' },
    ];

    const demoCategories = await db.insert(categories).values(
      demoCategoriesData.map((cat, i) => ({
        storeId: newStore.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.image,
        sortOrder: i,
        isActive: true,
      }))
    ).returning();

    const categoryMap = Object.fromEntries(demoCategories.map(c => [c.slug, c.id]));

    // Create 4 demo products
    const demoProductsData = [
      { categorySlug: 'women', name: 'שמלת מידי סאטן', slug: 'satin-midi-dress', shortDescription: 'שמלת סאטן אלגנטית באורך מידי', description: 'שמלת סאטן איכותית עם מחשוף V ושרוולים קצרים.', price: '389.00', comparePrice: '489.00', inventory: 30, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80' },
      { categorySlug: 'men', name: 'מעיל צמר ארוך', slug: 'long-wool-coat', shortDescription: 'מעיל צמר איכותי באורך ברך', description: 'מעיל צמר מעורב באורך ברך. גזרה ישרה עם צווארון רחב.', price: '799.00', comparePrice: '999.00', inventory: 15, image: 'https://image.hm.com/content/dam/global_campaigns/season_03/men/start-page-assets/wk01/Shirts-MCE-wk01-04-2x3.jpg?imwidth=1536' },
      { categorySlug: 'accessories', name: 'תיק צד מעור', slug: 'leather-crossbody-bag', shortDescription: 'תיק צד קומפקטי מעור אמיתי', description: 'תיק צד מעור בקר איכותי עם רצועה מתכווננת.', price: '459.00', comparePrice: null, inventory: 35, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80' },
      { categorySlug: 'shoes', name: 'מגפי עור שחורים', slug: 'black-leather-boots', shortDescription: 'מגפי עור קלאסיים עם עקב בלוק', description: 'מגפי עור אמיתי עם עקב בלוק יציב בגובה 5 ס"מ.', price: '599.00', comparePrice: '749.00', inventory: 20, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80' },
    ];

    const demoProducts = await db.insert(products).values(
      demoProductsData.map(p => ({
        storeId: newStore.id,
        categoryId: categoryMap[p.categorySlug],
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

    // Create product images
    await db.insert(productImages).values(
      demoProductsData.map((p, i) => ({
        productId: demoProducts[i].id,
        url: p.image,
        alt: p.name,
        isPrimary: true,
        sortOrder: 0,
      }))
    );

    revalidatePath('/dashboard');

    return { success: true, storeSlug: slug };
  } catch (error) {
    console.error('Error creating store:', error);
    return { success: false, error: 'שגיאה ביצירת החנות. נסה שוב.' };
  }
}

