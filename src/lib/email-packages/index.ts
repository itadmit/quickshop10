/**
 * Email Packages System - ניהול חבילות דיוור
 * 
 * מאפשר לחנויות לרכוש חבילות דיוור לשימוש באוטומציות.
 * כל מייל שנשלח מאוטומציה נספר לעומת המכסה החודשית.
 */

import { db } from '@/lib/db';
import { 
  emailPackages, 
  storeEmailSubscriptions, 
  storeEmailLogs,
  storeSubscriptions,
  platformInvoices,
  platformInvoiceItems,
} from '@/lib/db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { chargeWithToken } from '@/lib/billing/payplus-billing';

const VAT_RATE = 0.18;

// ============ TYPES ============

export interface EmailQuotaStatus {
  hasPackage: boolean;
  packageSlug: string | null;
  packageName: string | null;
  emailsUsed: number;
  emailsLimit: number;
  emailsRemaining: number;
  percentUsed: number;
  periodEnd: Date | null;
  status: 'active' | 'cancelled' | 'past_due' | 'expired' | 'no_package';
}

export interface EmailPackageInfo {
  slug: string;
  name: string;
  description: string | null;
  monthlyEmails: number;
  monthlyPrice: number;
  monthlyPriceWithVat: number;
  icon: string | null;
  isPopular: boolean;
}

// ============ GET PACKAGES ============

/**
 * Get all active email packages
 */
export async function getEmailPackages(): Promise<EmailPackageInfo[]> {
  const packages = await db
    .select()
    .from(emailPackages)
    .where(eq(emailPackages.isActive, true))
    .orderBy(emailPackages.sortOrder);

  return packages.map(pkg => ({
    slug: pkg.slug,
    name: pkg.name,
    description: pkg.description,
    monthlyEmails: pkg.monthlyEmails,
    monthlyPrice: Number(pkg.monthlyPrice),
    monthlyPriceWithVat: Math.round(Number(pkg.monthlyPrice) * (1 + VAT_RATE) * 100) / 100,
    icon: pkg.icon,
    isPopular: pkg.isPopular,
  }));
}

/**
 * Get a specific package by slug
 */
export async function getEmailPackage(slug: string): Promise<EmailPackageInfo | null> {
  const [pkg] = await db
    .select()
    .from(emailPackages)
    .where(and(eq(emailPackages.slug, slug), eq(emailPackages.isActive, true)))
    .limit(1);

  if (!pkg) return null;

  return {
    slug: pkg.slug,
    name: pkg.name,
    description: pkg.description,
    monthlyEmails: pkg.monthlyEmails,
    monthlyPrice: Number(pkg.monthlyPrice),
    monthlyPriceWithVat: Math.round(Number(pkg.monthlyPrice) * (1 + VAT_RATE) * 100) / 100,
    icon: pkg.icon,
    isPopular: pkg.isPopular,
  };
}

// ============ QUOTA CHECKING ============

/**
 * Get email quota status for a store
 * Used to check if automation emails can be sent
 */
export async function getEmailQuotaStatus(storeId: string): Promise<EmailQuotaStatus> {
  // Get store's email subscription
  const [subscription] = await db
    .select()
    .from(storeEmailSubscriptions)
    .where(eq(storeEmailSubscriptions.storeId, storeId))
    .limit(1);

  if (!subscription) {
    return {
      hasPackage: false,
      packageSlug: null,
      packageName: null,
      emailsUsed: 0,
      emailsLimit: 0,
      emailsRemaining: 0,
      percentUsed: 0,
      periodEnd: null,
      status: 'no_package',
    };
  }

  // Get package name
  const [pkg] = await db
    .select({ name: emailPackages.name })
    .from(emailPackages)
    .where(eq(emailPackages.slug, subscription.packageSlug))
    .limit(1);

  const emailsRemaining = Math.max(0, subscription.emailsLimit - subscription.emailsUsedThisPeriod);
  const percentUsed = subscription.emailsLimit > 0 
    ? Math.round((subscription.emailsUsedThisPeriod / subscription.emailsLimit) * 100)
    : 0;

  return {
    hasPackage: true,
    packageSlug: subscription.packageSlug,
    packageName: pkg?.name || subscription.packageSlug,
    emailsUsed: subscription.emailsUsedThisPeriod,
    emailsLimit: subscription.emailsLimit,
    emailsRemaining,
    percentUsed,
    periodEnd: subscription.currentPeriodEnd,
    status: subscription.status,
  };
}

/**
 * Check if store can send an email (has quota available)
 */
