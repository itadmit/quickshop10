import Link from "next/link"
import { Button } from "@/components/landing/Button"
import { Badge } from "@/components/landing/Badge"
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  ArrowLeftIcon, 
  ZapIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  GlobeIcon,
  ShoppingBagIcon
} from "@/components/admin/icons"

import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { CheckoutAnimation } from "@/components/landing/CheckoutAnimation"
import { AdditionalCostsAccordion } from "@/components/landing/AdditionalCostsAccordion"
import { PaymentsExitPopup } from "@/components/landing/PaymentsExitPopup"
import { PaymentsWhatsAppButton } from "@/components/landing/PaymentsWhatsAppButton"
import { ScrollToHash } from "@/components/landing/ScrollToHash"
import { ScrollToPricingButton } from "@/components/landing/ScrollToPricingButton"
import type { Metadata } from 'next'

// ISR for performance
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Quick Shop Payments - סליקה מהירה וזולה | קוויק שופ",
  description: "שכחו מחברות האשראי. סליקה מובנית עם עמלות הכי נמוכות בישראל, Bit, Apple Pay ו-Google Pay מופעלים אוטומטית.",
}

const benefits = [
  {
    Icon: TrendingUpIcon,
    title: "אחוזי המרה גבוהים יותר",
    desc: "הלקוח נשאר באתר שלכם ולא מועבר לדף חיצוני. חוויית תשלום חלקה שמגדילה מכירות ב-15% בממוצע."
  },
  {
    Icon: RefreshCwIcon,
    title: "החזרים כספיים בקליק",
    desc: "צריכים לזכות לקוח? עושים את זה ישירות מתוך ההזמנה בקוויק שופ. לא צריך להיכנס למערכת נפרדת."
  },
  {
    Icon: CreditCardIcon,
    title: "דוחות וניהול במקום אחד",
    desc: "כל המידע הפיננסי שלכם מסונכרן אוטומטית עם ההזמנות. בלי אקסלים ובלי התאמות בסוף החודש."
  }
]

// המסלול העיקרי - מוצג בראש
const mainPlan = {
  name: "המסלול המומלץ",
  desc: "הפתרון המלא לעסקים - הכי משתלם בישראל",
  monthlyPrice: 69,
  setupFee: 249,
  launchSetupFee: 99, // מבצע השקה
  fee: "1.0%",
  signupUrl: "https://quickshop.payme.io/system/kyc/signup/696d06d27620a8003ef28ef5",
  features: [
    "הקמת מסוף חדש",
    "סליקת כל כרטיסי האשראי",
    "תשלום ב-Bit, Apple Pay, Google Pay",
    "הקמה מיידית 24-48 שעות!",
    "החזרים כספיים בקליק",
    "דוחות וניהול במקום אחד"
  ]
}

// מסלולים אלטרנטיביים - מוצגים למטה
const alternativePlans = [
  {
    name: "לא סלקת לא שילמת",
    desc: "ללא התחייבות חודשית",
    monthlyPrice: 0,
    fee: "3.4%",
    signupUrl: "https://quickshop.payme.io/system/kyc/signup/696cfac27620a8003ef22784",
    features: [
      "לא סלקת - לא שילמת",
      "הקמה מיידית 24-48 שעות!",
      "סליקת כל כרטיסי האשראי",
      "תשלום ב-Bit, Apple Pay, Google Pay"
    ]
  },
  {
    name: "נשאר עם ספק האשראי שלך",
    desc: "משלם רק על השימוש בפלטפורמה",
    monthlyPrice: 125,
    fee: "לפי הספק שלך",
    providers: [
      { name: "ישראכרט", signupUrl: "https://quickshop.payme.io/system/kyc/signup/696d04d17620a8003ef28036" },
      { name: "כאל", signupUrl: "https://quickshop.payme.io/system/kyc/signup/696d04e47620a8003ef280c6" },
    ],
    features: [
      "חיבור למסוף קיים",
      "סליקת כל כרטיסי האשראי",
      "תשלום ב-Bit, Apple Pay, Google Pay",
      "החזרים כספיים בקליק",
      "דוחות וניהול במקום אחד"
    ]
  }
]

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  );
}

