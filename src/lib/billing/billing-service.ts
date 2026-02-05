/**
 * Billing Service
 * ניהול מנויים, חשבוניות וחיובים
 */

import { db } from '@/lib/db';
import {
  stores,
  storeSubscriptions,
  platformInvoices,
  platformInvoiceItems,
  storeTransactionFees,
  storePlugins,
  pluginPricing,
  orders,
} from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc, inArray } from 'drizzle-orm';
import {
  chargeWithToken,
  calculateSubscriptionPrice,
  calculateSubscriptionPriceAsync,
  calculateTransactionFee,
  calculateTransactionFeeAsync,
  calculateTransactionFeeForStore,
  PLAN_PRICING,
  VAT_RATE,
  TRANSACTION_FEE_RATE,
} from './payplus-billing';
import { getFeeRates } from './platform-settings';

// Types
export interface SubscriptionDetails {
  id: string;
  storeId: string;
  storeName: string;
  plan: 'trial' | 'branding' | 'quickshop';
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  hasPaymentMethod: boolean;
  cardLastFour: string | null;
  cardBrand: string | null;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  type: 'subscription' | 'transaction_fee' | 'plugin';
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  issuedAt: Date | null;
  paidAt: Date | null;
}

export interface StoreBillingSummary {
  subscription: SubscriptionDetails | null;
  pendingTransactionFees: number;
  pendingPluginFees: number;
  recentInvoices: InvoiceSummary[];
  currentPeriodTransactions: {
    amount: number;
    count: number;
    feeAmount: number;
  };
  activePlugins: {
    slug: string;
    monthlyPrice: number;
  }[];
}

/**
 * Generate unique invoice number
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get the highest invoice number for this year
  const [result] = await db
    .select({
      maxNum: sql<number>`COALESCE(MAX(CAST(SUBSTRING(${platformInvoices.invoiceNumber} FROM 10) AS INTEGER)), 0)`,
    })
    .from(platformInvoices)
    .where(sql`${platformInvoices.invoiceNumber} LIKE ${'QS-' + year + '-%'}`);
  
  const nextNum = (result?.maxNum || 0) + 1;
  return `QS-${year}-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Get or create subscription for a store
 */
export async function getOrCreateSubscription(storeId: string): Promise<SubscriptionDetails | null> {
  // Try to get existing subscription
  let subscription = await db
    .select()
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.storeId, storeId))
    .then(rows => rows[0]);

  // Create if doesn't exist
  if (!subscription) {
    const store = await db
      .select({ id: stores.id, name: stores.name, plan: stores.plan })
      .from(stores)
      .where(eq(stores.id, storeId))
      .then(rows => rows[0]);

    if (!store) return null;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    [subscription] = await db
      .insert(storeSubscriptions)
      .values({
        storeId: store.id,
        plan: store.plan,
        status: 'trial',
        trialEndsAt,
      })
      .returning();
  }

  // Get store name
  const store = await db
    .select({ name: stores.name })
    .from(stores)
    .where(eq(stores.id, storeId))
    .then(rows => rows[0]);

  return {
    id: subscription.id,
    storeId: subscription.storeId,
    storeName: store?.name || 'Unknown',
    plan: subscription.plan as 'trial' | 'branding' | 'quickshop',
    status: subscription.status as 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired',
    trialEndsAt: subscription.trialEndsAt,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    hasPaymentMethod: !!subscription.payplusTokenUid,
    cardLastFour: subscription.cardLastFour,
    cardBrand: subscription.cardBrand,
  };
}

/**
 * Update subscription after successful payment
 */
export async function activateSubscription(
  storeId: string,
  plan: 'branding' | 'quickshop',
  payplusCustomerUid: string,
  payplusTokenUid: string,
  cardLastFour: string,
  cardBrand: string,
  cardExpiry: string
): Promise<void> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db
    .update(storeSubscriptions)
    .set({
      plan,
      status: 'active',
      payplusCustomerUid,
      payplusTokenUid,
      cardLastFour,
      cardBrand,
      cardExpiry,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      updatedAt: now,
    })
    .where(eq(storeSubscriptions.storeId, storeId));

  // Also update the store's plan
  await db
    .update(stores)
    .set({
      plan,
      planExpiresAt: periodEnd,
      updatedAt: now,
    })
    .where(eq(stores.id, storeId));
}

