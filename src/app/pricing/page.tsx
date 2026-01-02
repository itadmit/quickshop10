import Link from 'next/link';

// Static page - no revalidation needed
export const dynamic = 'force-static';

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'להתחלה',
    features: [
      '10 מוצרים',
      'Subdomain בלבד',
      '3% עמלה מכל מכירה',
      'תמיכה בפורום',
    ],
    cta: 'התחל בחינם',
    highlighted: false,
  },
  {
    name: 'Basic',
    price: '49',
    description: 'לעסקים קטנים',
    features: [
      '100 מוצרים',
      'דומיין מותאם אישית',
      '2% עמלה מכל מכירה',
      'דוחות בסיסיים',
      'תמיכה באימייל',
    ],
    cta: 'התחל עכשיו',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '149',
    description: 'לעסקים גדלים',
    features: [
      'מוצרים ללא הגבלה',
      'דומיין מותאם אישית',
      '1% עמלה מכל מכירה',
      'דוחות מתקדמים',
      'עגלות נטושות',
      'צוות (עד 5 משתמשים)',
      'תמיכה בצ׳אט',
    ],
    cta: 'הכי פופולרי',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'בהתאמה',
    description: 'לארגונים',
    features: [
      'הכל ב-Pro',
      '0% עמלה',
      'API מלא',
      'צוות ללא הגבלה',
      'SLA 99.9%',
      'מנהל לקוח ייעודי',
      'אינטגרציות מותאמות',
    ],
    cta: 'צור קשר',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-black" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl tracking-[0.3em] uppercase">
            QuickShop
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/features" className="text-sm text-gray-600 hover:text-black transition-colors">
              יכולות
            </Link>
            <Link href="/pricing" className="text-sm font-medium">
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
            מחירים פשוטים וברורים
          </h1>
          <p className="text-gray-500 text-lg">
            בחרו את התוכנית שמתאימה לכם. ללא הפתעות, ללא עלויות נסתרות.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative p-8 rounded-2xl transition-all ${
                  plan.highlighted 
                    ? 'bg-black text-white scale-105 shadow-2xl' 
                    : 'bg-white border border-gray-200 hover:border-gray-400'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-black text-xs font-medium rounded-full">
                    הכי פופולרי
                  </div>
                )}
                
                <h3 className="font-display text-xl tracking-[0.1em] uppercase mb-2">
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/60' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                
                <div className="mb-6">
                  {plan.price === 'בהתאמה' ? (
                    <span className="text-2xl font-light">בהתאמה אישית</span>
                  ) : (
                    <>
                      <span className="text-4xl font-light">₪{plan.price}</span>
                      <span className={`text-sm ${plan.highlighted ? 'text-white/60' : 'text-gray-500'}`}>/חודש</span>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 16 16" 
                        fill="none" 
                        stroke={plan.highlighted ? 'white' : 'currentColor'} 
                        strokeWidth="2"
                        className="mt-0.5 flex-shrink-0"
                      >
                        <path d="M3 8l3 3 7-7" />
                      </svg>
                      <span className={plan.highlighted ? 'text-white/80' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === 'Enterprise' ? 'mailto:sales@quickshop.co.il' : '/register'}
                  className={`block w-full py-3 text-center text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl text-center mb-16 font-light tracking-[0.1em] uppercase">
            שאלות נפוצות
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'האם יש התחייבות?',
                a: 'לא! ניתן לבטל בכל עת. אין חוזים ואין התחייבויות ארוכות טווח.',
              },
              {
                q: 'מה קורה אם אני צריך יותר מוצרים?',
                a: 'פשוט שדרגו את התוכנית שלכם. המעבר מיידי וללא הפסקת שירות.',
              },
              {
                q: 'מה כלול בעמלה?',
                a: 'העמלה מכסה עיבוד תשלומים ותחזוקת מערכת. עמלות ספקי תשלום (כמו Stripe) נפרדות.',
              },
              {
                q: 'האם יש תקופת ניסיון?',
                a: 'כן! תוכנית Free היא בחינם לנצח. התחילו איתה וראו אם זה מתאים לכם.',
              },
              {
                q: 'איך אני משלם?',
                a: 'אנחנו מקבלים כרטיסי אשראי דרך Stripe. החיוב חודשי או שנתי (עם הנחה).',
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-white p-6 rounded-xl">
                <h3 className="font-medium mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-black text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-[0.1em] uppercase mb-6">
            מוכנים להתחיל?
          </h2>
          <p className="text-white/60 mb-8">
            הצטרפו למאות עסקים שכבר מוכרים עם QuickShop
          </p>
          <Link 
            href="/register" 
            className="inline-block px-12 py-4 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            התחל בחינם
          </Link>
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

