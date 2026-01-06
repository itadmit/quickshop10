import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { giftCards, giftCardTransactions, orders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Gift, CreditCard, Calendar, Clock, ShoppingBag, User } from 'lucide-react';
import { GiftCardAdjustForm } from './gift-card-adjust-form';

export const dynamic = 'force-dynamic';

interface GiftCardDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function GiftCardDetailPage({ params }: GiftCardDetailPageProps) {
  const { slug, id } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get gift card with transactions
  const giftCard = await db.query.giftCards.findFirst({
    where: eq(giftCards.id, id),
    with: {
      transactions: {
        with: {
          order: true,
        },
        orderBy: [desc(giftCardTransactions.createdAt)],
      },
    },
  });

  if (!giftCard || giftCard.storeId !== store.id) {
    redirect(`/shops/${slug}/admin/gift-cards`);
  }

  const formatCurrency = (amount: string | number | null) => {
    return `₪${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const usedAmount = Number(giftCard.initialBalance) - Number(giftCard.currentBalance);
  const usagePercentage = (usedAmount / Number(giftCard.initialBalance)) * 100;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/shops/${slug}/admin/gift-cards`} className="hover:text-gray-900">
          גיפט קארדס
        </Link>
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-gray-900 font-medium">{giftCard.code}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Header */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{giftCard.code}</h1>
                  <p className="text-white/80 text-sm">
                    {giftCard.status === 'active' ? 'פעיל' :
                     giftCard.status === 'used' ? 'נוצל' :
                     giftCard.status === 'expired' ? 'פג תוקף' : giftCard.status}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                giftCard.status === 'active' ? 'bg-green-400/30 text-green-100' :
                giftCard.status === 'used' ? 'bg-gray-400/30 text-gray-100' :
                'bg-red-400/30 text-red-100'
              }`}>
                {giftCard.status === 'active' ? 'פעיל' :
                 giftCard.status === 'used' ? 'נוצל' : 'פג תוקף'}
              </div>
            </div>

            {/* Balance */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-white/80 mb-2">
                <span>יתרה נוכחית</span>
                <span>{formatCurrency(giftCard.currentBalance)} / {formatCurrency(giftCard.initialBalance)}</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${100 - usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-white/70">נוצל: {formatCurrency(usedAmount)}</span>
                <span className="text-white font-semibold">{(100 - usagePercentage).toFixed(0)}% נותר</span>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                היסטוריית שימוש
              </h2>
            </div>

            {giftCard.transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>עדיין לא היה שימוש בגיפט קארד הזה</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {giftCard.transactions.map((tx) => (
                  <div key={tx.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          Number(tx.amount) < 0 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {Number(tx.amount) < 0 ? 'שימוש' : 'טעינה'}
                          </p>
                          {tx.note && (
                            <p className="text-sm text-gray-500">{tx.note}</p>
                          )}
                          {tx.order && (
                            <Link 
                              href={`/shops/${slug}/admin/orders/${tx.order.id}`}
                              className="text-sm text-purple-600 hover:text-purple-700"
                            >
                              הזמנה #{tx.order.orderNumber}
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${
                          Number(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {Number(tx.amount) > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          יתרה: {formatCurrency(tx.balanceAfter)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">פרטים</h3>
            <div className="space-y-4">
              <DetailRow 
                icon={Gift}
                label="ערך התחלתי"
                value={formatCurrency(giftCard.initialBalance)}
              />
              <DetailRow 
                icon={CreditCard}
                label="יתרה נוכחית"
                value={formatCurrency(giftCard.currentBalance)}
              />
              <DetailRow 
                icon={Calendar}
                label="נוצר"
                value={formatDate(giftCard.createdAt)}
              />
              {giftCard.expiresAt && (
                <DetailRow 
                  icon={Clock}
                  label="תוקף"
                  value={formatDate(giftCard.expiresAt)}
                />
              )}
              {giftCard.lastUsedAt && (
                <DetailRow 
                  icon={ShoppingBag}
                  label="שימוש אחרון"
                  value={formatDate(giftCard.lastUsedAt)}
                />
              )}
            </div>
          </div>

          {/* Recipient Info */}
          {(giftCard.recipientEmail || giftCard.recipientName) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">נמען</h3>
              <div className="space-y-3">
                {giftCard.recipientName && (
                  <p className="text-gray-900 font-medium">{giftCard.recipientName}</p>
                )}
                {giftCard.recipientEmail && (
                  <p className="text-gray-500 text-sm">{giftCard.recipientEmail}</p>
                )}
                {giftCard.message && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 italic">"{giftCard.message}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sender Info */}
          {giftCard.senderName && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">קונה</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-gray-900">{giftCard.senderName}</p>
              </div>
            </div>
          )}

          {/* Adjust Balance */}
          {giftCard.status === 'active' && (
            <GiftCardAdjustForm 
              giftCardId={giftCard.id} 
              storeSlug={slug}
              currentBalance={Number(giftCard.currentBalance)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

