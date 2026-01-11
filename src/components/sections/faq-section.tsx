/**
 * FAQSection - Server Component
 * שאלות נפוצות - אפס JS בסיסי, מהיר כמו PHP!
 * משתמש ב-<details> HTML נייטיבי לפתיחה/סגירה בלי JS
 */

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
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
    backgroundColor?: string;
    style?: 'accordion' | 'cards' | 'simple';
    // Typography - Title
    titleColor?: string;
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    titleWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
    // Typography - Subtitle
    subtitleColor?: string;
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

const TITLE_SIZES = {
  sm: 'text-xl md:text-2xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-3xl md:text-4xl',
  xl: 'text-4xl md:text-5xl',
};

const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function FAQSection({ 
  title, 
  subtitle, 
  content, 
  settings,
  sectionId 
}: FAQSectionProps) {
  const maxWidth = settings.maxWidth || 'lg';
  const style = settings.style || 'accordion';
  const titleSize = settings.titleSize || 'md';
  const titleWeight = settings.titleWeight || 'light';

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-2xl',
    'lg': 'max-w-3xl',
    'xl': 'max-w-4xl',
  }[maxWidth];

  // Default FAQ items for preview/empty state
  const items = content.items?.length ? content.items : [
    { id: '1', question: 'כמה זמן לוקח משלוח?', answer: 'משלוחים מגיעים תוך 3-5 ימי עסקים לכל רחבי הארץ. משלוח מהיר תוך 1-2 ימי עסקים.' },
    { id: '2', question: 'מה מדיניות ההחזרות?', answer: 'ניתן להחזיר מוצרים תוך 14 יום מיום הקבלה. המוצר צריך להיות באריזה המקורית ובמצב חדש.' },
    { id: '3', question: 'האם יש אחריות על המוצרים?', answer: 'כן, כל המוצרים שלנו מגיעים עם אחריות יצרן מלאה. לפרטים נוספים צרו קשר.' },
    { id: '4', question: 'איך אפשר לעקוב אחרי ההזמנה?', answer: 'לאחר השליחה תקבלו מייל עם מספר מעקב. ניתן לעקוב באזור האישי או דרך אתר חברת המשלוחים.' },
  ];

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
      data-section-name="שאלות נפוצות"
    >
      {settings.customCss && <style>{settings.customCss}</style>}
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Header */}
        <div className="text-center mb-12">
          <h2 
            className={`${TITLE_SIZES[titleSize]} ${FONT_WEIGHTS[titleWeight]} tracking-wide mb-3 ${!title ? 'hidden' : ''}`}
            style={{ color: settings.titleColor || 'inherit' }}
            data-section-title
          >
            {title || ''}
          </h2>
          <p 
            className={`text-sm md:text-base ${!subtitle ? 'hidden' : ''}`}
            style={{ color: settings.subtitleColor || '#4b5563' }}
            data-section-subtitle
          >
            {subtitle || ''}
          </p>
        </div>

        {/* FAQ Items - Using native <details> for zero JS! */}
        <div className={`space-y-${style === 'cards' ? '4' : '0'}`}>
          {items.map((item) => (
            <details 
              key={item.id}
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
