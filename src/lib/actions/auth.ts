'use server';

import { db } from '@/lib/db';
import { users, stores, pageSections, categories, products, productImages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signIn, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email';
import crypto from 'crypto';

// ============ REGISTER ============

interface RegisterData {
  name: string;
  email: string;
  password: string;
  storeName: string;
}

export async function register(data: RegisterData) {
  try {
    // Validate inputs
    if (!data.name || !data.email || !data.password || !data.storeName) {
      return { success: false, error: 'כל השדות הם חובה' };
    }

    if (data.password.length < 8) {
      return { success: false, error: 'הסיסמה חייבת להכיל לפחות 8 תווים' };
    }

    // Validate store name - only English letters, numbers, spaces, hyphens, and underscores
    const storeNameRegex = /^[a-zA-Z0-9\s_-]+$/;
    if (!storeNameRegex.test(data.storeName)) {
      return { success: false, error: 'שם החנות יכול להכיל רק אותיות אנגליות, מספרים, רווחים, מקפים ותווים תחתונים' };
    }

    // Check if store name contains at least one English letter or number
    const hasValidChars = /[a-zA-Z0-9]/.test(data.storeName);
    if (!hasValidChars) {
      return { success: false, error: 'שם החנות חייב להכיל לפחות אות אנגלית אחת או מספר' };
    }

    // Check if email exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return { success: false, error: 'האימייל כבר קיים במערכת' };
    }

    // Generate store slug
    const baseSlug = data.storeName
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

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const [user] = await db.insert(users).values({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      role: 'merchant',
    }).returning();

    // Create store
    const [newStore] = await db.insert(stores).values({
      ownerId: user.id,
      name: data.storeName,
      slug,
      currency: 'ILS',
      isPublished: false, // Start with Coming Soon
      settings: {
        contact_email: data.email.toLowerCase(),
      },
      themeSettings: {
        primary_color: '#1a1a1a',
        secondary_color: '#666666',
      },
      seoSettings: {
        meta_title: data.storeName,
      },
    }).returning();

    // Create default Noir template sections for home page
    await db.insert(pageSections).values([
      // Hero Section
      {
        storeId: newStore.id,
        page: 'home',
        type: 'hero',
        title: data.storeName.toUpperCase(),
        subtitle: 'ברוכים הבאים לחנות שלנו',
        content: {
          imageUrl: 'https://static.zara.net/assets/public/7d17/93b6/642f4cafb9ab/b570acca9761/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0.jpg?ts=1760467352233&w=3420',
          buttonLink: '#products',
          buttonText: 'גלה את הקולקציה',
        },
        settings: {
          height: '90vh',
          overlay: 0.1,
        },
        sortOrder: 0,
        isActive: true,
      },
      // Categories Section - show all categories
      {
        storeId: newStore.id,
        page: 'home',
        type: 'categories',
        title: null,
        subtitle: null,
        content: {
          showAll: true,
          categoryIds: [], // Empty = show all
        },
        settings: {
          gap: 8,
          columns: 4,
        },
        sortOrder: 1,
        isActive: true,
      },
      // Products Section - featured
      {
        storeId: newStore.id,
        page: 'home',
        type: 'products',
        title: 'פריטים נבחרים',
        subtitle: 'הבחירות שלנו לעונה',
        content: {
          type: 'all',
          limit: 4,
        },
        settings: {
          gap: 8,
          columns: 4,
        },
        sortOrder: 2,
        isActive: true,
      },
      // Video Banner Section
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
        settings: {
          height: '80vh',
          overlay: 0.2,
        },
        sortOrder: 3,
        isActive: true,
      },
      // Split Banner Section
      {
        storeId: newStore.id,
        page: 'home',
        type: 'split_banner',
        title: null,
        subtitle: null,
        content: {
          items: [
            {
              link: '/products',
              title: 'נשים',
              imageUrl: 'https://static.zara.net/assets/public/024c/0dd8/e19e4df78c61/f20fd99a35d2/02335629250-p/02335629250-p.jpg?ts=1752493031914&w=1230',
            },
            {
              link: '/products',
              title: 'גברים',
              imageUrl: 'https://static.zara.net/assets/public/a132/8434/0ddd438dbcef/110f9ea930b3/05939539716-p/05939539716-p.jpg?ts=1758270012870&w=2560',
            },
          ],
        },
        settings: {
          height: '70vh',
        },
        sortOrder: 4,
        isActive: true,
      },
      // All Products Section
      {
        storeId: newStore.id,
        page: 'home',
        type: 'products',
        title: 'כל המוצרים',
        subtitle: null,
        content: {
          type: 'all',
          limit: 8,
        },
        settings: {
          gap: 8,
          columns: 4,
          showCount: true,
        },
        sortOrder: 5,
        isActive: true,
      },
      // Newsletter Section
      {
        storeId: newStore.id,
        page: 'home',
        type: 'newsletter',
        title: 'הצטרפו למועדון',
        subtitle: 'הרשמו לניוזלטר וקבלו 15% הנחה על ההזמנה הראשונה',
        content: {
          buttonText: 'הרשמה',
          placeholder: 'כתובת אימייל',
        },
        settings: {
          maxWidth: 'xl',
        },
        sortOrder: 6,
        isActive: true,
      },
    ]);

    // Create default Coming Soon sections
    await db.insert(pageSections).values([
      {
        storeId: newStore.id,
        page: 'coming_soon',
        type: 'hero',
        title: 'Coming Soon',
        subtitle: data.storeName,
        content: {
          imageUrl: 'https://static.zara.net/assets/public/7d17/93b6/642f4cafb9ab/b570acca9761/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0/image-landscape-d9c8c30a-51dc-4c2c-a132-17471fd14151-default_0.jpg?ts=1760467352233&w=3420',
          buttonText: '',
          buttonLink: '',
        },
        settings: {
          height: '100vh',
          overlay: 0.6,
        },
        sortOrder: 0,
        isActive: true,
      },
      {
        storeId: newStore.id,
        page: 'coming_soon',
        type: 'newsletter',
        title: 'הישארו מעודכנים',
        subtitle: 'אנחנו עובדים על משהו מיוחד. השאירו את האימייל שלכם ונעדכן אתכם כשנפתח.',
        content: {
          placeholder: 'כתובת אימייל',
          buttonText: 'עדכנו אותי',
        },
        settings: {
          maxWidth: '500px',
        },
        sortOrder: 1,
        isActive: true,
      },
    ]);

    // Create 4 demo categories (Noir template style)
    const demoCategoriesData = [
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

    // Map category slugs to IDs
    const categoryMap = Object.fromEntries(
      demoCategories.map(c => [c.slug, c.id])
    );

    // Create 4 demo products (one from each category)
    const demoProductsData = [
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
        isFeatured: p.isFeatured,
        isActive: true,
        createdBy: user.id,
        updatedBy: user.id,
      }))
    ).returning();

    // Create product images for demo products
    await db.insert(productImages).values(
      demoProductsData.map((p, i) => ({
        productId: demoProducts[i].id,
        url: p.image,
        alt: p.name,
        isPrimary: true,
        sortOrder: 0,
      }))
    );

    // Send welcome email (don't await - fire and forget)
    sendWelcomeEmail(user.email, user.name || undefined, data.storeName).catch(console.error);

    return { success: true, userId: user.id, storeSlug: slug };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'שגיאה בהרשמה. נסה שוב.' };
  }
}

