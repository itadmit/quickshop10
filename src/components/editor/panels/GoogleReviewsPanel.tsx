'use client';

/**
 * GoogleReviewsPanel - Settings panel for Google Reviews section
 * פאנל הגדרות לסקשן ביקורות גוגל
 */

import { useState } from 'react';
import { 
  EditorInput,
  EditorThemeProvider,
  ThemeToggle,
  EditorSlider,
  EditorColorPicker,
  EditorSelect,
} from '../ui';

import {
  TypographyControl,
  AdvancedControl,
  VisibilityControl,
} from '../controls';

// Mini Accordion
function MiniAccordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--editor-border-default)] last:border-b-0">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center gap-2 py-3 hover:bg-[var(--editor-bg-secondary)] transition-colors">
        <svg className={`w-3 h-3 text-[var(--editor-text-muted)] transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        <span className="text-xs font-medium text-[var(--editor-text-primary)]">{title}</span>
      </button>
      {isOpen && <div className="pb-3 pl-5">{children}</div>}
    </div>
  );
}

// Google Logo
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

interface Section {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
}

interface GoogleReviewsPanelProps {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onClose?: () => void;
  onDelete?: () => void;
  storeSlug?: string;
}

type TabType = 'content' | 'design' | 'advanced';

interface GoogleReview {
  id?: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export function GoogleReviewsPanel({ section, onUpdate, onClose, onDelete, storeSlug }: GoogleReviewsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [isConnecting, setIsConnecting] = useState(false);

  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  const updateMultipleSettings = (updates: Record<string, unknown>) => {
    onUpdate({ settings: { ...section.settings, ...updates } });
  };

  const updateContent = (key: string, value: unknown) => {
    onUpdate({ content: { ...section.content, [key]: value } });
  };

  const reviews = (section.content.reviews as GoogleReview[]) || [];
  const isConnected = !!(section.content.googleAccountId);

  const updateReview = (index: number, field: string, value: unknown) => {
    const newReviews = [...reviews];
    newReviews[index] = { ...newReviews[index], [field]: value };
    updateContent('reviews', newReviews);
  };

  const addReview = () => {
    updateContent('reviews', [...reviews, { 
      id: `review-${Date.now()}`,
      authorName: 'לקוח חדש', 
      text: 'ביקורת חדשה', 
      rating: 5,
      relativeTime: 'לפני שבוע'
    }]);
  };

  const removeReview = (index: number) => {
    if (reviews.length <= 1) return;
    updateContent('reviews', reviews.filter((_, i) => i !== index));
  };

  const moveReview = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === reviews.length - 1) return;
    const newList = [...reviews];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    updateContent('reviews', newList);
  };

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    // TODO: Implement OAuth flow
    // Open popup for Google Business Profile authorization
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      `/shops/${storeSlug}/admin/settings/integrations/google-business/connect`,
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );
    
    // Listen for message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'google-business-connected') {
        const { accountId, businessName, averageRating, totalReviews, reviews } = event.data;
        updateContent('googleAccountId', accountId);
        updateContent('businessName', businessName);
        updateContent('averageRating', averageRating);
        updateContent('totalReviews', totalReviews);
        if (reviews) updateContent('reviews', reviews);
        setIsConnecting(false);
        window.removeEventListener('message', handleMessage);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Cleanup if popup closes without connecting
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        setIsConnecting(false);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'content', label: 'תוכן' },
    { id: 'design', label: 'עיצוב' },
    { id: 'advanced', label: 'מתקדם' },
  ];

  return (
    <EditorThemeProvider defaultMode="light">
      <div className="flex flex-col h-full bg-[var(--editor-bg-primary)]" dir="rtl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--editor-border-default)] bg-[var(--editor-bg-secondary)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GoogleLogo size={20} />
              <h3 className="text-sm font-medium text-[var(--editor-text-primary)]">ביקורות גוגל</h3>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex gap-1 p-1 bg-[var(--editor-bg-tertiary)] rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[var(--editor-bg-primary)] text-[var(--editor-text-primary)] shadow-sm'
                    : 'text-[var(--editor-text-muted)] hover:text-[var(--editor-text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'content' && (
            <div className="space-y-0">
              {/* Google Connection */}
              <MiniAccordion title="חיבור לגוגל" defaultOpen={true}>
                <div className="space-y-4">
                  {isConnected ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        מחובר לגוגל ביזנס
                      </div>
                      <p className="text-xs text-green-600">{section.content.businessName as string}</p>
                      <button 
                        onClick={() => updateContent('googleAccountId', null)}
                        className="mt-2 text-xs text-red-500 hover:underline"
                      >
                        נתק חיבור
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectGoogle}
                      disabled={isConnecting}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                    >
                      <GoogleLogo size={24} />
                      <span className="font-medium text-gray-700">
                        {isConnecting ? 'מתחבר...' : 'התחבר לגוגל ביזנס'}
                      </span>
                    </button>
                  )}
                  
                  <p className="text-xs text-gray-500 leading-relaxed">
                    חבר את חשבון Google Business שלך כדי למשוך ביקורות אוטומטית. 
                    אם אין לך חשבון, תוכל להוסיף ביקורות ידנית למטה.
                  </p>
                </div>
              </MiniAccordion>

              {/* Business Info */}
              <MiniAccordion title="פרטי העסק" defaultOpen={!isConnected}>
                <div className="space-y-3">
                  <EditorInput 
                    label="שם העסק" 
                    value={(section.content.businessName as string) || ''} 
                    onChange={(v) => updateContent('businessName', v)} 
                    placeholder="שם העסק בגוגל"
                  />
                  <EditorInput 
                    label="תמונת העסק (URL)" 
                    value={(section.content.businessImage as string) || ''} 
                    onChange={(v) => updateContent('businessImage', v)} 
                    placeholder="https://..."
                  />
                  <EditorSlider 
                    label="דירוג ממוצע" 
                    value={(section.content.averageRating as number) || 5} 
                    onChange={(v) => updateContent('averageRating', v)} 
                    min={1} 
                    max={5} 
                    step={0.1}
                    suffix="⭐"
                  />
                  <EditorInput 
                    label="מספר ביקורות" 
                    type="number"
                    value={String((section.content.totalReviews as number) || 0)} 
                    onChange={(v) => updateContent('totalReviews', parseInt(v) || 0)} 
                  />
                  <EditorInput 
                    label="לינק לגוגל ביזנס" 
                    value={(section.content.googlePlaceUrl as string) || ''} 
                    onChange={(v) => updateContent('googlePlaceUrl', v)} 
                    placeholder="https://g.co/kgs/..."
                  />
                </div>
              </MiniAccordion>

              {/* Title */}
              <MiniAccordion title="כותרות" defaultOpen={false}>
                <div className="space-y-3">
                  <EditorInput 
                    label="כותרת" 
                    value={(section.title as string) || ''} 
                    onChange={(v) => onUpdate({ title: v })} 
                    placeholder="ביקורות בגוגל"
                  />
                  <EditorInput 
                    label="תת-כותרת" 
                    value={(section.subtitle as string) || ''} 
                    onChange={(v) => onUpdate({ subtitle: v })} 
                  />
                </div>
              </MiniAccordion>

              {/* Reviews */}
              <MiniAccordion title={`ביקורות (${reviews.length})`} defaultOpen={true}>
                <div className="space-y-3">
                  {reviews.map((review, index) => (
                    <div 
                      key={review.id || index}
                      className="border border-[var(--editor-border-default)] rounded-lg p-3 bg-[var(--editor-bg-tertiary)]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-[var(--editor-text-secondary)]">
                          ביקורת {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => moveReview(index, 'up')} 
                            disabled={index === 0} 
                            className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" 
                            title="הזז למעלה"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
                          </button>
                          <button 
                            onClick={() => moveReview(index, 'down')} 
                            disabled={index === reviews.length - 1} 
                            className="p-1 hover:bg-[var(--editor-bg-hover)] rounded disabled:opacity-30" 
                            title="הזז למטה"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                          <button 
                            onClick={() => removeReview(index)} 
                            disabled={reviews.length <= 1} 
                            className="p-1 hover:bg-red-100 text-red-500 rounded disabled:opacity-30" 
                            title="מחק"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <EditorInput 
                          label="שם" 
                          value={review.authorName || ''} 
                          onChange={(v) => updateReview(index, 'authorName', v)} 
                          placeholder="שם המבקר" 
                        />
                        <EditorSlider 
                          label="דירוג" 
                          value={review.rating || 5} 
                          min={1} 
                          max={5} 
                          suffix="⭐" 
                          onChange={(v) => updateReview(index, 'rating', v)} 
                        />
                        <EditorInput 
                          label="טקסט" 
                          value={review.text || ''} 
                          onChange={(v) => updateReview(index, 'text', v)} 
                          placeholder="תוכן הביקורת" 
                        />
                        <EditorInput 
                          label="זמן" 
                          value={review.relativeTime || ''} 
                          onChange={(v) => updateReview(index, 'relativeTime', v)} 
                          placeholder="לפני שבוע" 
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={addReview} 
                    className="w-full py-2 border-2 border-dashed border-[var(--editor-border-default)] rounded-lg text-sm text-[var(--editor-text-secondary)] hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    + הוסף ביקורת
                  </button>
                </div>
              </MiniAccordion>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-0">
              <MiniAccordion title="פריסה" defaultOpen={true}>
                <div className="space-y-4">
                  <EditorSlider 
                    label="עמודות (מחשב)" 
                    value={(section.settings.columns as number) || 3} 
                    onChange={(v) => updateSettings('columns', v)} 
                    min={2} 
                    max={4} 
                    step={1} 
                  />
                  <EditorSlider 
                    label="עמודות (מובייל)" 
                    value={(section.settings.mobileColumns as number) || 1} 
                    onChange={(v) => updateSettings('mobileColumns', v)} 
                    min={1} 
                    max={2} 
                    step={1} 
                  />
                </div>
              </MiniAccordion>

              <MiniAccordion title="סליידר" defaultOpen={true}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--editor-text-secondary)]">הצג חצים</span>
                    <button
                      onClick={() => updateSettings('showArrows', !(section.settings.showArrows !== false))}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        section.settings.showArrows !== false ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                        section.settings.showArrows !== false ? 'translate-x-1' : 'translate-x-5'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--editor-text-secondary)]">הצג נקודות</span>
                    <button
                      onClick={() => updateSettings('showDots', !(section.settings.showDots !== false))}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        section.settings.showDots !== false ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                        section.settings.showDots !== false ? 'translate-x-1' : 'translate-x-5'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--editor-text-secondary)]">ניגון אוטומטי</span>
                    <button
                      onClick={() => updateSettings('autoplay', !section.settings.autoplay)}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        section.settings.autoplay ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                        section.settings.autoplay ? 'translate-x-1' : 'translate-x-5'
                      }`} />
                    </button>
                  </div>
                </div>
              </MiniAccordion>

              <MiniAccordion title="צבעים" defaultOpen={false}>
                <div className="space-y-3">
                  <EditorColorPicker 
                    label="רקע סקשן" 
                    value={(section.settings.backgroundColor as string) || '#fce7f3'} 
                    onChange={(v) => updateSettings('backgroundColor', v)} 
                  />
                  <EditorSelect
                    label="סגנון כרטיסים"
                    value={(section.settings.cardStyle as string) || 'white'}
                    onChange={(v) => updateSettings('cardStyle', v)}
                    options={[
                      { value: 'white', label: 'לבן' },
                      { value: 'transparent', label: 'שקוף' },
                    ]}
                  />
                </div>
              </MiniAccordion>

              <MiniAccordion title="טיפוגרפיה" defaultOpen={false}>
                <TypographyControl 
                  label="" 
                  prefix="title" 
                  settings={section.settings} 
                  onChange={updateSettings} 
                  defaultSize={30} 
                  defaultSizeMobile={24} 
                  defaultColor="#000000" 
                  defaultWeight="medium" 
                />
              </MiniAccordion>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-0">
              <MiniAccordion title="נראות" defaultOpen={true}>
                <VisibilityControl settings={section.settings} onChange={updateSettings} />
              </MiniAccordion>
              <AdvancedControl 
                settings={section.settings} 
                onChange={updateSettings} 
                onChangeMultiple={updateMultipleSettings} 
                defaults={{ paddingTop: 48, paddingBottom: 48 }} 
              />
            </div>
          )}
        </div>

        {onDelete && (
          <div className="p-4 border-t border-[var(--editor-border-default)] bg-[var(--editor-bg-secondary)]">
            <button 
              onClick={onDelete} 
              className="w-full py-3 px-4 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              מחק סקשן
            </button>
          </div>
        )}
      </div>
    </EditorThemeProvider>
  );
}





