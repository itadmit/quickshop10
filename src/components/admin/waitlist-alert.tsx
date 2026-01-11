'use client';

import { useState } from 'react';
import { Bell, Send, X } from 'lucide-react';
import { sendNotificationsForProduct } from '../waitlist/actions';

interface WaitlistAlertProps {
  storeId: string;
  storeSlug: string;
  productId: string;
  variantId?: string;
  count: number;
}

export function WaitlistAlert({ storeId, storeSlug, productId, variantId, count }: WaitlistAlertProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendNotifications = async () => {
    if (!confirm(`האם לשלוח התראות ל-${count} לקוחות שמחכים למוצר זה?`)) {
      return;
    }

    setIsSending(true);
    try {
      const response = await sendNotificationsForProduct(
        storeId,
        productId,
        variantId || null,
        storeSlug
      );
      
      setResult({
        success: response.success || false,
        message: response.success ? response.message || 'נשלח בהצלחה' : response.error || 'שגיאה בשליחה',
      });

      if (response.success) {
        setTimeout(() => setIsOpen(false), 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'אירעה שגיאה בשליחת ההודעות',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 rounded-full p-2">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">רשימת המתנה</h3>
            <p className="text-sm text-gray-600">
              {count} לקוחות מחכים למוצר זה
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {result ? (
        <div className={`p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="text-sm font-medium">{result.message}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            המלאי חזר! האם לשלוח התראה לכל הלקוחות ברשימת ההמתנה?
          </p>
          <button
            onClick={handleSendNotifications}
            disabled={isSending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>שולח...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>שלח התראות ({count})</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