/**
 * Calculate trial period transaction fees (for charging on activation)
 */
export async function calculateTrialPeriodFees(storeId: string): Promise<{
  totalTransactions: number;
  orderCount: number;
  feeAmount: number;
  vatAmount: number;
  totalFee: number;
  feeRate: number;
  periodStart: Date | null;
  periodEnd: Date;
}> {
  // Get subscription to find trial start date
  const subscription = await db
    .select({
      createdAt: storeSubscriptions.createdAt,
      trialEndsAt: storeSubscriptions.trialEndsAt,
      customFeePercentage: storeSubscriptions.customFeePercentage,
    })
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.storeId, storeId))
    .then(rows => rows[0]);

  const periodStart = subscription?.createdAt || null;
  const periodEnd = new Date();

  // Get all paid orders during trial period
  const paidOrders = await db
    .select({
      id: orders.id,
      total: orders.total,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      eq(orders.financialStatus, 'paid'),
      periodStart ? gte(orders.paidAt, periodStart) : sql`TRUE`,
      lte(orders.paidAt, periodEnd)
    ));

  if (paidOrders.length === 0) {
    return {
      totalTransactions: 0,
      orderCount: 0,
      feeAmount: 0,
      vatAmount: 0,
      totalFee: 0,
      feeRate: 0.005,
      periodStart,
      periodEnd,
    };
  }

  const totalTransactions = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  
  // Use store-specific fee rate if set
  const fee = await calculateTransactionFeeForStore(
    totalTransactions, 
    storeId, 
    subscription?.customFeePercentage
  );

  return {
    totalTransactions,
    orderCount: paidOrders.length,
    feeAmount: fee.feeAmount,
    vatAmount: fee.vatAmount,
    totalFee: fee.totalFee,
    feeRate: fee.feeRate,
    periodStart,
    periodEnd,
  };
}

/**
 * Charge trial period fees on subscription activation
 * Returns invoice ID if fees were charged, null if no fees
 */
