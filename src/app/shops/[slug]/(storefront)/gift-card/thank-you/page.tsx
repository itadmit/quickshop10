import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { pendingPayments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Gift, Mail, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ThankYouPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; error?: string }>;
}

export default async function GiftCardThankYouPage({ params, searchParams }: ThankYouPageProps) {
  const { slug } = await params;
  const { ref, error } = await searchParams;
  
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Handle error case
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">התשלום נכשל</h1>
          <p className="text-gray-600 mb-8">
            אירעה שגיאה בתהליך התשלום. לא חויבת ולא נוצר גיפט קארד.
          </p>
          <Link
            href={`/shops/${slug}/gift-card`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            נסה שוב
          </Link>
        </div>
      </div>
    );
  }

  // Get pending payment details
  let paymentData: {
    recipientName: string;
    recipientEmail: string;
    amount: string;
  } | null = null;

  if (ref) {
    const [payment] = await db
      .select()
      .from(pendingPayments)
      .where(
        and(
          eq(pendingPayments.storeId, store.id),
          eq(pendingPayments.providerRequestId, ref)
        )
      )
      .limit(1);

    if (payment) {
      // Gift card metadata is stored in orderData.metadata
      const orderData = payment.orderData as { metadata?: { recipientName?: string; recipientEmail?: string } } | undefined;
      const metadata = orderData?.metadata;
      paymentData = {
        recipientName: metadata?.recipientName || 'הנמען',
        recipientEmail: metadata?.recipientEmail || payment.customerEmail || '',
        amount: payment.amount,
      };
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-500/25 mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Gift className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            הגיפט קארד נשלח!
          </h1>
          <p className="text-gray-600 text-lg">
            תודה על הרכישה מ-{store.name}
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
            <p className="text-white/80 text-sm mb-1">סכום הגיפט קארד</p>
            <p className="text-4xl font-bold text-white">
              ₪{paymentData?.amount || '---'}
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">נשלח לכתובת</p>
                <p className="font-medium text-gray-900" dir="ltr">
                  {paymentData?.recipientEmail || '---'}
                </p>
              </div>
            </div>

            {paymentData?.recipientName && (
              <div className="text-center text-gray-600">
                <span className="text-lg">🎉</span>{' '}
                {paymentData.recipientName} יקבל את הגיפט קארד בדקות הקרובות
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-lg mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">שימו לב</p>
              <p>המייל עם קוד הגיפט קארד יישלח תוך מספר דקות. אם הנמען לא קיבל, בקשו ממנו לבדוק את תיקיית הספאם.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/shops/${slug}/gift-card`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
          >
            <Gift className="w-4 h-4" />
            רכישת גיפט קארד נוסף
          </Link>
          <Link
            href={`/shops/${slug}`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            חזרה לחנות
          </Link>
        </div>
      </div>
    </div>
  );
}

