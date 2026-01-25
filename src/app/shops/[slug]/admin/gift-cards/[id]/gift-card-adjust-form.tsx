'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Plus, Minus, Loader2 } from 'lucide-react';

interface GiftCardAdjustFormProps {
  giftCardId: string;
  storeSlug: string;
  currentBalance: number;
}

export function GiftCardAdjustForm({ giftCardId, storeSlug, currentBalance }: GiftCardAdjustFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const adjustAmount = Number(amount);
    if (!adjustAmount || adjustAmount <= 0) {
      setMessage({ type: 'error', text: 'נא להזין סכום תקין' });
      return;
    }

    if (adjustType === 'subtract' && adjustAmount > currentBalance) {
      setMessage({ type: 'error', text: 'לא ניתן להחסיר יותר מהיתרה הנוכחית' });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/shops/${storeSlug}/gift-cards/${giftCardId}/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: adjustType === 'add' ? adjustAmount : -adjustAmount,
            note: note || (adjustType === 'add' ? 'טעינה ידנית' : 'הפחתה ידנית'),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'שגיאה בעדכון היתרה');
        }

        setMessage({ type: 'success', text: 'היתרה עודכנה בהצלחה' });
        setAmount('');
        setNote('');
        router.refresh();
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Settings className="w-4 h-4 text-gray-400" />
        התאמת יתרה
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAdjustType('add')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              adjustType === 'add'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            הוסף
          </button>
          <button
            type="button"
            onClick={() => setAdjustType('subtract')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              adjustType === 'subtract'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Minus className="w-4 h-4" />
            הפחת
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">סכום</label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pr-8 pl-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">הערה (אופציונלי)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            placeholder={adjustType === 'add' ? 'סיבת הטעינה' : 'סיבת ההפחתה'}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !amount}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Settings className="w-4 h-4" />
          )}
          עדכן יתרה
        </button>
      </form>
    </div>
  );
}