export async function chargeTrialPeriodFees(
  storeId: string,
  payplusTokenUid: string,
  payplusCustomerUid: string
): Promise<{ success: boolean; invoiceId?: string; amount?: number; error?: string }> {
  const trialFees = await calculateTrialPeriodFees(storeId);
  
  // Skip if no transactions or fee is too small (less than ₪1)
  if (trialFees.totalFee < 1) {
    console.log(`[Trial Fees] No fees to charge for store ${storeId} (total: ₪${trialFees.totalFee.toFixed(2)})`);
    return { success: true, amount: 0 };
  }

  console.log(`[Trial Fees] Charging ₪${trialFees.totalFee.toFixed(2)} for ${trialFees.orderCount} orders from trial period`);

  const feePercentDisplay = (trialFees.feeRate * 100).toFixed(1);
  
  // Charge with token
  const chargeResult = await chargeWithToken({
    tokenUid: payplusTokenUid,
    customerUid: payplusCustomerUid,
    amount: trialFees.totalFee,
    description: `עמלות עסקאות מתקופת נסיון`,
    invoiceItems: [
      {
        name: `עמלות עסקאות תקופת נסיון (${feePercentDisplay}%)`,
        quantity: 1,
        price: trialFees.feeAmount,
      },
    ],
  });

  // Get subscription ID
  const subscription = await db
    .select({ id: storeSubscriptions.id })
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.storeId, storeId))
    .then(rows => rows[0]);

  const invoiceNumber = await generateInvoiceNumber();

  if (!chargeResult.success) {
    // Create failed invoice (but don't block activation)
    await db.insert(platformInvoices).values({
      storeId,
      subscriptionId: subscription?.id,
      invoiceNumber,
      type: 'transaction_fee',
      status: 'failed',
      subtotal: String(trialFees.feeAmount),
      vatRate: String(VAT_RATE * 100),
      vatAmount: String(trialFees.vatAmount),
      totalAmount: String(trialFees.totalFee),
      periodStart: trialFees.periodStart,
      periodEnd: trialFees.periodEnd,
      description: 'עמלות עסקאות מתקופת נסיון',
      lastChargeError: chargeResult.error,
      chargeAttempts: 1,
      lastChargeAttempt: new Date(),
    });

    console.error(`[Trial Fees] Failed to charge: ${chargeResult.error}`);
    // Return success anyway - don't block activation
    return { success: true, amount: 0, error: chargeResult.error };
  }

  // Create paid invoice
  const [invoice] = await db.insert(platformInvoices).values({
    storeId,
    subscriptionId: subscription?.id,
    invoiceNumber,
    type: 'transaction_fee',
    status: 'paid',
    subtotal: String(trialFees.feeAmount),
    vatRate: String(VAT_RATE * 100),
    vatAmount: String(trialFees.vatAmount),
    totalAmount: String(trialFees.totalFee),
    periodStart: trialFees.periodStart,
    periodEnd: trialFees.periodEnd,
    description: 'עמלות עסקאות מתקופת נסיון',
    payplusTransactionUid: chargeResult.transactionUid,
    payplusInvoiceNumber: chargeResult.invoiceNumber,
    payplusInvoiceUrl: chargeResult.invoiceUrl,
    issuedAt: new Date(),
    paidAt: new Date(),
  }).returning();

  // Create invoice items
  await db.insert(platformInvoiceItems).values({
    invoiceId: invoice.id,
    description: `עמלות עסקאות (${feePercentDisplay}%)`,
    quantity: 1,
    unitPrice: String(trialFees.feeAmount),
    totalPrice: String(trialFees.feeAmount),
  });

  // Record transaction fee
  await db.insert(storeTransactionFees).values({
    storeId,
    invoiceId: invoice.id,
    periodStart: trialFees.periodStart || new Date(),
    periodEnd: trialFees.periodEnd,
    totalTransactionsAmount: String(trialFees.totalTransactions),
    totalTransactionsCount: trialFees.orderCount,
    feePercentage: String(trialFees.feeRate),
    feeAmount: String(trialFees.feeAmount),
  });

  console.log(`[Trial Fees] Charged ₪${trialFees.totalFee.toFixed(2)} - Invoice: ${invoiceNumber}`);
  
  return { 
    success: true, 
    invoiceId: invoice.id, 
    amount: trialFees.totalFee 
  };
}

/**
 * Create subscription invoice
 */
export async function createSubscriptionInvoice(
  storeId: string,
  plan: 'branding' | 'quickshop',
  payplusTransactionUid: string,
  payplusInvoiceNumber: string | null,
  payplusInvoiceUrl: string | null
): Promise<string> {
  // Use async version to get prices from DB (with custom pricing support)
  const pricing = await calculateSubscriptionPriceAsync(plan, storeId);
  const invoiceNumber = await generateInvoiceNumber();
  const planNameHe = plan === 'branding' ? 'מסלול תדמית' : 'מסלול קוויק שופ';
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Get subscription ID
  const subscription = await db
    .select({ id: storeSubscriptions.id })
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.storeId, storeId))
    .then(rows => rows[0]);

  // Create invoice
  const [invoice] = await db
    .insert(platformInvoices)
    .values({
      storeId,
      subscriptionId: subscription?.id,
      invoiceNumber,
      type: 'subscription',
      status: 'paid',
      subtotal: String(pricing.basePrice),
      vatRate: String(VAT_RATE * 100),
      vatAmount: String(pricing.vatAmount),
      totalAmount: String(pricing.totalPrice),
      periodStart: now,
      periodEnd,
      description: `מנוי QuickShop - ${planNameHe}`,
      payplusTransactionUid,
      payplusInvoiceNumber,
      payplusInvoiceUrl,
      issuedAt: now,
      paidAt: now,
    })
    .returning();

  // Create invoice item
  await db.insert(platformInvoiceItems).values({
    invoiceId: invoice.id,
    description: `מנוי QuickShop - ${planNameHe}`,
    quantity: 1,
    unitPrice: String(pricing.basePrice),
    totalPrice: String(pricing.basePrice),
    referenceType: 'subscription',
    referenceId: plan,
  });

  return invoiceNumber;
}

/**
 * Calculate and charge transaction fees for a store
 */
