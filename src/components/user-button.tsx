'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CustomerData {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
  emailVerified?: boolean;
}

interface UserButtonProps {
  basePath: string;
  initialCustomer?: CustomerData | null;
}

export function UserButton({ basePath, initialCustomer }: UserButtonProps) {
  // Use initial data from server - no API call needed!
  const [customer, setCustomer] = useState<CustomerData | null>(initialCustomer ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Listen for auth changes (login/logout events from other components)
  useEffect(() => {
    const handleAuthChange = (event: CustomEvent<CustomerData | null>) => {
      setCustomer(event.detail);
    };

    window.addEventListener('customer-auth-change', handleAuthChange as EventListener);
    return () => window.removeEventListener('customer-auth-change', handleAuthChange as EventListener);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/customer/auth/logout', { method: 'POST' });
      setCustomer(null);
      setIsOpen(false);
      // Notify other components of logout
      window.dispatchEvent(new CustomEvent('customer-auth-change', { detail: null }));
      router.refresh();
    } catch {
      // Ignore errors
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center transition-colors cursor-pointer"
        aria-label={customer ? 'פתח תפריט משתמש' : 'התחבר'}
      >
        {customer ? (
          // Logged in - show user avatar or initials
          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium">
            {customer.firstName ? customer.firstName[0].toUpperCase() : customer.email[0].toUpperCase()}
          </div>
        ) : (
          // Not logged in - show user icon
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
            className="text-gray-700"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {customer ? (
            <>
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {customer.firstName || 'שלום'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {customer.email}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  href={`${basePath}/account`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  האיזור האישי
                </Link>
                
                <Link
                  href={`${basePath}/account/orders`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  ההזמנות שלי
                </Link>

                {!customer.hasPassword && (
                  <Link
                    href={`${basePath}/account/security`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    הגדר סיסמה
                  </Link>
                )}
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  התנתק
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Login prompt */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm text-gray-600">
                  התחבר לחשבונך כדי לעקוב אחרי הזמנות וליהנות מהטבות
                </p>
              </div>

              <div className="py-2">
                <Link
                  href={`${basePath}/login`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  התחברות
                </Link>
                
                <Link
                  href={`${basePath}/register`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  הרשמה
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

