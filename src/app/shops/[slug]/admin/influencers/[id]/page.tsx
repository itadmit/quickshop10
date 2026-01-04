import { getStoreBySlug } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { discounts, influencers } from '@/lib/db/schema';
import { eq, or, isNull, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { InfluencerForm } from '../influencer-form';

interface EditInfluencerPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditInfluencerPage({ params }: EditInfluencerPageProps) {
  const { slug, id } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Fetch the influencer
  const [influencer] = await db
    .select()
    .from(influencers)
    .where(and(eq(influencers.id, id), eq(influencers.storeId, store.id)))
    .limit(1);

  if (!influencer) {
    notFound();
  }

  // Fetch available discounts (not linked to other influencers, or linked to this one)
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
      or(isNull(discounts.influencerId), eq(discounts.influencerId, id))
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
            <span>עריכה</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">עריכת משפיען: {influencer.name}</h1>
        </div>
      </div>

      <InfluencerForm
        storeId={store.id}
        storeSlug={slug}
        mode="edit"
        influencer={influencer}
        availableDiscounts={availableDiscounts}
      />
    </div>
  );
}

