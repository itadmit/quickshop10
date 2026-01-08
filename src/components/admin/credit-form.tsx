'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreditFormProps {
  customerId: string;
  storeId: string;
  currentBalance: number;
  storeSlug: string;
}

export function CreditForm({ customerId, storeId, currentBalance, storeSlug }: CreditFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('נא להזין סכום תקין');
      return;
    }

    if (type === 'debit' && numAmount > currentBalance) {
      setError('לא ניתן לחייב יותר מהיתרה הנוכחית');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/customer/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          storeId,
          type,
          amount: numAmount,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'שגיאה בעדכון הקרדיט');
        return;
      }

      setSuccess(true);
      setAmount('');
      setReason('');
      router.refresh();
    } catch {
      setError('שגיאה בעדכון הקרדיט');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">עדכון קרדיט</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('credit')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              type === 'credit'
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
          >
            + זיכוי
          </button>
          <button
            type="button"
            onClick={() => setType('debit')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              type === 'debit'
                ? 'bg-red-100 text-red-700 border-2 border-red-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
            }`}
          >
            − חיוב
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סכום
          </label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
              className="w-full pr-8 pl-4 py-2.5 border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-0"
              placeholder="0"
              required
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סיבה (אופציונלי)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-0"
            placeholder="פיצוי על איחור במשלוח..."
          />
        </div>

        {/* Preview */}
        {amount && !isNaN(parseFloat(amount)) && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>יתרה נוכחית:</span>
              <span>₪{currentBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{type === 'credit' ? 'זיכוי:' : 'חיוב:'}</span>
              <span className={type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                {type === 'credit' ? '+' : '-'}₪{parseFloat(amount).toFixed(2)}
              </span>
            </div>
            <hr className="my-2 border-gray-200" />
            <div className="flex justify-between font-medium text-gray-900">
              <span>יתרה חדשה:</span>
              <span>
                ₪{(
                  type === 'credit'
                    ? currentBalance + parseFloat(amount)
                    : currentBalance - parseFloat(amount)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
            הקרדיט עודכן בהצלחה ✓
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !amount}
          className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isLoading ? 'מעדכן...' : type === 'credit' ? 'זכה את הלקוח' : 'חייב את הלקוח'}
        </button>
      </form>
    </div>
  );
}


