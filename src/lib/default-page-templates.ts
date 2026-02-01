// ============================================
// Default Page Templates - System Templates
// Built-in templates for common pages (Contact, About, FAQ, etc.)
// Server-side only - zero JS overhead!
// ============================================

export interface DefaultPageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: Array<{
    type: string;
    title: string | null;
    subtitle: string | null;
    content: Record<string, unknown>;
    settings: Record<string, unknown>;
  }>;
}

/**
 * Get default page templates - built-in system templates
 * These are predefined and always available
 */
export function getDefaultPageTemplates(): DefaultPageTemplate[] {
  return [
    // ============================================
    // Contact Page Template
    // ============================================
    {
      id: 'contact',
      name: 'צור קשר',
      description: 'עמוד יצירת קשר עם טופס',
      icon: 'message',
      sections: [
        {
          type: 'text_block',
          title: 'צרו איתנו קשר',
          subtitle: 'נשמח לשמוע מכם',
          content: {
            text: '<p>יש לכם שאלה? רוצים לשמוע עוד על המוצרים שלנו? השאירו פרטים ונחזור אליכם בהקדם.</p>',
          },
          settings: {
            maxWidth: 'lg',
            textAlign: 'center',
            paddingY: 'large',
          },
        },
        {
          type: 'contact',
          title: 'פרטי התקשרות',
          subtitle: null,
          content: {
            email: 'info@example.com',
            phone: '03-1234567',
            address: '',
            hours: "ימים א'-ה' 9:00-18:00",
            showForm: true,
            submitButtonText: 'שליחה',
          },
          settings: {
            layout: 'split',
            maxWidth: 'xl',
          },
        },
      ],
    },

    // ============================================
    // About Page Template
    // ============================================
    {
      id: 'about',
      name: 'אודות',
      description: 'עמוד אודות העסק',
      icon: 'info',
      sections: [
        {
          type: 'hero',
          title: 'הסיפור שלנו',
          subtitle: null,
          content: {
            imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920',
            buttonText: '',
            buttonLink: '',
          },
          settings: {
            height: '60vh',
            overlay: 0.4,
          },
        },
        {
          type: 'text_block',
          title: null,
          subtitle: null,
          content: {
            text: '<h2>מי אנחנו?</h2><p>אנחנו עסק שמאמין באיכות ובשירות מעולה. הסיפור שלנו התחיל מאהבה אמיתית לתחום והרצון לספק את הטוב ביותר ללקוחות שלנו.</p><p>החזון שלנו הוא להעניק חוויית קנייה מושלמת - ממוצרים איכותיים ועד שירות לקוחות שמשאיר חיוך.</p>',
          },
          settings: {
            maxWidth: 'lg',
            textAlign: 'right',
            paddingY: 'large',
          },
        },
        {
          type: 'features',
          title: 'למה לבחור בנו?',
          subtitle: null,
          content: {
            items: [
              { icon: 'star', title: 'איכות ללא פשרות', description: 'רק מוצרים מהטובים ביותר' },
              { icon: 'truck', title: 'משלוח מהיר', description: 'עד הבית שלכם' },
              { icon: 'shield', title: 'קנייה בטוחה', description: 'תשלום מאובטח' },
              { icon: 'heart', title: 'שירות אישי', description: 'אנחנו כאן בשבילכם' },
            ],
          },
          settings: {
            columns: 4,
            iconStyle: 'emoji',
          },
        },
      ],
    },

    // ============================================
    // FAQ Page Template
    // ============================================
    {
      id: 'faq',
      name: 'שאלות נפוצות',
      description: 'עמוד שאלות ותשובות',
      icon: 'question',
      sections: [
        {
          type: 'text_block',
          title: 'שאלות נפוצות',
          subtitle: 'מצאו תשובות לשאלות הנפוצות ביותר',
          content: {
            text: '',
          },
          settings: {
            maxWidth: 'lg',
            textAlign: 'center',
            paddingY: 'medium',
          },
        },
        {
          type: 'faq',
          title: null,
          subtitle: null,
          content: {
            items: [
              {
                question: 'מהם זמני המשלוח?',
                answer: 'משלוחים מגיעים תוך 3-5 ימי עסקים לכל רחבי הארץ. משלוח אקספרס זמין תוך 1-2 ימי עסקים.',
              },
              {
                question: 'מהי מדיניות ההחזרות?',
                answer: 'ניתן להחזיר מוצרים תוך 14 יום מרגע הקבלה, בתנאי שהמוצר באריזתו המקורית ולא נעשה בו שימוש.',
              },
              {
                question: 'אילו אמצעי תשלום מקובלים?',
                answer: 'אנו מקבלים כרטיסי אשראי (ויזה, מאסטרקארד, אמריקן אקספרס), PayPal ותשלום בהעברה בנקאית.',
              },
              {
                question: 'איך ניתן ליצור איתכם קשר?',
                answer: 'ניתן לפנות אלינו במייל, בטלפון או דרך טופס יצירת הקשר באתר. אנו משתדלים לענות תוך 24 שעות.',
              },
              {
                question: 'האם יש לכם חנות פיזית?',
                answer: 'כרגע אנו פועלים באונליין בלבד, אך מציעים משלוח לכל רחבי הארץ ואיסוף עצמי מנקודות מסירה.',
              },
            ],
          },
          settings: {
            style: 'accordion',
            maxWidth: 'lg',
          },
        },
      ],
    },

    // ============================================
    // Terms & Conditions Template
    // ============================================
    {
      id: 'terms',
      name: 'תקנון האתר',
      description: 'תנאי שימוש ותקנון',
      icon: 'policy',
      sections: [
        {
          type: 'text_block',
          title: 'תקנון האתר',
          subtitle: 'תנאי שימוש',
          content: {
            text: `<h3>כללי</h3>
<p>ברוכים הבאים לאתר שלנו. השימוש באתר זה מותנה בהסכמתך לתנאים המפורטים להלן. אנא קראו אותם בעיון.</p>

<h3>רכישות</h3>
<p>כל המחירים באתר כוללים מע"מ כחוק. אנו שומרים לעצמנו את הזכות לשנות מחירים ללא הודעה מוקדמת.</p>

<h3>משלוחים</h3>
<p>משלוחים מתבצעים לכל רחבי הארץ. זמני אספקה משתנים בהתאם לאזור המגורים ושיטת המשלוח שנבחרה.</p>

<h3>החזרות והחלפות</h3>
<p>ניתן להחזיר או להחליף מוצרים תוך 14 יום מיום הקבלה, בתנאי שהמוצר באריזתו המקורית ולא נעשה בו שימוש.</p>

<h3>פרטיות</h3>
<p>אנו מתחייבים לשמור על פרטיותכם ולא להעביר את פרטיכם לצד שלישי ללא הסכמתכם.</p>`,
          },
          settings: {
            maxWidth: 'lg',
            textAlign: 'right',
            paddingY: 'large',
          },
        },
      ],
    },

    // ============================================
    // Shipping Policy Template
    // ============================================
    {
      id: 'shipping',
      name: 'מדיניות משלוחים',
      description: 'מידע על משלוחים ואספקה',
      icon: 'truck',
      sections: [
        {
          type: 'text_block',
          title: 'מדיניות משלוחים',
          subtitle: 'כל מה שצריך לדעת על המשלוחים שלנו',
          content: {
            text: `<h3>שיטות משלוח</h3>
<p><strong>משלוח רגיל:</strong> 3-5 ימי עסקים - ₪29</p>
<p><strong>משלוח מהיר:</strong> 1-2 ימי עסקים - ₪49</p>
<p><strong>איסוף עצמי:</strong> מנקודות מסירה ברחבי הארץ - חינם</p>

<h3>משלוח חינם</h3>
<p>משלוח חינם בהזמנות מעל ₪200!</p>

<h3>זמני אספקה</h3>
<p>ימי עבודה הם ימים א'-ה' (לא כולל שישי, שבת וחגים). הזמנות שיבוצעו עד השעה 12:00 יישלחו באותו יום.</p>

<h3>מעקב אחר המשלוח</h3>
<p>לאחר שליחת ההזמנה תקבלו מספר מעקב במייל שיאפשר לכם לעקוב אחר המשלוח.</p>`,
          },
          settings: {
            maxWidth: 'lg',
            textAlign: 'right',
            paddingY: 'large',
          },
        },
      ],
    },

    // ============================================
    // Returns Policy Template
    // ============================================
    {
      id: 'returns',
      name: 'החזרות והחלפות',
      description: 'מדיניות החזרות והחלפות',
      icon: 'return',
      sections: [
        {
          type: 'text_block',
          title: 'מדיניות החזרות והחלפות',
          subtitle: null,
          content: {
            text: `<h3>החזרת מוצרים</h3>
<p>ניתן להחזיר מוצרים תוך 14 יום מיום הקבלה. המוצר חייב להיות באריזתו המקורית, ללא סימני שימוש.</p>

<h3>איך להחזיר?</h3>
<ol>
<li>צרו קשר עם שירות הלקוחות שלנו</li>
<li>קבלו אישור להחזרה ותווית משלוח</li>
<li>ארזו את המוצר באריזתו המקורית</li>
<li>שלחו אלינו את החבילה</li>
</ol>

<h3>החלפות</h3>
<p>רוצים להחליף מידה או צבע? אין בעיה! צרו קשר ונשמח לעזור.</p>

<h3>זיכויים</h3>
<p>לאחר קבלת המוצר ובדיקתו, הזיכוי יבוצע תוך 7 ימי עסקים לאמצעי התשלום המקורי.</p>`,
          },
          settings: {
            maxWidth: 'lg',
            textAlign: 'right',
            paddingY: 'large',
          },
        },
      ],
    },
  ];
}

/**
 * Get a specific default template by ID
 */
export function getDefaultPageTemplateById(id: string): DefaultPageTemplate | undefined {
  return getDefaultPageTemplates().find(t => t.id === id);
}









