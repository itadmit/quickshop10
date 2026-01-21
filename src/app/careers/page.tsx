import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CareersForm } from "@/components/landing/CareersForm";
import type { Metadata } from 'next';

// ISR - Revalidate every hour for good performance
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "דרושים בקוויק שופ - הצטרפו לצוות שלנו",
  description: "מחפשים אתגר חדש? הצטרפו לצוות של קוויק שופ - הפלטפורמה המובילה בישראל לבניית חנויות אונליין. משרות פנויות למפתחים, מעצבים, שיווק ועוד.",
}

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-emerald-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl lg:text-6xl mb-6 leading-[1.1] tracking-tight text-gray-900" style={{ fontWeight: 900 }}>
            הצטרפו לצוות שלנו
          </h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            אנחנו בונים את הפלטפורמה המובילה בישראל לחנויות אונליין. מחפשים אנשים מוכשרים שיעזרו לנו להמשיך לצמוח.
          </p>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">משרות פנויות</h2>
          
          <div className="space-y-6">
            {/* New Position - Project Manager */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-300 rounded-2xl p-6 hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                חדש!
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">מנהל/ת פרויקטים והקמות – E-Commerce</h3>
                  <p className="text-gray-600 mb-4">
                    התפקיד כולל אחריות מלאה על ניהול לקוחות לאחר סגירת העסקה – אפיון צרכים, הובלת תהליך ההקמה בפועל, עבודה שוטפת עם מערכת QuickShop, תקשורת רציפה מול הלקוחות, גביית תשלומים וסגירת פרויקטים.
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    זהו תפקיד תפעולי מרכזי שמאפשר למייסדים להתמקד בצמיחה ופיתוח מוצר, ללא מכירות וללא פיתוח, עם עצמאות גבוהה, אחריות אמיתית והשפעה ישירה על חוויית הלקוח והצלחת הפרויקטים.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">ניהול לקוחות</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">E-Commerce</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">עבודה עצמאית</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">תקשורת בינאישית</span>
                  </div>
                  <a 
                    href="#apply-form" 
                    className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-emerald-700 transition-colors"
                  >
                    הגש מועמדות
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Filled Position 1 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 opacity-60 relative">
              <div className="absolute top-4 left-4 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                גוייס ✓
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-500 mb-2 line-through">מפתח/ת Full Stack</h3>
                  <p className="text-gray-400 mb-4">
                    מחפשים מפתח/ת מנוסה ב-React, Next.js, TypeScript ו-Node.js. עבודה על פלטפורמת SaaS מתקדמת עם דגש על ביצועים ומהירות.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">React</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">Next.js</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">TypeScript</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">Node.js</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filled Position 2 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 opacity-60 relative">
              <div className="absolute top-4 left-4 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                גוייס ✓
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-500 mb-2 line-through">מעצב/ת UX/UI</h3>
                  <p className="text-gray-400 mb-4">
                    מחפשים מעצב/ת יצירתי/ת עם ניסיון בעיצוב ממשקים למוצרי SaaS. עבודה על חוויית משתמש מעולה ופיתוח תבניות עיצוב.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">Figma</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">UX Design</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">UI Design</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filled Position 3 */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 opacity-60 relative">
              <div className="absolute top-4 left-4 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                גוייס ✓
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-500 mb-2 line-through">משווק/ת דיגיטלי</h3>
                  <p className="text-gray-400 mb-4">
                    מחפשים משווק/ת דיגיטלי עם ניסיון בשיווק B2B, תוכן שיווקי וניהול קמפיינים. עבודה על צמיחה והרחבת בסיס הלקוחות.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">Content Marketing</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">SEO</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">Social Media</span>
                  </div>
                </div>
              </div>
            </div>

            {/* General Position */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">משרה אחרת?</h3>
                  <p className="text-gray-600 mb-4">
                    לא מצאתם משרה שמתאימה? אנחנו תמיד מחפשים אנשים מוכשרים. שלחו לנו קורות חיים ונשמח לשמוע מכם!
                  </p>
                  <a 
                    href="#apply-form" 
                    className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                  >
                    שלחו קורות חיים
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="apply-form" className="py-20 bg-gray-50 scroll-mt-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">שלחו לנו קורות חיים</h2>
            <p className="text-center text-gray-600 mb-8">
              מלאו את הטופס ונחזור אליכם בהקדם
            </p>
            
            <CareersForm />
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

