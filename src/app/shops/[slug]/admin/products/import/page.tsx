/**
 * Product Import Page - Server Component
 * 
 * ⚡ Performance:
 * - Single query (getStoreBySlug - cached)
 * - No getCurrentUser() blocking call
 * - Consistent admin UI
 */

import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { PageHeader, Button } from '@/components/admin/ui';
import { ProductImportForm } from './import-form';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductImportPage({ params }: PageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ייבוא מוצרים"
        description="ייבא מוצרים מקובץ CSV. קטגוריות שלא קיימות ייווצרו אוטומטית."
        breadcrumbs={[
          { label: 'מוצרים', href: `/shops/${slug}/admin/products` },
          { label: 'ייבוא' },
        ]}
        actions={
          <Button href={`/shops/${slug}/admin/products`} variant="secondary">
            חזרה למוצרים
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Import Form */}
        <div>
          <ProductImportForm storeId={store.id} storeSlug={slug} />
        </div>

        {/* CSV Format Guide */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">📋 מבנה קובץ CSV</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-2 pr-0 pl-4 font-medium text-gray-500">עמודה</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500 w-12">חובה</th>
                  <th className="text-right py-2 pl-0 pr-4 font-medium text-gray-500">תיאור</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">סלאג</td>
                  <td className="py-2 px-2 text-center text-green-500">✓</td>
                  <td className="py-2 pl-0 pr-4">שם המוצר</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">תיאור</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">תיאור מלא (HTML)</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">מחיר רגיל</td>
                  <td className="py-2 px-2 text-center text-green-500">✓</td>
                  <td className="py-2 pl-0 pr-4">המחיר המקורי</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">מחיר מבצע</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">המחיר המוזל (0 = ללא)</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">מקט</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">מק״ט / ברקוד</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">כמות במלאי</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">מספר יחידות</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">התעלם ממלאי</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">״כן״ = backorder</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">מוסתר</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">״כן״ = טיוטה</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">קטגוריות</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">מופרדות בפסיק</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">תגים</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">מופרדים בפסיק</td>
                </tr>
                <tr>
                  <td className="py-2 pr-0 pl-4 font-mono text-xs">תמונה ראשית</td>
                  <td className="py-2 px-2 text-center text-gray-300">-</td>
                  <td className="py-2 pl-0 pr-4">שמות קבצים (פסיק)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            <strong>💡 תמונות:</strong> הזן קידומת URL ושמות הקבצים יצורפו אליה.
            <div className="mt-2 font-mono text-xs bg-blue-100 p-2 rounded">
              https://example.com/images/ + img.webp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
