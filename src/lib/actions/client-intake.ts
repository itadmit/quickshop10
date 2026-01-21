"use server";

import { sendEmail } from "@/lib/email";

// Types
interface WizardData {
  designStyle: string[];
  hasExistingBranding: boolean | null;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  uploadedFiles: Array<{ name: string; url: string }>;
  referenceSites: Array<{ url: string; likes: string }>;
  detailLevel: 'minimal' | 'medium' | 'detailed' | null;
  specialFeatures: string[];
  customFeatures: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  additionalNotes: string;
}

// ==============================================
// 🎨 STYLE CONFIGURATIONS - Images & Settings
// ==============================================

// Base URL for template images
const TEMPLATE_IMAGES_BASE = '/template-images';

// Style-specific image sets and settings
const styleConfigs: Record<string, {
  images: {
    hero: string[];
    split: string[];
    category: string[];
  };
  overlay: number;
  textStyle: 'light' | 'dark';
  buttonStyle: 'solid' | 'outline';
  heroTexts: { title: string; subtitle: string; button: string }[];
  sectionTitles: {
    products: string;
    productsSubtitle: string;
    newsletter: string;
    newsletterSubtitle: string;
    video: string;
    videoSubtitle: string;
  };
}> = {
  luxury: {
    images: {
      hero: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80', // Luxury store
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80', // Gold jewelry
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1920&q=80', // Elegant interior
      ],
      split: [
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80', // Luxury watch
        'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&q=80', // Gold accessories
      ],
      category: [
        'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80',
      ],
    },
    overlay: 0.25,
    textStyle: 'light',
    buttonStyle: 'outline',
    heroTexts: [
      { title: 'אלגנטיות ללא פשרות', subtitle: 'קולקציית הפרימיום החדשה', button: 'לצפייה בקולקציה' },
      { title: 'יוקרה בכל פרט', subtitle: 'עיצובים בלעדיים', button: 'גלה עכשיו' },
    ],
    sectionTitles: {
      products: 'פריטי יוקרה נבחרים',
      productsSubtitle: 'הבחירות המושלמות לעונה',
      newsletter: 'הצטרפו למועדון VIP',
      newsletterSubtitle: 'קבלו גישה מוקדמת לקולקציות חדשות והטבות בלעדיות',
      video: 'קולקציית יוקרה',
      videoSubtitle: 'עיצובים שמדברים בעד עצמם',
    },
  },
  natural: {
    images: {
      hero: [
        'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1920&q=80', // Natural cosmetics
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1920&q=80', // Plants
        'https://images.unsplash.com/photo-1604177091072-b7e52c8ecf5b?w=1920&q=80', // Organic
      ],
      split: [
        'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
      ],
      category: [
        'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80',
      ],
    },
    overlay: 0.15,
    textStyle: 'dark',
    buttonStyle: 'solid',
    heroTexts: [
      { title: 'טבעי ואמיתי', subtitle: 'מוצרים אורגניים לחיים בריאים', button: 'לחנות' },
      { title: 'מהטבע אליכם', subtitle: 'רכיבים טבעיים 100%', button: 'גלו את המוצרים' },
    ],
    sectionTitles: {
      products: 'מוצרים טבעיים',
      productsSubtitle: 'רכיבים אורגניים מובחרים',
      newsletter: 'הצטרפו למשפחה',
      newsletterSubtitle: 'טיפים לחיים בריאים והנחות מיוחדות',
      video: 'מהטבע אליכם',
      videoSubtitle: 'הסיפור שלנו',
    },
  },
  minimal: {
    images: {
      hero: [
        'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=1920&q=80', // Minimal
        'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1920&q=80', // Clean
        'https://images.unsplash.com/photo-1554295405-abb8fd54f153?w=1920&q=80', // Simple
      ],
      split: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      ],
      category: [
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80',
      ],
    },
    overlay: 0.05,
    textStyle: 'dark',
    buttonStyle: 'outline',
    heroTexts: [
      { title: 'פחות זה יותר', subtitle: 'עיצוב נקי ופונקציונלי', button: 'לחנות' },
      { title: 'פשטות מושלמת', subtitle: 'מוצרים שמדברים בעד עצמם', button: 'גלו עכשיו' },
    ],
    sectionTitles: {
      products: 'המוצרים שלנו',
      productsSubtitle: '',
      newsletter: 'הישארו מעודכנים',
      newsletterSubtitle: '10% הנחה על ההזמנה הראשונה',
      video: 'הקולקציה',
      videoSubtitle: '',
    },
  },
  colorful: {
    images: {
      hero: [
        'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920&q=80', // Colorful
        'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=1920&q=80', // Vibrant
        'https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=1920&q=80', // Bold
      ],
      split: [
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      ],
      category: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
      ],
    },
    overlay: 0.1,
    textStyle: 'light',
    buttonStyle: 'solid',
    heroTexts: [
      { title: 'צבע את החיים!', subtitle: 'קולקציה צבעונית ושמחה', button: 'בואו נצבע!' },
      { title: 'אנרגיה של צבעים', subtitle: 'סטייל שמדבר בקול רם', button: 'לחנות' },
    ],
    sectionTitles: {
      products: 'הכי צבעוני',
      productsSubtitle: 'פריטים שיוסיפו צבע לחיים',
      newsletter: 'הצטרפו לחגיגה!',
      newsletterSubtitle: 'הנחות והפתעות צבעוניות',
      video: 'צבעים בפעולה',
      videoSubtitle: 'ראו איך זה נראה',
    },
  },
  young: {
    images: {
      hero: [
        'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1920&q=80', // Street
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80', // Urban
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1920&q=80', // Young
      ],
      split: [
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&q=80',
        'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80',
      ],
      category: [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80',
      ],
    },
    overlay: 0.2,
    textStyle: 'light',
    buttonStyle: 'solid',
    heroTexts: [
      { title: 'BE BOLD', subtitle: 'סטייל רחוב אמיתי', button: 'קנו עכשיו' },
      { title: 'הדור הבא', subtitle: 'טרנדים שמובילים', button: 'לחנות' },
    ],
    sectionTitles: {
      products: 'הכי חם עכשיו',
      productsSubtitle: 'הטרנדים של הרחוב',
      newsletter: 'הצטרפו לקהילה',
      newsletterSubtitle: 'דיל בלעדי למנויים',
      video: 'STREET STYLE',
      videoSubtitle: 'הסגנון שלנו',
    },
  },
  tech: {
    images: {
      hero: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80', // Tech
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920&q=80', // Futuristic
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80', // Digital
      ],
      split: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
      ],
      category: [
        'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
      ],
    },
    overlay: 0.3,
    textStyle: 'light',
    buttonStyle: 'outline',
    heroTexts: [
      { title: 'TECH FORWARD', subtitle: 'טכנולוגיה מתקדמת לחיים חכמים', button: 'לחנות' },
      { title: 'העתיד כאן', subtitle: 'מוצרים שמשנים את הכללים', button: 'גלו עכשיו' },
    ],
    sectionTitles: {
      products: 'טכנולוגיה חדשה',
      productsSubtitle: 'המוצרים החכמים ביותר',
      newsletter: 'הישארו מעודכנים',
      newsletterSubtitle: 'חדשות טכנולוגיה והנחות מיוחדות',
      video: 'ראו בפעולה',
      videoSubtitle: 'טכנולוגיה שעובדת',
    },
  },
  clean: {
    images: {
      hero: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
        'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=1920&q=80',
        'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80',
      ],
      split: [
        'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
        'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
      ],
      category: [
        'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80',
      ],
    },
    overlay: 0.1,
    textStyle: 'dark',
    buttonStyle: 'solid',
    heroTexts: [
      { title: 'ברוכים הבאים', subtitle: 'גלו את הקולקציה החדשה', button: 'לחנות' },
      { title: 'חדש בחנות', subtitle: 'מוצרים נבחרים במיוחד בשבילכם', button: 'לצפייה' },
    ],
    sectionTitles: {
      products: 'מוצרים נבחרים',
      productsSubtitle: 'הבחירות שלנו לעונה',
      newsletter: 'הצטרפו לניוזלטר',
      newsletterSubtitle: 'קבלו 15% הנחה על ההזמנה הראשונה',
      video: 'קולקציה חדשה',
      videoSubtitle: 'חדש בחנות',
    },
  },
};

