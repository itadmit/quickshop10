import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stores, storeMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ClientRedirect } from './client-redirect';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Platform admin goes to admin dashboard
  if (session.user.email === 'admin@quickshop.co.il') {
    redirect('/admin');
  }

  // Get user's stores - both owned and as team member
  // First get stores where user is owner
  const ownedStores = await db
    .select()
    .from(stores)
    .where(eq(stores.ownerId, session.user.id));

  // Then get stores where user is a team member
  const memberStores = await db.query.storeMembers.findMany({
    where: eq(storeMembers.userId, session.user.id),
    with: {
      store: true,
    },
  });

  // Combine and deduplicate (in case user is both owner and member)
  const ownedStoreIds = new Set(ownedStores.map(s => s.id));
  const memberOnlyStores = memberStores
    .filter(m => m.store && !ownedStoreIds.has(m.store.id))
    .map(m => ({ ...m.store!, memberRole: m.role }));
  
  // Create unified list with role info
  const userStores = [
    ...ownedStores.map(s => ({ ...s, memberRole: 'owner' as const })),
    ...memberOnlyStores,
  ];

  // If user has exactly one store, show loading and redirect client-side
  if (userStores.length === 1) {
    const store = userStores[0];
    // Influencers go to influencer dashboard
    const targetUrl = store.memberRole === 'influencer' 
      ? `/shops/${store.slug}/influencer`
      : `/shops/${store.slug}/admin`;
    return <ClientRedirect to={targetUrl} />;
  }

  // If no stores, show create store prompt
  if (userStores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4" dir="rtl">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-logo text-gray-900 mb-4">Quick Shop</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">אין לך חנות עדיין</h2>
            <p className="text-gray-600 mb-6">
              צור את החנות הראשונה שלך ותתחיל למכור!
            </p>
            <Link
              href="/create-store"
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              צור חנות חדשה
            </Link>
            
            {/* Logout link */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">מחובר כ: {session.user.email}</p>
              <Link
                href="/logout"
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                התנתק והתחבר עם חשבון אחר
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple stores - show store selector
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-logo text-gray-900 mb-2">Quick Shop</h1>
          <p className="text-gray-600">בחר חנות לניהול</p>
        </div>

        <div className="space-y-4">
          {userStores.map((store) => {
            const roleLabels: Record<string, string> = {
              owner: 'בעלים',
              manager: 'מנהל',
              marketing: 'שיווק',
              developer: 'מפתח',
              influencer: 'משפיען',
            };
            const roleLabel = roleLabels[store.memberRole] || store.memberRole;
            
            // Influencers go to influencer dashboard
            const targetUrl = store.memberRole === 'influencer' 
              ? `/shops/${store.slug}/influencer`
              : `/shops/${store.slug}/admin`;
            
            return (
              <Link
                key={store.id}
                href={targetUrl}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  {store.logoUrl ? (
                    <img 
                      src={store.logoUrl} 
                      alt={store.name} 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-400">
                        {store.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{store.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {roleLabel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{store.slug}.quickshop.co.il</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    store.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {store.isActive ? 'פעילה' : 'לא פעילה'}
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/create-store"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            צור חנות נוספת
          </Link>
        </div>
      </div>
    </div>
  );
}

