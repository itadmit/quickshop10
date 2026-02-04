import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "תנאי שימוש ותקנון | קוויק שופ",
  description: "תנאי השימוש והתקנון של קוויק שופ - כללי השימוש בפלטפורמה, זכויות וחובות",
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <LandingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">תנאי שימוש ותקנון</h1>
          <p className="text-gray-500 mb-8">עדכון אחרון: {new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. מבוא והגדרות</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ברוכים הבאים לקוויק שופ ("הפלטפורמה", "השירות", "אנחנו", "שלנו"). תנאי שימוש אלה ("התקנון") מגדירים את הכללים והתנאים לשימוש בפלטפורמה שלנו לבניית חנויות אונליין.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              על ידי הרשמה, התחברות או שימוש בפלטפורמה, אתם מסכימים להיות כפופים לתנאים אלה. אם אינכם מסכימים לתנאים אלה, אנא אל תשתמשו בשירותים שלנו.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg mb-4">
              <p className="text-emerald-800 text-sm">
                <strong>חשוב:</strong> מומלץ לקרוא את התקנון בעיון. אם יש לכם שאלות, אתם מוזמנים ליצור איתנו קשר לפני השימוש בפלטפורמה.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. הגדרות</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>"הפלטפורמה"</strong> - מערכת קוויק שופ לניהול חנויות אונליין</li>
              <li><strong>"משתמש"</strong> - כל אדם או גוף המשתמש בפלטפורמה</li>
              <li><strong>"חנות"</strong> - חנות אונליין שנוצרה באמצעות הפלטפורמה</li>
              <li><strong>"תוכן"</strong> - כל מידע, טקסט, תמונות, קבצים ונתונים שמועלים לפלטפורמה</li>
              <li><strong>"חשבון"</strong> - חשבון משתמש שנוצר בפלטפורמה</li>
              <li><strong>"שירותים"</strong> - כל השירותים והתכונות שמספקת הפלטפורמה</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. הרשמה וחשבון משתמש</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 דרישות הרשמה</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>עליכם להיות מעל גיל 18 או בעלי אישור מאפוטרופוס</li>
              <li>עליכם לספק מידע מדויק, מעודכן ומלא בעת ההרשמה</li>
              <li>עליכם לשמור על סודיות פרטי ההתחברות שלכם</li>
              <li>אתם אחראים לכל הפעילות שמתבצעת בחשבון שלכם</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 אבטחת חשבון</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              אתם אחראים לשמירה על אבטחת החשבון שלכם. עליכם:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>לשמור על סודיות הסיסמה</li>
              <li>לא לשתף את פרטי ההתחברות עם אחרים</li>
              <li>להודיע לנו מיד על כל פעילות חשודה או גישה לא מורשית</li>
              <li>להשתמש בסיסמה חזקה וייחודית</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 ביטול חשבון</h3>
            <p className="text-gray-700 leading-relaxed">
              אתם יכולים לבטל את החשבון שלכם בכל עת דרך הגדרות החשבון. ביטול החשבון יביא למחיקת הנתונים שלכם בהתאם למדיניות הפרטיות שלנו. שים לב שתחויבו בתשלום עבור תקופות שכבר נעשה בהן שימוש בשירות.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. שימוש מותר ואסור</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.1 שימוש מותר</h3>
            <p className="text-gray-700 leading-relaxed mb-4">אתם רשאים להשתמש בפלטפורמה למטרות הבאות:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>יצירה וניהול של חנות אונליין חוקית</li>
              <li>מכירת מוצרים ושירותים חוקיים</li>
              <li>ניהול הזמנות, לקוחות ומלאי</li>
              <li>שימוש בכלים המובנים בפלטפורמה כפי שנועדו</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 שימוש אסור</h3>
            <p className="text-gray-700 leading-relaxed mb-4">אסור להשתמש בפלטפורמה למטרות הבאות:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>מכירת מוצרים או שירותים בלתי חוקיים (סמים, נשק, תוכן פירטי וכו')</li>
              <li>הונאה, הולכת שולל או הטעיה של לקוחות</li>
              <li>הפרת זכויות יוצרים, סימני מסחר או זכויות קניין רוחני אחרות</li>
              <li>העלאת תוכן פוגעני, משפיל, גזעני או בלתי חוקי</li>
              <li>ניסיון לפרוץ, להשבית או להזיק למערכת</li>
              <li>שימוש בוטים, סקריפטים או כלים אוטומטיים ללא אישור</li>
              <li>שימוש בפלטפורמה לפעילות ספאם או הודעות לא רצויות</li>
              <li>הפרת כל חוק או תקנה ישראלי או בינלאומי</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. תוכן וזכויות יוצרים</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.1 תוכן שלכם</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              אתם שומרים על כל הזכויות בתוכן שאתם מעלים לפלטפורמה (מוצרים, תמונות, תיאורים וכו'). אתם מעניקים לנו רישיון להשתמש בתוכן זה רק לצורך הפעלת השירותים והפלטפורמה.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 אחריות לתוכן</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              אתם אחראים באופן בלעדי לכל התוכן שאתם מעלים. אתם מתחייבים כי:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>יש לכם זכות להשתמש ולהעלות את התוכן</li>
              <li>התוכן אינו מפר זכויות יוצרים, סימני מסחר או זכויות אחרות</li>
              <li>התוכן חוקי ואינו פוגעני</li>
              <li>התוכן מדויק ולא מטעה</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.3 הסרת תוכן</h3>
            <p className="text-gray-700 leading-relaxed">
              אנו שומרים לעצמנו את הזכות להסיר כל תוכן שמפר את התקנון, חוק או פוגע באחרים, ללא התראה מוקדמת. במקרים חמורים, נשמור את הזכות לסגור חשבונות באופן מיידי.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. תשלומים ותמחור</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.1 תמחור</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              התמחור שלנו מפורט בעמוד המחירים. אנו שומרים לעצמנו את הזכות לשנות מחירים, אך שינויים לא יחולו על תקופות שכבר שולמו מראש.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.2 תשלום</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>תשלום חודשי או שנתי (עם הנחה) לפי בחירתכם</li>
              <li>תשלום באמצעות כרטיס אשראי דרך ספקי תשלום מאובטחים</li>
              <li>החיוב מתבצע אוטומטית בסוף כל תקופת חיוב</li>
              <li>אם התשלום נכשל, השירות עשוי להיות מושעה עד לביצוע תשלום</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.3 החזרים</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו מציעים תקופת ניסיון של 14 יום. אם תבטלו את החשבון בתוך תקופת הניסיון, לא תחויבו בתשלום. לאחר תקופת הניסיון:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>החזרים יתבצעו רק במקרים חריגים ובהתאם לשיקול דעתנו</li>
              <li>ביטול באמצע תקופת החיוב לא מזכה בהחזר חלקי</li>
              <li>השירות ימשך עד סוף תקופת החיוב ששולמה</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.4 עמלות</h3>
            <p className="text-gray-700 leading-relaxed">
              חלק מהתוכניות כוללות עמלת מערכת על מכירות. עמלות אלה מפורטות בעמוד המחירים. עמלות ספקי תשלום (Bit, Pelecard וכו') הן נפרדות ומחושבות על ידם.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. אחריות הלקוחות שלכם</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              כבעלי חנות, אתם אחראים באופן מלא ל:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>מכירת מוצרים ושירותים חוקיים ואיכותיים</li>
              <li>עמידה בכל התחייבויותיכם ללקוחות (משלוח, החזרות, אחריות)</li>
              <li>פרסום מדיניות פרטיות, החזרות ומשלוחים ברורה</li>
              <li>עמידה בחוקי הגנת הצרכן</li>
              <li>הנפקת חשבוניות מס כנדרש בחוק</li>
              <li>טיפול בתלונות ופניות לקוחות</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              אנו לא נושאים באחריות למוצרים או שירותים שאתם מוכרים, או לסכסוכים בינכם לבין הלקוחות שלכם.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. אחריותנו והגבלות</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">8.1 זמינות השירות</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו שואפים לספק שירות זמין 24/7, אך איננו יכולים להבטיח זמינות מוחלטת. השירות עשוי להיות מושעה לצורך תחזוקה, עדכונים או בשל נסיבות חריגות.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">8.2 הגבלת אחריות</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              במידה המרבית המותרת בחוק, אנו לא נושאים באחריות ל:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>נזקים עקיפים, תוצאתיים או מיוחדים</li>
              <li>אובדן רווחים, הכנסות או נתונים</li>
              <li>נזקים שנגרמו כתוצאה משימוש או אי-שימוש בשירות</li>
              <li>בעיות טכניות זמניות או השבתות</li>
              <li>פעולות של צדדים שלישיים (ספקי תשלום, חברות שילוח וכו')</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">8.3 אחריות מקסימלית</h3>
            <p className="text-gray-700 leading-relaxed">
              במקרה שבו ניקח אחריות, האחריות המקסימלית שלנו לא תעלה על סכום התשלום ששילמתם לנו ב-12 החודשים האחרונים.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. שינויים בשירות</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו שומרים לעצמנו את הזכות לשנות, לשדרג, להוסיף או להסיר תכונות מהפלטפורמה בכל עת. שינויים משמעותיים יפורסמו מראש, אך איננו מתחייבים להודיע על כל שינוי.
            </p>
            <p className="text-gray-700 leading-relaxed">
              אם השינויים משפיעים לרעה על השימוש שלכם בפלטפורמה, תוכלו לבטל את החשבון שלכם בהתאם לסעיף 3.3.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. ביטול והשעיה</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">10.1 ביטול על ידכם</h3>
            <p className="text-gray-700 leading-relaxed">
              אתם יכולים לבטל את החשבון שלכם בכל עת דרך הגדרות החשבון. הביטול ייכנס לתוקף בסוף תקופת החיוב הנוכחית.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">10.2 השעיה וביטול על ידינו</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו שומרים לעצמנו את הזכות להשעות או לבטל חשבונות במקרים הבאים:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>הפרה של התקנון או מדיניות הפרטיות</li>
              <li>פעילות בלתי חוקית או חשודה</li>
              <li>אי תשלום או תשלום כושל</li>
              <li>פעילות הפוגעת בפלטפורמה או במשתמשים אחרים</li>
              <li>בקשת רשויות מוסמכות</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              במקרה של ביטול, נתונים עשויים להישמר לתקופה מסוימת בהתאם למדיניות הפרטיות ולחוק.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. חוקים ודין שולט</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              התקנון כפוף לחוקי מדינת ישראל. כל סכסוך או מחלוקת ייפתרו בבתי המשפט המוסמכים בישראל.
            </p>
            <p className="text-gray-700 leading-relaxed">
              אם חלק מהתקנון יימצא כבלתי תקף, שאר התנאים יישארו בתוקף.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. שינויים בתקנון</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו שומרים לעצמנו את הזכות לעדכן את התקנון מעת לעת. שינויים משמעותיים יפורסמו באתר ויישלחו לכם בהודעה. המשך השימוש בפלטפורמה לאחר פרסום השינויים מהווה הסכמה לתנאים החדשים.
            </p>
            <p className="text-gray-700 leading-relaxed">
              אם אינכם מסכימים לשינויים, עליכם להפסיק את השימוש בפלטפורמה ולבטל את החשבון שלכם.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. יצירת קשר</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              אם יש לכם שאלות לגבי התקנון, אתם מוזמנים ליצור איתנו קשר:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>קוויק שופ</strong></p>
              <p className="text-gray-700 mb-2">אימייל: <a href="mailto:info@quick-shop.co.il" className="text-emerald-600 hover:underline">info@quick-shop.co.il</a></p>
              <p className="text-gray-700 mb-2">טלפון: <a href="tel:+972552554432" className="text-emerald-600 hover:underline" dir="ltr">+972-55-255-4432</a></p>
              <p className="text-gray-700">כתובת: ישראל</p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. הסכמה</h2>
            <p className="text-gray-700 leading-relaxed">
              על ידי שימוש בפלטפורמה, אתם מאשרים שקראתם, הבנתם והסכמתם לתנאי השימוש והתקנון. אם אינכם מסכימים לתנאים אלה, אנא אל תשתמשו בשירותים שלנו.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
