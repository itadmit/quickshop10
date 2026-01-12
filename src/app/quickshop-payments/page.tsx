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

const pricingTiers = [
  {
    name: "לא סלקת לא שילמת",
    desc: "ללא התחייבות חודשית",
    monthlyPrice: 0,
    setupFee: 299,
    fee: "3.4%",
    feeDesc: "עמלת סליקה",
    features: [
      "לא סלקת - לא שילמת",
      "הקמה מיידית 24-48 שעות !",
      "סליקת כל כרטיסי האשראי",
      "תשלום ב-Bit, Apple Pay, Google Pay"
    ],
    recommended: false
  },
  {
    name: "רק סליקה",
    desc: "ללקוחות עם מסוף קיים",
    monthlyPrice: 129,
    setupFee: 249,
    fee: "לפי המסוף שלך",
    feeDesc: "עמלת סליקה",
    features: [
      "חיבור למסוף קיים",
      "סליקת כל כרטיסי האשראי",
      "תשלום ב-Bit, Apple Pay, Google Pay"
    ],
    recommended: false
  },
  {
    name: "הכל כלול PRO",
    desc: "הפתרון המלא לעסקים",
    monthlyPrice: 59,
    setupFee: 199,
    fee: "1.0%",
    feeDesc: "הכי משתלם בישראל",
    features: [
      "הקמת מסוף חדש",
      "סליקת כל כרטיסי האשראי",
      "תשלום ב-Bit, Apple Pay, Google Pay",
      "הקמה מיידית 24-48 שעות !"
    ],
    recommended: true
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
                <Button href="/register?service=payments" variant="primary" size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                  אני רוצה להצטרף
                  <ArrowLeftIcon className="mr-2 h-5 w-5" />
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm font-medium text-gray-500 flex-wrap">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-5 w-5 text-green-500" />
                  PCI DSS Level 1
                </div>
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5 text-green-500" />
                  כל סוגי הכרטיסים
                </div>
                <div className="flex items-center gap-2">
                  <GlobeIcon className="h-5 w-5 text-green-500" />
                  Bit, Apple Pay & Google Pay
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-100 rounded-full filter blur-3xl opacity-40 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-200 rounded-full filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '700ms' }} />
              
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-md w-full transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-gray-900 font-bold text-xl">תשלום מאובטח</div>
                  <div className="flex gap-2">
                    <div className="h-8 px-3 bg-white rounded border border-gray-100 flex items-center justify-center">
                      <span className="text-xs font-bold">VISA</span>
                    </div>
                    <div className="h-8 px-3 bg-white rounded border border-gray-100 flex items-center justify-center">
                      <span className="text-xs font-bold">Mastercard</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <ZapIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Bit</div>
                      <div className="text-xs text-green-600">תשלום מהיר</div>
                    </div>
                    <div className="mr-auto">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <GlobeIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Apple Pay</div>
                      <div className="text-xs text-green-600">מופעל אוטומטית</div>
                    </div>
                    <div className="mr-auto">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <GlobeIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Google Pay</div>
                      <div className="text-xs text-green-600">מופעל אוטומטית</div>
                    </div>
                    <div className="mr-auto">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-green-600 rounded-xl p-4 text-white text-center font-bold shadow-lg shadow-green-200">
                  שילם ₪249.00 בהצלחה
                </div>
              </div>
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
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <Badge className="mb-6 bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-1.5">
              המסלולים שלנו
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              שקיפות מלאה. <span className="text-green-400">בלי הפתעות.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              בחרו את המסלול שמתאים לגודל העסק שלכם.
              <br/>
              העמלות מחליפות את חברת האשראי והמסוף.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {pricingTiers.map((tier, idx) => (
              <div 
                key={idx} 
                className={`rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                  tier.recommended 
                    ? 'bg-slate-800/30 border border-green-500/50 transform md:-translate-y-6 shadow-2xl shadow-green-500/10 relative' 
                    : 'bg-slate-800/20 border border-slate-700/30 hover:bg-slate-800/30'
                }`}
              >
                {tier.recommended && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <ZapIcon className="w-3 h-3" /> מומלץ
                    </span>
                  </div>
                )}
                
                <div className={`mb-6 ${tier.recommended ? 'pt-2' : ''}`}>
                  <h3 className={`text-xl font-bold mb-2 ${tier.recommended ? 'text-2xl' : ''}`}>{tier.name}</h3>
                  <p className={tier.recommended ? 'text-green-200/80 text-sm' : 'text-slate-400 text-sm'}>{tier.desc}</p>
                </div>
                
                <div className="mb-8 pb-8 border-b border-slate-700/50">
                  <div className="flex items-baseline mb-3">
                    <span className="text-5xl font-bold tracking-tight">₪{tier.monthlyPrice}</span>
                    <span className="text-slate-400 mr-2 font-medium">/ חודש + מע״מ</span>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${tier.recommended ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-700/20 border-slate-600/20'}`}>
                    <span className={tier.recommended ? 'text-green-300 font-bold' : 'text-white font-bold'}>₪{tier.setupFee}</span>
                    <span className={tier.recommended ? 'text-green-200/60 text-sm' : 'text-slate-400 text-sm'}>דמי הקמה חד פעמיים + מע״מ</span>
                  </div>
                  {tier.recommended && (
                    <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3 text-center mt-3">
                      <p className="text-yellow-300 text-xs font-bold leading-tight">
                        ⚡ מחיר השקה בלעדי ל-50 הנרשמים הראשונים
                      </p>
                    </div>
                  )}
                </div>
                
                <div className={`mb-8 p-4 rounded-2xl text-center ${tier.recommended ? 'bg-gradient-to-b from-green-900/30 to-green-950/30 border border-green-500/30' : 'bg-slate-900/30 border border-slate-700/30'}`}>
                  <span className="block text-xs text-slate-400 mb-1 uppercase tracking-wider font-medium">{tier.feeDesc}</span>
                  <span className={`text-3xl font-bold ${tier.recommended ? 'text-white' : ''}`}>{tier.fee} {tier.fee.includes('%') && <span className="text-sm">+ מע״מ</span>}</span>
                </div>
                
                <ul className="space-y-4 text-sm text-slate-300 flex-grow">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tier.recommended ? 'bg-green-500' : 'bg-green-500/10'}`}>
                        <CheckCircleIcon className={`w-4 h-4 ${tier.recommended ? 'text-slate-900' : 'text-green-400'}`} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  href="/register?service=payments"
                  variant={tier.recommended ? 'primary' : 'outline'}
                  size="lg"
                  className={`w-full mt-6 rounded-xl ${tier.recommended ? 'bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/25' : 'bg-slate-700 hover:bg-slate-600 border-0 text-white'}`}
                >
                  {tier.recommended ? 'אני רוצה את המסלול הזה' : 'בחר מסלול זה'}
                </Button>
              </div>
            ))}
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
            <Button href="/register?service=payments" variant="primary" size="lg" className="px-10 py-6 text-xl bg-green-600 hover:bg-green-700">
              פתחו חשבון סליקה
            </Button>
            <Button href="mailto:payments@quick-shop.co.il" variant="outline" size="lg" className="px-10 py-6 text-xl">
              דברו איתנו
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}



