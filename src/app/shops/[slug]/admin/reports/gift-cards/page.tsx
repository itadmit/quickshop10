import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/queries';
import { getGiftCardStats } from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams } from '@/components/admin/report-header';

// Format helpers
function formatCurrency(value: number) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('he-IL').format(value);
}

function formatDate(date: Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded" />
        ))}
      </div>
      <div className="h-10 bg-gray-100 mb-2 rounded" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-50 mb-1 rounded" />
      ))}
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    used: 'bg-gray-100 text-gray-800',
    expired: 'bg-red-100 text-red-800',
    cancelled: 'bg-amber-100 text-amber-800',
  };

  const labels: Record<string, string> = {
    active: 'פעיל',
    used: 'נוצל',
    expired: 'פג תוקף',
    cancelled: 'בוטל',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

// Gift Cards Table
function GiftCardsTable({ 
  giftCards 
}: { 
  giftCards: Array<{ 
    id: string;
    code: string;
    initialBalance: number;
    currentBalance: number;
    usedAmount: number;
    status: string;
    recipientEmail: string | null;
    createdAt: Date | null;
    expiresAt: Date | null;
  }> 
}) {
  if (!giftCards.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
        <p>אין גיפט קארדים</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-right">
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">קוד</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">סטטוס</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">ערך מקורי</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">נוצל</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">יתרה</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">נמען</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">תאריך יצירה</th>
            <th className="py-3 px-4 font-medium text-gray-500 text-sm">תוקף</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {giftCards.map((card) => (
            <tr key={card.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                  {card.code}
                </code>
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={card.status} />
              </td>
              <td className="py-3 px-4 font-medium">
                {formatCurrency(card.initialBalance)}
              </td>
              <td className="py-3 px-4 text-red-600">
                {card.usedAmount > 0 ? `-${formatCurrency(card.usedAmount)}` : '-'}
              </td>
              <td className="py-3 px-4 font-medium text-green-600">
                {formatCurrency(card.currentBalance)}
              </td>
              <td className="py-3 px-4 text-gray-600">
                {card.recipientEmail || '-'}
              </td>
              <td className="py-3 px-4 text-gray-500 text-sm">
                {formatDate(card.createdAt)}
              </td>
              <td className="py-3 px-4 text-gray-500 text-sm">
                {formatDate(card.expiresAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Content Component
async function GiftCardsContent({ 
  storeId, 
  period,
  customRange,
}: { 
  storeId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  const { giftCards, totals } = await getGiftCardStats(storeId, period, customRange);

  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg">
          <p className="text-sm text-gray-500">גיפט קארדים פעילים</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatNumber(totals.activeCards)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg">
          <p className="text-sm text-gray-500">סה״כ ערך</p>
          <p className="text-xl sm:text-2xl font-medium mt-1">{formatCurrency(totals.totalInitialBalance)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg">
          <p className="text-sm text-gray-500">נוצל</p>
          <p className="text-xl sm:text-2xl font-medium mt-1 text-red-600">{formatCurrency(totals.totalUsed)}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg">
          <p className="text-sm text-gray-500">יתרה זמינה</p>
          <p className="text-xl sm:text-2xl font-medium mt-1 text-green-600">{formatCurrency(totals.totalCurrentBalance)}</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-sm text-green-700">פעילים</p>
          <p className="text-2xl font-medium text-green-800">{formatNumber(totals.activeCards)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <p className="text-sm text-gray-600">נוצלו במלואם</p>
          <p className="text-2xl font-medium text-gray-800">{formatNumber(totals.usedCards)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-sm text-red-700">פגי תוקף</p>
          <p className="text-2xl font-medium text-red-800">{formatNumber(totals.expiredCards)}</p>
        </div>
      </div>

      {/* Gift Cards Table */}
      <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">כל הגיפט קארדים</h2>
          <span className="text-sm text-gray-500">{formatNumber(giftCards.length)} סה״כ</span>
        </div>
        <GiftCardsTable giftCards={giftCards} />
      </div>
    </>
  );
}

// Page Component
export default async function GiftCardsReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const { period, customRange } = getReportPeriodParams(resolvedSearchParams);

  return (
    <div>
      <ReportHeader
        title="דוח גיפט קארדים"
        description="ניהול ומעקב אחר גיפט קארדים"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      <Suspense fallback={<TableSkeleton />}>
        <GiftCardsContent 
          storeId={store.id} 
          period={period} 
          customRange={customRange} 
        />
      </Suspense>
    </div>
  );
}

