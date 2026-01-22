import Link from 'next/link';

// Static page - no revalidation needed
export const dynamic = 'force-static';

const features = [
  {
    category: 'מכירות',
    items: [
      {
        title: 'חנות מותאמת אישית',
        description: 'עיצוב ZARA-style מינימליסטי עם התאמה מלאה למותג שלכם',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
        ),
      },
      {
        title: 'ניהול מוצרים',
        description: 'מוצרים, וריאנטים, תמונות, מלאי - הכל במקום אחד',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
            <circle cx="7" cy="7" r="1"/>
          </svg>
        ),
      },
      {
        title: 'קופונים והנחות',
        description: 'קופונים, הנחות אוטומטיות, מבצעים מיוחדים',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="2" width="20" height="20" rx="2"/>
            <circle cx="9" cy="9" r="2"/>
            <circle cx="15" cy="15" r="2"/>
            <line x1="16" y1="8" x2="8" y2="16"/>
          </svg>
        ),
      },
      {
        title: 'עגלות נטושות',
        description: 'זיהוי עגלות נטושות ושליחת תזכורות אוטומטיות',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
          </svg>
        ),
      },
    ],
  },
  {
    category: 'ניהול',
    items: [
      {
        title: 'ניהול הזמנות',
        description: 'צפייה, עדכון סטטוס, מעקב משלוחים',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <path d="M3 10h18"/>
            <circle cx="15" cy="15" r="2"/>
          </svg>
        ),
      },
      {
        title: 'ניהול לקוחות',
        description: 'פרופילים, היסטוריית הזמנות, קרדיט חנות',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/>
          </svg>
        ),
      },
      {
        title: 'ניהול צוות',
        description: 'הזמנת חברי צוות עם הרשאות מותאמות',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="7" r="3"/>
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
            <circle cx="17" cy="7" r="3"/>
            <path d="M21 21v-2a4 4 0 00-3-3.87"/>
          </svg>
        ),
      },
      {
        title: 'התראות חכמות',
        description: 'התראות על הזמנות, מלאי נמוך, לקוחות חדשים',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
        ),
      },
    ],
  },
  {
    category: 'אנליטיקס',
    items: [
      {
        title: 'דוחות מכירות',
        description: 'מכירות יומיות, שבועיות, חודשיות עם גרפים',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="5" y1="20" x2="5" y2="14"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="19" y1="20" x2="19" y2="10"/>
          </svg>
        ),
      },
      {
        title: 'ניתוח התנהגות',
        description: 'משפך המרה, מקורות תנועה, מוצרים פופולריים',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        ),
      },
      {
        title: 'Tracking Pixels',
        description: 'Facebook Pixel, Google Analytics, GTM מובנים',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
            <line x1="21.17" y1="8" x2="12" y2="8"/>
            <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
            <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
          </svg>
        ),
      },
      {
        title: 'Webhooks',
        description: 'חיבור ל-Zapier, Make.com וכלים חיצוניים',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        ),
      },
    ],
  },
  {
    category: 'טכנולוגיה',
    items: [
      {
        title: 'מהירות בזק',
        description: 'Server Components, ISR, Edge Runtime - טעינה מיידית',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        ),
      },
      {
        title: 'RTL מובנה',
        description: 'תמיכה מלאה בעברית מהיום הראשון',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="21" y1="10" x2="3" y2="10"/>
            <line x1="21" y1="6" x2="3" y2="6"/>
            <line x1="21" y1="14" x2="3" y2="14"/>
            <line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        ),
      },
      {
        title: 'מאובטח',
        description: 'SSL, HTTPS, אימות דו-שלבי, הצפנה מלאה',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        ),
      },
      {
        title: 'דומיין מותאם',
        description: 'חברו את הדומיין שלכם בקליק',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
        ),
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-black" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl tracking-[0.3em] uppercase">
            QuickShop
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/features" className="text-sm font-medium">
              יכולות
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-black transition-colors">
              מחירים
            </Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-black transition-colors">
              התחברות
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
            >
              התחל בחינם
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-light tracking-[0.1em] uppercase mb-4">
            כל מה שצריך לחנות מצליחה
          </h1>
          <p className="text-gray-500 text-lg">
            כלים מתקדמים לניהול, מכירה וצמיחה - בממשק פשוט ומהיר
          </p>
        </div>
      </section>

      {/* Features Grid */}
      {features.map((section) => (
        <section key={section.category} className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl text-center mb-12 font-light tracking-[0.1em] uppercase">
              {section.category}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {section.items.map((feature) => (
                <div 
                  key={feature.title}
                  className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 mb-4 flex items-center justify-center text-gray-600">
                    {feature.icon}
                  </div>
                  <h3 className="font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Speed Section */}
      <section className="py-24 px-6 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-[0.1em] uppercase mb-6">
            מהיר כמו PHP
          </h2>
          <p className="text-white/60 text-lg mb-12">
            בזמן ש-Shopify משתמש ב-React כבד, אנחנו משתמשים בטכנולוגיה חדשה שמספקת חווית משתמש מהירה כמו אתרי PHP קלאסיים.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-4xl font-light mb-2">&lt;1.5s</p>
              <p className="text-white/60 text-sm">LCP</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-light mb-2">&lt;100ms</p>
              <p className="text-white/60 text-sm">FID</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-light mb-2">&lt;0.1</p>
              <p className="text-white/60 text-sm">CLS</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-[0.1em] uppercase mb-6">
            מוכנים להתחיל?
          </h2>
          <p className="text-gray-500 mb-8">
            הצטרפו עכשיו והתחילו למכור תוך דקות
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="px-8 py-3 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              התחל בחינם
            </Link>
            <Link 
              href="/pricing" 
              className="px-8 py-3 border border-gray-300 text-sm font-medium hover:border-gray-600 transition-colors"
            >
              ראה מחירים
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black text-white border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-display text-xl tracking-[0.3em] uppercase">QuickShop</p>
          <div className="flex gap-8 text-sm text-white/60">
            <Link href="/features" className="hover:text-white transition-colors">יכולות</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">מחירים</Link>
            <Link href="/login" className="hover:text-white transition-colors">התחברות</Link>
          </div>
          <p className="text-xs text-white/40">
            © 2025 QuickShop. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
}





