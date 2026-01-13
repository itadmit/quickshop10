'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { markAsRead, markAllAsRead, type NotificationItem } from '@/lib/actions/notifications';

interface NotificationsDropdownProps {
  storeId: string;
  storeSlug: string;
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

// Format relative time in Hebrew
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דק׳`;
  if (diffHours < 24) return `לפני ${diffHours} שע׳`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  
  return new Date(date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
}

// Get icon for notification type
function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'new_order':
      return (
        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </div>
      );
    case 'low_stock':
    case 'out_of_stock':
      return (
        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
      );
    case 'new_customer':
      return (
        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      );
    case 'order_cancelled':
      return (
        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
      );
    case 'system':
    default:
      return (
        <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
      );
  }
}

export function NotificationsDropdown({ 
  storeId, 
  storeSlug, 
  initialNotifications, 
  initialUnreadCount 
}: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click - mark as read
  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Fire and forget - don't await
      startTransition(() => {
        markAsRead(notification.id);
      });
    }
    setIsOpen(false);
  };

  // Mark all as read
  const handleMarkAllRead = () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    
    // Fire and forget
    startTransition(() => {
      markAllAsRead(storeId);
    });
  };

  // Get resource link
  const getResourceLink = (notification: NotificationItem): string => {
    if (!notification.resourceId || !notification.resourceType) {
      return `/shops/${storeSlug}/admin`;
    }
    
    switch (notification.resourceType) {
      case 'order':
        return `/shops/${storeSlug}/admin/orders/${notification.resourceId}`;
      case 'product':
        return `/shops/${storeSlug}/admin/products/${notification.resourceId}`;
      case 'customer':
        return `/shops/${storeSlug}/admin/contacts?type=customer`;
      default:
        return `/shops/${storeSlug}/admin`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        aria-label="התראות"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">התראות</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium cursor-pointer disabled:opacity-50"
              >
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                <p>אין התראות חדשות</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={getResourceLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !notification.isRead ? 'bg-violet-50/50' : ''
                  }`}
                >
                  <NotificationIcon type={notification.type} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0" />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <Link 
                href={`/shops/${storeSlug}/admin/notifications`}
                onClick={() => setIsOpen(false)}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
              >
                הצג את כל ההתראות
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

