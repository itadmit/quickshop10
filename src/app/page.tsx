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
  ServerIcon, 
  CreditCardIcon, 
  TruckIcon, 
  ShoppingCartIcon, 
  ShoppingBagIcon,
  CheckIcon,
  ChevronDownIcon,
  MessageCircleIcon,
  SmartphoneIcon,
  PaletteIcon,
  LayoutDashboardIcon,
  PackageIcon,
  GlobeIcon,
  StarIcon,
  PackagePlusIcon,
  MegaphoneIcon,
  BoxesIcon,
  LayoutTemplateIcon,
  CalendarClockIcon,
  BanknoteIcon,
  ScanFaceIcon
} from "@/components/admin/icons"

import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { HeroProductShowcase } from "@/components/landing/HeroProductShowcase"
import { LeadCaptureModal } from "@/components/landing/LeadCaptureModal"
import { SmartWhatsappButton } from "@/components/landing/SmartWhatsappButton"
import type { Metadata } from 'next'

// ISR - Revalidate every hour for good performance
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "קוויק שופ - הלקוחות שלנו מוכרים יותר | פלטפורמה לחנויות אונליין",
  description: "אנחנו לא רק בונים חנויות - אנחנו בונים עסקים מצליחים. מהירות שמשפרת המרות, אינטגרציות לכל ספק ישראלי, ותמיכה שעוזרת לכם לצמוח. הצטרפו למצליחים!",
  keywords: [
    "חנות אונליין",
    "פלטפורמה לחנויות אונליין",
    "בניית חנות אונליין",
    "חנות וירטואלית",
    "מכירות אונליין",
    "איקומרס ישראל",
    "פלטפורמת מסחר אלקטרוני",
    "בניית אתר מכירות",
    "חנות דיגיטלית",
    "מערכת ניהול חנות",
    "סליקה אונליין",
    "תשלום אונליין",
    "משלוחים אונליין",
    "ניהול מלאי",
    "קופונים ומבצעים",
    "מועדון לקוחות",
    "תמיכה בעברית",
    "Drag and Drop",
    "עיצוב חנות",
    "שופיפיי חלופה",
    "וויקס חלופה",
    "חנות אונליין ישראל",
    "פלטפורמה ישראלית",
    "Quick Shop",
    "קוויק שופ"
  ],
  openGraph: {
    title: "קוויק שופ - הלקוחות שלנו מוכרים יותר | פלטפורמה לחנויות אונליין",
    description: "אנחנו לא רק בונים חנויות - אנחנו בונים עסקים מצליחים. מהירות שמשפרת המרות, אינטגרציות לכל ספק ישראלי, ותמיכה שעוזרת לכם לצמוח.",
    type: "website",
    locale: "he_IL",
    siteName: "קוויק שופ",
    url: "https://quickshop.co.il",
  },
  twitter: {
    card: "summary_large_image",
    title: "קוויק שופ - הלקוחות שלנו מוכרים יותר",
    description: "פלטפורמה לחנויות אונליין - הכל בעברית, הכל פשוט, והכל עובד",
  },
  alternates: {
    canonical: "https://quickshop.co.il",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

// Feature data - static, no runtime cost
const features = [
  { 
    Icon: PaletteIcon, 
    title: "עיצוב בחוויית Drag & Drop", 
    desc: "לא צריך מעצב ולא מתכנת. גוררים אלמנטים, משנים צבעים וטקסטים בקליק.",
    highlight: true
  },
  { 
    Icon: SmartphoneIcon, 
    title: "Mobile First", 
    desc: "החנות שלכם תראה מדהים בנייד באופן אוטומטי, בלי שום מאמץ נוסף.",
    highlight: true
  },
  { 
    Icon: MessageCircleIcon, 
    title: "תמיכה בוואטסאפ", 
    desc: "נתקעתם? אנחנו כאן. מענה אנושי, מהיר ובעברית.",
    highlight: true
  },
  { 
    Icon: ShoppingCartIcon, 
    title: "קופה חכמה המרה גבוהה", 
    desc: "תהליך רכישה מהיר שנועד למקסם מכירות ולמנוע נטישת עגלות.",
    highlight: true
  },
  { 
    Icon: ZapIcon, 
    title: "מהירות טעינה", 
    desc: "שרתים חזקים ב-AWS שמבטיחים שהאתר שלכם יטוס.",
  },
  { 
    Icon: LayoutDashboardIcon, 
    title: "ניהול מלא בעברית", 
    desc: "כל הממשק, הדוחות וההגדרות - הכל בעברית פשוטה וברורה.",
  },
  { 
    Icon: PackageIcon, 
    title: "ניהול מלאי והזמנות", 
    desc: "שליטה מלאה על המלאי, ווריאציות מוצרים (צבע/מידה) וסטטוס הזמנות.",
  },
  { 
    Icon: TrendingUpIcon, 
    title: "כלי שיווק מובנים", 
    desc: "קופונים, מבצעים, ושחזור עגלות נטושות בלחיצת כפתור.",
  },
]

const comparisons = [
  {
    feature: "תמיכה ושירות",
    quickshop: "וואטסאפ אישי בעברית",
    shopify: "מיילים / צ'אט בוט באנגלית",
    description: "זמינות אמיתית כשיש בעיה דחופה"
  },
  {
    feature: "ממשק ניהול",
    quickshop: "עברית מלאה (RTL)",
    shopify: "אנגלית / תרגום חלקי",
    description: "נוחות עבודה יומיומית"
  },
  {
    feature: "חשבוניות ומשלוחים",
    quickshop: "מובנה במערכת",
    shopify: "דורש אפליקציות חיצוניות",
    description: "אינטגרציה מלאה לשוק הישראלי"
  },
  {
    feature: "הקמת החנות",
    quickshop: "גרירה ושחרור (Drag & Drop)",
    shopify: "דורש ידע/תבניות מורכבות",
    description: "פשוט כמו לבנות מצגת"
  },
  {
    feature: "עלויות נסתרות",
    quickshop: "אין. הכל כלול.",
    shopify: "אפליקציות בתשלום נוסף",
    description: "יודעים בדיוק כמה משלמים בסוף חודש"
  },
]

const integrations = [
  { name: 'Google Tag Manager', logo: 'https://leadproinfotech.com/wp-content/uploads/2025/01/google-tag.png' },
  { name: 'TikTok Ads', logo: 'https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png' },
  { name: 'Facebook Pixel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png' },
  { name: 'Make', logo: 'https://luna1.co/6e65f0.png' },
  { name: 'Zapier', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zapier_logo.svg/2560px-Zapier_logo.svg.png' },
  { name: 'Apple Pay', logo: 'https://cdn2.downdetector.com/static/uploads/logo/apple-pay.png' },
  { name: 'Google Pay', logo: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/GooglePayLogo.width-500.format-webp.webp' },
  { name: 'Bit', logo: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Bit_logo_2024.svg/1200px-Bit_logo_2024.svg.png' },
]

const builtInFeatures = [
  { Icon: StarIcon, title: 'מערכת ביקורות', desc: 'אימות רכישה, תמונות וידאו, שאלות ותשובות (Q&A) וסינון חכם.', color: 'yellow' },
  { Icon: PackagePlusIcon, title: 'Bundles & Upsell', desc: 'הגדלת סל הקנייה עם באנדלים, הצעות בקופה ו-Cross-sell חכם.', color: 'pink' },
  { Icon: ScanFaceIcon, title: 'Shop the Look', desc: 'תיוג מוצרים על תמונות אווירה לרכישה מהירה של כל הלוק.', color: 'blue' },
  { Icon: MegaphoneIcon, title: 'שיווק מתקדם', desc: 'עגלות נטושות, קופונים, Gift Cards, ופיקסלים (FB, TikTok, Google).', color: 'green' },
  { Icon: BoxesIcon, title: 'ניהול מלאי', desc: 'וריאציות, עריכה מהירה, תוספות למוצרים וטבלאות מידות.', color: 'emerald' },
  { Icon: LayoutTemplateIcon, title: 'תוכן ועיצוב', desc: 'בלוג מובנה, עמודים אישיים, תפריטים ועורך עיצוב מתקדם.', color: 'orange' },
]

const extraFeatures = [
  { Icon: CalendarClockIcon, label: 'שומר שבת אוטומטי' },
  { Icon: MessageCircleIcon, label: 'אייקון וואטסאפ צף' },
  { Icon: BanknoteIcon, label: 'תשלום במזומן לשליח' },
  { Icon: BarChart3Icon, label: 'Google Analytics 4' },
]

const faqs = [
  {
    q: "האם אני צריך מתכנת כדי להקים חנות?",
    a: "ממש לא! המערכת שלנו בנויה בשיטת 'גרירה ושחרור' (Drag & Drop). אתם פשוט גוררים את האלמנטים שאתם רוצים, משנים טקסטים ותמונות, והחנות מוכנה. זה פשוט כמו לערוך מצגת."
  },
  {
    q: "האם באמת יש תמיכה בעברית?",
    a: "כן, וזה אחד היתרונות הגדולים שלנו. אנחנו חברה ישראלית, והתמיכה שלנו היא בעברית מלאה. בנוסף, יש לנו ערוץ תמיכה ישיר בוואטסאפ, כך שתמיד יש עם מי לדבר."
  },
  {
    q: "האם המערכת מתאימה למובייל?",
    a: "בוודאי. כל חנות שנבנית בקוויק שופ מותאמת אוטומטית למובייל (Mobile First). האתר שלכם יראה מדהים בכל מכשיר - אייפון, אנדרואיד, טאבלט ומחשב."
  },
  {
    q: "מה זה חבילת 'אתר קטלוג'?",
    a: "זו חבילה שמתאימה לעסקים שרוצים להציג את המוצרים שלהם באינטרנט בצורה מקצועית, אבל מעדיפים לסגור את העסקה בטלפון או בוואטסאפ ולא דרך סליקה באתר. מעולה ליבואנים, סיטונאים או עסקים בתחום השירותים."
  }
]

function getColorClasses(color: string) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-50 text-yellow-600',
    pink: 'bg-pink-50 text-pink-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return colors[color] || colors.emerald
}

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "קוויק שופ",
    "applicationCategory": "ECommercePlatform",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "399",
      "priceCurrency": "ILS",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1000"
    },
    "description": "פלטפורמה לחנויות אונליין - הכל בעברית, הכל פשוט, והכל עובד. בניית חנות אונליין עם Drag & Drop, תמיכה בעברית, אינטגרציות ישראליות וכל הכלים להצלחה.",
    "featureList": [
      "עיצוב Drag & Drop",
      "תמיכה בעברית",
      "סליקה אונליין",
      "ניהול מלאי",
      "קופונים ומבצעים",
      "מועדון לקוחות",
      "אינטגרציות ישראליות"
    ]
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right z-10">
              <Badge className="mb-6 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-1.5 text-sm font-medium rounded-full">
                הפלטפורמה המובילה בישראל 🇮🇱
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl mb-6 leading-[1.1] tracking-tight text-gray-900" style={{ fontWeight: 900 }}>
                הלקוחות שלנו מוכרים יותר
                <span className="text-emerald-500 block mt-2">וזה לא במקרה</span>
              </h1>
              
              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                בפלטפורמה שלנו לא רק בונים חנויות - בפלטפורמה שלנו בונים עסקים מצליחים. הכל בעברית, הכל פשוט, והכל עובד.
                <br />
                <strong>מהירות שמשפרת המרות</strong>, תמיכה ישירה בוואטסאפ, ממשק Drag & Drop קליל, וחיבור מושלם לכל מה שהעסק הישראלי צריך.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button href="/register" variant="primary" size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  <RocketIcon className="ml-2 h-5 w-5" />
                  התחילו בחינם עכשיו
                </Button>
                <Button href="/shops/noir-fashion" variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6">
                  צפו בחנות לדוגמא
                  <ArrowLeftIcon className="mr-2 h-5 w-5" />
                </Button>
              </div>
              <p className="mt-3 text-sm text-gray-400 text-center lg:text-right font-medium">
                 לא נדרש כרטיס אשראי • 7 ימים ניסיון חינם
              </p>

              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm font-medium text-gray-500 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                  ללא כרטיס אשראי
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                  הקמה תוך דקות
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                  שירות אישי
                </div>
              </div>
            </div>

            <HeroProductShowcase />
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 font-medium mb-10">עסקים ישראלים שבחרו בקוויק שופ</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
             <img src="https://quickshopil-storage.s3.amazonaws.com/uploads/spasha/6903621c39586.webp" alt="סטודיו פשה" className="h-12 w-auto object-contain hover:scale-110 transition-transform" />
             <img src="https://www.teva-call.co.il/wp-content/uploads/2019/08/Argania-logo.png" alt="ארגניה" className="h-12 w-auto object-contain hover:scale-110 transition-transform" />
             <img src="https://quickshopil-storage.s3.amazonaws.com/uploads/reefjewelry/67e51d6ff3fc3.webp" alt="ריף תכשיטים" className="h-12 w-auto object-contain hover:scale-110 transition-transform" />
             <img src="https://quickshopil-storage.s3.amazonaws.com/uploads/sefer/67c5c3d3d4273.webp" alt="ספר טוב" className="h-14 w-auto object-contain hover:scale-110 transition-transform" />
          </div>
        </div>
      </section>

      {/* Testimonial Section - Social Proof */}
      <section className="py-24 bg-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-emerald-900/50 to-black/50"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
           <div className="flex justify-center gap-1 mb-8">
             {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />)}
           </div>
           
           <h2 className="text-3xl md:text-5xl font-bold text-white mb-10 leading-tight">
             "ניסיתי הכל - שופיפיי, וויקס, וורדפרס. <br className="hidden md:block" />
             רק בקוויק שופ הרגשתי שזה באמת פשוט."
           </h2>
           
           <div className="flex items-center justify-center gap-5">
              <div className="w-16 h-16 bg-white rounded-full overflow-hidden border-2 border-emerald-400 p-0.5">
                <img 
                  src="https://3lwnd3ucppklouqs.public.blob.vercel-storage.com/quickshop/stores/argania/smEroidOvE.webp" 
                  alt="מישל דונדה" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
              <div className="text-right">
                 <div className="text-white font-bold text-lg">מישל דונדה</div>
                 <div className="text-emerald-300">מנהלת אתרים בקבוצת ארגניה</div>
              </div>
           </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 mb-4">הכל כלול</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">כל הכלים להצלחה במקום אחד</h2>
            <p className="text-xl text-gray-500">
              בנינו מערכת שחושבת על הכל, כדי שאתם תוכלו להתעסק רק בלמכור.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${item.highlight ? 'bg-white border-emerald-100 shadow-lg shadow-emerald-50' : 'bg-white border-gray-100 hover:border-emerald-100'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.highlight ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>
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
      <section id="comparison" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">למה כולם עוברים לקוויק שופ?</h2>
            <p className="text-xl text-gray-500">
              כשמשווים ראש בראש מול פלטפורמות בינלאומיות כמו שופיפיי, ההבדל ברור.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="hidden md:grid grid-cols-3 bg-gray-50/50 border-b border-gray-100">
              <div className="p-6 font-semibold text-gray-500">תכונה</div>
              <div className="p-6 text-center font-bold text-emerald-600 bg-emerald-50/30">קוויק שופ (אנחנו)</div>
              <div className="p-6 text-center font-semibold text-gray-500">פלטפורמות אחרות (Shopify/Wix)</div>
            </div>
            
            {comparisons.map((item, i) => (
              <div key={i} className="grid md:grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="p-6 flex flex-col justify-center">
                  <span className="font-bold text-gray-900">{item.feature}</span>
                  <span className="text-sm text-gray-500 mt-1">{item.description}</span>
                </div>
                <div className="p-6 flex items-center justify-center bg-emerald-50/10 font-bold text-emerald-700 text-center">
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

      {/* Quick Shop Payments Section */}
      <section className="py-20 bg-linear-to-br from-emerald-900 to-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-6 px-4 py-1.5 text-sm font-medium rounded-full backdrop-blur-sm">
                 חדש! סליקה מובנית 💳
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                תשכחו מחברות אשראי.
                <br />
                <span className="text-emerald-400">Quick Shop Payments</span> כאן.
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                אין צורך לעשות סקר שוק בחברות האשראי. קבלו תשלומים בקלות דרכנו, עם חוויית סליקה חלקה שמגדילה המרות ב-15%.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <SmartphoneIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Bit & Apple Pay & Google Pay</div>
                    <div className="text-xs text-gray-400">מופעל אוטומטית לכולם</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <BanknoteIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">חשבוניות אוטומטיות</div>
                    <div className="text-xs text-gray-400">נשלחות ללקוח מייד עם הרכישה</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                   <div className="bg-purple-500/20 p-2 rounded-lg">
                    <TrendingUpIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">הכסף אצלכם מהר</div>
                    <div className="text-xs text-gray-400">זיכוי חודשי כל 2 לחודש בפעימה אחת בלבד!</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button href="/quickshop-payments" variant="primary" size="lg">
                  לפרטים נוספים והרשמה
                  <ArrowLeftIcon className="mr-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Visual */}
            <div className="relative hidden lg:block">
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-all duration-700">
                 <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="font-bold text-gray-900">סיכום הזמנה</div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">שולם בהצלחה</span>
                 </div>
                 <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden">
                             <img 
                               src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" 
                               alt="Nike Air Max" 
                               className="w-full h-full object-cover"
                             />
                          </div>
                          <div>
                             <div className="font-bold text-gray-900">Nike Air Max</div>
                             <div className="text-sm text-gray-500">מידה: 42 | צבע: אדום</div>
                          </div>
                       </div>
                       <div className="font-bold text-gray-900">₪450.00</div>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-500">אמצעי תשלום</span>
                          <div className="flex items-center gap-2 font-bold text-gray-900">
                             <img src="https://cdn2.downdetector.com/static/uploads/logo/apple-pay.png" alt="Apple Pay" className="w-8 h-5 object-contain" />
                             Apple Pay
                          </div>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-500">חשבונית מס</span>
                          <span className="text-emerald-600 font-medium cursor-pointer">#INV-2024-001</span>
                       </div>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                       <p className="text-emerald-800 text-sm font-medium">
                          התשלום עבר בהצלחה! החשבונית נשלחה למייל.
                       </p>
                    </div>
                 </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl animate-bounce delay-700">
                 <div className="flex items-center gap-2 font-bold text-gray-900">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    סליקה מאובטחת SSL
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-blue-50 text-blue-600 border border-blue-100 mb-4">אינטגרציות</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">הכל מתחבר Plug & Play</h2>
            <p className="text-xl text-gray-500">
              בלי קוד ובלי הסתבכויות. מחברים את כל הכלים שאתם צריכים בקליק אחד.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {integrations.map((platform, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg transition-all flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center mb-4 transition-colors">
                  <img src={platform.logo} alt={platform.name} className="w-10 h-10 object-contain" />
                </div>
                <h3 className="font-bold text-gray-900">{platform.name}</h3>
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircleIcon className="w-3 h-3" />
                  חיבור בקליק
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">שקט נפשי טכנולוגי</h2>
              <p className="text-gray-400 text-lg mb-8">
                אנחנו דואגים לכל הצד הטכני - שרתים, אבטחה, גיבויים ועדכונים. אתם דואגים רק לעסק שלכם.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <ServerIcon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">מאוחסן ב-AWS</h3>
                    <p className="text-gray-400 text-sm">התשתית החזקה בעולם שמבטיחה שהחנות תמיד באוויר</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <TruckIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">מחובר לחברות שילוח</h3>
                    <p className="text-gray-400 text-sm">Cargo, HFD, Lionwheel ועוד - הפקת משלוחים אוטומטית</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CreditCardIcon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">סליקה ישראלית</h3>
                    <p className="text-gray-400 text-sm">עובדים עם כל חברות האשראי הישראליות, ביט ו-Apple Pay</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-700">
              <h3 className="font-bold text-xl mb-6">תמיכה שאין באף מקום אחר</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <MessageCircleIcon className="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                     <div className="font-bold">וואטסאפ ישיר</div>
                     <div className="text-sm text-gray-400">דברו עם בן אדם, לא עם בוט</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <GlobeIcon className="w-6 h-6 text-blue-500 shrink-0" />
                  <div>
                     <div className="font-bold">מדברים עברית</div>
                     <div className="text-sm text-gray-400">מבינים את השוק הישראלי ואת הצרכים שלכם</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <UsersIcon className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                     <div className="font-bold">קהילה תומכת</div>
                     <div className="text-sm text-gray-400">אלפי בעלי עסקים שכבר הצליחו</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built-in Plugins Section */}
      <section className="py-24 bg-white border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 mb-4">חוסכים לכם כסף</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">למה לשלם על אפליקציות?</h2>
            <p className="text-xl text-gray-500">
              בפלטפורמות אחרות כל פיצ'ר עולה כסף. אצלנו הכל מגיע Built-in.
              <br />
              כל הכלים המתקדמים ביותר, מוכנים לשימוש מהרגע הראשון.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {builtInFeatures.map((item, idx) => (
               <div key={idx} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-50/50 transition-all duration-300 bg-white group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${getColorClasses(item.color)}`}>
                     <item.Icon className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                     <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {extraFeatures.map((item, i) => (
               <div key={i} className="flex items-center justify-center gap-2 p-4 rounded-xl border border-gray-50 bg-gray-50/50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors">
                 <item.Icon className="w-4 h-4 text-emerald-500" />
                 {item.label}
               </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-white text-emerald-600 border border-emerald-200 mb-6 shadow-sm">תמחור פשוט ושקוף</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              בחרו את המסלול המתאים לעסק שלכם
            </h2>
            <p className="text-xl text-gray-600">
              בלי אותיות קטנות, בלי הפתעות. אפשר לשדרג או לבטל בכל רגע.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             {/* Catalog Plan */}
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-gray-300 transition-all flex flex-col">
               <div className="mb-6">
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">אתר תדמית / קטלוג</h3>
                 <p className="text-gray-500">מתאים לעסקים שרוצים להציג מוצרים ללא רכישה אונליין</p>
               </div>
               <div className="mb-8">
                 <div className="text-5xl font-bold text-gray-900">₪299</div>
                 <div className="text-gray-500 mt-2">לחודש</div>
                 <div className="text-emerald-600 font-bold text-sm mt-2">0% עמלות עסקה</div>
               </div>
               <Button href="/register?plan=catalog" variant="outline" className="w-full h-12 text-lg font-bold rounded-xl border-2">
                 התחילו עם קטלוג
               </Button>
               <ul className="mt-8 space-y-4 text-sm text-gray-600 flex-1">
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   עיצוב אישי ב-Drag & Drop
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   הצגת מוצרים ללא הגבלה
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   חיבור לדומיין אישי
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   טופס יצירת קשר ללידים
                 </li>
               </ul>
             </div>

             {/* Full Store Plan */}
             <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 relative overflow-hidden flex flex-col">
               <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">מומלץ</div>
               <div className="mb-6">
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">חנות אונליין מלאה</h3>
                 <p className="text-gray-500">כל מה שצריך כדי למכור באינטרנט ולצמוח</p>
               </div>
               <div className="mb-8">
                 <div className="text-5xl font-bold text-emerald-600">₪399</div>
                 <div className="text-gray-500 mt-2">לחודש</div>
                 <div className="text-gray-400 text-sm mt-2">+ 0.5% עמלת מערכת</div>
               </div>
               <Button href="/register?plan=store" variant="primary" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-emerald-100">
                 פתחו חנות מלאה
               </Button>
               <ul className="mt-8 space-y-4 text-sm text-gray-600 flex-1">
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   <strong>כל הפיצ'רים כלולים</strong>
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   מערכת סליקה ומשלוחים
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   קופונים, מבצעים ומועדון לקוחות
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   אינטגרציה לפייסבוק, גוגל וטיקטוק
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckIcon className="w-5 h-5 text-emerald-500" />
                   תמיכה מלאה בוואטסאפ
                 </li>
               </ul>
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
            החנות החדשה שלכם מחכה
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            אלפי עסקים ישראלים כבר בחרו בדרך הקלה והמשתלמת. הצטרפו אליהם היום.
          </p>
          <div className="flex justify-center gap-4">
             <Button href="/register" variant="primary" size="lg" className="px-10 py-6 text-xl">
               פתחו חנות בחינם עכשיו
             </Button>
          </div>
        </div>
      </section>

      <LandingFooter />

      <LeadCaptureModal />
      <SmartWhatsappButton />
    </div>
  )
}