export async function chargeTransactionFees(
  storeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  success: boolean;
  invoiceNumber?: string;
  amount?: number;
  error?: string;
}> {
  // Get subscription with payment token
  const subscription = await db
    .select()
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.storeId, storeId))
    .then(rows => rows[0]);

  if (!subscription?.payplusTokenUid || !subscription?.payplusCustomerUid) {
    return { success: false, error: 'No payment method on file' };
  }

  // Allow billing for active and past_due subscriptions
  // past_due means a previous charge failed, but we should still try to charge transaction fees
  if (subscription.status !== 'active' && subscription.status !== 'past_due') {
    return { success: false, error: 'Subscription not active' };
  }

  // Get paid orders in the period
  const paidOrders = await db
    .select({
      id: orders.id,
      total: orders.total,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      eq(orders.financialStatus, 'paid'),
      gte(orders.paidAt, periodStart),
      lte(orders.paidAt, periodEnd)
    ));

  if (paidOrders.length === 0) {
    return { success: true, amount: 0 }; // No fees to charge
  }

  // Calculate total transactions
  const totalAmount = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  
  // Use store-specific fee rate if set, otherwise use platform default
  const fee = await calculateTransactionFeeForStore(totalAmount, storeId, subscription.customFeePercentage);
  const feePercentDisplay = (fee.feeRate * 100).toFixed(1);

  // Skip if fee is too small (less than ₪1)
  if (fee.totalFee < 1) {
    return { success: true, amount: 0 };
  }

  // Charge with token
  const chargeResult = await chargeWithToken({
    tokenUid: subscription.payplusTokenUid,
    customerUid: subscription.payplusCustomerUid,
    amount: fee.totalFee,
    description: `עמלות עסקאות - ${periodStart.toLocaleDateString('he-IL')} עד ${periodEnd.toLocaleDateString('he-IL')}`,
    invoiceItems: [
      {
        name: `עמלות עסקאות (${feePercentDisplay}%)`,
        quantity: 1,
        price: fee.feeAmount,
      },
    ],
  });

  if (!chargeResult.success) {
    // Create failed invoice
    const invoiceNumber = await generateInvoiceNumber();
    await db.insert(platformInvoices).values({
      storeId,
      subscriptionId: subscription.id,
      invoiceNumber,
      type: 'transaction_fee',
      status: 'failed',
      subtotal: String(fee.feeAmount),
      vatRate: String(VAT_RATE * 100),
      vatAmount: String(fee.vatAmount),
      totalAmount: String(fee.totalFee),
      periodStart,
      periodEnd,
      description: `עמלות עסקאות - ${paidOrders.length} הזמנות`,
      chargeAttempts: 1,
      lastChargeAttempt: new Date(),
      lastChargeError: chargeResult.error,
      issuedAt: new Date(),
      dueAt: new Date(),
    });

    // Update subscription status to past_due
    await db
      .update(storeSubscriptions)
      .set({ status: 'past_due', updatedAt: new Date() })
      .where(eq(storeSubscriptions.id, subscription.id));

    return { success: false, error: chargeResult.error };
  }

  // Create successful invoice
  const invoiceNumber = await generateInvoiceNumber();
  const [invoice] = await db
    .insert(platformInvoices)
    .values({
      storeId,
      subscriptionId: subscription.id,
      invoiceNumber,
      type: 'transaction_fee',
      status: 'paid',
      subtotal: String(fee.feeAmount),
      vatRate: String(VAT_RATE * 100),
      vatAmount: String(fee.vatAmount),
      totalAmount: String(fee.totalFee),
      periodStart,
      periodEnd,
      description: `עמלות עסקאות - ${paidOrders.length} הזמנות`,
      payplusTransactionUid: chargeResult.transactionUid,
      payplusInvoiceNumber: chargeResult.invoiceNumber,
      payplusInvoiceUrl: chargeResult.invoiceUrl,
      issuedAt: new Date(),
      paidAt: new Date(),
    })
    .returning();

  // Create invoice item
  await db.insert(platformInvoiceItems).values({
    invoiceId: invoice.id,
    description: `עמלות עסקאות (0.5% מ-₪${totalAmount.toFixed(2)})`,
    quantity: 1,
    unitPrice: String(fee.feeAmount),
    totalPrice: String(fee.feeAmount),
    referenceType: 'transaction_fee',
    referenceId: `${periodStart.toISOString()}_${periodEnd.toISOString()}`,
  });

  // Record transaction fee calculation
  await db.insert(storeTransactionFees).values({
    storeId,
    periodStart,
    periodEnd,
    totalTransactionsAmount: String(totalAmount),
    totalTransactionsCount: paidOrders.length,
    feePercentage: String(fee.feeRate), // Use rate from DB
    feeAmount: String(fee.feeAmount),
    invoiceId: invoice.id,
    orderIds: paidOrders.map(o => o.id),
  });

  // If subscription was past_due, update back to active after successful charge
  if (subscription.status === 'past_due') {
    await db
      .update(storeSubscriptions)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(storeSubscriptions.id, subscription.id));
    console.log(`[Transaction Fees] Restored subscription status to active for store ${storeId}`);
  }

  return {
    success: true,
    invoiceNumber,
    amount: fee.totalFee,
  };
}

