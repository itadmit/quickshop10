'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Tag, ChevronDown, X } from 'lucide-react';
import { updateOrderCustomStatus } from '@/lib/actions/orders';

// ============================================
// Custom Status Selector
// For selecting store-specific workflow statuses
// ============================================

interface CustomStatus {
  id: string;
  name: string;
  color: string;
}

interface CustomStatusSelectorProps {
  orderId: string;
  storeSlug: string;
  customStatuses: CustomStatus[];
  currentStatusId: string | null;
}

export function CustomStatusSelector({
  orderId,
  storeSlug,
  customStatuses,
  currentStatusId,
}: CustomStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current status object
  const currentStatus = customStatuses.find(s => s.id === currentStatusId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStatus = (statusId: string | null) => {
    setIsOpen(false);
    startTransition(async () => {
      await updateOrderCustomStatus(orderId, storeSlug, statusId);
    });
  };

  // Don't render if no custom statuses defined
  if (customStatuses.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer
          ${currentStatus 
            ? 'border-gray-200 hover:border-gray-300 bg-white' 
            : 'border-dashed border-gray-300 hover:border-gray-400 bg-gray-50'
          }
          ${isPending ? 'opacity-50' : ''}
        `}
      >
        {currentStatus ? (
          <>
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: currentStatus.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {currentStatus.name}
            </span>
          </>
        ) : (
          <>
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">הוסף סטטוס</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50">
          {/* Clear option if status is set */}
          {currentStatus && (
            <>
              <button
                onClick={() => handleSelectStatus(null)}
                className="w-full px-3 py-2 text-right text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
                הסר סטטוס
              </button>
              <div className="border-t border-gray-100 my-1" />
            </>
          )}
          
          {/* Status options */}
          {customStatuses.map((status) => (
            <button
              key={status.id}
              onClick={() => handleSelectStatus(status.id)}
              className={`
                w-full px-3 py-2 text-right text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer
                ${status.id === currentStatusId ? 'bg-gray-50' : ''}
              `}
            >
              <span 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: status.color }}
              />
              <span className="flex-1">{status.name}</span>
              {status.id === currentStatusId && (
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Display-only badge for custom status
export function CustomStatusBadge({ 
  status, 
  size = 'default' 
}: { 
  status: CustomStatus | null; 
  size?: 'small' | 'default';
}) {
  if (!status) return null;

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 rounded-full text-white font-medium
        ${size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      `}
      style={{ backgroundColor: status.color }}
    >
      {status.name}
    </span>
  );
}

