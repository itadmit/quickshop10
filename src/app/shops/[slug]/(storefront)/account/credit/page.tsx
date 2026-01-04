import { getStoreBySlug } from '@/lib/db/queries';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { customerCreditTransactions, orders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const metadata = {
  title: 'יתרת קרדיט',
  description: 'צפייה ביתרת קרדיט והיסטוריית תנועות',
};

interface CreditPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerCreditPage({ params }: CreditPageProps) {
  const { slug } = await params;
  
  const store = await getStoreBySlug(slug);
  if (!store) {
    notFound();
  }
  
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Check if logged in
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect(`${basePath}/login?callbackUrl=${encodeURIComponent(`${basePath}/account/credit`)}`);
  }

  // Fetch credit transactions
  const transactions = await db
    .select({
      id: customerCreditTransactions.id,
      type: customerCreditTransactions.type,
      amount: customerCreditTransactions.amount,
      balanceAfter: customerCreditTransactions.balanceAfter,
      reason: customerCreditTransactions.reason,
      orderId: customerCreditTransactions.orderId,
      createdAt: customerCreditTransactions.createdAt,
    })
    .from(customerCreditTransactions)
    .where(eq(customerCreditTransactions.customerId, customer.id))
    .orderBy(desc(customerCreditTransactions.createdAt));

  const creditTypeLabels: Record<string, { label: string; color: string; icon: string }> = {
    credit: { label: 'זיכוי', color: 'text-green-600 bg-green-50', icon: '+' },
    debit: { label: 'שימוש', color: 'text-red-600 bg-red-50', icon: '−' },
    refund: { label: 'החזר', color: 'text-emerald-600 bg-emerald-50', icon: '+' },
    adjustment: { label: 'תיקון', color: 'text-amber-600 bg-amber-50', icon: '±' },
  };

  const creditBalance = Number(customer.creditBalance) || 0;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href={`${basePath}/account`}
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            חזרה לאיזור האישי
          </Link>
        </div>

        {/* Credit Balance Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M6 12h4"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">יתרת קרדיט</h1>
                <p className="text-gray-500 text-sm">זמין לשימוש בקניות</p>
              </div>
            </div>
            <div className="text-left" dir="ltr">
              <div className="text-4xl font-bold text-gray-900 tracking-tight">
                {creditBalance.toLocaleString()} ₪
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        {creditBalance > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            <p className="text-sm text-gray-600">
              הקרדיט שלך ישמש אוטומטית בקופה. תוכל לבחור לנצל אותו בעת התשלום.
            </p>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium">היסטוריית תנועות</h2>
          </div>
          
          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M6 12h4"/>
                </svg>
              </div>
              <h3 className="text-gray-900 font-medium mb-1">אין תנועות עדיין</h3>
              <p className="text-sm text-gray-500">
                כאשר תקבל זיכויים או תשתמש בקרדיט, הם יופיעו כאן
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((txn) => {
                const typeInfo = creditTypeLabels[txn.type] || creditTypeLabels.adjustment;
                const amount = Number(txn.amount);
                const isPositive = amount >= 0;
                
                return (
                  <div key={txn.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium ${typeInfo.color}`}>
                        {typeInfo.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {typeInfo.label}
                        </div>
                        {txn.reason && (
                          <p className="text-sm text-gray-500 mt-0.5">{txn.reason}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(txn.createdAt).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left" dir="ltr">
                      <div className={`font-medium text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : '-'}{Math.abs(amount).toLocaleString()} ₪
                      </div>
                      <div className="text-xs text-gray-400">
                        יתרה: {Number(txn.balanceAfter).toLocaleString()} ₪
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

