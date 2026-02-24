/**
 * Sanitize user input before rendering in the UI to prevent XSS.
 * Use when displaying user-supplied or untrusted content (e.g. policy content, comments, titles).
 * For plain text only, prefer rendering as text (React escapes by default) or use sanitizeHtml with minimal config.
 */

import DOMPurify from 'isomorphic-dompurify';

interface SanitizeConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ADD_ATTR?: string[];
}

const defaultConfig: SanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ADD_ATTR: ['target'],
};

/**
 * Sanitize HTML string for safe rendering (e.g. in dangerouslySetInnerHTML).
 * Use when you must allow limited HTML from user input.
 */
export function sanitizeHtml(html: string, config?: SanitizeConfig): string {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { ...defaultConfig, ...config });
}

/**
 * Strip all HTML and return plain text. Use when you need to display user input as text only.
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
