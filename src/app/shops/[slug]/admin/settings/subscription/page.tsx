import { db } from '@/lib/db';
import { stores, storeSubscriptions, platformInvoices, orders } from '@/lib/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/ui';
import { SubscriptionManager } from './subscription-manager';

export const dynamic = 'force-dynamic';

interface SubscriptionPageProps {
  params: Promise<{ slug: string }>;
}

const settingsTabs = [
  { id: 'general', label: 'כללי', href: '' },
  { id: 'subscription', label: 'מנוי', href: '/subscription' },
  { id: 'domain', label: 'דומיין', href: '/domain' },
  { id: 'payments', label: 'תשלומים', href: '/payments' },
  { id: 'tracking', label: 'מעקב', href: '/tracking' },
  { id: 'checkout', label: 'קופה', href: '/checkout' },
  { id: 'shipping', label: 'משלוח', href: '/shipping' },
  { id: 'tax', label: 'מיסים', href: '/tax' },
  { id: 'notifications', label: 'התראות', href: '/notifications' },
];

// Plan info
const planInfo = {
  trial: { name: 'תקופת נסיון', price: 0, color: 'blue' },
  branding: { name: 'אתר תדמית', price: 299, color: 'purple' },
  quickshop: { name: 'קוויק שופ', price: 399, color: 'emerald' },
};

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { slug } = await params;
  
  // Fetch store
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });
  
  if (!store) {
    notFound();
  }

  // Fetch subscription
  const subscription = await db.query.storeSubscriptions.findFirst({
    where: eq(storeSubscriptions.storeId, store.id),
  });

  // Calculate transaction fees for this billing period (last 2 weeks)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const periodTransactions = await db.select({
    total: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
  })
    .from(orders)
    .where(
      and(
        eq(orders.storeId, store.id),
        eq(orders.financialStatus, 'paid'),
        gte(orders.createdAt, twoWeeksAgo)
      )
    );

  const periodTotal = parseFloat(periodTransactions[0]?.total || '0');
  const pendingFees = periodTotal * 0.005 * 1.18; // 0.5% + VAT

  // Fetch recent invoices
  const recentInvoices = await db.select()
    .from(platformInvoices)
    .where(eq(platformInvoices.storeId, store.id))
    .orderBy(desc(platformInvoices.createdAt))
    .limit(10);

  // Calculate days remaining in trial
  let trialDaysRemaining = 0;
  if (subscription?.status === 'trial' && subscription.trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="הגדרות חנות"
        description="הגדר את פרטי החנות, עיצוב, ואפשרויות נוספות"
      />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <nav className="flex border-b border-gray-200 px-2 sm:px-4 overflow-x-auto scrollbar-hide">
          {settingsTabs.map((tab) => (
            <SettingsTab 
              key={tab.id}
              href={`/shops/${slug}/admin/settings${tab.href}`} 
              label={tab.label} 
              active={tab.id === 'subscription'} 
            />
          ))}
        </nav>

        {/* Subscription Content */}
        <div className="p-4 sm:p-6">
          <SubscriptionManager
            store={{
              id: store.id,
              name: store.name,
              slug: store.slug,
            }}
            subscription={subscription ? {
              id: subscription.id,
              plan: subscription.plan as 'trial' | 'branding' | 'quickshop',
              status: subscription.status as 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired',
              trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
              currentPeriodStart: subscription.currentPeriodStart?.toISOString() || null,
              currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
              hasPaymentMethod: !!subscription.payplusTokenUid,
            } : null}
            billing={{
              periodTransactionTotal: periodTotal,
              pendingTransactionFees: pendingFees,
              trialDaysRemaining,
            }}
            invoices={recentInvoices.map(inv => ({
              id: inv.id,
              type: inv.type as 'subscription' | 'transaction_fee' | 'plugin',
              amount: parseFloat(inv.totalAmount),
              status: inv.status as 'pending' | 'paid' | 'failed' | 'refunded',
              createdAt: inv.createdAt?.toISOString() || '',
              payplusInvoiceUrl: inv.payplusInvoiceUrl,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`
        px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0
        ${active
          ? 'border-gray-900 text-gray-900'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {label}
    </Link>
  );
}

