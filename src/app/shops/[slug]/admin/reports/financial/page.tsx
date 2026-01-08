import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getStoreBySlug } from '@/lib/db/queries';
import { 
  getGiftCardSummary,
  getInfluencerStats,
  getRefundStats,
  getStoreCreditStats,
  getSalesOverview,
  getGiftCardDetails,
  getStoreCreditDetails
} from '@/lib/actions/reports';
import { ReportHeader, getReportPeriodParams } from '@/components/admin/report-header';
import {
  GiftIcon,
  CreditCardIcon,
  ReceiptRefundIcon,
  CrownIcon,
} from '@/components/admin/icons';

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

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-100 mb-2" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-50 mb-1" />
      ))}
    </div>
  );
}

// Gift Cards Stats Component
function GiftCardsStats({ 
  stats 
}: { 
  stats: { totalIssued: number; totalValue: number; activeCards: number; activeBalance: number; usedValue: number } 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">סה״כ הונפקו</p>
        <p className="text-2xl font-medium mt-1">{formatNumber(stats.totalIssued)}</p>
        <p className="text-xs text-gray-400 mt-1">{formatCurrency(stats.totalValue)}</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">כרטיסים פעילים</p>
        <p className="text-2xl font-medium mt-1 text-green-600">{formatNumber(stats.activeCards)}</p>
        <p className="text-xs text-gray-400 mt-1">יתרה: {formatCurrency(stats.activeBalance)}</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">שווי מומש</p>
        <p className="text-2xl font-medium mt-1">{formatCurrency(stats.usedValue)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {stats.totalValue > 0 ? formatPercent((stats.usedValue / stats.totalValue) * 100) : '0%'} מהסה״כ
        </p>
      </div>
    </div>
  );
}

// Influencers Table Component
function InfluencersTable({ 
  influencers,
  totals
}: { 
  influencers: Array<{ 
    id: string; 
    name: string; 
    couponCode: string | null; 
    totalSales: number;
    totalCommission: number;
    totalOrders: number | null;
    isActive: boolean | null;
  }>;
  totals: { totalSales: number; totalCommission: number; totalOrders: number };
}) {
  if (!influencers.length) {
    return <p className="text-gray-500 text-center py-12">אין משפיענים רשומים</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 border border-purple-100 p-4">
          <p className="text-sm text-purple-600">סה״כ מכירות</p>
          <p className="text-xl font-medium mt-1">{formatCurrency(totals.totalSales)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-4">
          <p className="text-sm text-purple-600">עמלות לתשלום</p>
          <p className="text-xl font-medium mt-1">{formatCurrency(totals.totalCommission)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-4">
          <p className="text-sm text-purple-600">סה״כ הזמנות</p>
          <p className="text-xl font-medium mt-1">{formatNumber(totals.totalOrders)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-right">
              <th className="py-3 px-4 font-medium text-gray-500 text-sm">משפיען</th>
              <th className="py-3 px-4 font-medium text-gray-500 text-sm">קוד קופון</th>
              <th className="py-3 px-4 font-medium text-gray-500 text-sm">מכירות</th>
              <th className="py-3 px-4 font-medium text-gray-500 text-sm">הזמנות</th>
              <th className="py-3 px-4 font-medium text-gray-500 text-sm">עמלה</th>
              <th className="py-3 px-4 font-medium text-gray-500 text-sm">סטטוס</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {influencers.map((influencer) => (
              <tr key={influencer.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{influencer.name}</td>
                <td className="py-3 px-4">
                  <code className="text-sm bg-gray-100 px-2 py-0.5">
                    {influencer.couponCode || '-'}
                  </code>
                </td>
                <td className="py-3 px-4 font-medium">{formatCurrency(influencer.totalSales)}</td>
                <td className="py-3 px-4">{influencer.totalOrders || 0}</td>
                <td className="py-3 px-4 text-purple-600">{formatCurrency(influencer.totalCommission)}</td>
                <td className="py-3 px-4">
                  {influencer.isActive ? (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700">פעיל</span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500">לא פעיל</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Refunds Stats Component
function RefundsStats({ 
  stats 
}: { 
  stats: { total: number; totalAmount: number; pending: number; approved: number; completed: number; rejected: number } 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">סה״כ החזרים</p>
        <p className="text-2xl font-medium mt-1">{formatNumber(stats.total)}</p>
        <p className="text-xs text-gray-400 mt-1">{formatCurrency(stats.totalAmount)}</p>
      </div>
      <div className="bg-white border border-amber-200 p-4">
        <p className="text-sm text-amber-600">ממתינים לאישור</p>
        <p className="text-2xl font-medium mt-1 text-amber-600">{formatNumber(stats.pending)}</p>
      </div>
      <div className="bg-white border border-blue-200 p-4">
        <p className="text-sm text-blue-600">אושרו</p>
        <p className="text-2xl font-medium mt-1 text-blue-600">{formatNumber(stats.approved)}</p>
      </div>
      <div className="bg-white border border-green-200 p-4">
        <p className="text-sm text-green-600">הושלמו</p>
        <p className="text-2xl font-medium mt-1 text-green-600">{formatNumber(stats.completed)}</p>
      </div>
    </div>
  );
}

// Store Credits Stats Component
function StoreCreditsStats({ 
  stats 
}: { 
  stats: { totalIssued: number; totalUsed: number; outstandingBalance: number; customersWithCredit: number; transactions: number } 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">סה״כ הונפק</p>
        <p className="text-2xl font-medium mt-1">{formatCurrency(stats.totalIssued)}</p>
        <p className="text-xs text-gray-400 mt-1">{stats.transactions} פעולות</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">נוצל</p>
        <p className="text-2xl font-medium mt-1">{formatCurrency(stats.totalUsed)}</p>
        <p className="text-xs text-gray-400 mt-1">
          {stats.totalIssued > 0 ? formatPercent((stats.totalUsed / stats.totalIssued) * 100) : '0%'} מהסה״כ
        </p>
      </div>
      <div className="bg-white border border-blue-200 p-4">
        <p className="text-sm text-blue-600">יתרה כוללת</p>
        <p className="text-2xl font-medium mt-1 text-blue-600">{formatCurrency(stats.outstandingBalance)}</p>
        <p className="text-xs text-gray-400 mt-1">התחייבות פתוחה</p>
      </div>
      <div className="bg-white border border-gray-200 p-4">
        <p className="text-sm text-gray-500">לקוחות עם קרדיט</p>
        <p className="text-2xl font-medium mt-1">{formatNumber(stats.customersWithCredit)}</p>
      </div>
    </div>
  );
}

// Revenue Summary Component
function RevenueSummary({ 
  salesOverview,
  giftCardStats,
  refundStats,
  creditStats
}: { 
  salesOverview: { totalRevenue: number; totalOrders: number };
  giftCardStats: { usedValue: number };
  refundStats: { totalAmount: number };
  creditStats: { totalUsed: number };
}) {
  const grossRevenue = salesOverview.totalRevenue;
  const giftCardRedemptions = giftCardStats.usedValue;
  const refunds = refundStats.totalAmount;
  const creditsUsed = creditStats.totalUsed;
  const netRevenue = grossRevenue - refunds;

  return (
    <div className="bg-black text-white p-6">
      <h3 className="font-medium mb-4">סיכום פיננסי</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">הכנסות ברוטו</span>
          <span className="font-medium text-lg">{formatCurrency(grossRevenue)}</span>
        </div>
        <div className="flex justify-between items-center text-red-400">
          <span>החזרים</span>
          <span>-{formatCurrency(refunds)}</span>
        </div>
        <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
          <span className="font-medium">הכנסות נטו</span>
          <span className="font-medium text-xl">{formatCurrency(netRevenue)}</span>
        </div>
        <div className="border-t border-gray-700 pt-3 mt-3">
          <p className="text-xs text-gray-400 mb-2">מימוש אמצעי תשלום אלטרנטיביים:</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">גיפט קארדים</span>
            <span>{formatCurrency(giftCardRedemptions)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">קרדיט חנות</span>
            <span>{formatCurrency(creditsUsed)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Content Component
async function FinancialContent({ 
  storeId, 
  period,
  customRange 
}: { 
  storeId: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  // Parallel data fetching
  const [salesOverview, giftCardStats, influencerStats, refundStats, creditStats] = await Promise.all([
    getSalesOverview(storeId, period, customRange),
    getGiftCardSummary(storeId),
    getInfluencerStats(storeId),
    getRefundStats(storeId, period, customRange),
    getStoreCreditStats(storeId),
  ]);

  return (
    <>
      {/* Revenue Summary */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 p-4">
              <p className="text-sm text-gray-500">הכנסות ברוטו</p>
              <p className="text-2xl font-medium mt-1">{formatCurrency(salesOverview.totalRevenue)}</p>
            </div>
            <div className="bg-white border border-gray-200 p-4">
              <p className="text-sm text-gray-500">הזמנות</p>
              <p className="text-2xl font-medium mt-1">{formatNumber(salesOverview.totalOrders)}</p>
            </div>
            <div className="bg-white border border-gray-200 p-4">
              <p className="text-sm text-gray-500">החזרים</p>
              <p className="text-2xl font-medium mt-1 text-red-600">{formatCurrency(refundStats.totalAmount)}</p>
            </div>
            <div className="bg-white border border-gray-200 p-4">
              <p className="text-sm text-gray-500">הכנסות נטו</p>
              <p className="text-2xl font-medium mt-1 text-green-600">
                {formatCurrency(salesOverview.totalRevenue - refundStats.totalAmount)}
              </p>
            </div>
          </div>
        </div>
        <RevenueSummary 
          salesOverview={salesOverview}
          giftCardStats={giftCardStats}
          refundStats={refundStats}
          creditStats={creditStats}
        />
      </div>

      {/* Gift Cards */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <GiftIcon className="text-gray-600" size={20} />
          <h2 className="font-medium">גיפט קארדים</h2>
        </div>
        <GiftCardsStats stats={giftCardStats} />
      </div>

      {/* Store Credits */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CreditCardIcon className="text-gray-600" size={20} />
          <h2 className="font-medium">קרדיט חנות</h2>
        </div>
        <StoreCreditsStats stats={creditStats} />
      </div>

      {/* Refunds */}
      <div className="bg-white border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ReceiptRefundIcon className="text-gray-600" size={20} />
          <h2 className="font-medium">החזרים</h2>
        </div>
        <RefundsStats stats={refundStats} />
      </div>

      {/* Influencers */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CrownIcon className="text-gray-600" size={20} />
          <h2 className="font-medium">משפיענים</h2>
        </div>
        <InfluencersTable 
          influencers={influencerStats.influencers} 
          totals={influencerStats.totals} 
        />
      </div>
    </>
  );
}

// Page Component
export default async function FinancialReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const { period, customRange } = getReportPeriodParams(resolvedSearchParams);
  const activeTab = resolvedSearchParams.tab || 'overview';

  return (
    <div>
      <ReportHeader
        title="דוח פיננסי"
        description="גיפט קארדים, קרדיטים, משפיענים והחזרים"
        storeSlug={slug}
        backHref={`/shops/${slug}/admin/reports`}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 mb-6 w-fit">
        {[
          { id: 'overview', label: 'סקירה' },
          { id: 'giftcards', label: 'גיפט קארדס' },
          { id: 'credits', label: 'קרדיט חנות' },
          { id: 'influencers', label: 'משפיענים' },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`?tab=${tab.id}&period=${resolvedSearchParams.period || '30d'}`}
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Suspense fallback={<TableSkeleton />}>
        {activeTab === 'overview' && <FinancialContent storeId={store.id} period={period} customRange={customRange} />}
        {activeTab === 'giftcards' && <GiftCardsDetailContent storeId={store.id} />}
        {activeTab === 'credits' && <CreditsDetailContent storeId={store.id} />}
        {activeTab === 'influencers' && <InfluencersDetailContent storeId={store.id} storeSlug={slug} period={period} customRange={customRange} />}
      </Suspense>
    </div>
  );
}

// Gift Cards Detail Content
async function GiftCardsDetailContent({ storeId }: { storeId: string }) {
  const cards = await getGiftCardDetails(storeId);

  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">כל הגיפט קארדס</h2>
        <p className="text-sm text-gray-500">{cards.length} כרטיסים</p>
      </div>
      
      {cards.length === 0 ? (
        <p className="text-gray-500 text-center py-12">אין גיפט קארדס</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-right">
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">קוד</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">נמען</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">קונה</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">ערך התחלתי</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">נוצל</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">יתרה</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">סטטוס</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">תאריך הנפקה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <code className="bg-gray-100 px-2 py-0.5 text-sm">{card.code}</code>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{card.customerName || '-'}</p>
                      <p className="text-xs text-gray-500">{card.customerEmail}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{card.senderName || '-'}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(card.initialBalance)}</td>
                  <td className="py-3 px-4 text-green-600">{formatCurrency(card.usedAmount)}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(card.currentBalance)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      card.status === 'active' ? 'bg-green-100 text-green-700' :
                      card.status === 'used' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {card.status === 'active' ? 'פעיל' : card.status === 'used' ? 'נוצל' : card.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(card.createdAt).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Credits Detail Content
async function CreditsDetailContent({ storeId }: { storeId: string }) {
  const transactions = await getStoreCreditDetails(storeId);

  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">פעולות קרדיט חנות</h2>
        <p className="text-sm text-gray-500">{transactions.length} פעולות אחרונות</p>
      </div>
      
      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-12">אין פעולות קרדיט</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-right">
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">לקוח</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">סוג</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">סכום</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">יתרה לאחר</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">סיבה</th>
                <th className="py-3 px-4 font-medium text-gray-500 text-sm">תאריך</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{tx.customerName || '-'}</p>
                      <p className="text-xs text-gray-500">{tx.customerEmail}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type === 'credit' ? 'הוספה' : 'שימוש'}
                    </span>
                  </td>
                  <td className={`py-3 px-4 font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </td>
                  <td className="py-3 px-4">{formatCurrency(tx.balanceAfter)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{tx.reason || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Influencers Detail Content
async function InfluencersDetailContent({ 
  storeId, 
  storeSlug, 
  period,
  customRange 
}: { 
  storeId: string; 
  storeSlug: string; 
  period: '7d' | '30d' | '90d' | 'custom';
  customRange?: { from: Date; to: Date };
}) {
  const { influencers } = await getInfluencerStats(storeId);

  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">משפיענים</h2>
        <Link 
          href={`/shops/${storeSlug}/admin/influencers`}
          className="text-sm text-gray-500 hover:text-black"
        >
          נהל משפיענים ←
        </Link>
      </div>
      
      {influencers.length === 0 ? (
        <p className="text-gray-500 text-center py-12">אין משפיענים רשומים</p>
      ) : (
        <div className="space-y-4">
          {influencers.map(influencer => (
            <Link
              key={influencer.id}
              href={`/shops/${storeSlug}/admin/reports/financial/influencer/${influencer.id}?period=${period}`}
              className="block border border-gray-200 p-4 hover:border-black transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <CrownIcon className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">{influencer.name}</p>
                    <code className="text-sm bg-gray-100 px-2 py-0.5">{influencer.couponCode || 'ללא קוד'}</code>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-left">
                    <p className="text-sm text-gray-500">מכירות</p>
                    <p className="font-medium">{formatCurrency(influencer.totalSales)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500">הזמנות</p>
                    <p className="font-medium">{influencer.totalOrders || 0}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500">עמלה</p>
                    <p className="font-medium text-purple-600">{formatCurrency(influencer.totalCommission)}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

