'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Copy, Check, Plus, Trash2, Gift, Link as LinkIcon, Settings, Image as ImageIcon } from 'lucide-react';
import { MediaUploader, UploadedMedia } from '@/components/admin/media-uploader';
import { updateGiftCardSettings } from './actions';
import { type GiftCardSettings, defaultGiftCardSettings } from './types';

interface GiftCardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeSlug: string;
  initialSettings: GiftCardSettings;
}

export function GiftCardSettingsModal({
  isOpen,
  onClose,
  storeId,
  storeSlug,
  initialSettings,
}: GiftCardSettingsModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  
  const [settings, setSettings] = useState<GiftCardSettings>({
    ...defaultGiftCardSettings,
    ...initialSettings,
  });

  const giftCardUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/shops/${storeSlug}/gift-card`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(giftCardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAmount = () => {
    const amount = parseInt(newAmount);
    if (amount > 0 && !settings.amounts.includes(amount)) {
      setSettings({
        ...settings,
        amounts: [...settings.amounts, amount].sort((a, b) => a - b),
      });
      setNewAmount('');
    }
  };

  const handleRemoveAmount = (amount: number) => {
    setSettings({
      ...settings,
      amounts: settings.amounts.filter(a => a !== amount),
    });
  };

  const handleImageUpload = (media: UploadedMedia[]) => {
    if (media.length > 0) {
      setSettings({
        ...settings,
        cardImage: media[0].url,
      });
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateGiftCardSettings(storeId, storeSlug, settings);
      if (result.success) {
        router.refresh();
        onClose();
      } else {
        alert(result.error || 'שגיאה בשמירה');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">הגדרות גיפט קארד</h2>
              <p className="text-sm text-gray-500">ניהול רכישת כרטיסי מתנה על ידי לקוחות</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">אפשר רכישת גיפט קארד</p>
                <p className="text-sm text-gray-500">לקוחות יוכלו לרכוש כרטיסי מתנה באתר</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  settings.enabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {settings.enabled && (
            <>
              {/* Link to Page */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    קישור לעמוד גיפט קארד
                  </div>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={giftCardUrl}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 ltr text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      copied 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        הועתק
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        העתק
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Page Title & Description */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    כותרת העמוד
                  </label>
                  <input
                    type="text"
                    value={settings.pageTitle}
                    onChange={(e) => setSettings({ ...settings, pageTitle: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    placeholder="גיפט קארד"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    תיאור העמוד
                  </label>
                  <textarea
                    value={settings.pageDescription}
                    onChange={(e) => setSettings({ ...settings, pageDescription: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                    rows={2}
                    placeholder="הפתעה מושלמת לאנשים שאתם אוהבים"
                  />
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  סכומים זמינים
                </label>
                <div className="flex flex-wrap gap-2">
                  {settings.amounts.map((amount) => (
                    <div
                      key={amount}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg group"
                    >
                      <span className="font-medium text-purple-700">₪{amount}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmount(amount)}
                        className="p-0.5 text-purple-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="סכום"
                      className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmount())}
                    />
                    <button
                      type="button"
                      onClick={handleAddAmount}
                      className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    אפשר סכום מותאם אישית
                  </label>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, allowCustomAmount: !settings.allowCustomAmount })}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      settings.allowCustomAmount ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        settings.allowCustomAmount ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                
                {settings.allowCustomAmount && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">מינימום</label>
                      <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
                        <input
                          type="number"
                          value={settings.minAmount}
                          onChange={(e) => setSettings({ ...settings, minAmount: parseInt(e.target.value) || 0 })}
                          className="w-full pl-4 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">מקסימום</label>
                      <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
                        <input
                          type="number"
                          value={settings.maxAmount}
                          onChange={(e) => setSettings({ ...settings, maxAmount: parseInt(e.target.value) || 0 })}
                          className="w-full pl-4 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  תוקף ברירת מחדל
                </label>
                <select
                  value={settings.defaultExpiryMonths ?? ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    defaultExpiryMonths: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="">ללא תאריך תפוגה</option>
                  <option value="6">6 חודשים</option>
                  <option value="12">שנה</option>
                  <option value="24">שנתיים</option>
                  <option value="36">3 שנים</option>
                </select>
              </div>

              {/* Card Image */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    תמונת כרטיס המתנה (למייל)
                  </div>
                </label>
                <p className="text-xs text-gray-500">
                  התמונה תופיע במייל שנשלח לנמען. גודל מומלץ: 600x300 פיקסלים
                </p>
                {settings.cardImage ? (
                  <div className="relative inline-block">
                    <img
                      src={settings.cardImage}
                      alt="תמונת גיפט קארד"
                      className="w-64 h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, cardImage: null })}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <MediaUploader
                    storeId={storeId}
                    maxFiles={1}
                    accept="image"
                    value={[]}
                    onChange={handleImageUpload}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isPending ? 'שומר...' : 'שמור הגדרות'}
          </button>
        </div>
      </div>
    </div>
  );
}

