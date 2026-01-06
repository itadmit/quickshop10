'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCampaign, updateCampaign } from './actions';
import type { GamificationCampaign } from '@/lib/db/schema';
import { Target, Ticket, FileText, ClipboardList, Palette, Clock } from 'lucide-react';

interface CampaignFormProps {
  storeId: string;
  storeSlug: string;
  type: 'wheel' | 'scratch';
  mode: 'create' | 'edit';
  campaign?: GamificationCampaign;
}

const DEFAULT_WHEEL_COLORS = ['#e91e63', '#9c27b0', '#3f51b5', '#03a9f4', '#009688', '#4caf50', '#ffeb3b', '#ff9800', '#ff5722', '#795548', '#607d8b', '#e91e63'];

export function CampaignForm({ storeId, storeSlug, type, mode, campaign }: CampaignFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'basic' | 'form' | 'display' | 'timing'>('basic');

  // Form state
  const [name, setName] = useState(campaign?.name || '');
  const [title, setTitle] = useState(campaign?.title || (type === 'wheel' ? 'סובב וזכה!' : 'גרד וזכה!'));
  const [subtitle, setSubtitle] = useState(campaign?.subtitle || 'השאר פרטים וקבל הזדמנות לזכות בפרסים מדהימים');
  const [buttonText, setButtonText] = useState(campaign?.buttonText || (type === 'wheel' ? 'סובב עכשיו' : 'גרד עכשיו'));
  
  // Colors
  const [primaryColor, setPrimaryColor] = useState(campaign?.primaryColor || '#e91e63');
  const [secondaryColor, setSecondaryColor] = useState(campaign?.secondaryColor || '#9c27b0');
  const [backgroundColor, setBackgroundColor] = useState(campaign?.backgroundColor || '#ffffff');
  const [textColor, setTextColor] = useState(campaign?.textColor || '#333333');
  
  // Form fields
  const [collectName, setCollectName] = useState(campaign?.collectName ?? true);
  const [collectEmail, setCollectEmail] = useState(campaign?.collectEmail ?? true);
  const [collectPhone, setCollectPhone] = useState(campaign?.collectPhone ?? true);
  const [collectBirthday, setCollectBirthday] = useState(campaign?.collectBirthday ?? false);
  
  // Consent
  const [requireMarketingConsent, setRequireMarketingConsent] = useState(campaign?.requireMarketingConsent ?? true);
  const [requirePrivacyConsent, setRequirePrivacyConsent] = useState(campaign?.requirePrivacyConsent ?? true);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(campaign?.privacyPolicyUrl || '');
  const [termsUrl, setTermsUrl] = useState(campaign?.termsUrl || '');
  
  // Limits
  const [maxPlaysPerEmail, setMaxPlaysPerEmail] = useState(campaign?.maxPlaysPerEmail ?? 1);
  
  // Display settings
  const [trigger, setTrigger] = useState<'on_load' | 'exit_intent' | 'scroll' | 'time_delay'>(
    campaign?.trigger || 'time_delay'
  );
  const [triggerValue, setTriggerValue] = useState(campaign?.triggerValue ?? 3);
  const [frequency, setFrequency] = useState<'once' | 'once_per_session' | 'always' | 'every_x_days'>(
    campaign?.frequency || 'once'
  );
  const [frequencyDays, setFrequencyDays] = useState(campaign?.frequencyDays ?? 7);
  const [showOnDesktop, setShowOnDesktop] = useState(campaign?.showOnDesktop ?? true);
  const [showOnMobile, setShowOnMobile] = useState(campaign?.showOnMobile ?? true);
  
  // Target pages
  const [targetPages, setTargetPages] = useState<'all' | 'homepage' | 'products' | 'categories' | 'custom'>(
    campaign?.targetPages || 'all'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('נא להזין שם לקמפיין');
      return;
    }

    startTransition(async () => {
      const data = {
        storeId,
        name,
        type,
        title,
        subtitle,
        buttonText,
        primaryColor,
        secondaryColor,
        backgroundColor,
        textColor,
        collectName,
        collectEmail,
        collectPhone,
        collectBirthday,
        requireMarketingConsent,
        requirePrivacyConsent,
        privacyPolicyUrl: privacyPolicyUrl || undefined,
        termsUrl: termsUrl || undefined,
        maxPlaysPerEmail,
        trigger,
        triggerValue,
        frequency,
        frequencyDays,
        targetPages,
        showOnDesktop,
        showOnMobile,
      };

      const result = mode === 'create' 
        ? await createCampaign(data)
        : await updateCampaign(campaign!.id, data);

      if (result.success) {
        if (mode === 'create' && 'campaignId' in result) {
          router.push(`/shops/${storeSlug}/admin/plugins/gamification/${result.campaignId}`);
        } else {
          router.refresh();
        }
      } else {
        alert(result.error || 'אירעה שגיאה');
      }
    });
  };

  const tabs = [
    { id: 'basic', label: 'פרטים בסיסיים', Icon: FileText },
    { id: 'form', label: 'טופס רישום', Icon: ClipboardList },
    { id: 'display', label: 'עיצוב', Icon: Palette },
    { id: 'timing', label: 'תזמון והצגה', Icon: Clock },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-gray-900 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.Icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם הקמפיין (פנימי)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'wheel' ? 'גלגל מזל חנוכה 2024' : 'כרטיס גירוד סוף שנה'}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  כותרת (מה הלקוח יראה)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תת-כותרת
                </label>
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  טקסט כפתור
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מקסימום משחקים למייל
                </label>
                <input
                  type="number"
                  value={maxPlaysPerEmail}
                  onChange={(e) => setMaxPlaysPerEmail(parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  כמה פעמים כל אימייל יכול לשחק
                </p>
              </div>
            </div>
          )}

          {/* Form Tab */}
          {activeTab === 'form' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">שדות לאיסוף</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={collectName}
                      onChange={(e) => setCollectName(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">שם</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={collectEmail}
                      onChange={(e) => setCollectEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">אימייל</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={collectPhone}
                      onChange={(e) => setCollectPhone(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">טלפון</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={collectBirthday}
                      onChange={(e) => setCollectBirthday(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">תאריך לידה</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">הסכמות</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={requireMarketingConsent}
                      onChange={(e) => setRequireMarketingConsent(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <div>
                      <span className="text-sm text-gray-700">אישור קבלת דיוור שיווקי</span>
                      <p className="text-xs text-gray-500">דורש הסכמה לקבלת מבצעים ועדכונים</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={requirePrivacyConsent}
                      onChange={(e) => setRequirePrivacyConsent(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <div>
                      <span className="text-sm text-gray-700">אישור מדיניות פרטיות</span>
                      <p className="text-xs text-gray-500">דורש הסכמה למדיניות פרטיות</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קישור למדיניות פרטיות
                </label>
                <input
                  type="url"
                  value={privacyPolicyUrl}
                  onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                  placeholder="https://example.com/privacy"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קישור לתקנון
                </label>
                <input
                  type="url"
                  value={termsUrl}
                  onChange={(e) => setTermsUrl(e.target.value)}
                  placeholder="https://example.com/terms"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    צבע ראשי
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    צבע משני
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    צבע רקע
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    צבע טקסט
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-6 rounded-xl border border-gray-200" style={{ backgroundColor }}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                    {type === 'wheel' ? (
                      <Target className="w-8 h-8" style={{ color: primaryColor }} />
                    ) : (
                      <Ticket className="w-8 h-8" style={{ color: primaryColor }} />
                    )}
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: textColor }}>{title}</h3>
                  <p className="text-sm mt-1" style={{ color: textColor + 'aa' }}>{subtitle}</p>
                  <button
                    type="button"
                    className="mt-4 px-6 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Timing Tab */}
          {activeTab === 'timing' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מתי להציג
                </label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value as typeof trigger)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="on_load">מיד עם טעינת העמוד</option>
                  <option value="time_delay">אחרי X שניות</option>
                  <option value="scroll">אחרי גלילה של X%</option>
                  <option value="exit_intent">כשהמשתמש עוזב (Exit Intent)</option>
                </select>
              </div>

              {(trigger === 'time_delay' || trigger === 'scroll') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {trigger === 'time_delay' ? 'שניות לפני הצגה' : 'אחוז גלילה'}
                  </label>
                  <input
                    type="number"
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(parseInt(e.target.value) || 0)}
                    min={0}
                    max={trigger === 'scroll' ? 100 : 60}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תדירות הצגה
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="once">פעם אחת בלבד</option>
                  <option value="once_per_session">פעם בסשן</option>
                  <option value="every_x_days">כל X ימים</option>
                  <option value="always">תמיד</option>
                </select>
              </div>

              {frequency === 'every_x_days' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מספר ימים בין הצגות
                  </label>
                  <input
                    type="number"
                    value={frequencyDays}
                    onChange={(e) => setFrequencyDays(parseInt(e.target.value) || 7)}
                    min={1}
                    max={365}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  באילו עמודים להציג
                </label>
                <select
                  value={targetPages}
                  onChange={(e) => setTargetPages(e.target.value as typeof targetPages)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option value="all">כל העמודים</option>
                  <option value="homepage">דף הבית בלבד</option>
                  <option value="products">עמודי מוצרים</option>
                  <option value="categories">עמודי קטגוריות</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">מכשירים</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={showOnDesktop}
                      onChange={(e) => setShowOnDesktop(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">🖥️ מחשב</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={showOnMobile}
                      onChange={(e) => setShowOnMobile(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">📱 נייד</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          disabled={isPending}
        >
          ביטול
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isPending ? 'שומר...' : mode === 'create' ? 'צור קמפיין והמשך לפרסים' : 'שמור שינויים'}
        </button>
      </div>
    </form>
  );
}

