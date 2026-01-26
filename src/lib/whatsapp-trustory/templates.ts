/**
 * WhatsApp Message Templates
 * 
 * תבניות הודעות מוכנות לשימוש
 */

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'order' | 'marketing' | 'customer' | 'cart' | 'custom';
  content: string;
  variables: string[]; // רשימת משתנים שניתן להחליף
}

export interface TemplateVariables {
  customerName?: string;
  orderNumber?: string;
  storeName?: string;
  total?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  productName?: string;
  couponCode?: string;
  discountPercent?: string;
  cartUrl?: string;
  storeUrl?: string;
  [key: string]: string | undefined;
}

/**
 * תבניות הודעות מובנות
 */
export const MessageTemplates: MessageTemplate[] = [
  // ============================================
  // הזמנות
  // ============================================
  {
    id: 'order_created',
    name: 'הזמנה חדשה',
    description: 'נשלח כשלקוח מבצע הזמנה',
    category: 'order',
    content: `שלום {customerName} 👋

תודה על ההזמנה שלך ב-{storeName}!
מספר הזמנה: #{orderNumber}
סכום: ₪{total}

נעדכן אותך כשההזמנה תצא לדרך 📦`,
    variables: ['customerName', 'storeName', 'orderNumber', 'total'],
  },
  {
    id: 'order_paid',
    name: 'תשלום התקבל',
    description: 'נשלח כשתשלום מאושר',
    category: 'order',
    content: `✅ התשלום התקבל בהצלחה!

שלום {customerName},
הזמנה #{orderNumber} אושרה ונכנסה לטיפול.

תודה שקניתם ב-{storeName}! 🙏`,
    variables: ['customerName', 'orderNumber', 'storeName'],
  },
  {
    id: 'order_shipped',
    name: 'הזמנה נשלחה',
    description: 'נשלח כשהזמנה יוצאת למשלוח',
    category: 'order',
    content: `📦 ההזמנה שלך בדרך!

שלום {customerName},
הזמנה #{orderNumber} נשלחה.

מספר מעקב: {trackingNumber}
{trackingUrl}

תודה! {storeName}`,
    variables: ['customerName', 'orderNumber', 'trackingNumber', 'trackingUrl', 'storeName'],
  },
  {
    id: 'order_cancelled',
    name: 'הזמנה בוטלה',
    description: 'נשלח כשהזמנה מבוטלת',
    category: 'order',
    content: `שלום {customerName},

הזמנה #{orderNumber} בוטלה.
אם בוצע תשלום, הזיכוי יופיע תוך 5-7 ימי עסקים.

יש שאלות? אנחנו כאן לעזור.
{storeName}`,
    variables: ['customerName', 'orderNumber', 'storeName'],
  },

  // ============================================
  // עגלה נטושה
  // ============================================
  {
    id: 'cart_abandoned',
    name: 'עגלה נטושה',
    description: 'תזכורת על פריטים בעגלה',
    category: 'cart',
    content: `היי {customerName} 👋

שמנו לב שנשארו לך פריטים בעגלה ב-{storeName}.
אל תפספסי אותם! 🛒

{cartUrl}`,
    variables: ['customerName', 'storeName', 'cartUrl'],
  },

  // ============================================
  // לקוחות
  // ============================================
  {
    id: 'customer_welcome',
    name: 'ברוך הבא',
    description: 'הודעת קבלת פנים ללקוח חדש',
    category: 'customer',
    content: `ברוך הבא ל-{storeName}! 🎉

שלום {customerName},
שמחים שהצטרפת אלינו.

יש לנו המון דברים מעניינים בשבילך:
{storeUrl}`,
    variables: ['customerName', 'storeName', 'storeUrl'],
  },

  // ============================================
  // שיווק
  // ============================================
  {
    id: 'promotion_coupon',
    name: 'קופון הנחה',
    description: 'שליחת קופון הנחה',
    category: 'marketing',
    content: `🎁 מתנה מיוחדת בשבילך!

היי {customerName},
קבל {discountPercent}% הנחה על הקנייה הבאה ב-{storeName}!

קוד קופון: {couponCode}

{storeUrl}`,
    variables: ['customerName', 'discountPercent', 'storeName', 'couponCode', 'storeUrl'],
  },
  {
    id: 'back_in_stock',
    name: 'חזר למלאי',
    description: 'עדכון על מוצר שחזר למלאי',
    category: 'marketing',
    content: `📣 חדשות טובות!

היי {customerName},
{productName} חזר למלאי ב-{storeName}!

מהרו לפני שיגמר שוב 👉
{storeUrl}`,
    variables: ['customerName', 'productName', 'storeName', 'storeUrl'],
  },

  // ============================================
  // כללי
  // ============================================
  {
    id: 'custom',
    name: 'הודעה מותאמת',
    description: 'הודעה חופשית',
    category: 'custom',
    content: '',
    variables: ['customerName', 'storeName'],
  },
];

/**
 * החלפת משתנים בתבנית
 */
export function replaceTemplateVariables(
  template: string, 
  variables: TemplateVariables
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
  }
  
  // הסר משתנים שלא הוחלפו
  result = result.replace(/\{[^}]+\}/g, '');
  
  // נקה שורות ריקות כפולות
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

/**
 * קבלת תבנית לפי ID
 */
export function getTemplateById(templateId: string): MessageTemplate | undefined {
  return MessageTemplates.find(t => t.id === templateId);
}

/**
 * קבלת תבניות לפי קטגוריה
 */
export function getTemplatesByCategory(category: MessageTemplate['category']): MessageTemplate[] {
  return MessageTemplates.filter(t => t.category === category);
}

/**
 * קבלת כל התבניות (פורמט פשוט לשימוש ב-UI)
 */
export function getMessageTemplates(): Array<{
  id: string;
  name: string;
  content: string;
  category: string;
  variables?: string[];
}> {
  return MessageTemplates
    .filter(t => t.id !== 'custom') // לא מציג את התבנית הריקה
    .map(t => ({
      id: t.id,
      name: t.name,
      content: t.content,
      category: t.category,
      variables: t.variables,
    }));
}