// Hebrew labels
const styleLabels: Record<string, string> = {
  clean: 'נקי',
  luxury: 'יוקרתי',
  colorful: 'צבעוני',
  minimal: 'מינימליסטי',
  natural: 'טבעי',
  young: 'צעיר',
  tech: 'טכנולוגי',
};

const featureLabels: Record<string, string> = {
  video_banner: 'באנר וידאו',
  newsletter: 'ניוזלטר',
  split_banner: 'באנר מפוצל',
  reviews: 'ביקורות',
  instagram: 'פיד אינסטגרם',
  faq: 'שאלות נפוצות',
  blog: 'בלוג',
  loyalty: 'מועדון לקוחות',
  gift_cards: 'גיפט קארד',
  multi_currency: 'מטבעות מרובים',
};

const detailLabels: Record<string, string> = {
  minimal: 'מינימלי (4-5 אזורים)',
  medium: 'בינוני (6-7 אזורים)',
  detailed: 'מפורט (8+ אזורים)',
};

// ==============================================
// 🎨 TEMPLATE GENERATOR
// ==============================================

function generateTemplateJson(data: WizardData): object {
  const primaryStyle = data.designStyle[0] || 'clean';
  const config = styleConfigs[primaryStyle] || styleConfigs.clean;
  
  // Random selection from available options
  const randomHero = config.images.hero[Math.floor(Math.random() * config.images.hero.length)];
  const randomText = config.heroTexts[Math.floor(Math.random() * config.heroTexts.length)];
  
  // Determine number of sections based on detail level
  const sectionCounts = { minimal: 4, medium: 6, detailed: 9 };
  const targetSections = sectionCounts[data.detailLevel || 'medium'];
  
  // Use uploaded files for images if available
  const heroImage = data.uploadedFiles.find(f => 
    f.name.toLowerCase().includes('hero') || 
    f.name.toLowerCase().includes('banner') ||
    f.name.toLowerCase().includes('main')
  )?.url || randomHero;
  
  // Build sections array
  const sections: object[] = [];
  let sortOrder = 0;

  // 1. Hero Section - Always included
  sections.push({
    id: `section-hero-${Date.now()}`,
    type: 'hero',
    title: data.businessName ? data.businessName.toUpperCase() : randomText.title,
    subtitle: randomText.subtitle,
    content: {
      imageUrl: heroImage,
      buttonLink: '#products',
      buttonText: randomText.button,
    },
    settings: {
      height: '90vh',
      overlay: config.overlay,
      textColor: config.textStyle === 'light' ? '#ffffff' : '#000000',
      buttonStyle: config.buttonStyle,
    },
    sortOrder: sortOrder++,
    isActive: true,
  });

  // 2. Categories - Always included
  sections.push({
    id: `section-categories-${Date.now()}`,
    type: 'categories',
    title: null,
    subtitle: null,
    content: { showAll: true, categoryIds: [] },
    settings: { gap: 8, columns: 4 },
    sortOrder: sortOrder++,
    isActive: true,
  });

  // 3. Products Section - Always included
  sections.push({
    id: `section-products-${Date.now()}`,
    type: 'products',
    title: config.sectionTitles.products,
    subtitle: config.sectionTitles.productsSubtitle || null,
    content: { type: 'all', limit: 4 },
    settings: { gap: 8, columns: 4 },
    sortOrder: sortOrder++,
    isActive: true,
  });

  // 4. Video Banner - if selected or detailed
  if (data.specialFeatures.includes('video_banner') || targetSections >= 6) {
    sections.push({
      id: `section-video-${Date.now()}`,
      type: 'video_banner',
      title: config.sectionTitles.video,
      subtitle: config.sectionTitles.videoSubtitle || null,
      content: {
        videoUrl: 'https://image.hm.com/content/dam/global_campaigns/season_02/women/9000d/9000D-W-6C-16x9-women-spoil.mp4',
        buttonLink: '/products',
        buttonText: 'לצפייה בקולקציה',
      },
      settings: { height: '80vh', overlay: 0.2 },
      sortOrder: sortOrder++,
      isActive: true,
    });
  }

  // 5. Split Banner - if selected or medium+
  if (data.specialFeatures.includes('split_banner') || targetSections >= 5) {
    const splitImages = data.uploadedFiles.filter(f => !f.name.toLowerCase().includes('logo'));
    
    sections.push({
      id: `section-split-${Date.now()}`,
      type: 'split_banner',
      title: null,
      subtitle: null,
      content: {
        items: [
          {
            link: '/products',
            title: primaryStyle === 'luxury' ? 'לנשים' : 'קטגוריה 1',
            imageUrl: splitImages[0]?.url || config.images.split[0],
          },
          {
            link: '/products',
            title: primaryStyle === 'luxury' ? 'לגברים' : 'קטגוריה 2',
            imageUrl: splitImages[1]?.url || config.images.split[1],
          },
        ],
      },
      settings: { height: '70vh' },
      sortOrder: sortOrder++,
      isActive: true,
    });
  }

  // 6. More Products - if detailed
  if (targetSections >= 7) {
    sections.push({
      id: `section-products2-${Date.now()}`,
      type: 'products',
      title: 'כל המוצרים',
      subtitle: null,
      content: { type: 'all', limit: 8 },
      settings: { gap: 8, columns: 4, showCount: true },
      sortOrder: sortOrder++,
      isActive: true,
    });
  }

  // 7. Newsletter - if selected or medium+
  if (data.specialFeatures.includes('newsletter') || targetSections >= 4) {
    sections.push({
      id: `section-newsletter-${Date.now()}`,
      type: 'newsletter',
      title: config.sectionTitles.newsletter,
      subtitle: config.sectionTitles.newsletterSubtitle,
      content: { buttonText: 'הרשמה', placeholder: 'כתובת אימייל' },
      settings: { 
        maxWidth: 'xl',
        backgroundColor: data.primaryColor || undefined,
      },
      sortOrder: sortOrder++,
      isActive: true,
    });
  }

  // 8. Reviews - if selected
  if (data.specialFeatures.includes('reviews')) {
    sections.push({
      id: `section-reviews-${Date.now()}`,
      type: 'reviews',
      title: 'מה הלקוחות אומרים',
      subtitle: 'ביקורות אמיתיות מלקוחות מרוצים',
      content: { reviews: [] },
      settings: {},
      sortOrder: sortOrder++,
      isActive: true,
    });
  }

  // 9. FAQ - if selected
  if (data.specialFeatures.includes('faq')) {
    sections.push({
      id: `section-faq-${Date.now()}`,
      type: 'faq',
      title: 'שאלות נפוצות',
      subtitle: 'תשובות לשאלות הכי נפוצות',
      content: { items: [] },
      settings: {},
      sortOrder: sortOrder++,
      isActive: true,
    });
  }

  return {
    templateId: 'custom-generated',
    templateStyle: primaryStyle,
    storeName: data.businessName,
    exportDate: new Date().toISOString(),
    generatedFromIntake: true,
    cssVariables: {
      '--color-primary': data.primaryColor || '#000000',
      '--color-secondary': data.secondaryColor || '#ffffff',
      '--color-accent': data.primaryColor || '#000000',
    },
    themeSettings: {
      primaryColor: data.primaryColor || '#000000',
      secondaryColor: data.secondaryColor || '#ffffff',
      buttonStyle: config.buttonStyle,
      textStyle: config.textStyle,
    },
    intakeData: {
      designStyles: data.designStyle,
      detailLevel: data.detailLevel,
      specialFeatures: data.specialFeatures,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      referenceSites: data.referenceSites.filter(s => s.url.trim()),
    },
    uploadedAssets: data.uploadedFiles,
    sections,
  };
}

