'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createGiftCard } from '../actions';

export default function NewGiftCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slug, setSlug] = useState<string>('');
  
  // Form state
  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryMonths, setExpiryMonths] = useState('12');

  // Get slug from params
  useState(() => {
    params.then(p => setSlug(p.slug));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || Number(amount) <= 0) {
      alert('יש להזין סכום תקין');
      return;
    }

    startTransition(async () => {
      const expiresAt = hasExpiry 
        ? new Date(Date.now() + Number(expiryMonths) * 30 * 24 * 60 * 60 * 1000)
        : undefined;

      const result = await createGiftCard(slug, {
        amount: Number(amount),
        recipientEmail: recipientEmail || undefined,
        recipientName: recipientName || undefined,
        senderName: senderName || undefined,
        message: message || undefined,
        expiresAt,
      });

      if (result.error) {
        alert(result.error);
      } else {
        router.push(`/shops/${slug}/admin/gift-cards`);
      }
    });
  };

  const predefinedAmounts = [50, 100, 200, 500];

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href={`/shops/${slug}/admin/gift-cards`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4l-6 6 6 6"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">גיפט קארד חדש</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">סכום</h2>
          
          <div className="flex gap-2 mb-4">
            {predefinedAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  amount === preset.toString()
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                ₪{preset}
              </button>
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              או הזן סכום מותאם
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-4 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="0"
                min="1"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Recipient Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">פרטי נמען (אופציונלי)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם הנמען
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="לדוגמה: דנה כהן"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימייל הנמען
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="dana@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם השולח
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                placeholder="לדוגמה: יוסי לוי"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              הודעה אישית
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="יום הולדת שמח! מקווה שתמצאי משהו יפה..."
              rows={3}
            />
          </div>
        </div>

        {/* Expiry */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">תוקף</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm text-gray-600">הגדר תאריך תפוגה</span>
            </label>
          </div>
          
          {hasExpiry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תוקף הכרטיס
              </label>
              <select
                value={expiryMonths}
                onChange={(e) => setExpiryMonths(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
              >
                <option value="3">3 חודשים</option>
                <option value="6">6 חודשים</option>
                <option value="12">שנה</option>
                <option value="24">שנתיים</option>
                <option value="36">3 שנים</option>
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending || !amount}
            className="flex-1 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isPending ? 'יוצר...' : 'צור גיפט קארד'}
          </button>
          <Link
            href={`/shops/${slug}/admin/gift-cards`}
            className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}


