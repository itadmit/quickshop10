/**
 * פונקציית עזר לפורמט מחירים
 * תומכת בהצגה עם או בלי מספרים עשרוניים לפי הגדרת החנות
 */

export type PriceFormatOptions = {
  showDecimal?: boolean;  // האם להציג אגורות (ברירת מחדל: true)
  currency?: string;      // מטבע (ברירת מחדל: ILS)
  locale?: string;        // שפה (ברירת מחדל: he-IL)
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * פורמט מחיר - מחזיר מחרוזת עם סימן מטבע
 * @param price - המחיר (מספר או מחרוזת)
 * @param options - אפשרויות פורמט
 * @returns מחרוזת מפורמטת
 * 
 * דוגמאות:
 * formatPrice(100) => "₪100"
 * formatPrice(100, { showDecimal: true }) => "₪100.00"
 * formatPrice(99.5, { showDecimal: true }) => "₪99.50"
 * formatPrice(99.5) => "₪100" (מעוגל)
 */
export function formatPrice(
  price: number | string | null | undefined,
  options: PriceFormatOptions = {}
): string {
  const { showDecimal = true, currency = 'ILS' } = options;
  
  // המרה למספר
  const numPrice = typeof price === 'string' ? parseFloat(price) : (price ?? 0);
  
  if (isNaN(numPrice)) {
    return showDecimal ? `${CURRENCY_SYMBOLS[currency] || currency}0.00` : `${CURRENCY_SYMBOLS[currency] || currency}0`;
  }
  
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  
  if (showDecimal) {
    // הצג עם 2 ספרות אחרי הנקודה
    return `${symbol}${numPrice.toFixed(2)}`;
  } else {
    // עגל למספר שלם
    return `${symbol}${Math.round(numPrice)}`;
  }
}

/**
 * פורמט מחיר ללא סימן מטבע
 * @param price - המחיר
 * @param showDecimal - האם להציג אגורות
 */
export function formatPriceNumber(
  price: number | string | null | undefined,
  showDecimal: boolean = true
): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : (price ?? 0);
  
  if (isNaN(numPrice)) {
    return showDecimal ? '0.00' : '0';
  }
  
  if (showDecimal) {
    return numPrice.toFixed(2);
  } else {
    return Math.round(numPrice).toString();
  }
}

/**
 * פורמט הנחה - מחזיר את ההנחה בפורמט מתאים
 * @param amount - סכום ההנחה
 * @param options - אפשרויות פורמט
 */
export function formatDiscount(
  amount: number | string | null | undefined,
  options: PriceFormatOptions = {}
): string {
  const formatted = formatPrice(amount, options);
  return `-${formatted}`;
}

/**
 * ניקוי HTML entities מטקסט
 * ממיר entities נפוצים כמו &nbsp; לתווים רגילים
 * @param text - הטקסט לניקוי
 * @returns טקסט נקי
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';
  
  // Common HTML entities mapping - fast O(1) lookup
  // Using Unicode escape sequences for special characters
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&ndash;': '\u2013',  // en dash
    '&mdash;': '\u2014',  // em dash
    '&lsquo;': '\u2018',  // left single quote
    '&rsquo;': '\u2019',  // right single quote
    '&ldquo;': '\u201C',  // left double quote
    '&rdquo;': '\u201D',  // right double quote
    '&bull;': '\u2022',   // bullet
    '&hellip;': '\u2026', // ellipsis
    '&copy;': '\u00A9',   // copyright
    '&reg;': '\u00AE',    // registered
    '&trade;': '\u2122',  // trademark
  };
  
  // Single regex pass for all entities - O(n) complexity
  return text.replace(/&(?:nbsp|amp|lt|gt|quot|#39|apos|ndash|mdash|lsquo|rsquo|ldquo|rdquo|bull|hellip|copy|reg|trade);/gi, 
    (match) => entities[match.toLowerCase()] || match
  );
}

