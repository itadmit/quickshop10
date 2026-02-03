/**
 * Gamification Plugin - Main Page
 * 
 * ⚡ Server Component for fast loading
 * Manages both Wheel of Fortune and Scratch Card campaigns
 */

import { db } from '@/lib/db';
import { stores, gamificationCampaigns, gamificationPrizes, gamificationEntries, gamificationWins } from '@/lib/db/schema';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isPluginActive } from '@/lib/plugins/loader';
import { CampaignsList } from './campaigns-list';
import { StatCard, StatCardGrid } from '@/components/admin/ui';
import { Target, Ticket, Plus, BarChart3, CheckCircle, Gamepad2, TrendingUp } from 'lucide-react';

interface GamificationPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: 'wheel' | 'scratch' }>;
}

export default async function GamificationPage({ params, searchParams }: GamificationPageProps) {
  const { slug } = await params;
  const { type } = await searchParams;

  // Get store
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (!store) {
    notFound();
  }

  // Check if at least one gamification plugin is active
  const wheelActive = await isPluginActive(store.id, 'wheel-of-fortune');
  const scratchActive = await isPluginActive(store.id, 'scratch-card');

  if (!wheelActive && !scratchActive) {
    redirect(`/shops/${slug}/admin/plugins`);
  }

  // Filter by type if specified
  const typeFilter = type || (wheelActive ? 'wheel' : 'scratch');

  // Get campaigns with stats
  const campaigns = await db
    .select({
      id: gamificationCampaigns.id,
      name: gamificationCampaigns.name,
      type: gamificationCampaigns.type,
      isActive: gamificationCampaigns.isActive,
      title: gamificationCampaigns.title,
      primaryColor: gamificationCampaigns.primaryColor,
      impressions: gamificationCampaigns.impressions,
      plays: gamificationCampaigns.plays,
      conversions: gamificationCampaigns.conversions,
      startDate: gamificationCampaigns.startDate,
      endDate: gamificationCampaigns.endDate,
      createdAt: gamificationCampaigns.createdAt,
    })
    .from(gamificationCampaigns)
    .where(
      and(
        eq(gamificationCampaigns.storeId, store.id),
        type ? eq(gamificationCampaigns.type, type) : undefined
      )
    )
    .orderBy(desc(gamificationCampaigns.createdAt));

  // Calculate stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.isActive).length;
  const totalPlays = campaigns.reduce((sum, c) => sum + c.plays, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const conversionRate = totalPlays > 0 ? ((totalConversions / totalPlays) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {typeFilter === 'wheel' ? (
              <>
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-pink-600" />
                </div>
                גלגל המזל
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-purple-600" />
                </div>
                כרטיס גירוד
              </>
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            {typeFilter === 'wheel' 
              ? 'צור גלגלי מזל אינטראקטיביים לאיסוף לידים והגדלת מכירות'
              : 'צור כרטיסי גירוד וירטואליים לחוויה מרגשת'
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Type switcher */}
          {wheelActive && scratchActive && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Link
                href={`/shops/${slug}/admin/plugins/gamification?type=wheel`}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  typeFilter === 'wheel' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target className="w-4 h-4" />
                גלגל מזל
              </Link>
              <Link
                href={`/shops/${slug}/admin/plugins/gamification?type=scratch`}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  typeFilter === 'scratch' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Ticket className="w-4 h-4" />
                כרטיס גירוד
              </Link>
            </div>
          )}

          <Link
            href={`/shops/${slug}/admin/plugins/gamification/new?type=${typeFilter}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            קמפיין חדש
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard 
          label="קמפיינים" 
          value={totalCampaigns}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <StatCard 
          label="פעילים" 
          value={activeCampaigns}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard 
          label="משחקים" 
          value={totalPlays}
          icon={<Gamepad2 className="w-5 h-5" />}
        />
        <StatCard 
          label="המרות" 
          value={`${conversionRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </StatCardGrid>

      {/* Campaigns List */}
      {campaigns.length > 0 ? (
        <CampaignsList campaigns={campaigns} storeSlug={slug} />
      ) : (
        <EmptyState type={typeFilter} storeSlug={slug} />
      )}
    </div>
  );
}

function EmptyState({ type, storeSlug }: { type: string; storeSlug: string }) {
  return (
    <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${type === 'wheel' ? 'bg-pink-100' : 'bg-purple-100'}`}>
        {type === 'wheel' ? (
          <Target className={`w-10 h-10 text-pink-600`} />
        ) : (
          <Ticket className={`w-10 h-10 text-purple-600`} />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {type === 'wheel' ? 'אין גלגלי מזל עדיין' : 'אין כרטיסי גירוד עדיין'}
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {type === 'wheel' 
          ? 'צור גלגל מזל ראשון כדי להתחיל לאסוף לידים ולהגדיל מכירות'
          : 'צור כרטיס גירוד ראשון כדי ליצור חוויה מרגשת ללקוחות'
        }
      </p>
      <Link
        href={`/shops/${storeSlug}/admin/plugins/gamification/new?type=${type}`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 active:scale-[0.98] transition-all"
      >
        <Plus className="w-5 h-5" />
        צור קמפיין ראשון
      </Link>
    </div>
  );
}

