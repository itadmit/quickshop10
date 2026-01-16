/**
 * Platform Plugins Admin Page
 * ניהול מחירי תוספים בפלטפורמה
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { pluginPricing } from '@/lib/db/schema';
import { PluginPricingForm } from '../settings/plugin-pricing-form';
import { Puzzle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformPluginsPage() {
  const session = await auth();
  
  if (!session?.user?.email || session.user.email !== 'admin@quickshop.co.il') {
    redirect('/login');
  }

  // Get plugin pricing
  const pluginPrices = await db
    .select()
    .from(pluginPricing)
    .orderBy(pluginPricing.pluginSlug);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
            <Puzzle className="w-7 h-7 text-emerald-600" />
            ניהול תוספים
          </h1>
          <p className="text-gray-500">הגדר מחירים וימי נסיון לכל תוסף</p>
        </div>
      </div>

      {/* Plugin Pricing Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-900">מחירי תוספים</h2>
          <p className="text-sm text-gray-500 mt-1">המחירים יחולו על כל החנויות שיתקינו את התוספים</p>
        </div>
        <div className="p-6">
          <PluginPricingForm plugins={pluginPrices.map(p => ({
            slug: p.pluginSlug,
            monthlyPrice: Number(p.monthlyPrice),
            trialDays: p.trialDays || 14,
            isActive: p.isActive,
          }))} />
        </div>
      </div>
    </div>
  );
}

