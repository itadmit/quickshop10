'use client';

/**
 * Review List Actions - Client Component
 * 
 * Quick approve/delete buttons for the reviews list
 */

import { useState, useTransition } from 'react';
import { CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { updateReview, deleteReview } from './actions';

interface Props {
  reviewId: string;
  storeId: string;
  storeSlug: string;
  isApproved: boolean;
}

export function ReviewsListActions({ reviewId, storeId, storeSlug, isApproved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleApprove = () => {
    startTransition(async () => {
      await updateReview(reviewId, storeId, storeSlug, { isApproved: true });
    });
  };

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    startTransition(async () => {
      await deleteReview(reviewId, storeId, storeSlug);
      setShowConfirm(false);
    });
  };

  if (isPending) {
    return (
      <div className="p-2">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {!isApproved && (
        <button
          onClick={handleApprove}
          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
          title="אשר"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
      )}
      
      {showConfirm ? (
        <div className="flex items-center gap-1 bg-red-50 rounded px-2 py-1">
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            אשר מחיקה
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ביטול
          </button>
        </div>
      ) : (
        <button
          onClick={handleDelete}
          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
          title="מחק"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}









