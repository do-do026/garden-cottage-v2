// ============================================================
// Hermes Chat — Frontend Constants
// UI-specific constants for themes, layout sizes, timing, and
// pagination that are NOT shared with the backend.
// ============================================================

import {
  BREAKPOINTS,
  SOCKET_RECONNECT_DELAY,
  SOCKET_RECONNECT_MAX_ATTEMPTS,
  PAGINATION_SIZE,
} from '@shared/constants';

/** Re-export shared constants that the frontend relies on. */
export { BREAKPOINTS, SOCKET_RECONNECT_DELAY, SOCKET_RECONNECT_MAX_ATTEMPTS, PAGINATION_SIZE };

// -----------------------------------------------------------
// Theme defaults
// -----------------------------------------------------------

/** Default primary colour used when no user / bot override is set. */
export const DEFAULT_PRIMARY_COLOR = '#2196f3';

/** Preset colour swatches shown in the settings picker. */
export const PRESET_COLORS: readonly string[] = [
  '#2196f3', // Blue
  '#4caf50', // Green
  '#ff9800', // Orange
  '#f44336', // Red
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
  '#ff6b6b', // Coral
  '#607d8b', // Blue Grey
];

// -----------------------------------------------------------
// Layout
// -----------------------------------------------------------

/** Fixed width of the desktop sidebar in pixels. */
export const SIDEBAR_WIDTH = BREAKPOINTS.SIDEBAR_WIDTH;

/** Height of the top navigation bar in pixels. */
export const TOPBAR_HEIGHT = 56;

/** Height of the bottom navigation bar on mobile in pixels. */
export const BOTTOM_NAV_HEIGHT = 56;

// -----------------------------------------------------------
// Chat
// -----------------------------------------------------------

/** Maximum number of characters permitted in a single message. */
export const MAX_MESSAGE_LENGTH = 4096;

/** Maximum number of text lines for the message input before scrolling. */
export const MESSAGE_INPUT_MAX_ROWS = 4;

/** Maximum length of a truncated last-message preview in the chat list. */
export const LAST_MESSAGE_PREVIEW_LENGTH = 48;

// -----------------------------------------------------------
// Game sandbox
// -----------------------------------------------------------

/** Default iframe height for embedded HTML5 games (pixels). */
export const GAME_IFRAME_HEIGHT = 400;

// -----------------------------------------------------------
// Timing
// -----------------------------------------------------------

/** Debounce delay for the chat search filter (milliseconds). */
export const CHAT_SEARCH_DEBOUNCE_MS = 250;
