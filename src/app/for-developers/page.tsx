import Link from "next/link"
import { Button } from "@/components/landing/Button"
import { Badge } from "@/components/landing/Badge"
import { 
  RocketIcon, 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  CodeIcon,
  TerminalIcon,
  LayoutIcon,
  ZapIcon, 
  ServerIcon, 
  DatabaseIcon,
  PuzzleIcon,
  GlobeIcon,
  BracesIcon,
  GitBranchIcon,
  BoxIcon,
  LayersIcon,
  CheckIcon,
  XIcon,
  ChevronDownIcon,
  CpuIcon,
  WorkflowIcon
} from "@/components/admin/icons"

import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import type { Metadata } from 'next'

// ISR for performance
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "מסלול Partners למפתחים | קוויק שופ",
  description: "הפלטפורמה הישראלית הגמישה ביותר למפתחים ובוני אתרים. שליטה מלאה בקוד, קומפוננטות React, API מתקדם ומודל רווח משתלם.",
}

const features = [
  { 
    Icon: CodeIcon, 
    title: "React & Next.js", 
    desc: "פיתוח בטכנולוגיות מודרניות. קוד נקי, TypeScript מלא, וקומפוננטות שימושיות.",
    highlight: true
  },
  { 
    Icon: TerminalIcon, 
    title: "CLI & API מלא", 
    desc: "גישה מלאה ל-API, Webhooks, ו-CLI לניהול חנויות ואוטומציות.",
    highlight: true
  },
  { 
    Icon: LayoutIcon, 
    title: "תבניות מותאמות אישית", 
    desc: "צרו תבניות ייחודיות ומכרו אותן בשוק התבניות שלנו.",
    highlight: true
  },
  { 
    Icon: BracesIcon, 
    title: "Headless Commerce", 
    desc: "שימוש ב-API בלבד לפרויקטים מותאמים אישית לחלוטין.",
    highlight: true
  },
  { 
    Icon: DatabaseIcon, 
    title: "מסד נתונים מהיר", 
    desc: "Neon PostgreSQL עם Connection Pooling למהירות מקסימלית.",
  },
  { 
    Icon: ZapIcon, 
    title: "Server Components", 
    desc: "80%+ Server Components - ביצועים של PHP עם חוויית React.",
  },
  { 
    Icon: GitBranchIcon, 
    title: "Git Integration", 
    desc: "עבדו עם Git, CI/CD, וכל הכלים שאתם אוהבים.",
  },
  { 
    Icon: PuzzleIcon, 
    title: "פלאגינים וExtensions", 
    desc: "כתבו פלאגינים ותוספים שיתממשקו עם הפלטפורמה.",
  },
]

const comparisons = [
  {
    feature: "טכנולוגיה",
    quickshop: "React, Next.js, TypeScript",
    shopify: "Liquid (שפה ייעודית)",
    description: "עבודה עם כלים מודרניים ומוכרים"
  },
  {
    feature: "גמישות בקוד",
    quickshop: "שליטה מלאה (Source Code)",
    shopify: "מוגבל לתבניות",
    description: "יכולת להתאים הכל"
  },
  {
    feature: "ביצועים",
    quickshop: "Server Components (מהיר כמו PHP)",
    shopify: "Hydration כבד",
    description: "מהירות טעינה ו-SEO"
  },
  {
    feature: "API",
    quickshop: "REST + GraphQL מלא",
    shopify: "מוגבל בתוכניות זולות",
    description: "גישה לכל הנתונים"
  },
  {
    feature: "Webhooks",
    quickshop: "כל האירועים",
    shopify: "מוגבל",
    description: "אוטומציות וחיבורים"
  },
]

const techStack = [
  { name: 'Next.js 15', Icon: RocketIcon, desc: 'App Router, Server Actions' },
  { name: 'TypeScript', Icon: BracesIcon, desc: 'Type Safety מלא' },
  { name: 'Tailwind CSS', Icon: LayoutIcon, desc: 'עיצוב מהיר ונקי' },
  { name: 'Drizzle ORM', Icon: DatabaseIcon, desc: 'Type-safe DB queries' },
  { name: 'Neon PostgreSQL', Icon: ServerIcon, desc: 'Serverless + Pooling' },
  { name: 'Vercel Edge', Icon: GlobeIcon, desc: 'CDN גלובלי' },
]