/**
 * Charge plugin fees for a store
 */
export async function chargePluginFees(storeId: string): Promise<{
  success: boolean;
  invoiceNumber?: string;
  amount?: number;
  error?: string;
}> {
  // Get subscription with payment token
  const subscription = await db
    .select()
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.storeId, storeId))
    .then(rows => rows[0]);

  if (!subscription?.payplusTokenUid || !subscription?.payplusCustomerUid) {
    return { success: false, error: 'No payment method on file' };
  }

  // Get active plugins with pricing
  const activePluginsData = await db
    .select({
      pluginSlug: storePlugins.pluginSlug,
      monthlyPrice: pluginPricing.monthlyPrice,
    })
    .from(storePlugins)
    .innerJoin(pluginPricing, eq(storePlugins.pluginSlug, pluginPricing.pluginSlug))
    .where(and(
      eq(storePlugins.storeId, storeId),
      eq(storePlugins.isActive, true),
      eq(storePlugins.subscriptionStatus, 'active')
    ));

  if (activePluginsData.length === 0) {
    return { success: true, amount: 0 };
  }

  // Calculate total
  const subtotal = activePluginsData.reduce((sum, p) => sum + Number(p.monthlyPrice), 0);
  const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
  const totalAmount = subtotal + vatAmount;

  // Charge with token
  const chargeResult = await chargeWithToken({
    tokenUid: subscription.payplusTokenUid,
    customerUid: subscription.payplusCustomerUid,
    amount: totalAmount,
    description: `תוספים - ${activePluginsData.length} תוספים פעילים`,
    invoiceItems: activePluginsData.map(p => ({
      name: `תוסף: ${p.pluginSlug}`,
      quantity: 1,
      price: Number(p.monthlyPrice),
    })),
  });

  if (!chargeResult.success) {
    return { success: false, error: chargeResult.error };
  }

  // Create invoice
  const invoiceNumber = await generateInvoiceNumber();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const [invoice] = await db
    .insert(platformInvoices)
    .values({
      storeId,
      subscriptionId: subscription.id,
      invoiceNumber,
      type: 'plugin',
      status: 'paid',
      subtotal: String(subtotal),
      vatRate: String(VAT_RATE * 100),
      vatAmount: String(vatAmount),
      totalAmount: String(totalAmount),
      periodStart: now,
      periodEnd,
      description: `תוספים - ${activePluginsData.length} תוספים פעילים`,
      payplusTransactionUid: chargeResult.transactionUid,
      payplusInvoiceNumber: chargeResult.invoiceNumber,
      payplusInvoiceUrl: chargeResult.invoiceUrl,
      issuedAt: now,
      paidAt: now,
    })
    .returning();

  // Create invoice items
  for (const plugin of activePluginsData) {
    await db.insert(platformInvoiceItems).values({
      invoiceId: invoice.id,
      description: `תוסף: ${plugin.pluginSlug}`,
      quantity: 1,
      unitPrice: String(plugin.monthlyPrice),
      totalPrice: String(plugin.monthlyPrice),
      referenceType: 'plugin',
      referenceId: plugin.pluginSlug,
    });
  }

  // Update plugin billing dates
  await db
    .update(storePlugins)
    .set({
      lastBillingDate: now,
      nextBillingDate: periodEnd,
      updatedAt: now,
    })
    .where(and(
      eq(storePlugins.storeId, storeId),
      eq(storePlugins.isActive, true)
    ));

  return {
    success: true,
    invoiceNumber,
    amount: totalAmount,
  };
}

