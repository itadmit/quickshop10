/**
 * HTML Sanitization Utilities
 * Prevents XSS attacks from user-generated content
 * 
 * Uses sanitize-html which works in both server and client environments
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Configuration for product descriptions
 * Allows basic formatting, removes scripts and dangerous elements
 */
const PRODUCT_DESCRIPTION_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'i', 'em', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote', 'pre', 'code',
    'img', 'hr',
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel', 'title'],
    'img': ['src', 'alt', 'width', 'height', 'loading'],
    '*': ['class', 'style'],
    'th': ['colspan', 'rowspan'],
    'td': ['colspan', 'rowspan'],
  },
  // Force links to have safe attributes
  transformTags: {
    'a': (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
  },
  // Block dangerous protocols
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  // Don't allow any script-related content
  disallowedTagsMode: 'discard',
};

/**
 * Configuration for plain text - strip all HTML
 */
const PLAIN_TEXT_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

/**
 * Configuration for rich content (blogs, pages)
 */
const RICH_CONTENT_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'i', 'em', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'span', 'div', 'section', 'article', 'header', 'footer', 'aside', 'nav',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
    'blockquote', 'pre', 'code', 'kbd', 'samp',
    'img', 'figure', 'figcaption', 'picture', 'source',
    'video', 'audio', 'track',
    'hr', 'mark', 'sup', 'sub', 'abbr', 'time', 'cite', 'q',
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel', 'title'],
    'img': ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
    'video': ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'width', 'height'],
    'audio': ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
    'source': ['src', 'srcset', 'sizes', 'type', 'media'],
    'track': ['src', 'kind', 'srclang', 'label', 'default'],
    'time': ['datetime'],
    'abbr': ['title'],
    '*': ['class', 'style', 'id', 'role', 'lang', 'dir'],
    'th': ['colspan', 'rowspan', 'scope'],
    'td': ['colspan', 'rowspan'],
  },
  transformTags: {
    'a': (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
      },
    }),
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
    video: ['http', 'https'],
    audio: ['http', 'https'],
  },
};

/**
 * Sanitize product description HTML
 * Allows basic formatting, removes scripts and dangerous elements
 * 
 * @param html - Raw HTML string
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeProductDescription(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, PRODUCT_DESCRIPTION_CONFIG);
}

/**
 * Sanitize text to plain text (strip all HTML)
 * 
 * @param html - Raw HTML string
 * @returns Plain text without any HTML
 */
export function sanitizeToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, PLAIN_TEXT_CONFIG);
}

/**
 * Sanitize rich content (blog posts, pages)
 * More permissive than product descriptions
 * 
 * @param html - Raw HTML string
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeRichContent(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, RICH_CONTENT_CONFIG);
}

/**
 * Check if a string contains potentially dangerous HTML
 * Useful for validation before saving to database
 * 
 * @param html - Raw HTML string
 * @returns true if dangerous content was found
 */
export function containsDangerousHtml(html: string | null | undefined): boolean {
  if (!html) return false;
  
  // Check for script tags, event handlers, javascript: URLs
  const dangerousPatterns = [
    /<script\b/i,
    /\bon\w+\s*=/i,          // onclick=, onerror=, etc.
    /javascript:/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<form\b/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(html));
}

/**
 * Sanitize HTML preserving style (for editor output)
 * Used when we need to keep inline styles but still prevent XSS
 * 
 * @param html - Raw HTML string
 * @returns Sanitized HTML with styles preserved
 */
export function sanitizeWithStyles(html: string | null | undefined): string {
  if (!html) return '';
  
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'i', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'span', 'div',
      'table', 'tr', 'td', 'th',
      'blockquote', 'pre', 'code',
      'img', 'hr',
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel', 'title'],
      'img': ['src', 'alt', 'width', 'height'],
      '*': ['class', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}
