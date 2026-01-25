/**
 * Loyalty Program Plugin Settings - Redirect
 * 
 * מפנה לדף הגדרות מועדון לקוחות הראשי
 */

import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LoyaltyProgramPluginPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/shops/${slug}/admin/loyalty`);
}





