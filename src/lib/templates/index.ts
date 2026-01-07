/**
 * Template System - Server-Side Only
 * All CSS variables are applied on the server - zero client JS!
 * 
 * Each template defines:
 * - CSS variables for styling
 * - Preset sections with demo content
 * - Theme settings defaults
 */

export interface TemplateSection {
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  previewImage: string;
  isPro: boolean;
  
  // CSS Variables - applied server-side
  cssVariables: Record<string, string>;
  
  // Default theme settings
  themeSettings: {
    headerLayout: 'logo-right' | 'logo-center' | 'logo-left';
    headerSticky: boolean;
    headerTransparent: boolean;
    announcementText?: string;
    announcementBg?: string;
    announcementColor?: string;
  };
  
  // Preset sections
  sections: TemplateSection[];
}

// ============================================
// TEMPLATES DEFINITIONS
// ============================================

export const templates: Template[] = [
  // ============================================
  // 1. NOIR - Default Fashion Template
  // ============================================
  {
    id: 'noir',
    name: 'Noir',
    description: 'עיצוב מינימלי יוקרתי בשחור-לבן. מושלם לאופנה.',
    category: 'אופנה',
    previewImage: '/templates/noir-preview.jpg',
    isPro: false,
    
    cssVariables: {
      '--template-primary': '#000000',
      '--template-secondary': '#ffffff',
      '--template-accent': '#1a1a1a',
      '--template-text': '#1a1a1a',
      '--template-text-muted': '#666666',
      '--template-border': '#e5e5e5',
      '--template-bg': '#ffffff',
      '--template-bg-alt': '#fafafa',
      '--template-font-heading': "'Assistant', 'Heebo', sans-serif",
      '--template-font-body': "'Assistant', 'Heebo', sans-serif",
      '--template-radius': '0px',
      '--template-button-style': 'outline',
    },
    
    themeSettings: {
      headerLayout: 'logo-center',
      headerSticky: true,
      headerTransparent: true,
      announcementText: 'משלוח חינם בהזמנה מעל ₪299',
      announcementBg: '#000000',
      announcementColor: '#ffffff',
    },
    
    sections: [
      {
        type: 'hero',
        title: 'NEW COLLECTION',
        subtitle: 'קולקציית סתיו-חורף 2025',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920',
          buttonText: 'לחנות',
          buttonLink: '/products',
        },
        settings: { height: '90vh', overlay: 0.15 },
      },
      {
        type: 'features',
        title: null,
        subtitle: null,
        content: {
          features: [
            { id: '1', icon: 'truck', title: 'משלוח חינם', description: 'בהזמנה מעל ₪299' },
            { id: '2', icon: 'refresh', title: 'החזרות חינם', description: 'עד 30 יום' },
            { id: '3', icon: 'check', title: 'איכות מובטחת', description: '100% שביעות רצון' },
            { id: '4', icon: 'message', title: 'תמיכה', description: 'זמינים בכל שאלה' },
          ],
        },
        settings: { columns: 4, iconStyle: 'emoji', backgroundColor: '#fafafa' },
      },
      {
        type: 'categories',
        title: null,
        subtitle: null,
        content: { showAll: true, limit: 4 },
        settings: { columns: 4, gap: 8 },
      },
      {
        type: 'products',
        title: 'הנבחרים שלנו',
        subtitle: 'פריטים שאהבנו במיוחד',
        content: { type: 'featured', limit: 4 },
        settings: { columns: 4, gap: 8 },
      },
      {
        type: 'split_banner',
        title: null,
        subtitle: null,
        content: {
          right: { title: 'נשים', imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800', link: '/category/women' },
          left: { title: 'גברים', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', link: '/category/men' },
        },
        settings: { height: '70vh' },
      },
      {
        type: 'newsletter',
        title: 'הצטרפו למועדון',
        subtitle: 'קבלו 15% הנחה על ההזמנה הראשונה',
        content: { buttonText: 'הרשמה', placeholder: 'כתובת אימייל' },
        settings: { maxWidth: 'lg' },
      },
    ],
  },

  // ============================================
  // 2. FRESH BEAUTY - Cosmetics Template
  // ============================================
  {
    id: 'fresh-beauty',
    name: 'Fresh Beauty',
    description: 'עיצוב רענן וצעיר. מושלם לקוסמטיקה וטיפוח.',
    category: 'קוסמטיקה',
    previewImage: '/templates/fresh-beauty-preview.jpg',
    isPro: false,
    
    cssVariables: {
      '--template-primary': '#e91e63',
      '--template-secondary': '#fff5f7',
      '--template-accent': '#c2185b',
      '--template-text': '#2d2d2d',
      '--template-text-muted': '#777777',
      '--template-border': '#f0e0e3',
      '--template-bg': '#ffffff',
      '--template-bg-alt': '#fff9fa',
      '--template-font-heading': "'Heebo', 'Assistant', sans-serif",
      '--template-font-body': "'Heebo', 'Assistant', sans-serif",
      '--template-radius': '16px',
      '--template-button-style': 'filled',
    },
    
    themeSettings: {
      headerLayout: 'logo-center',
      headerSticky: true,
      headerTransparent: false,
      announcementText: '✨ מבצע השקה! 20% הנחה על כל האתר',
      announcementBg: '#e91e63',
      announcementColor: '#ffffff',
    },
    
    sections: [
      {
        type: 'hero',
        title: 'Natural Beauty',
        subtitle: 'טיפוח טבעי שעובד',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1920',
          buttonText: 'גלי את הקולקציה',
          buttonLink: '/products',
        },
        settings: { height: '80vh', overlay: 0.2 },
      },
      {
        type: 'features',
        title: 'למה לבחור בנו?',
        subtitle: null,
        content: {
          features: [
            { id: '1', icon: 'sparkles', title: 'טבעי 100%', description: 'ללא כימיקלים מזיקים' },
            { id: '2', icon: 'heart', title: 'Cruelty Free', description: 'לא נבדק על בעלי חיים' },
            { id: '3', icon: 'refresh', title: 'אריזה ירוקה', description: 'ידידותית לסביבה' },
            { id: '4', icon: 'star', title: 'תוצאות מוכחות', description: 'אלפי לקוחות מרוצים' },
          ],
        },
        settings: { columns: 4, iconStyle: 'emoji', backgroundColor: '#fff9fa' },
      },
      {
        type: 'image_text',
        title: 'הסיפור שלנו',
        subtitle: 'נולדנו מתוך אהבה לטבע',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',
          text: '<p>אנחנו מאמינים שיופי אמיתי מגיע מהטבע. כל המוצרים שלנו מיוצרים מחומרי גלם טבעיים ואורגניים, ללא פרבנים וללא ניסויים בבעלי חיים.</p>',
          buttonText: 'קראו עוד',
          buttonLink: '/about',
        },
        settings: { imagePosition: 'right', imageWidth: '50%' },
      },
      {
        type: 'products',
        title: 'הנמכרים ביותר',
        subtitle: 'המוצרים שכולם אוהבים',
        content: { type: 'all', limit: 4 },
        settings: { columns: 4, gap: 8 },
      },
      {
        type: 'reviews',
        title: 'מה הלקוחות אומרים',
        subtitle: null,
        content: {
          reviews: [
            { id: '1', author: 'מיכל כ.', rating: 5, text: 'העור שלי השתנה לחלוטין! ממליצה בחום', verified: true },
            { id: '2', author: 'נועה ש.', rating: 5, text: 'מוצרים מדהימים ומשלוח מהיר', verified: true },
            { id: '3', author: 'שירה ל.', rating: 5, text: 'סוף סוף מצאתי מוצרים שמתאימים לעור רגיש', verified: true },
          ],
        },
        settings: { columns: 3, style: 'cards', showRating: true },
      },
      {
        type: 'gallery',
        title: '#FreshBeauty',
        subtitle: 'הלקוחות שלנו ברשתות',
        content: { images: [] },
        settings: { columns: 4, gap: 4, aspectRatio: 'square' },
      },
      {
        type: 'newsletter',
        title: 'הצטרפי למועדון היופי',
        subtitle: 'טיפים, מבצעים ועדכונים ישירות למייל',
        content: { buttonText: 'הצטרפי עכשיו', placeholder: 'האימייל שלך' },
        settings: { maxWidth: 'md', backgroundColor: '#fff5f7' },
      },
    ],
  },

  // ============================================
  // 3. LUXE JEWELS - Jewelry Template
  // ============================================
  {
    id: 'luxe-jewels',
    name: 'Luxe Jewels',
    description: 'עיצוב יוקרתי ואלגנטי. מושלם לתכשיטים.',
    category: 'תכשיטים',
    previewImage: '/templates/luxe-jewels-preview.jpg',
    isPro: false,
    
    cssVariables: {
      '--template-primary': '#d4af37',
      '--template-secondary': '#1a1a1a',
      '--template-accent': '#b8860b',
      '--template-text': '#ffffff',
      '--template-text-muted': '#999999',
      '--template-border': '#333333',
      '--template-bg': '#0f0f0f',
      '--template-bg-alt': '#1a1a1a',
      '--template-font-heading': "'Noto Sans Hebrew', 'Rubik', sans-serif",
      '--template-font-body': "'Noto Sans Hebrew', 'Rubik', sans-serif",
      '--template-radius': '0px',
      '--template-button-style': 'outline',
    },
    
    themeSettings: {
      headerLayout: 'logo-center',
      headerSticky: true,
      headerTransparent: true,
      announcementText: '💎 משלוח VIP חינם בהזמנה מעל ₪500',
      announcementBg: '#d4af37',
      announcementColor: '#000000',
    },
    
    sections: [
      {
        type: 'hero',
        title: 'TIMELESS ELEGANCE',
        subtitle: 'קולקציית תכשיטים בעיצוב בלעדי',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920',
          buttonText: 'לקולקציה',
          buttonLink: '/products',
        },
        settings: { height: '100vh', overlay: 0.4 },
      },
      {
        type: 'text_block',
        title: 'אומנות בכל פרט',
        subtitle: null,
        content: {
          text: '<p>כל תכשיט בקולקציה שלנו מעוצב ומיוצר בעבודת יד על ידי אומנים מיומנים. אנו משלבים טכניקות מסורתיות עם עיצוב מודרני ליצירת פריטים ייחודיים שיישארו איתך לנצח.</p>',
        },
        settings: { maxWidth: 'lg', textAlign: 'center', paddingY: 'large' },
      },
      {
        type: 'categories',
        title: 'הקולקציות שלנו',
        subtitle: null,
        content: { showAll: true, limit: 4 },
        settings: { columns: 4, gap: 4 },
      },
      {
        type: 'image_text',
        title: 'עיצוב אישי',
        subtitle: 'תכשיט שמספר את הסיפור שלך',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800',
          text: '<p>הזמינו תכשיט מעוצב במיוחד עבורכם. צוות המעצבים שלנו ילווה אתכם מהרעיון ועד לפריט המוגמר.</p>',
          buttonText: 'צרו קשר',
          buttonLink: '/contact',
        },
        settings: { imagePosition: 'left', imageWidth: '50%' },
      },
      {
        type: 'products',
        title: 'הפריטים הנבחרים',
        subtitle: 'בלעדיות מהקולקציה החדשה',
        content: { type: 'featured', limit: 4 },
        settings: { columns: 4, gap: 8 },
      },
      {
        type: 'reviews',
        title: 'חוות דעת',
        subtitle: null,
        content: {
          reviews: [
            { id: '1', author: 'רונית מ.', rating: 5, text: 'קיבלתי המון מחמאות על הטבעת! איכות מדהימה', verified: true },
            { id: '2', author: 'דנה כ.', rating: 5, text: 'שירות מעולה והתכשיט יפהפה', verified: true },
            { id: '3', author: 'אורית ש.', rating: 5, text: 'עיצוב ייחודי שלא מוצאים בשום מקום אחר', verified: true },
          ],
        },
        settings: { columns: 3, style: 'quotes', showRating: true },
      },
      {
        type: 'newsletter',
        title: 'הצטרפו למועדון VIP',
        subtitle: 'גישה ראשונה לקולקציות חדשות והנחות בלעדיות',
        content: { buttonText: 'הצטרפו', placeholder: 'כתובת אימייל' },
        settings: { maxWidth: 'md' },
      },
    ],
  },

  // ============================================
  // 4. SALON PRO - Hair & Beauty Template
  // ============================================
  {
    id: 'salon-pro',
    name: 'Salon Pro',
    description: 'עיצוב מקצועי ומלוטש. מושלם למוצרי שיער וטיפוח.',
    category: 'שיער וטיפוח',
    previewImage: '/templates/salon-pro-preview.jpg',
    isPro: false,
    
    cssVariables: {
      '--template-primary': '#8b5cf6',
      '--template-secondary': '#f5f3ff',
      '--template-accent': '#7c3aed',
      '--template-text': '#1f2937',
      '--template-text-muted': '#6b7280',
      '--template-border': '#e5e7eb',
      '--template-bg': '#ffffff',
      '--template-bg-alt': '#faf5ff',
      '--template-font-heading': "'Rubik', 'Heebo', sans-serif",
      '--template-font-body': "'Rubik', 'Heebo', sans-serif",
      '--template-radius': '12px',
      '--template-button-style': 'filled',
    },
    
    themeSettings: {
      headerLayout: 'logo-right',
      headerSticky: true,
      headerTransparent: false,
      announcementText: '🎁 קנו 2 קבלו 1 חינם על כל המסכות',
      announcementBg: '#8b5cf6',
      announcementColor: '#ffffff',
    },
    
    sections: [
      {
        type: 'hero',
        title: 'שיער בריא מתחיל כאן',
        subtitle: 'מוצרים מקצועיים לתוצאות סלוניות בבית',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920',
          buttonText: 'גלו את המוצרים',
          buttonLink: '/products',
        },
        settings: { height: '85vh', overlay: 0.25 },
      },
      {
        type: 'features',
        title: 'למה הלקוחות בוחרים בנו',
        subtitle: null,
        content: {
          features: [
            { id: '1', icon: 'crown', title: 'מותגים מובילים', description: 'רק מהטובים בעולם' },
            { id: '2', icon: 'sparkles', title: 'מרכיבים איכותיים', description: 'ללא סולפטים וזרחנים' },
            { id: '3', icon: 'star', title: 'תוצאות מוכחות', description: 'כמו בסלון - בבית' },
            { id: '4', icon: 'truck', title: 'משלוח מהיר', description: 'עד 3 ימי עסקים' },
          ],
        },
        settings: { columns: 4, iconStyle: 'emoji', backgroundColor: '#faf5ff' },
      },
      {
        type: 'categories',
        title: 'קטגוריות',
        subtitle: 'מצאו את מה שמתאים לכם',
        content: { showAll: true, limit: 6 },
        settings: { columns: 3, gap: 6 },
      },
      {
        type: 'products',
        title: 'הנמכרים ביותר',
        subtitle: 'המוצרים שהלקוחות אוהבים',
        content: { type: 'all', limit: 8 },
        settings: { columns: 4, gap: 6 },
      },
      {
        type: 'banner_small',
        title: 'ייעוץ מקצועי חינם',
        subtitle: 'לא בטוחים מה מתאים לכם? צרו קשר',
        content: { icon: 'message', buttonText: 'לייעוץ', buttonLink: '/contact' },
        settings: { backgroundColor: '#8b5cf6', textColor: '#ffffff', size: 'medium' },
      },
      {
        type: 'image_text',
        title: 'טיפים מקצועיים',
        subtitle: 'מהמומחים שלנו',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
          text: '<p>הבלוג שלנו מלא בטיפים, מדריכים וטרנדים עדכניים מעולם הטיפוח. גלו איך לטפל בשיער שלכם כמו מקצוענים.</p>',
          buttonText: 'לבלוג',
          buttonLink: '/blog',
        },
        settings: { imagePosition: 'right', imageWidth: '50%' },
      },
      {
        type: 'reviews',
        title: 'הלקוחות ממליצים',
        subtitle: null,
        content: {
          reviews: [
            { id: '1', author: 'יעל ד.', rating: 5, text: 'השמפו הזה שינה לי את החיים! השיער כל כך רך', verified: true },
            { id: '2', author: 'מירב ג.', rating: 5, text: 'מוצרים מקצועיים במחירים הוגנים', verified: true },
            { id: '3', author: 'לירון ב.', rating: 5, text: 'משלוח מהיר ושירות מעולה', verified: true },
          ],
        },
        settings: { columns: 3, style: 'cards', showRating: true },
      },
      {
        type: 'newsletter',
        title: 'הישארו מעודכנים',
        subtitle: 'טיפים, מבצעים ומוצרים חדשים',
        content: { buttonText: 'הרשמה', placeholder: 'כתובת אימייל' },
        settings: { maxWidth: 'md' },
      },
    ],
  },

  // ============================================
  // 5. TASTE BUDS - Food & Drink Template
  // ============================================
  {
    id: 'taste-buds',
    name: 'Taste Buds',
    description: 'עיצוב חם ומזמין. מושלם למזון ומשקאות.',
    category: 'מזון ומשקאות',
    previewImage: '/templates/taste-buds-preview.jpg',
    isPro: false,
    
    cssVariables: {
      '--template-primary': '#ea580c',
      '--template-secondary': '#fff7ed',
      '--template-accent': '#c2410c',
      '--template-text': '#1c1917',
      '--template-text-muted': '#78716c',
      '--template-border': '#e7e5e4',
      '--template-bg': '#ffffff',
      '--template-bg-alt': '#fafaf9',
      '--template-font-heading': "'Heebo', 'Assistant', sans-serif",
      '--template-font-body': "'Heebo', 'Assistant', sans-serif",
      '--template-radius': '8px',
      '--template-button-style': 'filled',
    },
    
    themeSettings: {
      headerLayout: 'logo-center',
      headerSticky: true,
      headerTransparent: false,
      announcementText: '🍕 משלוח חינם בהזמנה מעל ₪150',
      announcementBg: '#ea580c',
      announcementColor: '#ffffff',
    },
    
    sections: [
      {
        type: 'hero',
        title: 'טעמים שאוהבים',
        subtitle: 'מוצרי בוטיק מהמטבחים הטובים בעולם',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920',
          buttonText: 'לתפריט המלא',
          buttonLink: '/products',
        },
        settings: { height: '85vh', overlay: 0.3 },
      },
      {
        type: 'features',
        title: 'למה אנחנו?',
        subtitle: null,
        content: {
          features: [
            { id: '1', icon: 'sparkles', title: 'טרי ואיכותי', description: 'מרכיבים מהחקלאים' },
            { id: '2', icon: 'star', title: 'מתכונים בלעדיים', description: 'פותחו ע"י שפים' },
            { id: '3', icon: 'package', title: 'אריזה מוקפדת', description: 'שמירה על הטריות' },
            { id: '4', icon: 'zap', title: 'משלוח מהיר', description: 'עד הבית שלכם' },
          ],
        },
        settings: { columns: 4, iconStyle: 'emoji', backgroundColor: '#fff7ed' },
      },
      {
        type: 'categories',
        title: 'הקטגוריות שלנו',
        subtitle: 'מגוון טעמים לכל אירוע',
        content: { showAll: true, limit: 6 },
        settings: { columns: 3, gap: 6 },
      },
      {
        type: 'products',
        title: 'הכי נמכרים',
        subtitle: 'הטעמים שהלקוחות אוהבים',
        content: { type: 'all', limit: 8 },
        settings: { columns: 4, gap: 6 },
      },
      {
        type: 'image_text',
        title: 'מהשדה לצלחת',
        subtitle: 'הסיפור שלנו',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
          text: '<p>אנחנו עובדים ישירות עם חקלאים מקומיים כדי להביא לכם את המוצרים הטריים והאיכותיים ביותר. כל מוצר נבחר בקפידה ומגיע אליכם בשיא הטריות.</p>',
          buttonText: 'הכירו אותנו',
          buttonLink: '/about',
        },
        settings: { imagePosition: 'right', imageWidth: '50%' },
      },
      {
        type: 'reviews',
        title: 'הלקוחות מדברים',
        subtitle: null,
        content: {
          reviews: [
            { id: '1', author: 'אלון מ.', rating: 5, text: 'הגבינות פה מדהימות! ממכר', verified: true },
            { id: '2', author: 'תמר ש.', rating: 5, text: 'איכות מעולה ומשלוח מהיר', verified: true },
            { id: '3', author: 'יוסי כ.', rating: 5, text: 'מזמין כל שבוע, לא מוותר', verified: true },
          ],
        },
        settings: { columns: 3, style: 'cards', showRating: true },
      },
      {
        type: 'faq',
        title: 'שאלות נפוצות',
        subtitle: null,
        content: {
          items: [
            { id: '1', question: 'איך שומרים על הטריות במשלוח?', answer: 'כל המשלוחים נארזים בקירור מיוחד ונשלחים במשלוח מהיר לשמירה על הטריות.' },
            { id: '2', question: 'מה מדיניות ההחזרות?', answer: 'אנחנו מחויבים לשביעות רצונכם. אם מוצר הגיע פגום - נחליף או נזכה ללא שאלות.' },
            { id: '3', question: 'יש אפשרות למשלוח קבוע?', answer: 'בהחלט! ניתן להירשם למנוי חודשי עם הנחה של 10%.' },
          ],
        },
        settings: { style: 'accordion', maxWidth: 'lg' },
      },
      {
        type: 'newsletter',
        title: 'הצטרפו למועדון הטעמים',
        subtitle: 'מתכונים, מבצעים והפתעות טעימות',
        content: { buttonText: 'להצטרפות', placeholder: 'האימייל שלכם' },
        settings: { maxWidth: 'md' },
      },
    ],
  },

  // ============================================
  // 6. TECH ZONE - Electronics Template
  // ============================================
  {
    id: 'tech-zone',
    name: 'Tech Zone',
    description: 'עיצוב מודרני וטכנולוגי. מושלם לאלקטרוניקה.',
    category: 'אלקטרוניקה',
    previewImage: '/templates/tech-zone-preview.jpg',
    isPro: false,
    
    cssVariables: {
      '--template-primary': '#3b82f6',
      '--template-secondary': '#eff6ff',
      '--template-accent': '#2563eb',
      '--template-text': '#0f172a',
      '--template-text-muted': '#64748b',
      '--template-border': '#e2e8f0',
      '--template-bg': '#ffffff',
      '--template-bg-alt': '#f8fafc',
      '--template-font-heading': "'Assistant', 'Noto Sans Hebrew', sans-serif",
      '--template-font-body': "'Assistant', 'Noto Sans Hebrew', sans-serif",
      '--template-radius': '8px',
      '--template-button-style': 'filled',
    },
    
    themeSettings: {
      headerLayout: 'logo-right',
      headerSticky: true,
      headerTransparent: false,
      announcementText: '⚡ משלוח אקספרס חינם בהזמנה מעל ₪399',
      announcementBg: '#3b82f6',
      announcementColor: '#ffffff',
    },
    
    sections: [
      {
        type: 'hero',
        title: 'הטכנולוגיה החדשה כאן',
        subtitle: 'גאדג\'טים, אביזרים ופתרונות חכמים',
        content: {
          imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920',
          buttonText: 'לקטלוג המלא',
          buttonLink: '/products',
        },
        settings: { height: '85vh', overlay: 0.35 },
      },
      {
        type: 'features',
        title: 'למה לקנות אצלנו?',
        subtitle: null,
        content: {
          features: [
            { id: '1', icon: 'check', title: 'מוצרים מקוריים', description: 'אחריות יבואן רשמי' },
            { id: '2', icon: 'shield', title: 'אחריות מורחבת', description: 'עד 3 שנים' },
            { id: '3', icon: 'refresh', title: 'החלפה קלה', description: '14 ימים ללא שאלות' },
            { id: '4', icon: 'rocket', title: 'משלוח מהיר', description: 'עד יום עסקים אחד' },
          ],
        },
        settings: { columns: 4, iconStyle: 'emoji', backgroundColor: '#f8fafc' },
      },
      {
        type: 'categories',
        title: 'הקטגוריות שלנו',
        subtitle: null,
        content: { showAll: true, limit: 6 },
        settings: { columns: 3, gap: 6 },
      },
      {
        type: 'products',
        title: 'מוצרים חמים',
        subtitle: 'הכי נמכרים החודש',
        content: { type: 'all', limit: 8 },
        settings: { columns: 4, gap: 6 },
      },
      {
        type: 'logos',
        title: 'המותגים שלנו',
        subtitle: 'נציגים רשמיים',
        content: { logos: [] },
        settings: { columns: 6, logoHeight: 48, grayscale: true },
      },
      {
        type: 'faq',
        title: 'שאלות נפוצות',
        subtitle: null,
        content: {
          items: [
            { id: '1', question: 'מה כוללת האחריות?', answer: 'כל המוצרים מגיעים עם אחריות יבואן רשמי. בנוסף, אנו מציעים אחריות מורחבת לרכישה.' },
            { id: '2', question: 'כמה זמן לוקח המשלוח?', answer: 'משלוח רגיל 3-5 ימי עסקים, משלוח אקספרס תוך יום עסקים אחד.' },
            { id: '3', question: 'האם יש שירות התקנה?', answer: 'כן, אנו מציעים שירות התקנה והדרכה לחלק מהמוצרים בתשלום נוסף.' },
          ],
        },
        settings: { style: 'cards', maxWidth: 'lg' },
      },
      {
        type: 'banner_small',
        title: 'צריכים עזרה בבחירה?',
        subtitle: 'המומחים שלנו כאן בשבילכם',
        content: { icon: 'message', buttonText: 'לייעוץ חינם', buttonLink: '/contact' },
        settings: { backgroundColor: '#3b82f6', textColor: '#ffffff', size: 'medium' },
      },
      {
        type: 'newsletter',
        title: 'הישארו מעודכנים',
        subtitle: 'דילים בלעדיים ומוצרים חדשים',
        content: { buttonText: 'הרשמה', placeholder: 'כתובת אימייל' },
        settings: { maxWidth: 'md' },
      },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter(t => t.category === category);
}

export function getDefaultTemplate(): Template {
  return templates.find(t => t.id === 'noir') || templates[0];
}

// Generate CSS variables string for <style> tag
export function getTemplateCSSVariables(templateId: string): string {
  const template = getTemplateById(templateId);
  if (!template) return '';
  
  return Object.entries(template.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');
}