/**
 * Renew subscription (monthly charge)
 */
export async function renewSubscription(storeId: string): Promise<{
  success: boolean;
  invoiceNumber?: string;
  error?: string;
}> {
  const subscription = await db
    .select()
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.storeId, storeId))
    .then(rows => rows[0]);

  if (!subscription) {
    return { success: false, error: 'Subscription not found' };
  }

  if (!subscription.payplusTokenUid || !subscription.payplusCustomerUid) {
    return { success: false, error: 'No payment method on file' };
  }

  if (subscription.plan === 'trial') {
    return { success: false, error: 'Cannot renew trial subscription' };
  }

  const plan = subscription.plan as 'branding' | 'quickshop';
  // Use async version to get prices from DB (with custom pricing support)
  const pricing = await calculateSubscriptionPriceAsync(plan, storeId);
  const planNameHe = plan === 'branding' ? 'מסלול תדמית' : 'מסלול קוויק שופ';

  // Charge with token
  const chargeResult = await chargeWithToken({
    tokenUid: subscription.payplusTokenUid,
    customerUid: subscription.payplusCustomerUid,
    amount: pricing.totalPrice,
    description: `חידוש מנוי QuickShop - ${planNameHe}`,
    invoiceItems: [
      {
        name: `מנוי QuickShop - ${planNameHe}`,
        quantity: 1,
        price: pricing.basePrice,
      },
    ],
  });

  if (!chargeResult.success) {
    // Update subscription status
    await db
      .update(storeSubscriptions)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(storeSubscriptions.id, subscription.id));

    return { success: false, error: chargeResult.error };
  }

  // Update subscription period
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db
    .update(storeSubscriptions)
    .set({
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      updatedAt: now,
    })
    .where(eq(storeSubscriptions.id, subscription.id));

  await db
    .update(stores)
    .set({
      planExpiresAt: periodEnd,
      updatedAt: now,
    })
    .where(eq(stores.id, storeId));

  // Create invoice
  const invoiceNumber = await createSubscriptionInvoice(
    storeId,
    plan,
    chargeResult.transactionUid || '',
    chargeResult.invoiceNumber || null,
    chargeResult.invoiceUrl || null
  );

  return { success: true, invoiceNumber };
}

/**
 * Get billing summary for a store
 */
export async function getStoreBillingSummary(storeId: string): Promise<StoreBillingSummary> {
  // Get subscription
  const subscription = await getOrCreateSubscription(storeId);

  // Get recent invoices
  const recentInvoicesData = await db
    .select()
    .from(platformInvoices)
    .where(eq(platformInvoices.storeId, storeId))
    .orderBy(desc(platformInvoices.createdAt))
    .limit(10);

  const recentInvoices: InvoiceSummary[] = recentInvoicesData.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    type: inv.type as 'subscription' | 'transaction_fee' | 'plugin',
    status: inv.status as 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled',
    subtotal: Number(inv.subtotal),
    vatAmount: Number(inv.vatAmount),
    totalAmount: Number(inv.totalAmount),
    issuedAt: inv.issuedAt,
    paidAt: inv.paidAt,
  }));

  // Get pending fees
  const pendingInvoices = await db
    .select({
      type: platformInvoices.type,
      totalAmount: platformInvoices.totalAmount,
    })
    .from(platformInvoices)
    .where(and(
      eq(platformInvoices.storeId, storeId),
      inArray(platformInvoices.status, ['pending', 'failed'])
    ));

  const pendingTransactionFees = pendingInvoices
    .filter(i => i.type === 'transaction_fee')
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  const pendingPluginFees = pendingInvoices
    .filter(i => i.type === 'plugin')
    .reduce((sum, i) => sum + Number(i.totalAmount), 0);

  // Get current period transactions
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const currentPeriodOrders = await db
    .select({
      total: orders.total,
    })
    .from(orders)
    .where(and(
      eq(orders.storeId, storeId),
      eq(orders.financialStatus, 'paid'),
      gte(orders.paidAt, twoWeeksAgo)
    ));

  const transactionAmount = currentPeriodOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const transactionFee = await calculateTransactionFeeAsync(transactionAmount);

  // Get active plugins
  const activePluginsData = await db
    .select({
      pluginSlug: storePlugins.pluginSlug,
      monthlyPrice: pluginPricing.monthlyPrice,
    })
    .from(storePlugins)
    .leftJoin(pluginPricing, eq(storePlugins.pluginSlug, pluginPricing.pluginSlug))
    .where(and(
      eq(storePlugins.storeId, storeId),
      eq(storePlugins.isActive, true)
    ));

  const activePlugins = activePluginsData.map(p => ({
    slug: p.pluginSlug,
    monthlyPrice: Number(p.monthlyPrice || 0),
  }));

  return {
    subscription,
    pendingTransactionFees,
    pendingPluginFees,
    recentInvoices,
    currentPeriodTransactions: {
      amount: transactionAmount,
      count: currentPeriodOrders.length,
      feeAmount: transactionFee.totalFee,
    },
    activePlugins,
  };
}

