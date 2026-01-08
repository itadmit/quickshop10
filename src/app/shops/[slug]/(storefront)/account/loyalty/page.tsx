/**
 * Customer Loyalty Page
 * 
 * Server Component - מהירות מקסימלית, HTML מוכן מהשרת
 * 
 * ⚠️ דף זה דורש שהתוסף "מועדון לקוחות PRO" יהיה מותקן
 */

import { db } from '@/lib/db';
import { stores, customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/customer-auth';
import { getLoyaltyMemberData, getLoyaltyTransactions, getOrCreateLoyaltyMember } from '@/lib/actions/loyalty';
import { LoyaltyProgressCard } from '@/components/loyalty/loyalty-progress-card';
import { LoyaltyTransactionsList } from '@/components/loyalty/loyalty-transactions-list';
import { isPluginActive } from '@/lib/plugins/loader';
import Link from 'next/link';
import { ArrowRight, Star, Gift, TrendingUp } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CustomerLoyaltyPage({ params }: Props) {
  const { slug } = await params;
  
  // Get store
  const [store] = await db
    .select({ id: stores.id, name: stores.name })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);
  
  if (!store) notFound();
  
  // Check if plugin is active
  const pluginActive = await isPluginActive(store.id, 'loyalty-program');
  if (!pluginActive) {
    // Plugin not installed - show message
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link 
            href={`/shops/${slug}/account`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לאיזור האישי
          </Link>
          
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">מועדון לקוחות</h1>
            <p className="text-gray-500">מועדון הלקוחות עדיין לא הופעל בחנות זו</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Check customer session
  const currentCustomer = await getCurrentCustomer();
  if (!currentCustomer || currentCustomer.storeId !== store.id) {
    redirect(`/shops/${slug}/login?callbackUrl=/shops/${slug}/account/loyalty`);
  }
  
  // Ensure customer is a loyalty member
  const member = await getOrCreateLoyaltyMember(store.id, currentCustomer.id);
  
  // Get full member data with progress
  const memberData = await getLoyaltyMemberData(store.id, currentCustomer.id);
  
  // If loyalty program not enabled
  if (!memberData || !memberData.program.isEnabled) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back Link */}
          <Link 
            href={`/shops/${slug}/account`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לאיזור האישי
          </Link>
          
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">מועדון לקוחות</h1>
            <p className="text-gray-500">מועדון הלקוחות עדיין לא הופעל בחנות זו</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Get transactions history
  const transactions = await getLoyaltyTransactions(memberData.member.id, 20);
  
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link 
          href={`/shops/${slug}/account`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לאיזור האישי
        </Link>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{memberData.program.name}</h1>
          <p className="text-gray-500">צבור נקודות, קבל הטבות ועלה ברמות</p>
        </div>
        
        {/* Main Progress Card */}
        <div className="mb-8">
          <LoyaltyProgressCard
            currentTier={memberData.currentTier as any}
            nextTier={memberData.nextTier as any}
            currentPoints={Number(memberData.member.currentPoints)}
            pointsValue={memberData.pointsValue}
            progressPercentage={memberData.progressPercentage}
            amountToNextTier={memberData.amountToNextTier}
            progressionType={memberData.program.progressionType}
            showProgressBar={memberData.program.showProgressBar}
          />
        </div>
        
        {/* All Tiers Overview */}
        {memberData.allTiers.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">רמות המועדון</h2>
            <div className="space-y-4">
              {memberData.allTiers.map((tier, index) => {
                const isCurrentTier = tier.id === memberData.currentTier?.id;
                const isPastTier = tier.level < (memberData.currentTier?.level || 0);
                const isFutureTier = tier.level > (memberData.currentTier?.level || 0);
                
                return (
                  <div 
                    key={tier.id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                      isCurrentTier 
                        ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' 
                        : isPastTier 
                          ? 'bg-green-50 border border-green-100'
                          : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
                      style={{ 
                        backgroundColor: tier.color,
                        opacity: isFutureTier ? 0.5 : 1 
                      }}
                    >
                      {tier.icon || tier.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${isFutureTier ? 'text-gray-500' : 'text-gray-900'}`}>
                          {tier.name}
                        </h3>
                        {isCurrentTier && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            הרמה שלך
                          </span>
                        )}
                        {isPastTier && (
                          <span className="text-green-600 text-xs">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {memberData.program.progressionType === 'total_spent' && `מ-₪${Number(tier.minValue).toLocaleString('he-IL')}`}
                        {memberData.program.progressionType === 'total_orders' && `מ-${Number(tier.minValue)} הזמנות`}
                        {memberData.program.progressionType === 'points_earned' && `מ-${Number(tier.minValue).toLocaleString('he-IL')} נקודות`}
                        {' • '}
                        ×{tier.pointsMultiplier} נקודות
                        {Number(tier.discountPercentage) > 0 && ` • ${tier.discountPercentage}% הנחה`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* How it Works */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">איך זה עובד?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">צבור נקודות</h3>
              <p className="text-sm text-gray-500">
                {memberData.program.pointsPerIls} נקודות על כל ₪1
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">עלה ברמות</h3>
              <p className="text-sm text-gray-500">
                קבל יותר הטבות ככל שאתה עולה
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">פדה הנחות</h3>
              <p className="text-sm text-gray-500">
                {Number(memberData.program.pointsRedemptionRate) * 100} אג' לכל נקודה
              </p>
            </div>
          </div>
        </div>
        
        {/* Transactions History */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">היסטוריית נקודות</h2>
          </div>
          <div className="p-6">
            <LoyaltyTransactionsList transactions={transactions as any} />
          </div>
        </div>
      </div>
    </div>
  );
}

