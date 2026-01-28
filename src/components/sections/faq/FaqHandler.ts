/**
 * FaqHandler - DOM update logic for FAQ section
 * לוגיקת עדכון DOM בזמן אמת לסקשן שאלות נפוצות
 */

import { Section } from '../types';
import { applyCommonUpdates } from '../handlers/common-handler';

interface FaqItem {
  id?: string;
  question: string;
  answer: string;
}

export function handleFaqUpdate(
  element: Element,
  updates: Partial<Section>
): void {
  const el = element as HTMLElement;
  
  // Apply common updates (title, subtitle, background, spacing, etc.)
  applyCommonUpdates(element, updates);

  // =====================================================
  // FAQ-SPECIFIC UPDATES
  // =====================================================
  
  // FAQ items
  if (updates.content?.items !== undefined) {
    const items = updates.content.items as FaqItem[];
    const container = el.querySelector('[data-faq-list]') as HTMLElement;
    
    if (container && items) {
      items.forEach((item, index) => {
        const faqItem = container.querySelector(`[data-faq-index="${index}"]`) as HTMLElement;
        if (faqItem) {
          const questionEl = faqItem.querySelector('[data-faq-question]') as HTMLElement;
          const answerEl = faqItem.querySelector('[data-faq-answer]') as HTMLElement;
          
          if (questionEl) questionEl.textContent = item.question;
          if (answerEl) answerEl.textContent = item.answer;
        }
      });
    }
  }

  // Question color
  if (updates.settings?.questionColor !== undefined) {
    const color = updates.settings.questionColor as string;
    const questions = el.querySelectorAll('[data-faq-question]');
    questions.forEach((q) => {
      (q as HTMLElement).style.color = color;
    });
  }

  // Answer color
  if (updates.settings?.answerColor !== undefined) {
    const color = updates.settings.answerColor as string;
    const answers = el.querySelectorAll('[data-faq-answer]');
    answers.forEach((a) => {
      (a as HTMLElement).style.color = color;
    });
  }
}

export function handler(element: Element, updates: Record<string, unknown>) {
  handleFaqUpdate(element, updates as Partial<Section>);
}

export const defaultContent = {
  items: [
    { id: '1', question: 'מה אני מקבל?', answer: 'תיאור מפורט של מה שהלקוח מקבל.' },
    { id: '2', question: 'כמה זמן המשלוח?', answer: 'המשלוח מגיע תוך 3-5 ימי עסקים.' },
    { id: '3', question: 'מה מדיניות ההחזרות?', answer: 'ניתן להחזיר את המוצר תוך 30 יום.' },
  ],
};

export const defaultSettings = {
  titleSize: 30,
  titleSizeMobile: 24,
  titleColor: '#000000',
  questionColor: '#111827',
  answerColor: '#6b7280',
  backgroundColor: '#ffffff',
  paddingTop: 64,
  paddingBottom: 64,
  isVisible: true,
};