/**
 * Get all stores with expired trials
 */
export async function getExpiredTrials(): Promise<{ storeId: string; storeName: string; trialEndsAt: Date }[]> {
  const now = new Date();
  
  const expired = await db
    .select({
      storeId: storeSubscriptions.storeId,
      storeName: stores.name,
      trialEndsAt: storeSubscriptions.trialEndsAt,
    })
    .from(storeSubscriptions)
    .innerJoin(stores, eq(stores.id, storeSubscriptions.storeId))
    .where(and(
      eq(storeSubscriptions.status, 'trial'),
      lte(storeSubscriptions.trialEndsAt, now)
    ));

  return expired.map(e => ({
    storeId: e.storeId,
    storeName: e.storeName,
    trialEndsAt: e.trialEndsAt!,
  }));
}

/**
 * Expire a trial subscription
 */
export async function expireTrialSubscription(storeId: string): Promise<void> {
  await db
    .update(storeSubscriptions)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(eq(storeSubscriptions.storeId, storeId));

  // Deactivate the store
  await db
    .update(stores)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, storeId));
}

/**
 * Get stores due for subscription renewal
 */
export async function getStoresDueForRenewal(): Promise<string[]> {
  const now = new Date();
  
  const stores = await db
    .select({ storeId: storeSubscriptions.storeId })
    .from(storeSubscriptions)
    .where(and(
      eq(storeSubscriptions.status, 'active'),
      lte(storeSubscriptions.currentPeriodEnd, now)
    ));

  return stores.map(s => s.storeId);
}

/**
 * Get stores due for transaction fee billing
 * Returns ALL active/past_due stores with their last billing date
 * The cron will calculate the correct period for each store
 * Note: past_due stores should also be charged (they just had a failed payment before)
 */
export async function getStoresDueForTransactionFees(): Promise<{
  storeId: string;
  lastPeriodEnd: Date | null;
}[]> {
  // Get all stores with active or past_due subscriptions
  // past_due stores should also be charged - they had a previous payment failure but still need billing
  const activeStores = await db
    .select({ 
      storeId: storeSubscriptions.storeId,
      activatedAt: storeSubscriptions.currentPeriodStart, // When subscription was activated
    })
    .from(storeSubscriptions)
    .where(inArray(storeSubscriptions.status, ['active', 'past_due']));

  const storesWithBillingInfo: { storeId: string; lastPeriodEnd: Date | null }[] = [];

  for (const store of activeStores) {
    // Get last transaction fee billing for this store
    const lastFee = await db
      .select({ periodEnd: storeTransactionFees.periodEnd })
      .from(storeTransactionFees)
      .where(eq(storeTransactionFees.storeId, store.storeId))
      .orderBy(desc(storeTransactionFees.periodEnd))
      .limit(1)
      .then(rows => rows[0]);

    storesWithBillingInfo.push({
      storeId: store.storeId,
      lastPeriodEnd: lastFee?.periodEnd || store.activatedAt || null,
    });
  }

  return storesWithBillingInfo;
}