export default function QuickShopPaymentsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <ScrollToHash />
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-green-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right z-10">
              <Badge className="mb-6 bg-green-100 text-green-800 border border-green-200 px-4 py-1.5 text-sm font-medium rounded-full">
                סליקה מובנית ב-Quick Shop 💳
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight text-gray-900">
                תשכחו מחברות אשראי.
                <span className="text-green-600 block mt-2">Quick Shop Payments כאן.</span>
              </h1>
              
              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                אין צורך לעשות סקר שוק בחברות האשראי. קבלו תשלומים בקלות דרכנו, עם חוויית סליקה חלקה שמגדילה המרות ב-15%.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <ScrollToPricingButton />
              </div>

              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm font-medium text-gray-500 flex-wrap">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-5 w-5 text-green-500" />
                  PCI DSS Level 1
                </div>
                <div className="flex items-center gap-2">
                  <img src="https://propsender.com/wp-content/uploads/2020/04/Mastercard-visa-card-logo.png" alt="Visa & Mastercard" className="h-5 object-contain" />
                </div>
                <div className="flex items-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/he/thumb/e/eb/Bit_logo_2024.svg/1200px-Bit_logo_2024.svg.png" alt="Bit" className="h-5 object-contain" />
                </div>
                <div className="flex items-center gap-2">
                  <img src="https://cdn2.downdetector.com/static/uploads/logo/apple-pay.png" alt="Apple Pay" className="h-5 object-contain" />
                </div>
                <div className="flex items-center gap-2">
                  <img src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/GooglePayLogo.width-500.format-webp.webp" alt="Google Pay" className="h-5 object-contain" />
                </div>
              </div>
            </div>

            {/* Hero Visual - Animated Checkout Demo */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-100 rounded-full filter blur-3xl opacity-40 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-200 rounded-full filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '700ms' }} />
              
              <CheckoutAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">למה כולם עוברים ל-Quick Shop Payments?</h2>
            <p className="text-lg text-gray-500">
              הפסקנו את הטרטור מול חברות האשראי. הכל במקום אחד, פשוט וקל.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-green-100 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                  <benefit.Icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-500 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Launch Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black py-4 border-y-2 border-yellow-500">
        <div className="flex items-center justify-center gap-8 animate-pulse">
          <span className="text-yellow-400 font-black text-xl md:text-2xl tracking-wider">LAUNCH PRICE</span>
          <span className="text-white text-lg md:text-xl font-bold">מחירי השקה בלעדיים - לזמן מוגבל בלבד</span>
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span className="text-yellow-400 font-black text-xl md:text-2xl tracking-wider hidden md:block">EXCLUSIVE OFFER</span>
          <span className="text-white text-lg md:text-xl font-bold hidden md:block">הזדמנות חד פעמית - רק עכשיו</span>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden scroll-mt-20">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-6 bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-1.5">
              המסלול שלנו
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              שקיפות מלאה. <span className="text-green-400">בלי הפתעות.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              מסלול אחד פשוט וברור - העמלות מחליפות את חברת האשראי והמסוף.
            </p>
          </div>

          {/* Main Plan - Highlighted */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="rounded-3xl p-10 bg-gradient-to-b from-slate-800/50 to-slate-800/30 border-2 border-green-500/60 shadow-2xl shadow-green-500/20 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-green-500 text-white text-sm font-bold px-6 py-2 rounded-full flex items-center gap-2 shadow-lg">
                  <ZapIcon className="w-4 h-4" /> המסלול המומלץ
                </span>
              </div>
              
              <div className="text-center mb-8 pt-4">
                <h3 className="text-3xl font-bold mb-2">{mainPlan.name}</h3>
                <p className="text-green-200/80">{mainPlan.desc}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Monthly Price */}
                <div className="bg-slate-900/50 rounded-2xl p-6 text-center border border-slate-700/50">
                  <span className="block text-sm text-slate-400 mb-2">תשלום חודשי</span>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-white">₪{mainPlan.monthlyPrice}</span>
                    <span className="text-slate-400 mr-2">+ מע״מ</span>
                  </div>
                </div>
                
                {/* Fee */}
                <div className="bg-gradient-to-b from-green-900/40 to-green-950/40 rounded-2xl p-6 text-center border border-green-500/30">
                  <span className="block text-sm text-green-300/80 mb-2">עמלת סליקה</span>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-white">{mainPlan.fee}</span>
                    <span className="text-slate-400 mr-2">+ מע״מ</span>
                  </div>
                </div>
              </div>
              
              {/* Setup Fee with Launch Offer */}
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-2xl p-6 text-center mb-8">
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <div>
                    <span className="text-4xl font-bold text-yellow-300">₪{mainPlan.launchSetupFee}</span>
                    <span className="text-yellow-200/80 mr-1">+ מע״מ</span>
                    <span className="block text-xs text-yellow-300 font-bold">🎉 מבצע חודש ההשקה!</span>
                  </div>
                  <div className="text-4xl text-yellow-400">←</div>
                  <div className="text-slate-400">
                    <span className="line-through text-lg">₪{mainPlan.setupFee}</span>
                    <span className="block text-xs">דמי הקמה רגילים</span>
                  </div>
                </div>
              </div>
              
              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {mainPlan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-200">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                      <CheckCircleIcon className="w-4 h-4 text-slate-900" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
              
              {/* Additional Costs Accordion with Signup Button */}
              <AdditionalCostsAccordion signupUrl={mainPlan.signupUrl} />
            </div>
          </div>

          {/* Alternative Plans */}
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-slate-300 mb-2">לא מתאים לך? יש עוד אפשרויות:</h3>
              <p className="text-slate-500">בחר את המסלול שמתאים לך</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* מסלול לא סלקת לא שילמת */}
              <div className="rounded-2xl p-6 bg-slate-800/40 border-2 border-slate-600/50 hover:bg-slate-800/60 hover:border-slate-500/70 transition-all">
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-white mb-1">{alternativePlans[0].name}</h4>
                  <p className="text-slate-400 text-sm">{alternativePlans[0].desc}</p>
                </div>
                
                <div className="flex items-center gap-6 mb-6">
                  <div>
                    <span className="text-3xl font-bold text-white">₪{alternativePlans[0].monthlyPrice}</span>
                    <span className="text-slate-400 text-sm mr-1">/ חודש + מע״מ</span>
                  </div>
                  <div className="h-10 w-px bg-slate-600" />
                  <div className="bg-slate-900/70 px-4 py-2 rounded-lg border border-slate-700">
                    <span className="text-lg font-bold text-green-400">{alternativePlans[0].fee}</span>
                    <span className="text-slate-400 text-sm mr-1">+ מע״מ</span>
                  </div>
                </div>
                
                <ul className="space-y-2 text-sm text-slate-300 mb-6">
                  {alternativePlans[0].features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  href={alternativePlans[0].signupUrl}
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl !bg-slate-700/50 hover:!bg-slate-600/70 !border-2 !border-slate-500 !text-white font-bold"
                >
                  בחר מסלול זה
                </Button>
              </div>
              
              {/* מסלול נשאר עם ספק האשראי שלך */}
              <div className="rounded-2xl p-6 bg-slate-800/40 border-2 border-slate-600/50 hover:bg-slate-800/60 hover:border-slate-500/70 transition-all">
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-white mb-1">{alternativePlans[1].name}</h4>
                  <p className="text-slate-400 text-sm">{alternativePlans[1].desc}</p>
                </div>
                
                <div className="flex items-center gap-6 mb-6">
                  <div>
                    <span className="text-3xl font-bold text-white">₪{alternativePlans[1].monthlyPrice}</span>
                    <span className="text-slate-400 text-sm mr-1">/ חודש + מע״מ</span>
                  </div>
                  <div className="h-10 w-px bg-slate-600" />
                  <div className="bg-slate-900/70 px-4 py-2 rounded-lg border border-slate-700">
                    <span className="text-lg font-bold text-green-400">{alternativePlans[1].fee}</span>
                  </div>
                </div>
                
                <ul className="space-y-2 text-sm text-slate-300 mb-6">
                  {alternativePlans[1].features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="text-xs text-slate-400 mb-3 text-center">בחר את הספק שלך:</div>
                <div className="grid grid-cols-2 gap-3">
                  {alternativePlans[1].providers?.map((provider, i) => (
                    <Button 
                      key={i}
                      href={provider.signupUrl}
                      variant="outline"
                      size="md"
                      className="rounded-xl !bg-slate-700/50 hover:!bg-slate-600/70 !border-2 !border-slate-500 !text-white font-bold"
                    >
                      {provider.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-gray-900">
            מוכנים להתחיל לסלוק?
          </h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            הצטרפו לאלפי עסקים שכבר חוסכים אלפי שקלים בחודש עם Quick Shop Payments.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button href={mainPlan.signupUrl} variant="primary" size="lg" className="px-10 py-6 text-xl bg-green-600 hover:bg-green-700">
              פתחו חשבון סליקה
            </Button>
            <Button href="mailto:payments@quick-shop.co.il" variant="outline" size="lg" className="px-10 py-6 text-xl">
              דברו איתנו
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
      
      {/* Floating WhatsApp Button */}
      <PaymentsWhatsAppButton />
      
      {/* Exit Intent Popup */}
      <PaymentsExitPopup />
    </div>
  )
}