export async function canSendEmail(storeId: string): Promise<{
  canSend: boolean;
  reason?: string;
  quotaStatus: EmailQuotaStatus;
}> {
  const quotaStatus = await getEmailQuotaStatus(storeId);

  if (!quotaStatus.hasPackage) {
    return {
      canSend: false,
      reason: 'אין חבילת דיוור פעילה. רכוש חבילת דיוור כדי לשלוח מיילים אוטומטיים.',
      quotaStatus,
    };
  }

  if (quotaStatus.status !== 'active') {
    return {
      canSend: false,
      reason: `חבילת הדיוור ${quotaStatus.status === 'past_due' ? 'בחריגת תשלום' : quotaStatus.status === 'cancelled' ? 'בוטלה' : 'לא פעילה'}. חדש את החבילה כדי להמשיך לשלוח מיילים.`,
      quotaStatus,
    };
  }

  if (quotaStatus.emailsRemaining <= 0) {
    return {
      canSend: false,
      reason: `מכסת המיילים החודשית נגמרה (${quotaStatus.emailsLimit} מיילים). שדרג את החבילה או המתן לחידוש.`,
      quotaStatus,
    };
  }

  return {
    canSend: true,
    quotaStatus,
  };
}

// ============ USAGE TRACKING ============

/**
 * Increment email usage and log the sent email
 * Called after successfully sending an email from automation
 */
