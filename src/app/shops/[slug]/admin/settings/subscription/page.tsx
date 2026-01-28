import { db } from '@/lib/db';
import { stores, storeSubscriptions, platformInvoices, orders } from '@/lib/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { SubscriptionManager } from './subscription-manager';
import { SettingsWrapper } from '@/components/admin/settings-wrapper';

// ============================================
// Subscription Settings Page - Server Component
// Follows REQUIREMENTS.md: Server Component, no JS
// ============================================

interface SubscriptionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ success?: string; error?: string; transaction_uid?: string }>;
}

export default async function SubscriptionPage({ params, searchParams }: SubscriptionPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  
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

  // Calculate trial period transaction fees (for showing before activation)
  // Use createdAt instead of paidAt to match dashboard calculations
  // and handle cases where paidAt might be NULL
  let trialTransactionsTotal = 0;
  let trialTransactionsCount = 0;
  let trialFees = 0;
  
  if (subscription?.status === 'trial' && subscription.createdAt) {
    const trialTransactions = await db.select({
      total: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
      count: sql<string>`COUNT(*)`,
    })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, store.id),
          eq(orders.financialStatus, 'paid'),
          // Use createdAt as fallback when paidAt is NULL
          sql`COALESCE(${orders.paidAt}, ${orders.createdAt}) >= ${subscription.createdAt}`
        )
      );
    
    trialTransactionsTotal = parseFloat(trialTransactions[0]?.total || '0');
    trialTransactionsCount = parseInt(trialTransactions[0]?.count || '0');
    trialFees = trialTransactionsTotal * 0.005 * 1.18; // 0.5% + VAT
  }

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
    <SettingsWrapper storeSlug={slug} activeTab="subscription">
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
          customMonthlyPrice: subscription.customMonthlyPrice,
          // Billing details for invoices
          billingName: subscription.billingName || null,
          billingEmail: subscription.billingEmail || null,
          vatNumber: subscription.vatNumber || null,
        } : null}
        billing={{
          periodTransactionTotal: periodTotal,
          pendingTransactionFees: pendingFees,
          trialDaysRemaining,
          trialTransactionsTotal,
          trialTransactionsCount,
          trialFees,
        }}
        invoices={recentInvoices.map(inv => ({
          id: inv.id,
          type: inv.type as 'subscription' | 'transaction_fee' | 'plugin' | 'email_package',
          amount: parseFloat(inv.totalAmount),
          status: inv.status as 'pending' | 'paid' | 'failed' | 'refunded',
          createdAt: inv.createdAt?.toISOString() || '',
          payplusInvoiceUrl: inv.payplusInvoiceUrl,
        }))}
        paymentResult={{
          success: search.success === 'true',
          error: search.error === 'true',
          transactionUid: search.transaction_uid,
        }}
      />
    </SettingsWrapper>
  );
}
