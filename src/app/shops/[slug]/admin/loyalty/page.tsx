/**
 * Loyalty Program Admin Page
 * 
 * Server Component - כל הנתונים נטענים בצד השרת
 * מהירות: אין hydration מיותר, HTML מוכן מראש
 * 
 * ⚠️ דף זה דורש התקנת תוסף "מועדון לקוחות PRO"
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { loyaltyPrograms, loyaltyTiers, loyaltyMembers } from '@/lib/db/schema-loyalty';
import { eq, asc, sql, count } from 'drizzle-orm';
import { getLoyaltyStats, createLoyaltyProgram } from '@/lib/actions/loyalty';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard, StatCardGrid } from '@/components/admin/ui';
import { LoyaltySettingsForm } from './settings-form';
import { LoyaltyTiersList } from './tiers-list';
import { LoyaltyStatsCards } from './stats-cards';
import { Gift, Users, Star, Coins, Crown, ArrowLeft } from 'lucide-react';
import { isPluginActive } from '@/lib/plugins/loader';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LoyaltyAdminPage({ params }: Props) {
  const { slug } = await params;
  
  // Get store
  const [store] = await db
    .select({ id: stores.id, name: stores.name })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);
  
  if (!store) notFound();
  
  // Check if plugin is installed
  const pluginActive = await isPluginActive(store.id, 'loyalty-program');
  
  if (!pluginActive) {
    return (
      <div dir="rtl" className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">מועדון לקוחות PRO</h1>
          <p className="text-gray-500 mb-6">
            התוסף לא מותקן בחנות שלך. התקן את תוסף "מועדון לקוחות PRO" מחנות התוספים כדי להתחיל לבנות מועדון לקוחות עם רמות, נקודות והטבות.
          </p>
          <div className="space-y-3">
            <Link
              href={`/shops/${slug}/admin/plugins`}
              className="block w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              עבור לחנות התוספים
            </Link>
            <Link
              href={`/shops/${slug}/admin`}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Get or create loyalty program
  let program = await db.query.loyaltyPrograms.findFirst({
    where: eq(loyaltyPrograms.storeId, store.id),
    with: {
      tiers: {
        orderBy: asc(loyaltyTiers.level),
      },
    },
  });
  
  // Create program if doesn't exist
  if (!program) {
    const result = await createLoyaltyProgram(store.id);
    if (result.success && result.program) {
      // Re-fetch with relations
      program = await db.query.loyaltyPrograms.findFirst({
        where: eq(loyaltyPrograms.id, result.program.id),
        with: {
          tiers: {
            orderBy: asc(loyaltyTiers.level),
          },
        },
      });
    }
  }
  
  if (!program) {
    return (
      <div className="p-6">
        <p className="text-red-500">שגיאה ביצירת תוכנית נאמנות</p>
      </div>
    );
  }
  
  // Get stats
  const stats = await getLoyaltyStats(store.id);
  
  return (
    <div className="space-y-8" dir="rtl">
      <PageHeader
        title="מועדון לקוחות"
        description={program.isEnabled ? 'התוסף פעיל' : 'התוסף לא פעיל'}
      />
      
      {/* Stats Cards - Server Component */}
      <StatCardGrid columns={4}>
        <StatCard
          label="חברי מועדון"
          value={stats?.totalMembers || 0}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="נקודות פעילות"
          value={formatNumber(Number(stats?.totalPointsActive || 0))}
          icon={<Star className="w-5 h-5" />}
        />
        <StatCard
          label="נקודות שנצברו"
          value={formatNumber(Number(stats?.totalPointsEarned || 0))}
          icon={<Coins className="w-5 h-5" />}
        />
        <StatCard
          label="נקודות שנפדו"
          value={formatNumber(Number(stats?.totalPointsRedeemed || 0))}
          icon={<Gift className="w-5 h-5" />}
        />
      </StatCardGrid>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form - Left 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">הגדרות כלליות</h2>
            <LoyaltySettingsForm 
              program={program} 
              storeSlug={slug} 
            />
          </div>
        </div>
        
        {/* Quick Stats - Right col */}
        <div className="space-y-6">
          {/* Members by Tier */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">חברים לפי רמה</h3>
            <div className="space-y-3">
              {stats?.membersByTier?.length ? (
                stats.membersByTier.map((item) => (
                  <div key={item.tierId || 'default'} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.tierColor || '#6B7280' }}
                      />
                      <span className="text-sm text-gray-700">{item.tierName || 'ללא רמה'}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">אין חברים עדיין</p>
              )}
            </div>
          </div>
          
          {/* Points Value */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-6">
            <h3 className="text-sm font-medium text-amber-800 mb-2">ערך נקודות פעילות</h3>
            <p className="text-2xl font-bold text-amber-900">
              ₪{formatNumber(Number(stats?.totalPointsActive || 0) * Number(program.pointsRedemptionRate))}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              לפי {Number(program.pointsRedemptionRate) * 100} אג' לנקודה
            </p>
          </div>
        </div>
      </div>
      
      {/* Tiers Management */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">רמות המועדון</h2>
          <p className="text-sm text-gray-500 mt-1">
            הגדר רמות שונות עם הטבות ייחודיות לכל רמה
          </p>
        </div>
        <LoyaltyTiersList 
          tiers={program.tiers} 
          programId={program.id}
          storeSlug={slug}
          progressionType={program.progressionType}
        />
      </div>
    </div>
  );
}

// ============ Helper Components ============

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString('he-IL');
}

