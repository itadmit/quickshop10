'use client';

/**
 * Review Edit Form - Client Component
 * 
 * Edit badges, approval status, featured status, and admin reply
 */

import { useState, useTransition } from 'react';
import { Loader2, CheckCircle, Star, Trash2, Send } from 'lucide-react';
import { updateReview, addAdminReply, deleteReview } from '../actions';
import { useRouter } from 'next/navigation';

const AVAILABLE_BADGES = [
  { id: 'editors-pick', name: 'בחירת העורך', icon: '👑', color: 'bg-purple-100 text-purple-700' },
  { id: 'top-reviewer', name: 'מבקר מוביל', icon: '🏆', color: 'bg-amber-100 text-amber-700' },
  { id: 'helpful', name: 'מועיל במיוחד', icon: '👍', color: 'bg-emerald-100 text-emerald-700' },
];

interface Props {
  review: {
    id: string;
    isApproved: boolean;
    isFeatured: boolean;
    badges: string[];
    adminReply: string;
  };
  storeId: string;
  storeSlug: string;
}

export function ReviewEditForm({ review, storeId, storeSlug }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [isApproved, setIsApproved] = useState(review.isApproved);
  const [isFeatured, setIsFeatured] = useState(review.isFeatured);
  const [badges, setBadges] = useState<string[]>(review.badges);
  const [adminReply, setAdminReply] = useState(review.adminReply);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleBadge = (badgeId: string) => {
    setBadges(prev => 
      prev.includes(badgeId)
        ? prev.filter(b => b !== badgeId)
        : [...prev, badgeId]
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateReview(review.id, storeId, storeSlug, {
        isApproved,
        isFeatured,
        badges,
      });
    });
  };

  const handleSendReply = () => {
    if (!adminReply.trim()) return;
    
    startTransition(async () => {
      await addAdminReply(review.id, storeId, storeSlug, '', adminReply);
    });
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    startTransition(async () => {
      await deleteReview(review.id, storeId, storeSlug);
      router.push(`/shops/${storeSlug}/admin/plugins/product-reviews`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Approval & Featured */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">סטטוס</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isApproved}
              onChange={(e) => setIsApproved(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>ביקורת מאושרת (תוצג באתר)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
            />
            <Star className="w-5 h-5 text-purple-500" />
            <span>ביקורת מומלצת (תודגש באתר)</span>
          </label>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">תגיות</h2>
        
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_BADGES.map(badge => (
            <button
              key={badge.id}
              type="button"
              onClick={() => handleToggleBadge(badge.id)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                badges.includes(badge.id)
                  ? badge.color
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="ml-1">{badge.icon}</span>
              {badge.name}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Reply */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-medium mb-4">תגובת מנהל</h2>
        
        <textarea
          value={adminReply}
          onChange={(e) => setAdminReply(e.target.value)}
          placeholder="כתוב תגובה ללקוח..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 resize-none"
        />
        
        <button
          onClick={handleSendReply}
          disabled={isPending || !adminReply.trim()}
          className="mt-3 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {review.adminReply ? 'עדכן תגובה' : 'שלח תגובה'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <span className="text-red-600 text-sm">האם למחוק את הביקורת?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'מוחק...' : 'כן, מחק'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800"
            >
              ביטול
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-600 hover:text-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            מחק ביקורת
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              שומר...
            </>
          ) : (
            'שמור שינויים'
          )}
        </button>
      </div>
    </div>
  );
}


