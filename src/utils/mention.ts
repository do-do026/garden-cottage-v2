// ============================================================
// Hermes Chat — Mention Utility Functions
// Handles parsing and manipulating @mention text in the
// message input field: extraction, replacement, and listing.
// ============================================================

/** Regex matching @botId patterns (alphanumeric + hyphens + underscores). */
const MENTION_RE = /@([a-zA-Z0-9_-]+)/g;

/**
 * Locate the active @mention at a given cursor position.
 * If the cursor is inside or immediately after a `@word` pattern,
 * return its start index and the filter text after the `@` sign.
 * Returns null when no active mention is found at the cursor.
 */
export function extractMentionAtCursor(
  text: string,
  cursorPos: number,
): { start: number; filter: string } | null {
  // Find the last '@' before the cursor
  let match: RegExpExecArray | null;
  let lastStart = -1;
  let lastFilter = '';

  // Reset regex state
  MENTION_RE.lastIndex = 0;

  while ((match = MENTION_RE.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    // Check if cursor is within or at the end of this mention
    if (cursorPos >= matchStart && cursorPos <= matchEnd) {
      lastStart = matchStart;
      lastFilter = match[1];
    }
  }

  if (lastStart === -1) {
    // Also check for a partial mention: '@' followed by text but cursor
    // is before any non-word boundary (the user is still typing)
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex === -1) return null;

    const afterAt = textBeforeCursor.slice(lastAtIndex + 1);
    // If there's a space between @ and cursor, it's not a mention
    if (/\s/.test(afterAt)) return null;

    // This is a partial mention that the regex didn't capture yet
    // because the word isn't complete
    return { start: lastAtIndex, filter: afterAt };
  }

  // Filter text after '@' contains spaces → invalid mention
  if (/\s/.test(lastFilter)) return null;

  return { start: lastStart, filter: lastFilter };
}

/**
 * Replace the @mention at the given cursor position with a resolved
 * mention text (e.g. "@botId "). Returns the new full text and the
 * new cursor position (immediately after the inserted text).
 */
export function replaceMentionAtCursor(
  text: string,
  cursorPos: number,
  mentionText: string,
): { newText: string; newCursor: number } {
  const extracted = extractMentionAtCursor(text, cursorPos);

  if (!extracted) {
    // No mention to replace — just insert at cursor
    const before = text.slice(0, cursorPos);
    const after = text.slice(cursorPos);
    return {
      newText: before + mentionText + after,
      newCursor: cursorPos + mentionText.length,
    };
  }

  const { start } = extracted;
  const mentionEnd = findMentionEnd(text, start);

  const before = text.slice(0, start);
  const after = text.slice(mentionEnd);
  const newText = before + mentionText + after;
  const newCursor = start + mentionText.length;

  return { newText, newCursor };
}

/**
 * Find the end index of a mention starting at `start`.
 * A mention ends at the first whitespace or end of string.
 */
function findMentionEnd(text: string, start: number): number {
  for (let i = start + 1; i < text.length; i++) {
    if (/\s/.test(text[i])) return i;
  }
  return text.length;
}

/**
 * Extract all unique bot IDs mentioned with @ in the given text.
 * Returns an array of bot IDs (without the @ prefix).
 */
export function parseMentions(text: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  const regex = new RegExp(MENTION_RE.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const id = match[1];
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }

  return ids;
}
