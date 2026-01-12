import Link from "next/link"
import { Button } from "@/components/landing/Button"
import { Badge } from "@/components/landing/Badge"
import { 
  RocketIcon, 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  UsersIcon, 
  TrendingUpIcon, 
  BarChart3Icon, 
  ZapIcon, 
  CreditCardIcon, 
  TruckIcon, 
  EyeIcon, 
  MousePointerClickIcon, 
  HeartIcon, 
  ShoppingCartIcon, 
  ShoppingBagIcon,
  SearchIcon, 
  CheckIcon,
  XIcon,
  ChevronDownIcon
} from "@/components/admin/icons"

import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import type { Metadata } from 'next'

// ISR for performance
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "מסלול Partners למשווקים | קוויק שופ",
  description: "הפלטפורמה הישראלית המתקדמת לניהול חנות אונליין. 14 אירועי tracking, מערכת משפיעניות מובנית, שיתוף צוות ללא עלות, והתממשקות מושלמת לכל פלטפורמות הפרסום.",
}

const features = [
  { 
    Icon: BarChart3Icon, 
    title: "14 אירועי Tracking", 
    desc: "מעקב מלא אחרי כל צעד של הלקוח - מכניסה לאתר, דרך צפייה במוצר ועד לרכישה.",
    highlight: true
  },
  { 
    Icon: UsersIcon, 
    title: "מערכת משפיעניות", 
    desc: "ניהול משפיענים מובנה במערכת. קופונים ייעודיים, דשבורד אישי ומעקב אחר ביצועים.",
    highlight: true
  },
  { 
    Icon: TrendingUpIcon, 
    title: "אופטימיזציית המרות", 
    desc: "כלים מובנים להגדלת יחס ההמרה - Upsells, Cross-sells, ושחזור עגלות.",
    highlight: true
  },
  { 
    Icon: MousePointerClickIcon, 
    title: "פיקסלים וחיבורים", 
    desc: "Facebook, TikTok, Google Ads - התקנה בקליק אחד ומעבר נתונים מלא.",
    highlight: true
  },
  { 
    Icon: ZapIcon, 
    title: "מהירות = המרות", 
    desc: "אתר מהיר = יותר מכירות. אנחנו מבטיחים זמני טעינה של פחות מ-2 שניות.",
  },
  { 
    Icon: HeartIcon, 
    title: "רשימות משאלות", 
    desc: "לקוחות שומרים מוצרים ואתם יכולים לפנות אליהם בהמשך.",
  },
  { 
    Icon: ShoppingCartIcon, 
    title: "שחזור עגלות נטושות", 
    desc: "וואטסאפ ומייל אוטומטי ללקוחות שעזבו באמצע.",
  },
  { 
    Icon: SearchIcon, 
    title: "SEO מובנה", 
    desc: "אופטימיזציה אוטומטית לגוגל - meta tags, sitemap, וכתובות נקיות.",
  },
]

const trackingEvents = [
  { name: 'PageView', desc: 'צפייה בדף', Icon: EyeIcon },
  { name: 'ViewContent', desc: 'צפייה במוצר', Icon: ShoppingBagIcon },
  { name: 'AddToCart', desc: 'הוספה לעגלה', Icon: ShoppingCartIcon },
  { name: 'InitiateCheckout', desc: 'התחלת צ\'קאאוט', Icon: CreditCardIcon },
  { name: 'Purchase', desc: 'רכישה הושלמה', Icon: CheckCircleIcon },
  { name: 'Search', desc: 'חיפוש באתר', Icon: SearchIcon },
]

const comparisons = [
  {
    feature: "אירועי Tracking",
    quickshop: "14 אירועים מובנים",
    others: "5-8 אירועים בסיסיים",
    description: "מעקב מדויק יותר = פרסום יעיל יותר"
  },
  {
    feature: "מערכת משפיעניות",
    quickshop: "מובנה + דשבורד ייעודי",
    others: "אפליקציה חיצונית בתשלום",
    description: "חיסכון של מאות שקלים בחודש"
  },
  {
    feature: "שיתוף צוות",
    quickshop: "ללא הגבלה, חינם",
    others: "עולה כסף / מוגבל",
    description: "כל הצוות עובד יחד בלי תוספת מחיר"
  },
  {
    feature: "זמן טעינה",
    quickshop: "< 2 שניות (Server Components)",
    others: "3-5+ שניות",
    description: "מהירות = יותר המרות"
  },
  {
    feature: "A/B Testing",
    quickshop: "מובנה",
    others: "אפליקציה נוספת",
    description: "בדקו מה עובד בלי כלים חיצוניים"
  },
]