// ==============================================
// 📧 EMAIL FORMATTING
// ==============================================

function formatEmailHtml(data: WizardData, templateJson: object): string {
  const designStylesHebrew = data.designStyle.map(s => styleLabels[s] || s).join(', ');
  const featuresHebrew = data.specialFeatures.map(f => featureLabels[f] || f).join(', ');
  const detailHebrew = data.detailLevel ? detailLabels[data.detailLevel] : 'לא צוין';

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .section:last-child { border-bottom: none; }
        .section-title { font-size: 16px; font-weight: bold; color: #10b981; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .section-title::before { content: ''; width: 4px; height: 20px; background: #10b981; border-radius: 2px; }
        .field { margin-bottom: 8px; }
        .field-label { font-weight: 600; color: #666; }
        .field-value { color: #333; }
        .reference-site { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 10px; }
        .reference-site a { color: #10b981; }
        .json-block { background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; direction: ltr; text-align: left; }
        .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; }
        .contact-box { background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-top: 20px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .color-box { display: inline-block; width: 30px; height: 30px; border-radius: 6px; vertical-align: middle; margin-left: 8px; border: 1px solid #ddd; }
        .files-list { background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 10px; }
        .files-list a { display: block; color: #10b981; margin-bottom: 5px; }
        .style-badge { background: ${data.primaryColor || '#10b981'}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎨 שאלון אפיון חדש!</h1>
          <p>${data.businessName} - ${data.contactName}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">פרטי יצירת קשר</div>
            <div class="contact-box">
              <div class="field"><span class="field-label">שם העסק:</span> <span class="field-value">${data.businessName}</span></div>
              <div class="field"><span class="field-label">איש קשר:</span> <span class="field-value">${data.contactName}</span></div>
              <div class="field"><span class="field-label">אימייל:</span> <span class="field-value"><a href="mailto:${data.email}">${data.email}</a></span></div>
              <div class="field"><span class="field-label">טלפון:</span> <span class="field-value"><a href="tel:${data.phone}">${data.phone}</a></span></div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">סגנון עיצוב</div>
            <div>${data.designStyle.map(s => `<span class="badge">${styleLabels[s] || s}</span>`).join(' ')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">מיתוג וצבעים</div>
            <div class="field">
              <span class="field-label">יש מיתוג קיים:</span> 
              <span class="field-value">${data.hasExistingBranding ? 'כן' : 'לא'}</span>
            </div>
            <div class="field">
              <span class="field-label">צבע ראשי:</span> 
              <span class="color-box" style="background-color: ${data.primaryColor}"></span>
              <span class="field-value">${data.primaryColor}</span>
            </div>
            <div class="field">
              <span class="field-label">צבע משני:</span> 
              <span class="color-box" style="background-color: ${data.secondaryColor}"></span>
              <span class="field-value">${data.secondaryColor}</span>
            </div>
            ${data.uploadedFiles.length > 0 ? `
            <div class="files-list">
              <span class="field-label">קבצים שהועלו:</span>
              ${data.uploadedFiles.map(f => `<a href="${f.url}" target="_blank">📎 ${f.name}</a>`).join('')}
            </div>
            ` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">אתרי השראה</div>
            ${data.referenceSites
              .filter(site => site.url.trim())
              .map((site, idx) => `
                <div class="reference-site">
                  <div class="field"><span class="field-label">אתר ${idx + 1}:</span> <a href="${site.url}" target="_blank">${site.url}</a></div>
                  ${site.likes ? `<div class="field"><span class="field-label">מה אהב:</span> <span class="field-value">${site.likes}</span></div>` : ''}
                </div>
              `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">רמת פירוט</div>
            <div class="field-value">${detailHebrew}</div>
          </div>
          
          ${data.specialFeatures.length > 0 ? `
          <div class="section">
            <div class="section-title">פיצ'רים מבוקשים</div>
            <div>${data.specialFeatures.map(f => `<span class="badge">${featureLabels[f] || f}</span>`).join(' ')}</div>
            ${data.customFeatures ? `<div class="field" style="margin-top: 10px;"><span class="field-label">פיצ'רים נוספים:</span> <span class="field-value">${data.customFeatures}</span></div>` : ''}
          </div>
          ` : ''}
          
          ${data.additionalNotes ? `
          <div class="section">
            <div class="section-title">הערות נוספות</div>
            <div class="field-value">${data.additionalNotes}</div>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">תבנית מוצעת (JSON)</div>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">ניתן לייבא את התבנית ישירות לאדיטור:</p>
            <div class="json-block">${JSON.stringify(templateJson, null, 2)}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>נשלח מטופס אפיון לקוחות - QuickShop</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==============================================
// 📤 SUBMIT ACTION
// ==============================================

export async function submitClientIntake(data: WizardData): Promise<{ success: boolean; message?: string }> {
  try {
    // Generate template based on answers
    const templateJson = generateTemplateJson(data);
    
    // Format email content
    const emailHtml = formatEmailHtml(data, templateJson);
    
    // Recipients
    const recipients = ['itadmit@gmail.com', '0547359@gmail.com'];
    
    // Send to each recipient
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient,
        subject: `🎨 שאלון אפיון חדש - ${data.businessName} (${data.designStyle.join(', ')})`,
        html: emailHtml,
      });
    }
    
    // Also send a confirmation to the client
    await sendEmail({
      to: data.email,
      subject: `תודה על מילוי השאלון - ${data.businessName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, ${data.primaryColor || '#10b981'}, ${data.secondaryColor || '#059669'}); color: white; padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px; text-align: center; }
            .content h2 { color: #333; margin-bottom: 20px; }
            .content p { color: #666; font-size: 16px; }
            .steps { background: #f0fdf4; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: right; }
            .step { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
            .step:last-child { margin-bottom: 0; }
            .step-icon { width: 30px; height: 30px; background: ${data.primaryColor || '#10b981'}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>תודה רבה! 🎉</h1>
            </div>
            <div class="content">
              <h2>קיבלנו את הפרטים שלך</h2>
              <p>היי ${data.contactName},<br>תודה שמילאת את שאלון האפיון עבור ${data.businessName}!</p>
              
              <div class="steps">
                <div class="step">
                  <div class="step-icon">1</div>
                  <span>נעבור על התשובות שלך בקפידה</span>
                </div>
                <div class="step">
                  <div class="step-icon">2</div>
                  <span>ניצור תבנית מותאמת אישית לעסק</span>
                </div>
                <div class="step">
                  <div class="step-icon">3</div>
                  <span>ניצור איתך קשר תוך 24 שעות</span>
                </div>
              </div>
              
              <p>יש לך שאלות? אפשר ליצור קשר בכל עת:<br>
              <a href="tel:+972552554432">055-255-4432</a> | 
              <a href="mailto:info@quick-shop.co.il">info@quick-shop.co.il</a></p>
            </div>
            <div class="footer">
              <p>© QuickShop - הפלטפורמה הישראלית לבניית חנויות אונליין</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting client intake:', error);
    return { success: false, message: 'אירעה שגיאה בשליחת הטופס' };
  }
}
