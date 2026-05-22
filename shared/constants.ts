// ============================================================
// Hermes Chat — Shared Constants
// Used by both frontend and backend for event names, defaults,
// and security-related configuration.
// ============================================================

import type { UserSettings } from './types.js';

// -----------------------------------------------------------
// Socket.IO Event Names
// All events use the 'namespace:action' naming convention.
// -----------------------------------------------------------

/** Socket.IO event name constants. */
export const SOCKET_EVENTS = {
  /** Client sends a message to a chat. */
  MESSAGE_SEND: 'message:send',
  /** Server broadcasts a new message to chat participants. */
  MESSAGE_NEW: 'message:new',
  /** Server acknowledges message receipt / delivery status. */
  MESSAGE_ACK: 'message:ack',
  /** Client requests a bot connection. */
  BOT_CONNECT: 'bot:connect',
  /** Server broadcasts bot status changes. */
  BOT_STATUS: 'bot:status',
  /** Hermes sends a game result back through the server. */
  GAME_RESULT: 'game:result',
  /** Hermes sends a progress update. */
  PROGRESS_UPDATE: 'progress:update',
  /** Hermes sends a UI modification instruction. */
  UI_MOD: 'ui:mod',
  /** Client or scheduler triggers a task execution. */
  TASK_TRIGGER: 'task:trigger',
} as const;

// -----------------------------------------------------------
// Message Type Constants
// -----------------------------------------------------------

/** Message type string constants (mirrors the MessageType enum values). */
export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  MARKDOWN: 'MARKDOWN',
  GAME: 'GAME',
  PROGRESS: 'PROGRESS',
  SYSTEM: 'SYSTEM',
  UI_MOD: 'UI_MOD',
} as const;

// -----------------------------------------------------------
// Security: UI Mod Whitelist
// Only these UIModType values are accepted from bots.
// -----------------------------------------------------------

/**
 * Set of UI modification types that bots are allowed to request.
 *
 * ADD_BUTTON and SHOW_MODAL are intentionally excluded — they are
 * defined in the UIModType enum for future use but are not yet
 * implemented or security-reviewed, so they are rejected at runtime.
 */
export const WHITELISTED_UI_MODS: ReadonlySet<string> = new Set([
  'SET_THEME',
  'SET_PRIMARY_COLOR',
  'SET_BACKGROUND',
]);

// -----------------------------------------------------------
// Default User Settings
// -----------------------------------------------------------

/** Default settings applied to new users or after a UI reset. */
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  primaryColor: '#2196f3',
  notifications: true,
  language: 'en',
};

// -----------------------------------------------------------
// Pagination
// -----------------------------------------------------------

/** Default number of messages per page when loading history. */
export const PAGINATION_SIZE = 50;

// -----------------------------------------------------------
// Response Breakpoints (shared reference)
// -----------------------------------------------------------

/** Responsive design breakpoints in pixels (match Tailwind config). */
export const BREAKPOINTS = {
  /** Mobile: screens narrower than this value. */
  MOBILE_MAX: 767,
  /** Tablet: screens between MOBILE_MAX+1 and this value. */
  TABLET_MAX: 1024,
  /** Desktop sidebar fixed width. */
  SIDEBAR_WIDTH: 320,
} as const;

// -----------------------------------------------------------
// Timeouts & Intervals (milliseconds)
// -----------------------------------------------------------

/** WebSocket heartbeat interval for Hermes connections. */
export const HERMES_HEARTBEAT_INTERVAL = 30_000;

/** Socket.IO reconnection delay (initial, ms). */
export const SOCKET_RECONNECT_DELAY = 1_000;

/** Maximum Socket.IO reconnection attempts. */
export const SOCKET_RECONNECT_MAX_ATTEMPTS = 10;

// -----------------------------------------------------------
// Sandbox Configuration
// -----------------------------------------------------------

/** iframe sandbox flags for HTML5 game sandbox. */
export const GAME_SANDBOX_FLAGS =
  'allow-scripts allow-same-origin';
