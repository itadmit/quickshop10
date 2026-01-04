import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageForm } from '../page-form';

const pageTemplates: Record<string, { title: string; content: string }> = {
  about: {
    title: 'אודות',
    content: `<h2>אודותינו</h2>
<p>ברוכים הבאים לחנות שלנו!</p>
<p>אנחנו חנות מקוונת המתמחה באספקת מוצרים איכותיים ללקוחותינו.</p>
<h3>החזון שלנו</h3>
<p>להעניק חווית קנייה מעולה עם שירות אישי ומוצרים מהשורה הראשונה.</p>
<h3>צוות</h3>
<p>הצוות שלנו מורכב מאנשי מקצוע מנוסים שעומדים לרשותכם בכל שאלה.</p>`,
  },
  contact: {
    title: 'צור קשר',
    content: `<h2>צור קשר</h2>
<p>נשמח לשמוע מכם!</p>
<h3>פרטי התקשרות</h3>
<p><strong>טלפון:</strong> 03-1234567</p>
<p><strong>אימייל:</strong> info@example.com</p>
<p><strong>כתובת:</strong> רחוב הראשי 1, תל אביב</p>
<h3>שעות פעילות</h3>
<p>ראשון - חמישי: 09:00 - 18:00</p>
<p>שישי: 09:00 - 13:00</p>`,
  },
  shipping: {
    title: 'משלוחים והחזרות',
    content: `<h2>מדיניות משלוחים</h2>
<h3>אזורי משלוח</h3>
<p>אנו משלחים לכל רחבי הארץ.</p>
<h3>זמני אספקה</h3>
<p><strong>משלוח רגיל:</strong> 3-5 ימי עסקים</p>
<p><strong>משלוח מהיר:</strong> 1-2 ימי עסקים</p>
<h3>מדיניות החזרות</h3>
<p>ניתן להחזיר מוצרים תוך 14 יום מיום הקנייה.</p>
<p>המוצר חייב להיות באריזתו המקורית וללא סימני שימוש.</p>`,
  },
  privacy: {
    title: 'מדיניות פרטיות',
    content: `<h2>מדיניות פרטיות</h2>
<p>אנו מתחייבים לשמור על פרטיותכם.</p>
<h3>איסוף מידע</h3>
<p>אנו אוספים מידע הנדרש לביצוע הזמנות ושיפור השירות.</p>
<h3>שימוש במידע</h3>
<p>המידע משמש אותנו לעיבוד הזמנות, שירות לקוחות ושיפור חווית המשתמש.</p>
<h3>אבטחת מידע</h3>
<p>אנו משתמשים באמצעי אבטחה מתקדמים להגנה על המידע שלכם.</p>
<h3>יצירת קשר</h3>
<p>לשאלות בנושא פרטיות, צרו קשר בכתובת: privacy@example.com</p>`,
  },
};

export default async function NewPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { slug } = await params;
  const { template } = await searchParams;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  const templateData = template && pageTemplates[template] 
    ? pageTemplates[template] 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">עמוד חדש</h1>
          <p className="text-gray-500 text-sm mt-1">
            {templateData ? `תבנית: ${templateData.title}` : 'יצירת עמוד תוכן חדש'}
          </p>
        </div>
        <Link
          href={`/shops/${slug}/admin/pages`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← חזרה לעמודים
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PageForm 
          storeId={store.id} 
          slug={slug}
          initialData={templateData ? {
            title: templateData.title,
            slug: template!,
            content: templateData.content,
            isPublished: false,
          } : undefined}
        />
      </div>
    </div>
  );
}


