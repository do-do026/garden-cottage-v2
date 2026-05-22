// ============================================================
// Hermes Chat — Formatting Utilities
// Pure functions for formatting timestamps, progress values,
// and text for display purposes.
// ============================================================

import { LAST_MESSAGE_PREVIEW_LENGTH } from '@/config/constants';

// -----------------------------------------------------------
// Time formatting
// -----------------------------------------------------------

/**
 * Format a Unix-millisecond timestamp into a human-readable string.
 *
 * Rules:
 * - Today:       "HH:mm"                  (e.g. "14:30")
 * - Yesterday:   "Yesterday"              (e.g. "Yesterday")
 * - This year:   "MM/DD"                  (e.g. "07/15")
 * - Older:       "YYYY/MM/DD"             (e.g. "2024/07/15")
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return 'Yesterday';
  }

  if (date.getFullYear() === now.getFullYear()) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  }

  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Format a Unix-millisecond timestamp as a relative time string.
 *
 * Examples: "just now", "5m ago", "2h ago", "3d ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatTime(timestamp);
}

// -----------------------------------------------------------
// Progress formatting
// -----------------------------------------------------------

/**
 * Format a progress value and max into a percentage string (e.g. "75%").
 * Returns "0%" when max is zero to avoid division by zero.
 */
export function formatProgress(value: number, max: number): string {
  if (max <= 0) return '0%';
  const pct = Math.round((value / max) * 100);
  return `${Math.min(100, Math.max(0, pct))}%`;
}

// -----------------------------------------------------------
// Text truncation
// -----------------------------------------------------------

/**
 * Truncate text to a maximum length, appending an ellipsis if truncated.
 * Returns the original string unchanged if within the limit.
 */
export function truncateText(text: string, maxLength: number = LAST_MESSAGE_PREVIEW_LENGTH): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
