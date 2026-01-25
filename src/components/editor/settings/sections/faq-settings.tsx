'use client';

/**
 * FAQ Section Settings - Content & Design
 * הגדרות סקשן שאלות נפוצות - תוכן ועיצוב
 */

import {
  SettingsGroup,
  SelectField,
  ColorField,
} from '../common';
import {
  TitleTypography,
  SubtitleTypography,
} from '../common/typography-settings';
import { BackgroundColorControl } from '../common/background-settings';

// ============================================
// TYPES
// ============================================

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: {
    items?: FAQItem[];
  };
  settings: Record<string, unknown>;
}

interface FAQSettingsProps {
  section: FAQSection;
  onUpdate: (updates: Partial<FAQSection>) => void;
}

// ============================================
// CONTENT SETTINGS
// ============================================

export function FAQContentSettings({ section, onUpdate }: FAQSettingsProps) {
  const items = (section.content.items as FAQItem[]) || [
    { id: '1', question: 'כמה זמן לוקח משלוח?', answer: 'משלוחים מגיעים תוך 3-5 ימי עסקים' },
    { id: '2', question: 'מה מדיניות ההחזרות?', answer: 'ניתן להחזיר תוך 14 יום' },
  ];

  const updateItems = (newItems: FAQItem[]) => {
    onUpdate({ content: { ...section.content, items: newItems } });
  };

  const updateItem = (index: number, field: keyof FAQItem, value: string) => {
    const newItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    updateItems(newItems);
  };

  const addItem = () => {
    const newId = String(Date.now());
    updateItems([...items, { id: newId, question: 'שאלה חדשה?', answer: 'תשובה' }]);
  };

  const removeItem = (index: number) => {
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <SettingsGroup title="שאלות ותשובות">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">שאלה {index + 1}</span>
              <button
                onClick={() => removeItem(index)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={item.question}
              onChange={(e) => updateItem(index, 'question', e.target.value)}
              className="w-full text-sm font-medium border border-gray-200 rounded px-2 py-1"
              placeholder="שאלה"
            />
            <textarea
              value={item.answer}
              onChange={(e) => updateItem(index, 'answer', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 min-h-[60px]"
              placeholder="תשובה"
            />
          </div>
        ))}
        <button
          onClick={addItem}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400"
        >
          + הוסף שאלה
        </button>
      </div>
    </SettingsGroup>
  );
}

// ============================================
// DESIGN SETTINGS
// ============================================

export function FAQDesignSettings({ section, onUpdate }: FAQSettingsProps) {
  const updateSettings = (key: string, value: unknown) => {
    onUpdate({ settings: { ...section.settings, [key]: value } });
  };

  return (
    <div className="p-4 space-y-6">
      <SettingsGroup title="טיפוגרפיה">
        <TitleTypography settings={section.settings} onChange={updateSettings} />
        <SubtitleTypography settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>

      <SettingsGroup title="סגנון">
        <SelectField
          label="סגנון תצוגה"
          value={(section.settings.style as string) || 'accordion'}
          options={[
            { value: 'accordion', label: 'אקורדיון' },
            { value: 'cards', label: 'כרטיסים' },
            { value: 'simple', label: 'פשוט' },
          ]}
          onChange={(v) => updateSettings('style', v)}
        />
        <ColorField
          label="צבע שאלה"
          value={(section.settings.questionColor as string) || '#111827'}
          onChange={(v) => updateSettings('questionColor', v)}
        />
        <ColorField
          label="צבע תשובה"
          value={(section.settings.answerColor as string) || '#4b5563'}
          onChange={(v) => updateSettings('answerColor', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="רקע">
        <BackgroundColorControl settings={section.settings} onChange={updateSettings} />
      </SettingsGroup>
    </div>
  );
}

