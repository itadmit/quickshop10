'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { processReturnRequest, updateReturnStatus, addInternalNote } from '../actions';

interface ReturnRequestActionsProps {
  storeSlug: string;
  request: {
    id: string;
    orderId: string;
    status: string;
    type: string;
    requestedResolution: string;
    totalValue: string;
    customerId: string | null;
    internalNotes: string | null;
  };
  canProcess: boolean;
  canComplete: boolean;
}

const resolutionOptions = [
  { value: 'exchange', label: 'החלפה למוצר אחר', description: 'יצירת הזמנה חדשה' },
  { value: 'store_credit', label: 'קרדיט לחנות', description: 'הוספת קרדיט לחשבון הלקוח' },
  { value: 'refund', label: 'זיכוי כספי', description: 'החזר לכרטיס האשראי' },
] as const;

export function ReturnRequestActions({ storeSlug, request, canProcess, canComplete }: ReturnRequestActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [resolution, setResolution] = useState<string>(request.requestedResolution);
  const [amount, setAmount] = useState(request.totalValue);
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleApprove = () => {
    if (!resolution) {
      setError('יש לבחור סוג פתרון');
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await processReturnRequest({
        storeSlug,
        requestId: request.id,
        action: 'approve',
        resolution: resolution as 'exchange' | 'store_credit' | 'refund',
        amount: Number(amount),
        customerNotes,
      });

      if (result.success) {
        setSuccess('הבקשה אושרה בהצלחה');
        router.refresh();
      } else {
        setError(result.error || 'אירעה שגיאה');
      }
    });
  };

  const handleReject = () => {
    if (!customerNotes.trim()) {
      setError('יש להזין סיבת דחייה');
      return;
    }

    setError('');
    startTransition(async () => {
      const result = await processReturnRequest({
        storeSlug,
        requestId: request.id,
        action: 'reject',
        customerNotes,
      });

      if (result.success) {
        setSuccess('הבקשה נדחתה');
        router.refresh();
      } else {
        setError(result.error || 'אירעה שגיאה');
      }
    });
  };

  const handleComplete = () => {
    setError('');
    startTransition(async () => {
      const result = await updateReturnStatus({
        storeSlug,
        requestId: request.id,
        status: 'completed',
      });

      if (result.success) {
        setSuccess('הבקשה הושלמה');
        router.refresh();
      } else {
        setError(result.error || 'אירעה שגיאה');
      }
    });
  };

  const handleItemReceived = () => {
    setError('');
    startTransition(async () => {
      const result = await updateReturnStatus({
        storeSlug,
        requestId: request.id,
        status: 'item_received',
      });

      if (result.success) {
        setSuccess('סטטוס עודכן');
        router.refresh();
      } else {
        setError(result.error || 'אירעה שגיאה');
      }
    });
  };

  const handleAddNote = () => {
    if (!internalNote.trim()) return;

    startTransition(async () => {
      const result = await addInternalNote({
        storeSlug,
        requestId: request.id,
        note: internalNote,
      });

      if (result.success) {
        setInternalNote('');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Actions Card */}
      {canProcess && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-medium mb-4">טיפול בבקשה</h2>

          {/* Resolution Selection */}
          <div className="space-y-3 mb-4">
            <label className="text-sm text-gray-500">בחר פתרון:</label>
            {resolutionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setResolution(option.value)}
                className={`w-full p-3 border rounded-lg text-right transition-colors cursor-pointer ${
                  resolution === option.value 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                    resolution === option.value ? 'border-black' : 'border-gray-300'
                  }`}>
                    {resolution === option.value && (
                      <div className="w-2 h-2 bg-black rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Amount (for credit/refund) */}
          {(resolution === 'store_credit' || resolution === 'refund') && (
            <div className="mb-4">
              <label className="block text-sm text-gray-500 mb-1">סכום</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">₪</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          )}

          {/* Customer Notes */}
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-1">הודעה ללקוח</label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="הודעה שתישלח ללקוח..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gray-400"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 transition-colors cursor-pointer"
            >
              {isPending ? 'מעבד...' : 'אשר בקשה'}
            </button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="w-full py-2.5 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              דחה בקשה
            </button>
          </div>
        </div>
      )}

      {/* Complete Actions */}
      {canComplete && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-medium mb-4">עדכון סטטוס</h2>

          {request.status === 'approved' && (
            <p className="text-sm text-gray-500 mb-4">
              ממתין שהלקוח ישלח את המוצר בחזרה
            </p>
          )}

          {request.status === 'awaiting_shipment' && (
            <button
              onClick={handleItemReceived}
              disabled={isPending}
              className="w-full py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer mb-2"
            >
              המוצר התקבל
            </button>
          )}

          {(request.status === 'item_received' || request.status === 'approved') && (
            <button
              onClick={handleComplete}
              disabled={isPending}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              סיים טיפול
            </button>
          )}
        </div>
      )}

      {/* Internal Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-medium mb-4">הערות פנימיות</h2>
        
        {request.internalNotes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            {request.internalNotes}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="הוסף הערה..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
          />
          <button
            onClick={handleAddNote}
            disabled={isPending || !internalNote.trim()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
          >
            הוסף
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-medium mb-4">קישורים מהירים</h2>
        <div className="space-y-2">
          <a
            href={`/shops/${storeSlug}/admin/orders/${request.orderId}`}
            className="block text-sm text-blue-600 hover:underline"
          >
            צפה בהזמנה המקורית →
          </a>
          {request.customerId && (
            <a
              href={`/shops/${storeSlug}/admin/contacts?type=customer`}
              className="block text-sm text-blue-600 hover:underline"
            >
              צפה בפרופיל הלקוח →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


