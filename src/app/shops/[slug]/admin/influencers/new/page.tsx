import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { discounts, influencers } from '@/lib/db/schema';
import { eq, and, notInArray, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InfluencerForm } from '../influencer-form';

interface NewInfluencerPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewInfluencerPage({ params }: NewInfluencerPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Get discount IDs already linked to influencers
  const linkedDiscountIds = await db
    .select({ discountId: influencers.discountId })
    .from(influencers)
    .where(and(
      eq(influencers.storeId, store.id),
      sql`${influencers.discountId} IS NOT NULL`
    ));

  const usedIds = linkedDiscountIds.map(r => r.discountId).filter(Boolean) as string[];

  // Fetch available discounts (not already linked to an influencer)
  const availableDiscounts = await db
    .select({
      id: discounts.id,
      code: discounts.code,
      type: discounts.type,
      value: discounts.value,
    })
    .from(discounts)
    .where(and(
      eq(discounts.storeId, store.id),
      eq(discounts.isActive, true),
      usedIds.length > 0 ? notInArray(discounts.id, usedIds) : sql`1=1`
    ))
    .orderBy(discounts.code);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/shops/${slug}/admin/influencers`} className="hover:text-gray-700">
              משפיענים
            </Link>
            <span>/</span>
            <span>משפיען חדש</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">משפיען חדש</h1>
        </div>
      </div>

      <InfluencerForm
        storeId={store.id}
        storeSlug={slug}
        mode="create"
        availableDiscounts={availableDiscounts}
      />
    </div>
  );
}

