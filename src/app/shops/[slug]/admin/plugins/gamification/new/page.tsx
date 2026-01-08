/**
 * New Campaign Page
 * 
 * ⚡ Server Component with client form
 */

import { db } from '@/lib/db';
import { stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isPluginActive } from '@/lib/plugins/loader';
import { CampaignForm } from '../campaign-form';
import { Target, Ticket } from 'lucide-react';

interface NewCampaignPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: 'wheel' | 'scratch' }>;
}

export default async function NewCampaignPage({ params, searchParams }: NewCampaignPageProps) {
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

  // Validate type and plugin access
  const wheelActive = await isPluginActive(store.id, 'wheel-of-fortune');
  const scratchActive = await isPluginActive(store.id, 'scratch-card');

  const campaignType = type || (wheelActive ? 'wheel' : 'scratch');

  if (campaignType === 'wheel' && !wheelActive) {
    redirect(`/shops/${slug}/admin/plugins`);
  }
  if (campaignType === 'scratch' && !scratchActive) {
    redirect(`/shops/${slug}/admin/plugins`);
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/shops/${slug}/admin/plugins/gamification?type=${campaignType}`}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${campaignType === 'wheel' ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'}`}>
              {campaignType === 'wheel' ? <Target className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
            </div>
            {campaignType === 'wheel' ? 'גלגל מזל חדש' : 'כרטיס גירוד חדש'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            הגדר את פרטי הקמפיין והפרסים
          </p>
        </div>
      </div>

      {/* Form */}
      <CampaignForm 
        storeId={store.id} 
        storeSlug={slug}
        type={campaignType}
        mode="create"
      />
    </div>
  );
}

