/**
 * Campaign Edit Page
 * 
 * ⚡ Server Component - manage campaign and prizes
 */

import { db } from '@/lib/db';
import { stores, gamificationCampaigns, gamificationPrizes, products, productImages } from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CampaignForm } from '../campaign-form';
import { PrizesManager } from './prizes-manager';
import { Target, Ticket, BarChart3, Eye } from 'lucide-react';

interface CampaignEditPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function CampaignEditPage({ params }: CampaignEditPageProps) {
  const { slug, id } = await params;

  // Get store
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (!store) {
    notFound();
  }

  // Get campaign
  const campaign = await db.query.gamificationCampaigns.findFirst({
    where: and(
      eq(gamificationCampaigns.id, id),
      eq(gamificationCampaigns.storeId, store.id)
    ),
  });

  if (!campaign) {
    notFound();
  }

  // Get prizes
  const prizes = await db
    .select()
    .from(gamificationPrizes)
    .where(eq(gamificationPrizes.campaignId, id))
    .orderBy(asc(gamificationPrizes.sortOrder));

  // Get products for gift selection
  const storeProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
    })
    .from(products)
    .where(
      and(
        eq(products.storeId, store.id),
        eq(products.isActive, true)
      )
    )
    .limit(100);

  // Calculate probability total
  const probabilityTotal = prizes.reduce((sum, p) => sum + parseFloat(p.probability), 0);
  const isValidProbability = Math.abs(probabilityTotal - 100) < 0.01;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/shops/${slug}/admin/plugins/gamification?type=${campaign.type}`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: campaign.primaryColor + '20', color: campaign.primaryColor }}
              >
                {campaign.type === 'wheel' ? (
                  <Target className="w-5 h-5" />
                ) : (
                  <Ticket className="w-5 h-5" />
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
              {campaign.isActive ? (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">פעיל</span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">לא פעיל</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {campaign.type === 'wheel' ? 'גלגל מזל' : 'כרטיס גירוד'} • נוצר {new Date(campaign.createdAt).toLocaleDateString('he-IL')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/shops/${slug}/admin/plugins/gamification/${id}/stats`}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            סטטיסטיקות
          </Link>
          <Link
            href={`/shops/${slug}/admin/plugins/gamification/${id}/preview`}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            תצוגה מקדימה
          </Link>
        </div>
      </div>

      {/* Probability Warning */}
      {prizes.length > 0 && !isValidProbability && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-amber-800">סכום ההסתברויות לא תקין</p>
            <p className="text-sm text-amber-700">
              סכום האחוזים הנוכחי הוא {probabilityTotal.toFixed(1)}% - צריך להיות בדיוק 100%
            </p>
          </div>
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Campaign Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">הגדרות קמפיין</h2>
          <CampaignForm
            storeId={store.id}
            storeSlug={slug}
            type={campaign.type}
            mode="edit"
            campaign={campaign}
          />
        </div>

        {/* Right: Prizes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              פרסים ({prizes.length}{campaign.type === 'wheel' ? '/12' : ''})
            </h2>
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${
              isValidProbability ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              סה״כ: {probabilityTotal.toFixed(1)}%
            </div>
          </div>
          
          <PrizesManager
            campaignId={id}
            campaignType={campaign.type}
            prizes={prizes.map(p => ({
              ...p,
              value: p.value ? parseFloat(p.value) : null,
              probability: parseFloat(p.probability),
              couponMinPurchase: p.couponMinPurchase ? parseFloat(p.couponMinPurchase) : null,
            }))}
            products={storeProducts.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price ? parseFloat(p.price) : 0,
            }))}
            storeSlug={slug}
          />
        </div>
      </div>
    </div>
  );
}

