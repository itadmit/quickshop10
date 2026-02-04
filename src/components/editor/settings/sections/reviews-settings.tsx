'use client';

/**
 * Reviews Section Settings - Content & Design
 * הגדרות סקשן ביקורות - תוכן ועיצוב
 */

import {
  SettingsGroup,
  TextField,
  SelectField,
  SliderField,
  SwitchField,
} from '../common';
import {
  TitleTypography,
  SubtitleTypography,
  TextTypography,
} from '../common/typography-settings';
import {
  BackgroundColorControl,
  CardBackgroundControl,
} from '../common/background-settings';
import {
  ColumnsControl,
  MobileColumnsControl,
  GapControl,
  LayoutTypeControl,
} from '../common/grid-settings';

// ============================================
// TYPES
// ============================================

interface Review {
  author: string;
  text: string;
  rating: number;
  date?: string;
}

interface ReviewsSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    reviews?: Review[];
  };
  settings: Record<string, unknown>;
}

interface ReviewsSettingsProps {
  section: ReviewsSection;
  onUpdate: (updates: Partial<ReviewsSection>) => void;
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function ReviewsContentSettings({ section, onUpdate }: ReviewsSettingsProps) {
  const reviews = (section.content.reviews as Review[]) || [
    { author: 'שרה כ.', text: 'מוצר מעולה, ממליצה בחום!', rating: 5 },
    { author: 'דוד מ.', text: 'איכות גבוהה ומשלוח מהיר', rating: 5 },
    { author: 'רחל ל.', text: 'שירות לקוחות מצוין', rating: 4 },
  ];

  const updateReviews = (newReviews: Review[]) => {
    onUpdate({ content: { ...section.content, reviews: newReviews } });
  };

  const updateReview = (index: number, field: keyof Review, value: string | number) => {
    const newReviews = reviews.map((r, i) => 
      i === index ? { ...r, [field]: value } : r
    );
    updateReviews(newReviews);
  };

  const addReview = () => {
    updateReviews([...reviews, { author: 'לקוח חדש', text: 'ביקורת', rating: 5 }]);
  };

  const removeReview = (index: number) => {
    updateReviews(reviews.filter((_, i) => i !== index));
  };

  return (
    <SettingsGroup title="ביקורות">
      <div className="space-y-3">
        {reviews.map((review, index) => (
          <div key={index} className="border border-[var(--editor-border-default)] rounded-lg p-3 space-y-2 bg-[var(--editor-bg-primary)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">ביקורת {index + 1}</span>
              <button
                onClick={() => removeReview(index)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
                title="הסר"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={review.author}
              onChange={(e) => updateReview(index, 'author', e.target.value)}
              className="w-full text-sm font-medium border border-gray-200 rounded px-2 py-1"
              placeholder="שם"
            />
            <textarea
              value={review.text}
              onChange={(e) => updateReview(index, 'text', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 min-h-[60px]"
              placeholder="טקסט הביקורת"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">דירוג:</span>
              <select
                value={review.rating}
                onChange={(e) => updateReview(index, 'rating', parseInt(e.target.value))}
                className="text-sm border border-gray-200 rounded px-2 py-1"
              >
                {[5, 4, 3, 2, 1].map(n => (
                  <option key={n} value={n}>{'⭐'.repeat(n)}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <button
          onClick={addReview}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
        >
          + הוסף ביקורת
        </button>
      </div>
    </SettingsGroup>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function ReviewsDesignSettings({ section, onUpdate }: ReviewsSettingsProps) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Typography */}
      <SettingsGroup title="טיפוגרפיה">
        <TitleTypography settings={section.settings} onChange={updateSettings} />
        <SubtitleTypography settings={section.settings} onChange={updateSettings} />
        <TextTypography settings={section.settings} onChange={updateSettings} label="טקסט ביקורת" />
      </SettingsGroup>

      {/* Layout */}
      <SettingsGroup title="פריסה">
        <LayoutTypeControl settings={section.settings} onChange={updateSettings} />
        <ColumnsControl settings={section.settings} onChange={updateSettings} />
        <MobileColumnsControl settings={section.settings} onChange={updateSettings} />
        <GapControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      {/* Card Style */}
      <SettingsGroup title="עיצוב כרטיס">
        <SelectField
          label="סגנון כרטיס"
          value={(section.settings.cardStyle as string) || 'simple'}
          options={[
            { value: 'simple', label: 'פשוט' },
            { value: 'bordered', label: 'עם מסגרת' },
            { value: 'shadow', label: 'עם צל' },
          ]}
          onChange={(v) => updateSettings('cardStyle', v)}
        />
        <CardBackgroundControl settings={section.settings} onChange={updateSettings} />
        <SwitchField
          label="הצג תאריך"
          value={(section.settings.showDate as boolean) || false}
          onChange={(v) => updateSettings('showDate', v)}
        />
        <SwitchField
          label="הצג אווטאר"
          value={(section.settings.showAvatar as boolean) !== false}
          onChange={(v) => updateSettings('showAvatar', v)}
        />
      </SettingsGroup>

      {/* Background */}
      <SettingsGroup title="רקע">
        <BackgroundColorControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      {/* Slider Options (when layout is slider) */}
      {section.settings.layout === 'slider' && (
        <SettingsGroup title="הגדרות סליידר">
          <SwitchField
            label="חצים"
            value={(section.settings.showArrows as boolean) !== false}
            onChange={(v) => updateSettings('showArrows', v)}
          />
          <SwitchField
            label="נקודות"
            value={(section.settings.showDots as boolean) !== false}
            onChange={(v) => updateSettings('showDots', v)}
          />
          <SwitchField
            label="הפעלה אוטומטית"
            value={(section.settings.autoplay as boolean) || false}
            onChange={(v) => updateSettings('autoplay', v)}
          />
          {(section.settings.autoplay as boolean) && (
            <SliderField
              label="מהירות (שניות)"
              value={(section.settings.autoplaySpeed as number) || 5}
              min={2}
              max={10}
              suffix="s"
              onChange={(v) => updateSettings('autoplaySpeed', v)}
            />
          )}
        </SettingsGroup>
      )}
    </div>
  );
}

