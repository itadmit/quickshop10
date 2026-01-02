'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { disableGiftCard, enableGiftCard, deleteGiftCard } from './actions';

interface GiftCardButtonsProps {
  cardId: string;
  slug: string;
  status: string;
  code: string;
}

export function GiftCardButtons({ cardId, slug, status, code }: GiftCardButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisable = () => {
    if (!confirm('האם אתה בטוח שברצונך להשבית את הגיפט קארד?')) return;
    
    startTransition(async () => {
      const result = await disableGiftCard(cardId, slug);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
    setShowMenu(false);
  };

  const handleEnable = () => {
    startTransition(async () => {
      const result = await enableGiftCard(cardId, slug);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הגיפט קארד? פעולה זו לא ניתנת לביטול.')) return;
    
    startTransition(async () => {
      const result = await deleteGiftCard(cardId, slug);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyCode}
          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded hover:bg-gray-50"
          title="העתק קוד"
        >
          {copied ? '✓' : 'העתק'}
        </button>
        
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isPending}
          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5"/>
            <circle cx="8" cy="8" r="1.5"/>
            <circle cx="8" cy="13" r="1.5"/>
          </svg>
        </button>
      </div>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
            {status === 'active' ? (
              <button
                onClick={handleDisable}
                disabled={isPending}
                className="w-full px-4 py-2 text-sm text-right text-amber-600 hover:bg-amber-50 disabled:opacity-50"
              >
                השבת
              </button>
            ) : status === 'cancelled' ? (
              <button
                onClick={handleEnable}
                disabled={isPending}
                className="w-full px-4 py-2 text-sm text-right text-green-600 hover:bg-green-50 disabled:opacity-50"
              >
                הפעל
              </button>
            ) : null}
            
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="w-full px-4 py-2 text-sm text-right text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              מחק
            </button>
          </div>
        </>
      )}
    </div>
  );
}

