import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGiftCardSettings } from '../../admin/gift-cards/settings/actions';
import { defaultGiftCardSettings } from '../../admin/gift-cards/settings/types';
import { GiftCardPurchaseForm } from './gift-card-purchase-form';
import { Gift, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface GiftCardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function GiftCardPage({ params }: GiftCardPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get gift card settings
  const settings = await getGiftCardSettings(store.id);

  // If gift card purchase is not enabled, show a message
  if (!settings.enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <Gift className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">גיפט קארד לא זמין</h1>
          <p className="text-gray-600 mb-8">
            רכישת כרטיסי מתנה אינה זמינה כרגע בחנות זו.
          </p>
          <Link
            href={`/shops/${slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            חזרה לחנות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25 mb-6">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {settings.pageTitle || defaultGiftCardSettings.pageTitle}
          </h1>
          <p className="text-gray-600 text-lg">
            {settings.pageDescription || defaultGiftCardSettings.pageDescription}
          </p>
        </div>

        {/* Purchase Form */}
        <GiftCardPurchaseForm
          storeId={store.id}
          storeSlug={slug}
          storeName={store.name}
          settings={settings}
        />

        {/* Info Section */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">איך זה עובד?</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">בחרו סכום</p>
                <p className="text-sm text-gray-500">בחרו מבין הסכומים המוצעים או הזינו סכום מותאם אישית</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">מלאו את הפרטים</p>
                <p className="text-sm text-gray-500">הזינו את פרטי הנמען והוסיפו הודעה אישית</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">שלמו וזהו!</p>
                <p className="text-sm text-gray-500">הגיפט קארד יישלח ישירות למייל של הנמען</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

