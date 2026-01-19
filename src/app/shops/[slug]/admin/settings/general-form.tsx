'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateStoreSettings } from './actions';
import { MediaUploader } from '@/components/admin/media-uploader';
import { Globe, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Clock, Package, RotateCcw, EyeOff, Lock } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  currency: string;
  timezone: string | null;
  isPublished: boolean;
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
    isPublished: store.isPublished,
    contactEmail: (settings.contactEmail as string) || '',
    contactPhone: (settings.contactPhone as string) || '',
    address: (settings.address as string) || '',
    facebookUrl: (settings.facebookUrl as string) || '',
    instagramUrl: (settings.instagramUrl as string) || '',
    twitterUrl: (settings.twitterUrl as string) || '',
    abandonedCartMinutes: (settings.abandonedCartMinutes as number) || 60,
    lowStockThreshold: (settings.lowStockThreshold as number) || 5,
    returnPolicyDays: (settings.returnPolicyDays as number) || 14,
    showDecimalPrices: (settings.showDecimalPrices as boolean) ?? true,
    comingSoonPassword: (settings.comingSoonPassword as string) || '',
    comingSoonPasswordEnabled: (settings.comingSoonPasswordEnabled as boolean) || false,
    siteTagline: (settings.siteTagline as string) || '',
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store Status Banner - Full Width */}
      <div className={`rounded-xl p-4 ${formData.isPublished ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {formData.isPublished ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-amber-600" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">
                {formData.isPublished ? 'האתר פעיל ופתוח ללקוחות' : 'האתר במצב Coming Soon'}
              </p>
              <p className="text-sm text-gray-500">
                {formData.isPublished 
                  ? 'לקוחות יכולים לגלוש ולרכוש' 
                  : 'לקוחות יראו דף "בקרוב"'}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}
            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${
              formData.isPublished ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                formData.isPublished ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
        
        {!formData.isPublished && (
          <div className="mt-4 pt-4 border-t border-amber-200/50 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">הגנת סיסמה לצפייה</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, comingSoonPasswordEnabled: !prev.comingSoonPasswordEnabled }))}
                className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors cursor-pointer ${
                  formData.comingSoonPasswordEnabled ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                    formData.comingSoonPasswordEnabled ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
            </label>
            
            {formData.comingSoonPasswordEnabled && (
              <input
                type="text"
                value={formData.comingSoonPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, comingSoonPassword: e.target.value }))}
                placeholder="הכנס סיסמה..."
                className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg bg-white"
              />
            )}
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Store Identity */}
        <div className="space-y-6">
          {/* Store Identity */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900">זהות החנות</h2>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  שם החנות *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Logo & Favicon Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">לוגו</label>
                  {formData.logoUrl ? (
                    <div className="relative inline-block border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <img 
                        src={formData.logoUrl} 
                        alt="לוגו" 
                        className="max-h-14 max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <MediaUploader
                      value={[]}
                      onChange={(files) => setFormData(prev => ({ ...prev, logoUrl: files[0]?.url || '' }))}
                      maxFiles={1}
                      multiple={false}
                      folder={`quickshop/stores/${store.slug}`}
                      storeId={store.id}
                      storeSlug={store.slug}
                      aspectRatio="16:9"
                      compact={true}
                      placeholder="העלה לוגו"
                    />
                  )}
                </div>
                
                {/* Favicon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Favicon</label>
                  {formData.faviconUrl ? (
                    <div className="relative inline-block border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <img 
                        src={formData.faviconUrl} 
                        alt="Favicon" 
                        className="w-10 h-10 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, faviconUrl: '' }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <MediaUploader
                      value={[]}
                      onChange={(files) => setFormData(prev => ({ ...prev, faviconUrl: files[0]?.url || '' }))}
                      maxFiles={1}
                      multiple={false}
                      folder={`quickshop/stores/${store.slug}`}
                      storeId={store.id}
                      storeSlug={store.slug}
                      aspectRatio="1:1"
                      compact={true}
                      placeholder="העלה"
                    />
                  )}
                </div>
              </div>

              {/* Currency & Timezone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">מטבע</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-gray-400"
                  >
                    <option value="ILS">₪ שקל (ILS)</option>
                    <option value="USD">$ דולר (USD)</option>
                    <option value="EUR">€ אירו (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">אזור זמן</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-gray-400"
                  >
                    <option value="Asia/Jerusalem">ישראל</option>
                    <option value="Europe/London">לונדון</option>
                    <option value="America/New_York">ניו יורק</option>
                  </select>
                </div>
              </div>

              {/* Price Display Toggle */}
              <label className="flex items-center justify-between py-2 cursor-pointer border-t border-gray-100 pt-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">הצג מחירים עם אגורות</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formData.showDecimalPrices ? 'דוגמה: ₪99.90' : 'דוגמה: ₪100'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, showDecimalPrices: !prev.showDecimalPrices }))}
                  className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors cursor-pointer ${
                    formData.showDecimalPrices ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                      formData.showDecimalPrices ? 'left-5' : 'left-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </section>

          {/* Advanced Settings */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900">הגדרות מתקדמות</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                    עגלה נטושה
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max="1440"
                      value={formData.abandonedCartMinutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, abandonedCartMinutes: parseInt(e.target.value) || 60 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <span className="text-sm text-gray-500">דק׳</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Package className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                    מלאי נמוך
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <span className="text-sm text-gray-500">יח׳</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <RotateCcw className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                    ימים להחזרה
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.returnPolicyDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, returnPolicyDays: parseInt(e.target.value) || 14 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <span className="text-sm text-gray-500">ימים</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Contact & Social */}
        <div className="space-y-6">
          {/* Contact Info */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900">פרטי קשר</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Mail className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                  אימייל
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="hello@store.com"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                  טלפון
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="03-1234567"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline-block ml-1 opacity-50" />
                  כתובת
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="רחוב הרצל 15, תל אביב"
                />
              </div>
            </div>
          </section>

          {/* Social Media */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900">רשתות חברתיות</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Facebook className="w-3.5 h-3.5 inline-block ml-1 text-blue-600" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="https://facebook.com/..."
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Instagram className="w-3.5 h-3.5 inline-block ml-1 text-pink-600" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="https://instagram.com/..."
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Twitter className="w-3.5 h-3.5 inline-block ml-1" />
                  Twitter / X
                </label>
                <input
                  type="url"
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="https://x.com/..."
                  dir="ltr"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Submit - Full Width */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
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
