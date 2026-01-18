import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

/**
 * Billing Redirect Page
 * 
 * This page handles redirects from PayPlus after subscription payment.
 * It processes the payment result and redirects to the subscription page.
 */

interface BillingPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
    status?: string;
    status_code?: string;
    transaction_uid?: string;
    [key: string]: string | undefined;
  }>;
}

export default async function BillingPage({ params, searchParams }: BillingPageProps) {
  const { slug } = await params;
  const search = await searchParams;

  // The slug might be a UUID (storeId) from PayPlus redirect
  // Try to find store by ID first, then by slug
  let store = await db.query.stores.findFirst({
    where: eq(stores.id, slug),
  });

  if (!store) {
    // If not found by ID, try by slug
    store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });
  }

  if (!store) {
    notFound();
  }

  // Check payment status from PayPlus redirect
  const statusCode = search.status_code;
  const status = search.status;
  const isSuccess = search.success === 'true' || 
                    statusCode === '000' || 
                    statusCode === '0' || 
                    status === 'approved';

  // Build redirect URL to subscription page (use slug for clean URL)
  const redirectParams = new URLSearchParams();
  
  if (isSuccess) {
    redirectParams.set('success', 'true');
    if (search.transaction_uid) {
      redirectParams.set('transaction_uid', search.transaction_uid);
    }
  } else if (search.error === 'true' || status === 'rejected' || status === 'error') {
    redirectParams.set('error', 'true');
  }

  // Redirect to subscription page using store slug
  redirect(`/shops/${store.slug}/admin/settings/subscription?${redirectParams.toString()}`);
}

