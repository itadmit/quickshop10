/**
 * Order Thank You Page - Redirect to main thank-you page
 * This handles legacy URLs with order number in path
 */

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

interface ThankYouOrderPageProps {
  params: Promise<{ slug: string; orderNumber: string }>;
  searchParams: Promise<{ t?: string; ref?: string }>;
}

export default async function ThankYouOrderPage({ params, searchParams }: ThankYouOrderPageProps) {
  const { slug, orderNumber } = await params;
  const search = await searchParams;
  
  // Check for custom domain
  const headersList = await headers();
  const basePath = headersList.get('x-custom-domain') ? '' : `/shops/${slug}`;
  
  // Redirect to main thank-you page with order reference
  const queryParams = new URLSearchParams();
  queryParams.set('ref', orderNumber);
  if (search.t) queryParams.set('t', search.t);
  
  redirect(`${basePath}/checkout/thank-you?${queryParams.toString()}`);
}
