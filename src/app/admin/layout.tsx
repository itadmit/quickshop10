import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SuperAdminSidebar } from '@/components/admin/super-admin-sidebar';
import { SuperAdminHeader } from '@/components/admin/super-admin-header';

// Platform admin emails - can add more here
const ADMIN_EMAILS = ['admin@quickshop.co.il'];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      {/* Header */}
      <SuperAdminHeader 
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
      />
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <SuperAdminSidebar />
        
        {/* Main Content - Full width on mobile */}
        <main className="flex-1 md:mr-64 mt-14 transition-all duration-300">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
