import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Store, Users, CreditCard, Settings, LogOut, ChevronDown, BookOpen } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 h-screen w-64 bg-white border-l border-gray-200 flex flex-col z-50 shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold">Q</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">QuickShop</span>
              <span className="mr-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded">
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem href="/admin" icon={LayoutDashboard} label="סקירה" />
          <NavItem href="/admin/stores" icon={Store} label="חנויות" />
          <NavItem href="/admin/users" icon={Users} label="משתמשים" />
          <NavItem href="/admin/billing" icon={CreditCard} label="חיובים" />
          <NavItem href="/admin/guides" icon={BookOpen} label="מדריכים" />
          <NavItem href="/admin/settings" icon={Settings} label="הגדרות" />
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-medium text-sm">
                {session.user.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session.user.name || 'Platform Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <Link
            href="/logout"
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            התנתק
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mr-64 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors group"
    >
      <Icon className="w-5 h-5 group-hover:text-emerald-600" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
