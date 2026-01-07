'use client';

import { useState, useTransition } from 'react';
import { Key, Loader2, Eye, EyeOff } from 'lucide-react';

interface OwnerPasswordFormProps {
  storeId: string;
  ownerId: string | null;
  ownerEmail: string | null;
}

export function OwnerPasswordForm({ storeId, ownerId, ownerEmail }: OwnerPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!ownerId) {
      setMessage({ type: 'error', text: 'לחנות זו אין בעלים' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'הסיסמה חייבת להכיל לפחות 8 תווים' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'הסיסמאות אינן תואמות' });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/stores/${storeId}/owner-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'שגיאה בעדכון הסיסמה');
        }

        setMessage({ type: 'success', text: 'הסיסמה עודכנה בהצלחה' });
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'שגיאה בעדכון הסיסמה';
        setMessage({ type: 'error', text: errorMessage });
      }
    });
  };

  if (!ownerId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-900">החלפת סיסמה</h3>
        </div>
        <p className="text-sm text-gray-500">לחנות זו אין בעלים משויך</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-gray-900">החלפת סיסמה</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        שינוי סיסמה עבור: <span className="font-medium text-gray-700">{ownerEmail}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 pl-10"
              placeholder="לפחות 8 תווים"
              required
              minLength={8}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            placeholder="הזן את הסיסמה שוב"
            required
            minLength={8}
            dir="ltr"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !newPassword || !confirmPassword}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              מעדכן...
            </>
          ) : (
            <>
              <Key className="w-4 h-4" />
              עדכן סיסמה
            </>
          )}
        </button>
      </form>
    </div>
  );
}

