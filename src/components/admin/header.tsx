'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { logout } from '@/lib/actions/auth';
import { NotificationsDropdown } from './notifications-dropdown';
import type { NotificationItem } from '@/lib/actions/notifications';

// ============================================
// AdminHeader - Untitled UI Style
// Client Component (מינימום JS לתפריטים)
// ============================================

interface AdminHeaderProps {
  storeName: string;
  storeSlug: string;
  storeId: string;
  user?: {
    name: string;
    email: string;
    image?: string;
  };
  notifications?: NotificationItem[];
  unreadCount?: number;
}

export function AdminHeader({ storeName, storeSlug, storeId, user, notifications = [], unreadCount = 0 }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0].toUpperCase();
  };

  const handleMobileMenuToggle = () => {
    window.dispatchEvent(new Event('toggle-mobile-menu'));
  };

  return (
    <header className="fixed top-0 right-0 left-0 h-14 bg-white border-b border-gray-200 z-50">
      <div className="h-full px-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={handleMobileMenuToggle}
          className="md:hidden p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Logo + Store */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 sm:min-w-[200px]">
          <Link 
            href={`/shops/${storeSlug}/admin`}
            className="flex items-center gap-2"
          >
            {/* Logo */}
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 truncate hidden sm:block">{storeName}</span>
          </Link>
        </div>

        {/* Search Bar - Center (hidden on mobile) */}
        <div className="hidden sm:flex flex-1 max-w-md mx-auto">
          <div className={`relative transition-all w-full ${searchFocused ? 'ring-2 ring-gray-900/5' : ''} rounded-lg`}>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="חיפוש..."
              className="w-full bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 rounded-lg py-2 pr-10 pl-16 outline-none border border-gray-200 focus:border-gray-300 focus:bg-white transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <kbd className="text-[10px] font-medium text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">⌘</kbd>
              <kbd className="text-[10px] font-medium text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">K</kbd>
            </div>
          </div>
        </div>
        
        {/* Mobile Search Button */}
        <button className="sm:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 sm:min-w-[200px] justify-end">
          {/* View Store */}
          <Link 
            href={`/shops/${storeSlug}`}
            target="_blank"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="צפה בחנות"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </Link>
          
          {/* Notifications */}
          <NotificationsDropdown
            storeId={storeId}
            storeSlug={storeSlug}
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1" />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              {user?.image ? (
                <img 
                  src={user.image} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {getInitials(user?.name || '')}
                </div>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {user?.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {getInitials(user?.name || '')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <DropdownLink
                    href={`/shops/${storeSlug}/admin/settings`}
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                      </svg>
                    }
                    onClick={() => setUserMenuOpen(false)}
                  >
                    הגדרות חנות
                  </DropdownLink>
                  <DropdownLink
                    href={`/shops/${storeSlug}/admin/settings/team`}
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                    }
                    onClick={() => setUserMenuOpen(false)}
                  >
                    הזמנת משתמשים
                  </DropdownLink>
                  <DropdownLink
                    href="/dashboard"
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                      </svg>
                    }
                    onClick={() => setUserMenuOpen(false)}
                  >
                    כל החנויות
                  </DropdownLink>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    התנתק
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Dropdown Link Component
function DropdownLink({ 
  href, 
  icon, 
  children, 
  onClick 
}: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <span className="text-gray-400">{icon}</span>
      {children}
    </Link>
  );
}
