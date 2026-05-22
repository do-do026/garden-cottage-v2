// ============================================================
// Hermes Chat — Shared Type Definitions
// Used by both frontend and backend to ensure type consistency
// across the whole communication pipeline.
// ============================================================

// -----------------------------------------------------------
// Enums
// -----------------------------------------------------------

/** Types of messages that can be exchanged in a chat. */
export enum MessageType {
  TEXT = 'TEXT',
  MARKDOWN = 'MARKDOWN',
  GAME = 'GAME',
  PROGRESS = 'PROGRESS',
  SYSTEM = 'SYSTEM',
  UI_MOD = 'UI_MOD',
}

/** Delivery lifecycle status of a message. */
export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

/** Allowed UI modification instruction types from bots. */
export enum UIModType {
  SET_THEME = 'SET_THEME',
  SET_PRIMARY_COLOR = 'SET_PRIMARY_COLOR',
  /** @deprecated - Not yet implemented, reserved for future use. */
  ADD_BUTTON = 'ADD_BUTTON',
  /** @deprecated - Not yet implemented, reserved for future use. */
  SHOW_MODAL = 'SHOW_MODAL',
  SET_BACKGROUND = 'SET_BACKGROUND',
}

/** Connection status of a Hermes bot. */
export enum BotStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
}

/** Lifecycle status of a scheduled task. */
export enum TaskStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

// -----------------------------------------------------------
// Core Domain Interfaces
// -----------------------------------------------------------

/** A bot UI modification instruction issued by a Hermes agent. */
export interface UIModInstruction {
  /** The type of UI modification to perform. */
  type: UIModType;
  /** Stringified payload (JSON). Interpretation depends on `type`. */
  payload: string;
}

/** Additional metadata attached to a message. */
export interface MessageMetadata {
  /** URL of an HTML5 game to embed inside a sandboxed iframe. */
  gameUrl?: string;
  /** Current progress value (for progress bars). */
  progressValue?: number;
  /** Maximum progress value (for progress bars). */
  progressMax?: number;
  /** Human-readable label for the current progress step. */
  progressLabel?: string;
  /** UI modification instruction from a bot. */
  uiMod?: UIModInstruction;
  /** ID of the message this one is replying to. */
  replyTo?: string;
}

/** A single message within a chat conversation. */
export interface Message {
  /** Unique message identifier (UUID v4). */
  id: string;
  /** Type of content this message carries. */
  type: MessageType;
  /** ID of the chat this message belongs to. */
  chatId: string;
  /** ID of the sender (user or bot). */
  senderId: string;
  /** Message body — plain text, markdown source, or stringified JSON. */
  content: string;
  /** Extra metadata depending on message type. */
  metadata: MessageMetadata;
  /** Current delivery status. */
  status: MessageStatus;
  /** Unix timestamp in milliseconds. */
  timestamp: number;
  /** Unix timestamp of last edit, if any. */
  editedAt?: number;
}

/** A chat conversation between a user and a bot. */
export interface Chat {
  /** Unique chat identifier. */
  id: string;
  /** Display title for the chat. */
  title: string;
  /** ID of the bot participating in this chat. */
  botId: string;
  /** Preview text of the most recent message (for sidebar). */
  lastMessage?: string;
  /** Number of unread messages for the current user. */
  unreadCount: number;
  /** Unix timestamp of the most recent activity. */
  updatedAt: number;
  /** Unix timestamp of chat creation. */
  createdAt: number;
}

/** A Hermes agent bot that users can chat with. */
export interface Bot {
  /** Unique bot identifier. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** URL to the bot's avatar image. */
  avatarUrl?: string;
  /** Hostname or IP address of the Hermes agent. */
  hermesAddress: string;
  /** Port the Hermes agent WebSocket listens on. */
  hermesPort: number;
  /** Authentication token for connecting to the Hermes agent. */
  authToken?: string;
  /** Current connection status. */
  status: BotStatus;
  /** Unix timestamp of the last heartbeat / seen event. */
  lastSeen: number;
}

/** A scheduled (cron) task attached to a bot. */
export interface Task {
  /** Unique task identifier. */
  id: string;
  /** ID of the bot this task belongs to. */
  botId: string;
  /** Human-readable task name. */
  name: string;
  /** Standard cron expression (5-field). */
  cronExpression: string;
  /** Action payload to send when the task fires. */
  action: string;
  /** Current task lifecycle status. */
  status: TaskStatus;
  /** Unix timestamp of the last execution, if any. */
  lastRun?: number;
  /** Unix timestamp of the next scheduled run, if computable. */
  nextRun?: number;
}

/** User-specific settings that affect the UI and behavior. */
export interface UserSettings {
  /** Display theme: 'light' | 'dark'. */
  theme: string;
  /** Primary accent color (CSS hex). */
  primaryColor: string;
  /** Whether desktop/email notifications are enabled. */
  notifications: boolean;
  /** Preferred UI language (e.g. 'en', 'zh-CN'). */
  language: string;
}

/** A user of the Hermes Chat application. */
export interface User {
  /** Unique user identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** URL to the user's avatar image. */
  avatarUrl?: string;
  /** User-specific preferences. */
  settings: UserSettings;
}

// -----------------------------------------------------------
// Wire-format types (Hermes ↔ Backend)
// -----------------------------------------------------------

/**
 * Envelope for messages exchanged between the backend and a Hermes agent
 * over the native WebSocket (ws) connection.
 */
export interface HermesMessage {
  /** Message type discriminator. */
  type: string;
  /** Message payload (content varies by type). */
  payload: unknown;
  /** Unix timestamp in milliseconds. */
  timestamp: number;
  /** Trace ID for end-to-end request correlation (UUID v4). */
  traceId: string;
}

// -----------------------------------------------------------
// API response wrappers
// -----------------------------------------------------------

/** Standard paginated API response. */
export interface PaginatedResponse<T> {
  /** Array of items for the current page. */
  data: T[];
  /** Total number of items across all pages. */
  total: number;
  /** Current page number (1-based). */
  page: number;
  /** Number of items per page. */
  pageSize: number;
  /** Whether there is a next page available. */
  hasMore: boolean;
}

/** Standard API error shape. */
export interface ApiError {
  /** HTTP status code. */
  status: number;
  /** Machine-readable error code. */
  code: string;
  /** Human-readable error message. */
  message: string;
  /** Optional trace ID for debugging. */
  traceId?: string;
}