// ============ LOGIN ============

export async function login(email: string, password: string) {
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'שגיאה בהתחברות';
    // Auth.js throws errors with specific messages
    if (errorMessage.includes('אימייל או סיסמה שגויים')) {
      return { success: false, error: 'אימייל או סיסמה שגויים' };
    }
    if (errorMessage.includes('אנא התחבר באמצעות Google')) {
      return { success: false, error: 'החשבון הזה מחובר ל-Google. התחבר באמצעות Google.' };
    }
    return { success: false, error: 'שגיאה בהתחברות. נסה שוב.' };
  }
}

// ============ GOOGLE LOGIN ============

export async function loginWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' });
}

// ============ FORGOT PASSWORD ============

// Store reset tokens (in production, use Redis or DB table)
const resetTokens = new Map<string, { email: string; expires: Date }>();

export async function forgotPassword(email: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, {
      email: user.email,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Send email
    await sendPasswordResetEmail(user.email, token, user.name || undefined);

    return { success: true };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { success: false, error: 'שגיאה בשליחת המייל. נסה שוב.' };
  }
}

// ============ RESET PASSWORD ============

export async function resetPassword(token: string, newPassword: string) {
  try {
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return { success: false, error: 'קישור לא תקין או פג תוקף' };
    }

    if (tokenData.expires < new Date()) {
      resetTokens.delete(token);
      return { success: false, error: 'הקישור פג תוקף. בקש קישור חדש.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'הסיסמה חייבת להכיל לפחות 8 תווים' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.email, tokenData.email));

    resetTokens.delete(token);

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'שגיאה באיפוס הסיסמה. נסה שוב.' };
  }
}

// ============ VERIFY EMAIL ============

const verificationTokens = new Map<string, { email: string; expires: Date }>();

export async function sendVerificationToken(email: string) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return { success: false, error: 'משתמש לא נמצא' };
    }

    if (user.emailVerifiedAt) {
      return { success: false, error: 'האימייל כבר מאומת' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    verificationTokens.set(token, {
      email: user.email,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await sendVerificationEmail(user.email, token, user.name || undefined);

    return { success: true };
  } catch (error) {
    console.error('Send verification error:', error);
    return { success: false, error: 'שגיאה בשליחת המייל. נסה שוב.' };
  }
}

export async function verifyEmail(token: string) {
  try {
    const tokenData = verificationTokens.get(token);
    
    if (!tokenData) {
      return { success: false, error: 'קישור לא תקין' };
    }

    if (tokenData.expires < new Date()) {
      verificationTokens.delete(token);
      return { success: false, error: 'הקישור פג תוקף. בקש קישור חדש.' };
    }

    await db
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.email, tokenData.email));

    verificationTokens.delete(token);

    return { success: true };
  } catch (error) {
    console.error('Verify email error:', error);
    return { success: false, error: 'שגיאה באימות האימייל. נסה שוב.' };
  }
}

// ============ LOGOUT ============

export async function logout() {
  await signOut({ redirectTo: '/login' });
}

