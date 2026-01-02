import Link from 'next/link';

interface InfluencerSidebarProps {
  storeSlug: string;
  currentPath?: string;
}

const navItems = [
  { 
    href: '', 
    label: 'דשבורד', 
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    href: '/coupons', 
    label: 'הקופונים שלי', 
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    )
  },
  { 
    href: '/sales', 
    label: 'מכירות', 
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    href: '/commissions', 
    label: 'עמלות', 
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    href: '/refunds', 
    label: 'החזרים', 
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    )
  },
];

export function InfluencerSidebar({ storeSlug, currentPath = '' }: InfluencerSidebarProps) {
  const basePath = `/shops/${storeSlug}/influencer`;
  
  // Normalize current path for comparison
  const normalizedPath = currentPath.replace(basePath, '').replace(/\/$/, '') || '';
  
  const isActive = (itemHref: string) => {
    if (itemHref === '' && normalizedPath === '') return true;
    if (itemHref !== '' && normalizedPath.startsWith(itemHref)) return true;
    return false;
  };

  return (
    <aside className="fixed top-14 right-0 w-56 h-[calc(100vh-56px)] bg-white border-l border-gray-200 overflow-y-auto">
      {/* Nav Items */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`${basePath}${item.href}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                active 
                  ? 'bg-purple-50 text-purple-700' 
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <span className={`transition-colors ${
                active ? 'text-purple-500' : 'text-gray-400 group-hover:text-purple-500'
              }`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 border-t border-gray-100" />

      {/* Settings */}
      <nav className="p-4">
        <Link
          href={`${basePath}/settings`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
            normalizedPath.startsWith('/settings')
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className={`transition-colors ${
            normalizedPath.startsWith('/settings') ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-600'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <span className="text-sm font-medium">הגדרות</span>
        </Link>
      </nav>
    </aside>
  );
}

