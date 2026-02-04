import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "מדיניות פרטיות | קוויק שופ",
  description: "מדיניות הפרטיות של קוויק שופ - כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלכם",
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" dir="rtl">
      <LandingHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">מדיניות פרטיות</h1>
          <p className="text-gray-500 mb-8">עדכון אחרון: {new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. מבוא</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              קוויק שופ ("אנחנו", "שלנו", "החברה") מחויבת להגנה על הפרטיות שלכם. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים, חושפים ומגנים על המידע האישי שלכם כאשר אתם משתמשים בפלטפורמה שלנו לבניית חנויות אונליין.
            </p>
            <p className="text-gray-700 leading-relaxed">
              על ידי שימוש בשירותים שלנו, אתם מסכימים לאיסוף ושימוש במידע בהתאם למדיניות זו.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. איזה מידע אנו אוספים</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 מידע שתספקו לנו</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>פרטי התחברות: שם משתמש, כתובת אימייל, מספר טלפון</li>
              <li>פרטי עסק: שם העסק, כתובת, מספר עוסק מורשה/ח.פ</li>
              <li>פרטי תשלום: פרטי כרטיס אשראי (מאוחסנים בצורה מוצפנת דרך ספקי תשלום מאובטחים)</li>
              <li>תוכן: מוצרים, תמונות, תיאורים וכל תוכן אחר שתעלו לחנות שלכם</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 מידע שנאסף אוטומטית</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>נתוני שימוש: פעולות שביצעתם בפלטפורמה, דפים שביקרתם, זמן בילוי</li>
              <li>נתוני מכשיר: סוג דפדפן, מערכת הפעלה, כתובת IP</li>
              <li>עוגיות (Cookies): קבצים קטנים המסייעים לנו לזכור את ההעדפות שלכם ולשפר את החוויה</li>
              <li>לוגים: רשומות של פעילות במערכת לצורך אבטחה וניתוח</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 מידע מלקוחות החנות שלכם</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              כאשר לקוחות מבצעים רכישות בחנות שלכם, אנו אוספים מידע הכרחי לביצוע העסקה:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>פרטי קשר: שם, כתובת אימייל, מספר טלפון</li>
              <li>פרטי משלוח: כתובת למשלוח</li>
              <li>פרטי תשלום: מועברים ישירות לספק התשלום (Bit, Pelecard וכו') ואינם מאוחסנים אצלנו</li>
              <li>היסטוריית הזמנות: פרטי המוצרים שנרכשו, סכומים ותאריכים</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. כיצד אנו משתמשים במידע</h2>
            <p className="text-gray-700 leading-relaxed mb-4">אנו משתמשים במידע שנאסף למטרות הבאות:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>לספק ולשפר את השירותים שלנו - הפעלת הפלטפורמה, תמיכה טכנית, עדכונים</li>
              <li>לעבד הזמנות - ביצוע תשלומים, הפקת חשבוניות, ניהול משלוחים</li>
              <li>לתקשר איתכם - הודעות שירות, עדכונים חשובים, תמיכה טכנית</li>
              <li>לשיווק (רקכמתכם) - עדכונים על פיצ'רים חדשים, טיפים, הצעות מיוחדות</li>
              <li>לאבטחה - זיהוי פעילות חשודה, מניעת הונאות, הגנה על החשבון שלכם</li>
              <li>לניתוח ושיפור - הבנת דפוסי שימוש, שיפור ביצועים, פיתוח תכונות חדשות</li>
              <li>לעמוד בדרישות חוקיות - שמירה על רשומות כנדרש בחוק, דיווח לרשויות במידת הצורך</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. שיתוף מידע עם צדדים שלישיים</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו לא מוכרים את המידע האישי שלכם. אנו חולקים מידע רק במקרים הבאים:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.1 ספקי שירותים</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו עובדים עם ספקי שירותים מהימנים המסייעים לנו להפעיל את הפלטפורמה:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>ספקי תשלום:</strong> Bit, Pelecard, Apple Pay, Google Pay - לביצוע תשלומים</li>
              <li><strong>חברות שילוח:</strong> Cargo, HFD, Lionwheel - להפקת משלוחים</li>
              <li><strong>שירותי ענן:</strong> AWS - לאיחסון נתונים</li>
              <li><strong>שירותי אנליטיקס:</strong> Google Analytics, Facebook Pixel - לניתוח תנועה (רק בחנויות שלכם)</li>
              <li><strong>שירותי תמיכה:</strong> מערכות CRM לניהול פניות</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              כל ספקי השירותים מחויבים לשמור על סודיות המידע ולעמוד בתקני אבטחה מחמירים.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 דרישות חוקיות</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו עשויים לחשוף מידע אם נדרש על פי חוק, צו בית משפט, או בקשה מרשות מוסמכת.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 העברת עסק</h3>
            <p className="text-gray-700 leading-relaxed">
              במקרה של מיזוג, רכישה או מכירת נכסים, המידע עשוי להיות מועבר כחלק מהעסקה, תוך שמירה על מדיניות פרטיות דומה.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. אבטחת מידע</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלכם:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>הצפנה:</strong> כל התקשורת מוצפנת באמצעות SSL/TLS</li>
              <li><strong>איחסון מאובטח:</strong> הנתונים מאוחסנים בשרתי AWS עם תקני אבטחה מחמירים</li>
              <li><strong>גיבויים:</strong> גיבויים אוטומטיים יומיים של כל הנתונים</li>
              <li><strong>גישה מוגבלת:</strong> רק עובדים מורשים עם צורך עסקי לגשת למידע</li>
              <li><strong>ניטור:</strong> מערכות ניטור מתקדמות לזיהוי פעילות חשודה</li>
              <li><strong>עדכוני אבטחה:</strong> עדכונים שוטפים של מערכות האבטחה</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              למרות מאמצינו, אין שיטה להעברה או אחסון אלקטרוני שהיא מאובטחת ב-100%. אנו לא יכולים להבטיח אבטחה מוחלטת, אך אנו מחויבים להגן על המידע שלכם כמיטב יכולתנו.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. זכויותיכם</h2>
            <p className="text-gray-700 leading-relaxed mb-4">לפי חוק הגנת הפרטיות התשמ"א-1981, יש לכם זכויות הבאות:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>זכות לעיון:</strong> אתם יכולים לבקש לקבל עותק של המידע האישי שאנו מחזיקים עליכם</li>
              <li><strong>זכות לתיקון:</strong> אתם יכולים לבקש לתקן מידע לא מדויק או לא מעודכן</li>
              <li><strong>זכות למחיקה:</strong> אתם יכולים לבקש למחוק את המידע האישי שלכם (בכפוף למגבלות חוקיות)</li>
              <li><strong>זכות להתנגד:</strong> אתם יכולים להתנגד לעיבוד המידע שלכם למטרות שיווק</li>
              <li><strong>זכות לניידות:</strong> אתם יכולים לבקש להעביר את המידע שלכם לספק אחר</li>
              <li><strong>זכות להסרת הסכמה:</strong> אתם יכולים להסיר את הסכמתכם לעיבוד מידע בכל עת</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              כדי לממש את זכויותיכם, אנא פנו אלינו בכתובת: <a href="mailto:info@quick-shop.co.il" className="text-emerald-600 hover:underline">info@quick-shop.co.il</a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. עוגיות (Cookies)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              אנו משתמשים בעוגיות כדי לשפר את החוויה שלכם. סוגי העוגיות שאנו משתמשים:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>עוגיות הכרחיות:</strong> נחוצות להפעלת הפלטפורמה (אימות, אבטחה)</li>
              <li><strong>עוגיות ביצועים:</strong> עוזרות לנו להבין כיצד אתם משתמשים בפלטפורמה</li>
              <li><strong>עוגיות פונקציונליות:</strong> זוכרות את ההעדפות שלכם (שפה, עיצוב)</li>
              <li><strong>עוגיות שיווק:</strong> משמשות לניתוח תנועה ושיווק (רקכמתכם)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              אתם יכולים לשלוט בעוגיות דרך הגדרות הדפדפן שלכם, אך שים לב שזה עלול להשפיע על תפקוד הפלטפורמה.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. מידע של קטינים</h2>
            <p className="text-gray-700 leading-relaxed">
              השירותים שלנו מיועדים לבעלי עסקים מעל גיל 18. אנו לא אוספים במודע מידע מקטינים. אם אתם הורים או אפוטרופוסים ומגלים שילדכם סיפק לנו מידע אישי, אנא פנו אלינו ואנו נמחק את המידע בהקדם האפשרי.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. שינויים במדיניות</h2>
            <p className="text-gray-700 leading-relaxed">
              אנו עשויים לעדכן את מדיניות הפרטיות מעת לעת. שינויים משמעותיים יפורסמו באתר זה ויישלחו לכם בהודעה. מומלץ לבדוק את המדיניות מעת לעת כדי להישאר מעודכנים.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. יצירת קשר</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              אם יש לכם שאלות או חששות לגבי מדיניות הפרטיות שלנו, אתם מוזמנים ליצור איתנו קשר:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>קוויק שופ</strong></p>
              <p className="text-gray-700 mb-2">אימייל: <a href="mailto:info@quick-shop.co.il" className="text-emerald-600 hover:underline">info@quick-shop.co.il</a></p>
              <p className="text-gray-700 mb-2">טלפון: <a href="tel:+972552554432" className="text-emerald-600 hover:underline" dir="ltr">+972-55-255-4432</a></p>
              <p className="text-gray-700 mb-2">כתובת: אלי הורביץ 4 רחובות</p>
              <p className="text-gray-700">שעות פעילות: ימים א'-ה' 09:00-18:00</p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. מדיניות פרטיות לחנויות</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              אם אתם בעלי חנות בפלטפורמה שלנו, אתם אחראים ליצור ולפרסם מדיניות פרטיות משלכם עבור הלקוחות שלכם. אנו מספקים תבנית בסיסית, אך מומלץ להתייעץ עם עורך דין כדי להתאים אותה לצרכים הספציפיים של העסק שלכם.
            </p>
            <p className="text-gray-700 leading-relaxed">
              אנו עוזרים לכם לעמוד בדרישות חוק הגנת הפרטיות על ידי מתן כלים לניהול הסכמות, מחיקת נתונים, ועמידה בזכויות הלקוחות שלכם.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
