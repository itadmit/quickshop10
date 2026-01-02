/**
 * Order Thank You Page - Redirect to main thank-you page
 * This handles legacy URLs with order number in path
 */

import { redirect } from 'next/navigation';

interface ThankYouOrderPageProps {
  params: Promise<{ slug: string; orderNumber: string }>;
  searchParams: Promise<{ t?: string; ref?: string }>;
}

export default async function ThankYouOrderPage({ params, searchParams }: ThankYouOrderPageProps) {
  const { slug, orderNumber } = await params;
  const search = await searchParams;
  
  // Redirect to main thank-you page with order reference
  const queryParams = new URLSearchParams();
  queryParams.set('ref', orderNumber);
  if (search.t) queryParams.set('t', search.t);
  
  redirect(`/shops/${slug}/checkout/thank-you?${queryParams.toString()}`);
}
