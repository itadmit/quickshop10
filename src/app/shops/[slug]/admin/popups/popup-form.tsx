'use client';

import { useState, useTransition } from 'react';
import { createPopup, updatePopup, type PopupFormData, type PopupContent, type PopupStyle } from './actions';
import type { Popup } from '@/lib/db/schema';

interface PopupFormProps {
  storeId: string;
  mode: 'create' | 'edit';
  popup?: Popup;
}

const defaultContent: PopupContent = {
  title: '',
  subtitle: '',
  body: '',
  buttonText: 'לחץ כאן',
  buttonUrl: '',
};

const defaultStyle: PopupStyle = {
  bgColor: '#ffffff',
  textColor: '#1a1a1a',
  buttonBgColor: '#000000',
  buttonTextColor: '#ffffff',
  overlayOpacity: 50,
  borderRadius: 0,
  width: 'medium',
};

export function PopupForm({ storeId, mode, popup }: PopupFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'content' | 'trigger' | 'style'>('content');
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(popup?.name || '');
  const [type, setType] = useState<'image' | 'text' | 'form'>(popup?.type || 'text');
  const [isActive, setIsActive] = useState(popup?.isActive || false);
  const [trigger, setTrigger] = useState<'on_load' | 'exit_intent' | 'scroll' | 'time_delay'>(popup?.trigger || 'time_delay');
  const [triggerValue, setTriggerValue] = useState(popup?.triggerValue || 3);
  const [position, setPosition] = useState<'center' | 'bottom_right' | 'bottom_left' | 'full_screen'>(popup?.position || 'center');
  const [frequency, setFrequency] = useState<'once' | 'once_per_session' | 'always' | 'every_x_days'>(popup?.frequency || 'once');
  const [frequencyDays, setFrequencyDays] = useState(popup?.frequencyDays || 7);
  const [targetPages, setTargetPages] = useState<'all' | 'homepage' | 'products' | 'categories' | 'custom'>(popup?.targetPages || 'all');
  const [showOnDesktop, setShowOnDesktop] = useState(popup?.showOnDesktop ?? true);
  const [showOnMobile, setShowOnMobile] = useState(popup?.showOnMobile ?? true);
  const [content, setContent] = useState<PopupContent>((popup?.content as PopupContent) || defaultContent);
  const [style, setStyle] = useState<PopupStyle>((popup?.style as PopupStyle) || defaultStyle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('שם הפופאפ הוא חובה');
      return;
    }

    const formData: PopupFormData = {
      name,
      type,
      isActive,
      trigger,
      triggerValue,
      position,
      frequency,
      frequencyDays,
      targetPages,
      showOnDesktop,
      showOnMobile,
      content,
      style,
    };

    startTransition(async () => {
      const result = mode === 'create'
        ? await createPopup(storeId, formData)
        : await updatePopup(popup!.id, storeId, formData);

      if (result.success) {
        setIsOpen(false);
        if (mode === 'create') {
          // Reset form
          setName('');
          setType('text');
          setContent(defaultContent);
          setStyle(defaultStyle);
        }
      } else {
        setError(result.error || 'שגיאה בשמירה');
      }
    });
  };

  const updateContent = (key: keyof PopupContent, value: unknown) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const updateStyle = (key: keyof PopupStyle, value: unknown) => {
    setStyle(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* Trigger Button */}
      {mode === 'create' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          פופאפ חדש
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="ערוך"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" dir="rtl">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {mode === 'create' ? 'פופאפ חדש' : 'עריכת פופאפ'}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  {[
                    { key: 'content', label: 'תוכן' },
                    { key: 'trigger', label: 'טריגר והגדרות' },
                    { key: 'style', label: 'עיצוב' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as typeof activeTab)}
                      className={`px-6 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? 'text-gray-900 border-b-2 border-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[60vh] modal-scroll">
                <div className="p-6 space-y-6">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  {/* Content Tab */}
                  {activeTab === 'content' && (
                    <div className="space-y-6">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">שם הפופאפ</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="לדוגמה: הרשמה לניוזלטר"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">סוג פופאפ</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'text', label: 'טקסט', icon: '📝' },
                            { value: 'image', label: 'תמונה', icon: '🖼️' },
                            { value: 'form', label: 'טופס', icon: '📋' },
                          ].map(t => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setType(t.value as typeof type)}
                              className={`p-4 border rounded-lg text-center transition-colors ${
                                type === t.value
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl mb-1">{t.icon}</div>
                              <div className="text-sm font-medium">{t.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Content based on type */}
                      {type === 'text' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
                            <input
                              type="text"
                              value={content.title || ''}
                              onChange={(e) => updateContent('title', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת משנית</label>
                            <input
                              type="text"
                              value={content.subtitle || ''}
                              onChange={(e) => updateContent('subtitle', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">תוכן</label>
                            <textarea
                              value={content.body || ''}
                              onChange={(e) => updateContent('body', e.target.value)}
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">טקסט כפתור</label>
                              <input
                                type="text"
                                value={content.buttonText || ''}
                                onChange={(e) => updateContent('buttonText', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">קישור כפתור</label>
                              <input
                                type="text"
                                value={content.buttonUrl || ''}
                                onChange={(e) => updateContent('buttonUrl', e.target.value)}
                                placeholder="/category/sale"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {type === 'image' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כתובת תמונה (URL)</label>
                            <input
                              type="text"
                              value={content.imageUrl || ''}
                              onChange={(e) => updateContent('imageUrl', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">העלו תמונה למדיה וספו את הקישור כאן</p>
                          </div>
                          {content.imageUrl && (
                            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={content.imageUrl}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">קישור (לחיצה על התמונה)</label>
                            <input
                              type="text"
                              value={content.linkUrl || ''}
                              onChange={(e) => updateContent('linkUrl', e.target.value)}
                              placeholder="/category/sale"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}

                      {type === 'form' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
                            <input
                              type="text"
                              value={content.title || ''}
                              onChange={(e) => updateContent('title', e.target.value)}
                              placeholder="הירשמו לניוזלטר"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת משנית</label>
                            <input
                              type="text"
                              value={content.subtitle || ''}
                              onChange={(e) => updateContent('subtitle', e.target.value)}
                              placeholder="קבלו 10% הנחה על ההזמנה הראשונה"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">שדות טופס</label>
                            <div className="space-y-2">
                              {(content.fields || [{ name: 'email', type: 'email', placeholder: 'אימייל', required: true }]).map((field, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                  <span className="text-sm font-medium flex-1">{field.placeholder || field.name}</span>
                                  <span className="text-xs text-gray-500">{field.type}</span>
                                  {field.required && <span className="text-xs text-red-500">חובה</span>}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">כברירת מחדל: שדה אימייל בלבד</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">טקסט כפתור</label>
                            <input
                              type="text"
                              value={content.buttonText || ''}
                              onChange={(e) => updateContent('buttonText', e.target.value)}
                              placeholder="הירשמו עכשיו"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">הודעת הצלחה</label>
                            <input
                              type="text"
                              value={content.successMessage || ''}
                              onChange={(e) => updateContent('successMessage', e.target.value)}
                              placeholder="תודה! נשלח אליכם קוד הנחה בקרוב"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Trigger Tab */}
                  {activeTab === 'trigger' && (
                    <div className="space-y-6">
                      {/* Trigger Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">מתי להציג?</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'time_delay', label: 'אחרי X שניות', desc: 'זמן בדף' },
                            { value: 'on_load', label: 'בטעינת הדף', desc: 'מיידי' },
                            { value: 'exit_intent', label: 'יציאה מהדף', desc: 'עכבר יוצא' },
                            { value: 'scroll', label: 'גלילה', desc: 'אחוז מהדף' },
                          ].map(t => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setTrigger(t.value as typeof trigger)}
                              className={`p-3 border rounded-lg text-right transition-colors ${
                                trigger === t.value
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-sm font-medium">{t.label}</div>
                              <div className="text-xs text-gray-500">{t.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Trigger Value */}
                      {(trigger === 'time_delay' || trigger === 'scroll') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {trigger === 'time_delay' ? 'שניות' : 'אחוז גלילה'}
                          </label>
                          <input
                            type="number"
                            value={triggerValue}
                            onChange={(e) => setTriggerValue(parseInt(e.target.value) || 0)}
                            min={0}
                            max={trigger === 'scroll' ? 100 : 60}
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      )}

                      {/* Position */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">מיקום</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'center', label: 'מרכז' },
                            { value: 'bottom_right', label: 'למטה ימין' },
                            { value: 'bottom_left', label: 'למטה שמאל' },
                            { value: 'full_screen', label: 'מסך מלא' },
                          ].map(p => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setPosition(p.value as typeof position)}
                              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                                position === p.value
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Frequency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">תדירות הצגה</label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                          <option value="once">פעם אחת בלבד</option>
                          <option value="once_per_session">פעם אחת בסשן</option>
                          <option value="always">תמיד</option>
                          <option value="every_x_days">כל X ימים</option>
                        </select>
                      </div>

                      {frequency === 'every_x_days' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">מספר ימים</label>
                          <input
                            type="number"
                            value={frequencyDays}
                            onChange={(e) => setFrequencyDays(parseInt(e.target.value) || 7)}
                            min={1}
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                        </div>
                      )}

                      {/* Target Pages */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">עמודי יעד</label>
                        <select
                          value={targetPages}
                          onChange={(e) => setTargetPages(e.target.value as typeof targetPages)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                          <option value="all">כל העמודים</option>
                          <option value="homepage">דף הבית בלבד</option>
                          <option value="products">עמודי מוצר</option>
                          <option value="categories">עמודי קטגוריה</option>
                          <option value="custom">URLs ספציפיים</option>
                        </select>
                      </div>

                      {/* Device Visibility */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">מכשירים</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={showOnDesktop}
                              onChange={(e) => setShowOnDesktop(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
                            <span className="text-sm">מחשב</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={showOnMobile}
                              onChange={(e) => setShowOnMobile(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            />
                            <span className="text-sm">מובייל</span>
                          </label>
                        </div>
                      </div>

                      {/* Active Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">סטטוס</div>
                          <div className="text-sm text-gray-500">הפעל או השבת את הפופאפ</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsActive(!isActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isActive ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isActive ? 'translate-x-1' : 'translate-x-6'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Style Tab */}
                  {activeTab === 'style' && (
                    <div className="space-y-6">
                      {/* Width */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">רוחב</label>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { value: 'small', label: 'קטן' },
                            { value: 'medium', label: 'בינוני' },
                            { value: 'large', label: 'גדול' },
                            { value: 'full', label: 'מלא' },
                          ].map(w => (
                            <button
                              key={w.value}
                              type="button"
                              onClick={() => updateStyle('width', w.value)}
                              className={`p-2 border rounded-lg text-sm font-medium transition-colors ${
                                style.width === w.value
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {w.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Colors */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">צבע רקע</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={style.bgColor || '#ffffff'}
                              onChange={(e) => updateStyle('bgColor', e.target.value)}
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={style.bgColor || '#ffffff'}
                              onChange={(e) => updateStyle('bgColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">צבע טקסט</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={style.textColor || '#1a1a1a'}
                              onChange={(e) => updateStyle('textColor', e.target.value)}
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={style.textColor || '#1a1a1a'}
                              onChange={(e) => updateStyle('textColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">צבע כפתור</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={style.buttonBgColor || '#000000'}
                              onChange={(e) => updateStyle('buttonBgColor', e.target.value)}
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={style.buttonBgColor || '#000000'}
                              onChange={(e) => updateStyle('buttonBgColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">צבע טקסט כפתור</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={style.buttonTextColor || '#ffffff'}
                              onChange={(e) => updateStyle('buttonTextColor', e.target.value)}
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={style.buttonTextColor || '#ffffff'}
                              onChange={(e) => updateStyle('buttonTextColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Border Radius */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">עיגול פינות</label>
                        <input
                          type="range"
                          min={0}
                          max={24}
                          value={style.borderRadius || 0}
                          onChange={(e) => updateStyle('borderRadius', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-sm text-gray-500 text-center">{style.borderRadius || 0}px</div>
                      </div>

                      {/* Overlay Opacity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">שקיפות רקע כהה</label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={style.overlayOpacity || 50}
                          onChange={(e) => updateStyle('overlayOpacity', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="text-sm text-gray-500 text-center">{style.overlayOpacity || 50}%</div>
                      </div>

                      {/* Preview */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">תצוגה מקדימה</label>
                        <div 
                          className="relative aspect-video rounded-lg overflow-hidden"
                          style={{ backgroundColor: `rgba(0,0,0,${(style.overlayOpacity || 50) / 100})` }}
                        >
                          <div 
                            className="absolute inset-0 m-auto w-fit h-fit p-6 max-w-[80%]"
                            style={{ 
                              backgroundColor: style.bgColor || '#ffffff',
                              borderRadius: `${style.borderRadius || 0}px`,
                              color: style.textColor || '#1a1a1a',
                            }}
                          >
                            <div className="text-lg font-medium mb-2">{content.title || 'כותרת'}</div>
                            <div className="text-sm opacity-70 mb-4">{content.subtitle || 'כותרת משנית'}</div>
                            <button
                              type="button"
                              className="px-4 py-2 text-sm font-medium"
                              style={{
                                backgroundColor: style.buttonBgColor || '#000000',
                                color: style.buttonTextColor || '#ffffff',
                                borderRadius: `${Math.min(style.borderRadius || 0, 8)}px`,
                              }}
                            >
                              {content.buttonText || 'כפתור'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'שומר...' : mode === 'create' ? 'צור פופאפ' : 'שמור שינויים'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

