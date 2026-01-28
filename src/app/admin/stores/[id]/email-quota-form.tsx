'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Plus, Gift, RefreshCw, Sparkles, Trash2 } from 'lucide-react';

interface Props {
  storeId: string;
  emailSubscription: {
    id: string;
    packageSlug: string;
    status: string;
    emailsUsedThisPeriod: number;
    emailsLimit: number;
    currentPeriodEnd: Date | null;
  } | null;
}

const PACKAGES = [
  { slug: 'starter', name: 'Starter', emails: 500 },
  { slug: 'basic', name: 'Basic', emails: 1000 },
  { slug: 'growth', name: 'Growth', emails: 5000 },
  { slug: 'pro', name: 'Pro', emails: 10000 },
  { slug: 'scale', name: 'Scale', emails: 25000 },
];

export function EmailQuotaForm({ storeId, emailSubscription }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adjustAmount, setAdjustAmount] = useState(100);
  const [action, setAction] = useState<'add' | 'set' | 'reset' | 'activate' | 'delete'>('add');
  const [selectedPackage, setSelectedPackage] = useState('growth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Confirm before delete
    if (action === 'delete') {
      if (!confirm('האם אתה בטוח שברצונך למחוק את החבילה? הלקוח יצטרך לרכוש מחדש.')) {
        return;
      }
    }
    
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/stores/${storeId}/email-quota`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action, 
            amount: adjustAmount,
            packageSlug: action === 'activate' ? selectedPackage : undefined,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          alert(data.message);
          router.refresh();
        } else {
          alert(data.error || 'שגיאה בעדכון המכסה');
        }
      } catch (error) {
        console.error('Error updating quota:', error);
        alert('שגיאה בעדכון המכסה');
      }
    });
  };

  const getPackageName = (slug: string | null) => {
    if (!slug) return 'אין';
    const names: Record<string, string> = {
      starter: 'Starter',
      basic: 'Basic',
      growth: 'Growth',
      pro: 'Pro',
      scale: 'Scale',
    };
    return names[slug] || slug;
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2">
        <Mail className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-900">ניהול מכסת דיוור</h3>
      </div>

      {emailSubscription ? (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Current Status */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">חבילה נוכחית</span>
              <span className="font-semibold text-indigo-700">{getPackageName(emailSubscription.packageSlug)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">מכסה חודשית</span>
              <span className="font-semibold text-gray-900">{emailSubscription.emailsLimit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">נשלחו החודש</span>
              <span className="font-semibold text-gray-900">{emailSubscription.emailsUsedThisPeriod.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">נותרו</span>
              <span className={`font-semibold ${
                emailSubscription.emailsLimit - emailSubscription.emailsUsedThisPeriod <= 0 
                  ? 'text-red-600' 
                  : 'text-emerald-600'
              }`}>
                {(emailSubscription.emailsLimit - emailSubscription.emailsUsedThisPeriod).toLocaleString()}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (emailSubscription.emailsUsedThisPeriod / emailSubscription.emailsLimit * 100) >= 90 ? 'bg-red-500' :
                  (emailSubscription.emailsUsedThisPeriod / emailSubscription.emailsLimit * 100) >= 75 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, emailSubscription.emailsUsedThisPeriod / emailSubscription.emailsLimit * 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-left">
              {Math.round(emailSubscription.emailsUsedThisPeriod / emailSubscription.emailsLimit * 100)}% נוצל
            </div>
          </div>

          {/* Adjust Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">פעולה</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('add')}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                    action === 'add' 
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' 
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  הוסף מיילים
                </button>
                <button
                  type="button"
                  onClick={() => setAction('set')}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                    action === 'set' 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' 
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  <Gift className="w-3 h-3" />
                  הגדר מכסה
                </button>
                <button
                  type="button"
                  onClick={() => setAction('reset')}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                    action === 'reset' 
                      ? 'bg-amber-100 text-amber-700 border-2 border-amber-500' 
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  אפס שימוש
                </button>
                <button
                  type="button"
                  onClick={() => setAction('activate')}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                    action === 'activate' 
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' 
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  החלף חבילה
                </button>
                <button
                  type="button"
                  onClick={() => setAction('delete')}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 col-span-2 ${
                    action === 'delete' 
                      ? 'bg-red-100 text-red-700 border-2 border-red-500' 
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                  מחק חבילה (לבדיקות)
                </button>
              </div>
            </div>

            {action === 'activate' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">בחר חבילה</label>
                <select
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PACKAGES.map(pkg => (
                    <option key={pkg.slug} value={pkg.slug}>
                      {pkg.name} ({pkg.emails.toLocaleString()} מיילים)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(action === 'add' || action === 'set') && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {action === 'add' ? 'כמות להוספה' : 'מכסה חדשה'}
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <p className={`text-xs ${action === 'delete' ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              {action === 'add' && `יוסיפו ${adjustAmount} מיילים למכסה הנוכחית`}
              {action === 'set' && `המכסה תוגדר ל-${adjustAmount} מיילים`}
              {action === 'reset' && 'השימוש החודשי יתאפס ל-0'}
              {action === 'activate' && `החבילה תוחלף והמכסה תתאפס`}
              {action === 'delete' && '⚠️ החבילה תימחק לחלוטין - הלקוח יצטרך לרכוש מחדש'}
            </p>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isPending ? 'מעדכן...' : 'עדכן'}
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-center mb-4">
            <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">הפעל חבילת דיוור ללא תשלום (מתנה)</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">בחר חבילה</label>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PACKAGES.map(pkg => (
                <option key={pkg.slug} value={pkg.slug}>
                  {pkg.name} ({pkg.emails.toLocaleString()} מיילים)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            onClick={() => setAction('activate')}
            className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isPending ? 'מפעיל...' : 'הפעל חבילה (מתנה)'}
          </button>
        </form>
      )}
    </div>
  );
}

