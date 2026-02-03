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

import { sanitizeProductDescription } from '@/lib/security/html-sanitizer';

/**
 * ניקוי HTML entities מטקסט
 * ממיר entities נפוצים כמו &nbsp; לתווים רגילים
 * @param text - הטקסט לניקוי
 * @returns טקסט נקי
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';
  
  // SECURITY: First sanitize to remove XSS vectors, then decode entities
  // This ensures scripts/event handlers are stripped before rendering
  const sanitized = sanitizeProductDescription(text);
  
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
  let result = sanitized.replace(/&(?:nbsp|amp|lt|gt|quot|#39|apos|ndash|mdash|lsquo|rsquo|ldquo|rdquo|bull|hellip|copy|reg|trade);/gi, 
    (match) => entities[match.toLowerCase()] || match
  );
  
  // Convert literal "\n" strings (escaped newlines from DB) to <br> tags
  // This handles cases where \n was stored as text rather than actual newline
  result = result.replace(/\\n/g, '<br>');
  
  // Also convert actual newlines to <br> tags for consistency
  result = result.replace(/\n/g, '<br>');
  
  // Convert [embed]YouTube URL[/embed] to responsive iframe
  result = convertYouTubeEmbeds(result);
  
  return result;
}

/**
 * המרת [embed]YouTube URL[/embed] ל-iframe רספונסיבי
 * תומך בפורמטים:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function convertYouTubeEmbeds(text: string): string {
  // Pattern to match [embed]URL[/embed]
  const embedPattern = /\[embed\](.*?)\[\/embed\]/gi;
  
  return text.replace(embedPattern, (match, url) => {
    const videoId = extractYouTubeVideoId(url.trim());
    
    if (!videoId) {
      // If not a valid YouTube URL, return original text without the tags
      return url.trim();
    }
    
    // Return responsive YouTube iframe
    return '<div class="youtube-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;"><iframe src="https://www.youtube.com/embed/' + videoId + '" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>';
  });
}

/**
 * חילוץ Video ID מ-YouTube URL
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  
  // Standard YouTube: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  
  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  
  // Already embed URL: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  
  return null;
}
