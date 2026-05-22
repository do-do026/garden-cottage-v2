// ============================================================
// Hermes Chat — Security / Sanitisation Utilities
// Wraps DOMPurify for HTML cleaning and provides URL + text
// sanitisation helpers to prevent XSS and injection attacks.
// ============================================================

import DOMPurify from 'dompurify';

// -----------------------------------------------------------
// HTML sanitisation
// -----------------------------------------------------------

/**
 * Sanitise an HTML string through DOMPurify, stripping all
 * dangerous tags and attributes. Returns a safe HTML string.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

// -----------------------------------------------------------
// URL sanitisation
// -----------------------------------------------------------

/**
 * Validate and sanitise a URL string.
 * Returns the original URL if it is considered safe, or an empty string
 * if the URL fails validation (malformed, or uses a disallowed protocol).
 *
 * Allowed protocols: http:, https:, data: (images only)
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol === 'http:' || protocol === 'https:') {
      return url;
    }

    // data: URLs are only allowed for images
    if (protocol === 'data:' && url.startsWith('data:image/')) {
      return url;
    }

    console.warn('[sanitize] Rejected URL with disallowed protocol:', protocol);
    return '';
  } catch {
    console.warn('[sanitize] Failed to parse URL:', url);
    return '';
  }
}

// -----------------------------------------------------------
// Text sanitisation
// -----------------------------------------------------------

/**
 * Sanitise free-form text input by stripping HTML tags and
 * trimming leading / trailing whitespace.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  // Strip any HTML tags using DOMPurify with no allowed tags
  const cleaned = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  return cleaned.trim();
}
