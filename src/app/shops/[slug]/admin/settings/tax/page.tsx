import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { taxRates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TaxRateForm } from './tax-form';
import { TaxRateButtons } from './tax-buttons';

export default async function TaxSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get tax rates
  const rates = await db
    .select()
    .from(taxRates)
    .where(eq(taxRates.storeId, store.id))
    .orderBy(desc(taxRates.isDefault), desc(taxRates.createdAt));

  const formatRate = (rate: string) => {
    return `${Number(rate)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href={`/shops/${slug}/admin/settings`} className="hover:text-black">
            הגדרות
          </Link>
          <span>/</span>
          <span>מיסים</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">הגדרות מיסים</h1>
        <p className="text-gray-500 text-sm mt-1">
          הגדרת שיעורי מס לפי אזור
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <p className="text-blue-900 font-medium">מס ערך מוסף בישראל</p>
            <p className="text-blue-700 mt-1">
              שיעור מע״מ בישראל הוא 17%. מומלץ להציג מחירים כולל מע״מ (כברירת מחדל).
            </p>
          </div>
        </div>
      </div>

      {/* Add New Rate */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">הוסף שיעור מס</h2>
        <TaxRateForm storeId={store.id} slug={slug} />
      </div>

      {/* Existing Rates */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">שיעורי מס קיימים</h2>
        </div>

        {rates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 14l6-6m4.5-4.5v18m0 0h-18m18 0a4.5 4.5 0 00-4.5-4.5H5.5"/>
            </svg>
            <p>לא הוגדרו שיעורי מס</p>
            <p className="text-sm mt-1">הוסף שיעור מס ראשון למעלה</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rates.map((rate) => (
              <div key={rate.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{rate.name}</span>
                      {rate.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                          ברירת מחדל
                        </span>
                      )}
                      {!rate.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          לא פעיל
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {rate.country || 'כל המדינות'}
                      {rate.region && ` / ${rate.region}`}
                      {' • '}
                      {rate.includeInPrice ? 'כלול במחיר' : 'נוסף למחיר'}
                      {rate.applyToShipping && ' • חל על משלוח'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatRate(rate.rate)}
                    </span>
                    <TaxRateButtons rateId={rate.id} slug={slug} isActive={rate.isActive} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Common Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">הגדרות נפוצות</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg text-right hover:border-gray-400 transition-colors">
            <p className="font-medium">מע״מ ישראל 17%</p>
            <p className="text-sm text-gray-500 mt-1">הגדרה מובנית עבור עסקים ישראליים</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg text-right hover:border-gray-400 transition-colors">
            <p className="font-medium">פטור ממע״מ</p>
            <p className="text-sm text-gray-500 mt-1">לעסקים פטורים או לייצוא</p>
          </button>
        </div>
      </div>
    </div>
  );
}