export async function incrementEmailUsage(params: {
  storeId: string;
  automationId?: string;
  recipientEmail: string;
  emailType: string;
  subject?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { storeId, automationId, recipientEmail, emailType, subject, metadata } = params;

  // Get current subscription
  const [subscription] = await db
    .select()
    .from(storeEmailSubscriptions)
    .where(eq(storeEmailSubscriptions.storeId, storeId))
    .limit(1);

  if (subscription) {
    // Increment usage
    await db
      .update(storeEmailSubscriptions)
      .set({
        emailsUsedThisPeriod: sql`${storeEmailSubscriptions.emailsUsedThisPeriod} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(storeEmailSubscriptions.id, subscription.id));

    // Log the email
    await db.insert(storeEmailLogs).values({
      storeId,
      automationId: automationId || null,
      recipientEmail,
      emailType,
      subject,
      status: 'sent',
      metadata: metadata || {},
      billingPeriodStart: subscription.currentPeriodStart,
      billingPeriodEnd: subscription.currentPeriodEnd,
    });
  }
}

/**
 * Log a failed email send
 */
export async function logFailedEmail(params: {
  storeId: string;
  automationId?: string;
  recipientEmail: string;
  emailType: string;
  errorMessage: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { storeId, automationId, recipientEmail, emailType, errorMessage, metadata } = params;

  await db.insert(storeEmailLogs).values({
    storeId,
    automationId: automationId || null,
    recipientEmail,
    emailType,
    status: 'failed',
    errorMessage,
    metadata: metadata || {},
  });
}

// ============ SUBSCRIPTION MANAGEMENT ============

/**
 * Subscribe store to an email package
 * Called after successful payment
 */
export async function subscribeToEmailPackage(params: {
  storeId: string;
  packageSlug: string;
}): Promise<{ success: boolean; error?: string }> {
  const { storeId, packageSlug } = params;

  // Get package info
  const [pkg] = await db
    .select()
    .from(emailPackages)
    .where(and(eq(emailPackages.slug, packageSlug), eq(emailPackages.isActive, true)))
    .limit(1);

  if (!pkg) {
    return { success: false, error: 'חבילה לא נמצאה' };
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Check if subscription exists
  const [existing] = await db
    .select()
    .from(storeEmailSubscriptions)
    .where(eq(storeEmailSubscriptions.storeId, storeId))
    .limit(1);

  if (existing) {
    // Update existing subscription
    await db
      .update(storeEmailSubscriptions)
      .set({
        packageSlug,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        emailsUsedThisPeriod: 0,
        emailsLimit: pkg.monthlyEmails,
        lastBillingDate: now,
        nextBillingDate: periodEnd,
        cancelledAt: null,
        cancellationReason: null,
        updatedAt: now,
      })
      .where(eq(storeEmailSubscriptions.id, existing.id));
  } else {
    // Create new subscription
    await db.insert(storeEmailSubscriptions).values({
      storeId,
      packageSlug,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      emailsUsedThisPeriod: 0,
      emailsLimit: pkg.monthlyEmails,
      lastBillingDate: now,
      nextBillingDate: periodEnd,
    });
  }

  return { success: true };
}

/**
 * Cancel email package subscription
 */
export async function cancelEmailSubscription(
  storeId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const [subscription] = await db
    .select()
    .from(storeEmailSubscriptions)
    .where(eq(storeEmailSubscriptions.storeId, storeId))
    .limit(1);

  if (!subscription) {
    return { success: false, error: 'אין מנוי פעיל' };
  }

  await db
    .update(storeEmailSubscriptions)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(storeEmailSubscriptions.id, subscription.id));

  return { success: true };
}

// ============ BILLING ============

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EM-${year}${month}-${random}`;
}

/**
 * Charge email package subscription (called by cron)
 */
export async function chargeEmailPackage(storeId: string): Promise<{
  success: boolean;
  invoiceNumber?: string;
  amount?: number;
  error?: string;
}> {
  // Get email subscription
  const [emailSub] = await db
    .select()
    .from(storeEmailSubscriptions)
    .where(and(
      eq(storeEmailSubscriptions.storeId, storeId),
      eq(storeEmailSubscriptions.status, 'active')
    ))
    .limit(1);

  if (!emailSub) {
    return { success: false, error: 'No active email subscription' };
  }

  // Get package pricing
  const [pkg] = await db
    .select()
    .from(emailPackages)
    .where(eq(emailPackages.slug, emailSub.packageSlug))
    .limit(1);

  if (!pkg) {
    return { success: false, error: 'Package not found' };
  }

  // Get store subscription (for payment token)
  const [storeSub] = await db
    .select()
    .from(storeSubscriptions)
    .where(eq(storeSubscriptions.storeId, storeId))
    .limit(1);

  if (!storeSub?.payplusTokenUid || !storeSub?.payplusCustomerUid) {
    return { success: false, error: 'No payment method on file' };
  }

  // Calculate amounts
  const subtotal = Number(pkg.monthlyPrice);
  const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
  const totalAmount = subtotal + vatAmount;

  // Charge with token
  const chargeResult = await chargeWithToken({
    tokenUid: storeSub.payplusTokenUid,
    customerUid: storeSub.payplusCustomerUid,
    amount: totalAmount,
    description: `חבילת דיוור - ${pkg.name}`,
    invoiceItems: [{
      name: `חבילת דיוור: ${pkg.name} (${pkg.monthlyEmails} מיילים)`,
      quantity: 1,
      price: subtotal,
    }],
  });

  if (!chargeResult.success) {
    // Mark as past due
    await db
      .update(storeEmailSubscriptions)
      .set({ status: 'past_due', updatedAt: new Date() })
      .where(eq(storeEmailSubscriptions.id, emailSub.id));

    return { success: false, error: chargeResult.error };
  }

  // Create invoice
  const invoiceNumber = await generateInvoiceNumber();
  const now = new Date();
  const newPeriodEnd = new Date(now);
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

  const [invoice] = await db
    .insert(platformInvoices)
    .values({
      storeId,
      subscriptionId: storeSub.id,
      invoiceNumber,
      type: 'email_package',
      status: 'paid',
      subtotal: String(subtotal),
      vatRate: String(VAT_RATE * 100),
      vatAmount: String(vatAmount),
      totalAmount: String(totalAmount),
      periodStart: now,
      periodEnd: newPeriodEnd,
      description: `חבילת דיוור - ${pkg.name}`,
      payplusTransactionUid: chargeResult.transactionUid,
      payplusInvoiceNumber: chargeResult.invoiceNumber,
      payplusInvoiceUrl: chargeResult.invoiceUrl,
      issuedAt: now,
      paidAt: now,
    })
    .returning();

  // Create invoice item
  await db.insert(platformInvoiceItems).values({
    invoiceId: invoice.id,
    description: `חבילת דיוור: ${pkg.name} (${pkg.monthlyEmails} מיילים)`,
    quantity: 1,
    unitPrice: String(subtotal),
    totalPrice: String(subtotal),
    referenceType: 'email_package',
    referenceId: pkg.slug,
  });

  // Reset usage and extend period
  await db
    .update(storeEmailSubscriptions)
    .set({
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: newPeriodEnd,
      emailsUsedThisPeriod: 0,
      lastBillingDate: now,
      nextBillingDate: newPeriodEnd,
      updatedAt: now,
    })
    .where(eq(storeEmailSubscriptions.id, emailSub.id));

  return {
    success: true,
    invoiceNumber,
    amount: totalAmount,
  };
}

// ============ STATS ============

/**
 * Get email stats for a period
 */
export async function getEmailStats(storeId: string, periodStart: Date, periodEnd: Date) {
  const logs = await db
    .select({
      emailType: storeEmailLogs.emailType,
      status: storeEmailLogs.status,
      count: sql<number>`count(*)`,
    })
    .from(storeEmailLogs)
    .where(and(
      eq(storeEmailLogs.storeId, storeId),
      gte(storeEmailLogs.sentAt, periodStart),
      lte(storeEmailLogs.sentAt, periodEnd)
    ))
    .groupBy(storeEmailLogs.emailType, storeEmailLogs.status);

  const sent = logs
    .filter(l => l.status === 'sent')
    .reduce((sum, l) => sum + Number(l.count), 0);

  const failed = logs
    .filter(l => l.status === 'failed')
    .reduce((sum, l) => sum + Number(l.count), 0);

  const byType = logs.reduce((acc, l) => {
    if (!acc[l.emailType]) {
      acc[l.emailType] = { sent: 0, failed: 0 };
    }
    if (l.status === 'sent') {
      acc[l.emailType].sent += Number(l.count);
    } else {
      acc[l.emailType].failed += Number(l.count);
    }
    return acc;
  }, {} as Record<string, { sent: number; failed: number }>);

  return {
    total: sent + failed,
    sent,
    failed,
    byType,
  };
}