const faqs = [
  {
    q: "האם אני צריך ידע מוקדם ב-Next.js?",
    a: "לא חובה, אבל יעזור. אנחנו מספקים דוקומנטציה מקיפה, קוד לדוגמה, ותמיכה בעברית לכל שאלה."
  },
  {
    q: "האם אני יכול ליצור תבניות ולמכור אותן?",
    a: "בהחלט! יש לנו שוק תבניות שבו מפתחים יכולים למכור את העבודות שלהם. אתם קובעים את המחיר ומקבלים 70% מכל מכירה."
  },
  {
    q: "מה כלול בגישת ה-API?",
    a: "גישה מלאה לכל הנתונים: מוצרים, הזמנות, לקוחות, מלאי, קופונים ועוד. REST וגם GraphQL. ללא הגבלת קריאות."
  },
  {
    q: "איך עובד מודל העמלות?",
    a: "אתם מקבלים 20% מכל חנות שאתם מביאים לפלטפורמה, לכל החיים של הלקוח. בנוסף, 70% מכל מכירת תבנית."
  }
]

export default function ForDevelopersPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-1.5 text-sm font-medium rounded-full">
              למפתחים ובוני אתרים 👨‍💻
            </Badge>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              הפלטפורמה שמפתחים
              <span className="text-blue-400 block mt-2">רצו שתהיה קיימת</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              React, Next.js, TypeScript - הכלים שאתם כבר מכירים ואוהבים.
              <br />
              <strong className="text-white">API מלא, שליטה בקוד, ומודל רווח משתלם.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/register?type=developer" variant="primary" size="lg" className="w-full sm:w-auto">
                <CodeIcon className="ml-2 h-5 w-5" />
                הצטרפו כמפתח שותף
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
                צפו בתיעוד
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 justify-center text-sm font-medium text-gray-400 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                חשבון מפתח חינם
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                API ללא הגבלה
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                תמיכה בעברית
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 font-medium mb-10">בנוי על הטכנולוגיות הכי מתקדמות</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                  <tech.Icon className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{tech.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-blue-50 text-blue-600 border border-blue-100 mb-4">יכולות מפתחים</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">הכלים שאתם צריכים</h2>
            <p className="text-xl text-gray-500">
              פלטפורמה שנבנתה על ידי מפתחים, למפתחים. עם כל מה שחסר בפתרונות האחרים.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${item.highlight ? 'bg-white border-blue-100 shadow-lg shadow-blue-50' : 'bg-white border-gray-100 hover:border-blue-100'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.highlight ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                  <item.Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">למה לבחור בקוויק שופ?</h2>
            <p className="text-xl text-gray-500">
              השוואה טכנית מול פלטפורמות אחרות
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="hidden md:grid grid-cols-3 bg-gray-50/50 border-b border-gray-100">
              <div className="p-6 font-semibold text-gray-500">קריטריון</div>
              <div className="p-6 text-center font-bold text-blue-600 bg-blue-50/30">קוויק שופ</div>
              <div className="p-6 text-center font-semibold text-gray-500">Shopify / אחרים</div>
            </div>
            
            {comparisons.map((item, i) => (
              <div key={i} className="grid md:grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="p-6 flex flex-col justify-center">
                  <span className="font-bold text-gray-900">{item.feature}</span>
                  <span className="text-sm text-gray-500 mt-1">{item.description}</span>
                </div>
                <div className="p-6 flex items-center justify-center bg-blue-50/10 font-bold text-blue-700 text-center">
                   {item.quickshop}
                </div>
                <div className="p-6 flex items-center justify-center text-gray-500 text-center">
                   {item.shopify}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Model */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-6">מודל רווח</Badge>
            <h2 className="text-4xl font-bold mb-6">הרוויחו מהעבודה שלכם</h2>
            <p className="text-xl text-gray-300">
              שני ערוצי הכנסה שעובדים בשבילכם
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10">
              <div className="text-5xl font-bold text-emerald-400 mb-4">20%</div>
              <h3 className="text-2xl font-bold mb-4">עמלת הפניה</h3>
              <p className="text-gray-300 leading-relaxed">
                על כל חנות שאתם מביאים לפלטפורמה, תקבלו 20% מכל התשלומים החודשיים שלה - לכל החיים!
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10">
              <div className="text-5xl font-bold text-emerald-400 mb-4">70%</div>
              <h3 className="text-2xl font-bold mb-4">מכירת תבניות</h3>
              <p className="text-gray-300 leading-relaxed">
                יצרתם תבנית מדהימה? מכרו אותה בשוק שלנו וקבלו 70% מכל מכירה.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">שאלות נפוצות</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white rounded-2xl p-6 cursor-pointer border border-gray-100 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between font-bold text-gray-900 list-none">
                  {faq.q}
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-gray-600 mt-4 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-gray-900">
            מוכנים לבנות משהו מדהים?
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            הצטרפו לקהילת המפתחים שלנו והתחילו להרוויח מהיום.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
             <Button href="/register?type=developer" variant="primary" size="lg" className="px-10 py-6 text-xl">
               הצטרפו כמפתח שותף
             </Button>
             <Button href="mailto:developers@quick-shop.co.il" variant="outline" size="lg" className="px-10 py-6 text-xl">
               דברו איתנו
             </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}


