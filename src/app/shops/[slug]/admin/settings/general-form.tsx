'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateStoreSettings } from './actions';

interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  currency: string;
  timezone: string | null;
}

interface GeneralSettingsFormProps {
  store: Store;
  settings: Record<string, unknown>;
}

export function GeneralSettingsForm({ store, settings }: GeneralSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: store.name,
    logoUrl: store.logoUrl || '',
    faviconUrl: store.faviconUrl || '',
    currency: store.currency,
    timezone: store.timezone || 'Asia/Jerusalem',
    contactEmail: (settings.contactEmail as string) || '',
    contactPhone: (settings.contactPhone as string) || '',
    address: (settings.address as string) || '',
    facebookUrl: (settings.facebookUrl as string) || '',
    instagramUrl: (settings.instagramUrl as string) || '',
    twitterUrl: (settings.twitterUrl as string) || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      const result = await updateStoreSettings(store.id, formData);
      if (result.success) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Store Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי החנות</h2>
        
        <div className="grid gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם החנות *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              לוגו (URL)
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="https://..."
              dir="ltr"
            />
            {formData.logoUrl && (
              <img
                src={formData.logoUrl}
                alt="לוגו"
                className="mt-2 h-16 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>

          {/* Favicon URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Favicon (URL)
            </label>
            <input
              type="url"
              value={formData.faviconUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, faviconUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="https://..."
              dir="ltr"
            />
          </div>

          {/* Currency & Timezone */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מטבע
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              >
                <option value="ILS">₪ שקל ישראלי (ILS)</option>
                <option value="USD">$ דולר אמריקאי (USD)</option>
                <option value="EUR">€ אירו (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אזור זמן
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              >
                <option value="Asia/Jerusalem">ישראל (Asia/Jerusalem)</option>
                <option value="Europe/London">לונדון (Europe/London)</option>
                <option value="America/New_York">ניו יורק (America/New_York)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי קשר</h2>
        
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימייל
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                placeholder="hello@store.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                placeholder="03-1234567"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כתובת
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors resize-none"
              placeholder="רחוב הרצל 15, תל אביב"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">רשתות חברתיות</h2>
        
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facebook
            </label>
            <input
              type="url"
              value={formData.facebookUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="https://facebook.com/..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram
            </label>
            <input
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="https://instagram.com/..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Twitter / X
            </label>
            <input
              type="url"
              value={formData.twitterUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
              placeholder="https://x.com/..."
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* URL Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">כתובות החנות</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <span className="text-gray-500">כתובת ראשית:</span>{' '}
            <code className="bg-gray-100 px-2 py-0.5 rounded">
              quickshop.co.il/shops/{store.slug}
            </code>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            לדומיין מותאם אישית, צור קשר עם התמיכה
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            נשמר בהצלחה
          </span>
        )}
      </div>
    </form>
  );
}