const faqs = [
  {
    q: "מה זה 14 אירועי Tracking?",
    a: "אנחנו שולחים לפלטפורמות הפרסום (פייסבוק, טיקטוק, גוגל) מידע על כל פעולה שהלקוח עושה באתר - מצפייה בדף הבית, דרך חיפוש, צפייה במוצר, הוספה לעגלה, עדכון כמות, הסרה מעגלה, התחלת צ'קאאוט, הזנת פרטים, בחירת משלוח, בחירת תשלום, ועד לרכישה מוצלחת. המידע הזה מאפשר לאלגוריתמים של הפלטפורמות לזהות את הקהל הנכון עבורכם."
  },
  {
    q: "איך עובדת מערכת המשפיעניות?",
    a: "יוצרים משפיען/ית בלוח הניהול, מגדירים קופון או הנחה ייעודיים, והם מקבלים דשבורד משלהם. הם יכולים לראות בזמן אמת כמה מכירות נעשו עם הקופון שלהם, כמה עמלה הם צברו, ואיזה מוצרים הכי מוכרים."
  },
  {
    q: "האם אפשר לשתף את החנות עם צוות?",
    a: "כן! הוסיפו כמה אנשי צוות שתרצו - ללא עלות נוספת. לכל אחד אפשר להגדיר הרשאות שונות (צפייה בלבד, עריכת מוצרים, גישה להזמנות וכו')."
  },
  {
    q: "האם יש לכם Conversion API (Server-Side)?",
    a: "בהחלט! בנוסף לפיקסל הסטנדרטי, יש לנו Server-Side Tracking שמבטיח שהנתונים מגיעים גם כשיש חסימות (iOS 14+, Ad blockers וכו')."
  }
]

export default function ForMarketersPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-slate-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-1.5 text-sm font-medium rounded-full">
              למשווקים ומפרסמים 📈
            </Badge>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              הפלטפורמה שמשווקים
              <span className="text-purple-400 block mt-2">חולמים עליה</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              14 אירועי Tracking, מערכת משפיעניות מובנית, וכל הכלים שצריך לעשות ROAS טוב.
              <br />
              <strong className="text-white">הפלטפורמה שנבנתה עם מפרסמים בראש.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/register?type=marketer" variant="primary" size="lg" className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600">
                <BarChart3Icon className="ml-2 h-5 w-5" />
                הצטרפו כשותף שיווקי
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
                ראו את הכלים שלנו
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 justify-center text-sm font-medium text-gray-400 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                14 אירועי Tracking
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                מערכת משפיעניות מובנית
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                שיתוף צוות ללא הגבלה
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Events Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 font-medium mb-10">חלק מאירועי ה-Tracking שאנחנו שולחים</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trackingEvents.map((event, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                  <event.Icon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{event.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{event.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">+ עוד 8 אירועים נוספים...</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-purple-50 text-purple-600 border border-purple-100 mb-4">כלי שיווק</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">הכל כדי למקסם ROAS</h2>
            <p className="text-xl text-gray-500">
              הכלים שמפרסמים מקצועיים צריכים - מובנים במערכת, בלי אפליקציות נוספות.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${item.highlight ? 'bg-white border-purple-100 shadow-lg shadow-purple-50' : 'bg-white border-gray-100 hover:border-purple-100'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.highlight ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-600'}`}>
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
            <h2 className="text-4xl font-bold mb-6 text-gray-900">למה מפרסמים עוברים אלינו?</h2>
            <p className="text-xl text-gray-500">
              השוואה שיווקית מול פלטפורמות אחרות
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="hidden md:grid grid-cols-3 bg-gray-50/50 border-b border-gray-100">
              <div className="p-6 font-semibold text-gray-500">קריטריון</div>
              <div className="p-6 text-center font-bold text-purple-600 bg-purple-50/30">קוויק שופ</div>
              <div className="p-6 text-center font-semibold text-gray-500">פלטפורמות אחרות</div>
            </div>
            
            {comparisons.map((item, i) => (
              <div key={i} className="grid md:grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="p-6 flex flex-col justify-center">
                  <span className="font-bold text-gray-900">{item.feature}</span>
                  <span className="text-sm text-gray-500 mt-1">{item.description}</span>
                </div>
                <div className="p-6 flex items-center justify-center bg-purple-50/10 font-bold text-purple-700 text-center">
                   {item.quickshop}
                </div>
                <div className="p-6 flex items-center justify-center text-gray-500 text-center">
                   {item.others}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Model */}
      <section className="py-20 bg-gradient-to-br from-purple-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-6">מודל רווח</Badge>
            <h2 className="text-4xl font-bold mb-6">הרוויחו מכל לקוח שאתם מביאים</h2>
            <p className="text-xl text-gray-300">
              מודל שותפים משתלם למשווקים
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10">
              <div className="text-5xl font-bold text-emerald-400 mb-4">20%</div>
              <h3 className="text-2xl font-bold mb-4">עמלה חודשית</h3>
              <p className="text-gray-300 leading-relaxed">
                על כל חנות שאתם מביאים, תקבלו 20% מהתשלום החודשי שלה - לתמיד. לקוח שמשלם ₪399 = ₪80 לכם כל חודש.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10">
              <div className="text-5xl font-bold text-emerald-400 mb-4">∞</div>
              <h3 className="text-2xl font-bold mb-4">ללא הגבלה</h3>
              <p className="text-gray-300 leading-relaxed">
                אין גבול לכמות הלקוחות שאפשר להביא. ככל שתביאו יותר, תרוויחו יותר. זו הכנסה פסיבית שממשיכה לצמוח.
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
            מוכנים לשדרג את הפרסום?
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            הצטרפו לקהילת המשווקים שלנו והתחילו להרוויח מהיום.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
             <Button href="/register?type=marketer" variant="primary" size="lg" className="px-10 py-6 text-xl bg-purple-500 hover:bg-purple-600">
               הצטרפו כשותף שיווקי
             </Button>
             <Button href="mailto:partners@quick-shop.co.il" variant="outline" size="lg" className="px-10 py-6 text-xl">
               דברו איתנו
             </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}



