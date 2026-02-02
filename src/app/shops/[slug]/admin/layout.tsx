import { getStoreBySlug, getUnreadOrdersCount } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';
import { WelcomeModal } from '@/components/admin/welcome-modal';
import { SubscriptionBlockedBanner } from '@/components/admin/subscription-blocked-banner';
import { auth } from '@/lib/auth';
import { getNotifications, getUnreadCount } from '@/lib/actions/notifications';
import { getPluginMenuItems } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { storeMembers, storeSubscriptions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  
  if (!store) {
    return { title: 'חנות לא נמצאה' };
  }

  return {
    title: `ניהול | ${store.name}`,
  };
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { slug } = await params;
  
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/shops/${slug}/admin`);
  }

  const store = await getStoreBySlug(slug);
  
  if (!store) {
    notFound();
  }

  // Verify user has access to this store (owner, platform admin, or team member)
  const isOwner = store.ownerId === session.user.id;
  const isPlatformAdmin = session.user.role === 'admin';
  
  let isTeamMember = false;
  if (!isOwner && !isPlatformAdmin) {
    // Check if user is a team member of this store
    const [membership] = await db
      .select()
      .from(storeMembers)
      .where(and(
        eq(storeMembers.storeId, store.id),
        eq(storeMembers.userId, session.user.id)
      ))
      .limit(1);
    
    isTeamMember = !!membership;
  }
  
  if (!isOwner && !isPlatformAdmin && !isTeamMember) {
    redirect('/dashboard');
  }

  // Get unread orders count for badge
  const unreadOrdersCount = await getUnreadOrdersCount(store.id);

  // Fetch notifications, plugin menu items and subscription (parallel for speed)
  const [notifications, unreadNotificationsCount, pluginMenuItems, subscription] = await Promise.all([
    getNotifications(store.id, 10),
    getUnreadCount(store.id),
    getPluginMenuItems(store.id),
    db.query.storeSubscriptions.findFirst({
      where: eq(storeSubscriptions.storeId, store.id),
    }),
  ]);
  
  // 📊 Calculate subscription status
  const now = new Date();
  let subscriptionStatus: 'trial' | 'active' | 'expired' | 'past_due' | null = null;
  let trialDaysRemaining = 0;
  let isBlocked = false;
  let blockReason: string | null = null;
  
  if (subscription) {
    subscriptionStatus = subscription.status as 'trial' | 'active' | 'expired' | 'past_due';
    
    // Calculate trial days remaining
    if (subscription.status === 'trial' && subscription.trialEndsAt) {
      const trialEnd = new Date(subscription.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      // If trial ended, mark as expired
      if (trialDaysRemaining === 0 && diffTime < 0) {
        subscriptionStatus = 'expired';
        isBlocked = true;
        blockReason = 'תקופת הנסיון הסתיימה';
      }
    }
    
    // Check for expired or past_due status
    if (subscription.status === 'expired') {
      isBlocked = true;
      blockReason = 'המנוי פג תוקף';
    } else if (subscription.status === 'past_due') {
      isBlocked = true;
      blockReason = 'יש בעיה בתשלום';
    } else if (subscription.status === 'cancelled') {
      // Check if period ended
      if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < now) {
        isBlocked = true;
        blockReason = 'המנוי בוטל';
      }
    }
  } else {
    // No subscription record - treat as new trial (7 days from creation)
    const storeCreated = new Date(store.createdAt);
    const trialEnd = new Date(storeCreated.getTime() + 7 * 24 * 60 * 60 * 1000);
    const diffTime = trialEnd.getTime() - now.getTime();
    trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    subscriptionStatus = 'trial';
    
    if (trialDaysRemaining === 0 && diffTime < 0) {
      isBlocked = true;
      blockReason = 'תקופת הנסיון הסתיימה';
    }
  }
  
  // Platform admins are never blocked
  if (isPlatformAdmin) {
    isBlocked = false;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden" dir="rtl">
      {/* Welcome Modal for new stores */}
      <WelcomeModal storeName={store.name} storeSlug={slug} />
      
      {/* Header */}
      <AdminHeader 
        storeName={store.name} 
        storeSlug={slug}
        storeId={store.id}
        customDomain={store.customDomain || undefined}
        user={{
          name: session.user.name || '',
          email: session.user.email || '',
          image: session.user.image || undefined,
        }}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        subscriptionStatus={subscriptionStatus}
        trialDaysRemaining={trialDaysRemaining}
      />
      
      <div className="flex overflow-x-hidden">
        {/* Sidebar - Hidden on mobile */}
        <AdminSidebar 
          storeSlug={slug} 
          unreadOrdersCount={unreadOrdersCount}
          pluginMenuItems={pluginMenuItems}
        />
        
        {/* Main Content - Full width on mobile */}
        <main className="flex-1 md:mr-64 mt-14 transition-all duration-300 min-w-0">
          <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
            {/* 🚫 Subscription Blocked Banner - shows above content when blocked */}
            {isBlocked && (
              <SubscriptionBlockedBanner 
                storeSlug={slug}
                reason={blockReason || 'המנוי אינו פעיל'}
                isPlatformAdmin={isPlatformAdmin}
              />
            )}
            
            {/* Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
