import { getStoreBySlug, getUnreadOrdersCount } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';
import { WelcomeModal } from '@/components/admin/welcome-modal';
import { auth } from '@/lib/auth';
import { getNotifications, getUnreadCount } from '@/lib/actions/notifications';
import { getPluginMenuItems } from '@/lib/plugins/loader';
import { db } from '@/lib/db';
import { storeMembers } from '@/lib/db/schema';
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

  // Fetch notifications and plugin menu items for header (parallel for speed)
  const [notifications, unreadNotificationsCount, pluginMenuItems] = await Promise.all([
    getNotifications(store.id, 10),
    getUnreadCount(store.id),
    getPluginMenuItems(store.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
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
      />
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <AdminSidebar 
          storeSlug={slug} 
          unreadOrdersCount={unreadOrdersCount}
          pluginMenuItems={pluginMenuItems}
        />
        
        {/* Main Content - Full width on mobile */}
        <main className="flex-1 md:mr-64 mt-14 transition-all duration-300">
          <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
