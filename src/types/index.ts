// ============================================================
// Hermes Chat — Frontend Type Extensions
// Re-exports all shared types and defines frontend-specific
// types for UI state, themes, and game results.
// ============================================================

export * from '@shared/types';

// -----------------------------------------------------------
// Frontend-specific Types
// -----------------------------------------------------------

/** Metadata configuration for a bot-injected UI component. */
export interface UIComponentConfig {
  /** Unique identifier for the injected component instance. */
  id: string;
  /** Component type discriminator (e.g. 'button', 'modal'). */
  type: string;
  /** Arbitrary props forwarded to the component at render time. */
  props: Record<string, unknown>;
}

/** Runtime theme configuration, driven by user settings or bot UIMod. */
export interface ThemeConfig {
  /** Light or dark appearance mode. */
  mode: 'light' | 'dark';
  /** Primary accent colour as a CSS hex string. */
  primaryColor: string;
  /** Optional background colour override (CSS hex). */
  backgroundColor?: string;
}

/** Socket.IO connection health, consumed by the UI store. */
export interface ConnectionStatus {
  /** Whether the socket is currently connected to the server. */
  connected: boolean;
  /** Whether the socket is actively attempting to reconnect. */
  reconnecting: boolean;
  /** Unix-ms timestamp of the last successful connection, if any. */
  lastConnected?: number;
}

/** Result payload returned after a user completes an HTML5 game. */
export interface GameResult {
  /** ID of the game that was played. */
  gameId: string;
  /** Final score achieved by the user. */
  score: number;
  /** Game-specific result data (arbitrary JSON-serialisable object). */
  data: Record<string, unknown>;
  /** Unix-ms timestamp of when the game was completed. */
  completedAt: number;
}

// -----------------------------------------------------------
// V2: CARD & WIDGET Frontend Types
// -----------------------------------------------------------

export type { CardComponentProps, CardComponentRegistry } from './card';
export type { WidgetComponentProps, WidgetComponentRegistry } from './widget';
