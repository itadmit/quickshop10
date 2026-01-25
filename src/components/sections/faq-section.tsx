/**
 * FAQSection - Server Component
 * שאלות נפוצות - אפס JS בסיסי, מהיר כמו PHP!
 * משתמש ב-<details> HTML נייטיבי לפתיחה/סגירה בלי JS
 * 
 * 🔧 Uses shared section-system constants
 */

import { TITLE_SIZES, FONT_WEIGHTS, MAX_WIDTHS } from '@/lib/section-system';
import type { TitleSize, FontWeight } from '@/lib/section-system';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string | null;
  subtitle: string | null;
  content: {
    items?: FAQItem[];
  };
  settings: {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    backgroundColor?: string;
    style?: 'accordion' | 'cards' | 'simple';
    // Typography - Title (supports both string keys and numeric px values)
    titleColor?: string;
    titleSize?: TitleSize | number;
    titleSizeMobile?: number;
    titleWeight?: FontWeight;
    // Typography - Subtitle
    subtitleColor?: string;
    subtitleSize?: number;
    subtitleSizeMobile?: number;
    // Question styling
    questionColor?: string;
    answerColor?: string;
    // Spacing
    marginTop?: number;
    marginBottom?: number;
    // Custom
    customClass?: string;
    customId?: string;
    customCss?: string;
  };
  sectionId?: string;
}

export function FAQSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId 
}: FAQSectionProps) {
  const maxWidth = settings.maxWidth || 'lg';
  const style = settings.style || 'accordion';
  
  // Check if numeric font sizes
  const titleSizeValue = settings.titleSize;
  const isNumericTitleSize = typeof titleSizeValue === 'number';
  const titleSize = isNumericTitleSize ? 'md' : (titleSizeValue || 'md');
  const titleWeight = settings.titleWeight || 'light';
  
  const subtitleSizeValue = settings.subtitleSize;
  const isNumericSubtitleSize = typeof subtitleSizeValue === 'number';

  const maxWidthClass = MAX_WIDTHS[maxWidth] || MAX_WIDTHS.lg;

  // Default FAQ items for preview/empty state
  const items = content.items?.length ? content.items : [
    { id: '1', question: 'כמה זמן לוקח משלוח?', answer: 'משלוחים מגיעים תוך 3-5 ימי עסקים לכל רחבי הארץ. משלוח מהיר תוך 1-2 ימי עסקים.' },
    { id: '2', question: 'מה מדיניות ההחזרות?', answer: 'ניתן להחזיר מוצרים תוך 14 יום מיום הקבלה. המוצר צריך להיות באריזה המקורית ובמצב חדש.' },
    { id: '3', question: 'האם יש אחריות על המוצרים?', answer: 'כן, כל המוצרים שלנו מגיעים עם אחריות יצרן מלאה. לפרטים נוספים צרו קשר.' },
    { id: '4', question: 'איך אפשר לעקוב אחרי ההזמנה?', answer: 'לאחר השליחה תקבלו מייל עם מספר מעקב. ניתן לעקוב באזור האישי או דרך אתר חברת המשלוחים.' },
  ];

  const hasCustomSizes = isNumericTitleSize || isNumericSubtitleSize;

  return (
    <section 
      className={`py-16 px-4 ${settings.customClass || ''}`}
      style={{ 
        backgroundColor: settings.backgroundColor || 'transparent',
        marginTop: settings.marginTop ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom ? `${settings.marginBottom}px` : undefined,
      }}
      id={settings.customId || undefined}
      data-section-id={sectionId}
      data-section-type="faq"
      data-section-name="שאלות נפוצות"
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      
      {/* Scoped responsive styles for numeric font sizes */}
      {hasCustomSizes && (
        <style dangerouslySetInnerHTML={{ __html: `
          ${isNumericTitleSize ? `
            [data-section-id="${sectionId}"] [data-section-title] {
              font-size: ${settings.titleSizeMobile || (titleSizeValue as number) * 0.7}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-title] {
                font-size: ${titleSizeValue}px !important;
              }
            }
          ` : ''}
          ${isNumericSubtitleSize ? `
            [data-section-id="${sectionId}"] [data-section-subtitle] {
              font-size: ${settings.subtitleSizeMobile || (subtitleSizeValue as number) * 0.8}px !important;
            }
            @media (min-width: 768px) {
              [data-section-id="${sectionId}"] [data-section-subtitle] {
                font-size: ${subtitleSizeValue}px !important;
              }
            }
          ` : ''}
        `}} />
      )}
      
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Header */}
        <div className="text-center mb-12">
          <h2 
            className={`${!isNumericTitleSize ? TITLE_SIZES[titleSize as TitleSize] : ''} ${FONT_WEIGHTS[titleWeight]} tracking-wide mb-3 ${!title ? 'hidden' : ''}`}
            style={{ color: settings.titleColor || 'inherit' }}
            data-section-title
          >
            {title || ''}
          </h2>
          <p 
            className={`${!isNumericSubtitleSize ? 'text-sm md:text-base' : ''} ${!subtitle ? 'hidden' : ''}`}
            style={{ color: settings.subtitleColor || '#4b5563' }}
            data-section-subtitle
          >
            {subtitle || ''}
          </p>
        </div>

        {/* FAQ Items - Using native <details> for zero JS! */}
        <div className={`space-y-${style === 'cards' ? '4' : '0'}`} data-faq-items>
          {items.map((item, index) => (
            <details
              key={item.id || `faq-${index}`}
              data-faq-item-id={item.id || `faq-${index}`}
              data-faq-item-index={index}
              className={`
                group
                ${style === 'accordion' ? 'border-b border-gray-200' : ''}
                ${style === 'cards' ? 'bg-gray-50 rounded-lg overflow-hidden' : ''}
                ${style === 'simple' ? '' : ''}
              `}
            >
              <summary 
                className={`
                  flex items-center justify-between cursor-pointer list-none
                  ${style === 'accordion' ? 'py-5' : ''}
                  ${style === 'cards' ? 'p-5' : ''}
                  ${style === 'simple' ? 'py-3' : ''}
                  hover:text-gray-600 transition-colors
                `}
              >
                <span 
                  className="font-medium text-right pr-4"
                  style={{ color: settings.questionColor || '#111827' }}
                  data-faq-question
                >
                  {item.question}
                </span>
                <svg 
                  className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180 shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div 
                className={`
                  leading-relaxed
                  ${style === 'accordion' ? 'pb-5' : ''}
                  ${style === 'cards' ? 'px-5 pb-5' : ''}
                  ${style === 'simple' ? 'pb-4 pr-4' : ''}
                `}
                style={{ color: settings.answerColor || '#4b5563' }}
                data-faq-answer
              >
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
