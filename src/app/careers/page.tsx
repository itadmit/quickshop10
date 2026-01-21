import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CareersForm } from "@/components/landing/CareersForm";
import { JobAccordion } from "@/components/landing/JobAccordion";
import type { Metadata } from 'next';

// ISR - Revalidate every hour for good performance
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "דרושים בקוויק שופ - הצטרפו לצוות שלנו",
  description: "מחפשים אתגר חדש? הצטרפו לצוות של קוויק שופ - הפלטפורמה המובילה בישראל לבניית חנויות אונליין. משרות פנויות למפתחים, מעצבים, שיווק ועוד.",
}

// Job positions data
const jobPositions = [
  {
    id: 'project-manager',
    title: 'מנהל/ת פרויקטים והקמות – E-Commerce',
    isNew: true,
    isFilled: false,
    location: 'רחובות',
    type: 'משרה מלאה',
    description: 'התפקיד כולל אחריות מלאה על ניהול לקוחות לאחר סגירת העסקה – אפיון צרכים, הובלת תהליך ההקמה בפועל, עבודה שוטפת עם מערכת QuickShop, תקשורת רציפה מול הלקוחות, גביית תשלומים וסגירת פרויקטים. זהו תפקיד תפעולי מרכזי עם עצמאות גבוהה, אחריות אמיתית והשפעה ישירה על חוויית הלקוח והצלחת הפרויקטים.',
    responsibilities: [
      'אפיון צרכי הלקוח והבנת הדרישות העסקיות',
      'הקמת חנויות אונליין מקצה לקצה במערכת QuickShop',
      'תקשורת שוטפת עם לקוחות לאורך כל תהליך ההקמה',
      'עמידה בלוחות זמנים וניהול ציפיות לקוחות',
      'גביית תשלומים וסגירת פרויקטים מוצלחים',
      'שיפור תהליכים ומתודולוגיות עבודה',
    ],
    requirements: [
      { text: 'הבנה בסיסית בעולם ה-E-Commerce' },
      { text: 'תקשורת מצוינת מול לקוחות' },
      { text: 'סדר, אחריות ויכולת עבודה עצמאית' },
      { text: 'יכולת למידה מהירה של מערכות חדשות' },
      { text: 'ניסיון עם Wix / WooCommerce / Shopify', isAdvantage: true },
      { text: 'ניסיון בניהול פרויקטים דיגיטליים / אתרי חנויות', isAdvantage: true },
    ],
    tags: [
      { label: 'ניהול לקוחות', color: 'bg-emerald-100 text-emerald-800' },
      { label: 'E-Commerce', color: 'bg-blue-100 text-blue-800' },
      { label: 'עבודה עצמאית', color: 'bg-purple-100 text-purple-800' },
      { label: 'תקשורת בינאישית', color: 'bg-amber-100 text-amber-800' },
    ],
  },
  {
    id: 'full-stack',
    title: 'מפתח/ת Full Stack',
    isNew: false,
    isFilled: true,
    location: 'רחובות',
    type: 'משרה מלאה',
    description: 'מחפשים מפתח/ת מנוסה ב-React, Next.js, TypeScript ו-Node.js. עבודה על פלטפורמת SaaS מתקדמת עם דגש על ביצועים ומהירות.',
    responsibilities: [],
    requirements: [],
    tags: [
      { label: 'React', color: 'bg-gray-100 text-gray-500' },
      { label: 'Next.js', color: 'bg-gray-100 text-gray-500' },
      { label: 'TypeScript', color: 'bg-gray-100 text-gray-500' },
    ],
  },
  {
    id: 'ux-ui',
    title: 'מעצב/ת UX/UI',
    isNew: false,
    isFilled: true,
    location: 'רחובות',
    type: 'משרה מלאה',
    description: 'מחפשים מעצב/ת יצירתי/ת עם ניסיון בעיצוב ממשקים למוצרי SaaS. עבודה על חוויית משתמש מעולה ופיתוח תבניות עיצוב.',
    responsibilities: [],
    requirements: [],
    tags: [
      { label: 'Figma', color: 'bg-gray-100 text-gray-500' },
      { label: 'UX Design', color: 'bg-gray-100 text-gray-500' },
      { label: 'UI Design', color: 'bg-gray-100 text-gray-500' },
    ],
  },
  {
    id: 'marketing',
    title: 'משווק/ת דיגיטלי',
    isNew: false,
    isFilled: true,
    location: 'רחובות',
    type: 'משרה מלאה',
    description: 'מחפשים משווק/ת דיגיטלי עם ניסיון בשיווק B2B, תוכן שיווקי וניהול קמפיינים. עבודה על צמיחה והרחבת בסיס הלקוחות.',
    responsibilities: [],
    requirements: [],
    tags: [
      { label: 'Content Marketing', color: 'bg-gray-100 text-gray-500' },
      { label: 'SEO', color: 'bg-gray-100 text-gray-500' },
      { label: 'Social Media', color: 'bg-gray-100 text-gray-500' },
    ],
  },
];

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
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">משרות פנויות</h2>
          <p className="text-center text-gray-500 mb-12">לחצו על משרה לפרטים נוספים</p>
          
          <div className="space-y-4">
            {jobPositions.map((position) => (
              <JobAccordion key={position.id} position={position} />
            ))}

            {/* General Position - Not Accordion */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-emerald-400 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">לא מצאתם משרה מתאימה?</h3>
                  <p className="text-gray-600 mb-4">
                    אנחנו תמיד מחפשים אנשים מוכשרים. שלחו לנו קורות חיים ונשמח לשמוע מכם!
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
