// ============================================================
// Hermes Chat — Backend Type Extensions
// Re-exports all shared types and defines server-specific
// configuration and runtime state types.
// ============================================================

export * from '../../../shared/types.js';

import type { BotStatus } from '../../../shared/types.js';

// -----------------------------------------------------------
// Configuration Types
// -----------------------------------------------------------

/** SQLite database connection parameters. */
export interface DBConfig {
  /** Filesystem path to the SQLite database file. */
  dbPath: string;
}

/** HTTP / Express server configuration. */
export interface ServerConfig {
  /** Port the Express server listens on. */
  port: number;
  /** Allowed CORS origin for browser clients. */
  corsOrigin: string;
  /** API key for authenticating client requests. */
  apiKey: string;
}

/** Default Hermes agent connection parameters. */
export interface HermesConfig {
  /** Default hostname or IP of the Hermes agent. */
  host: string;
  /** Default WebSocket port of the Hermes agent. */
  port: number;
  /** Optional authentication token for Hermes connections. */
  authToken?: string;
}

/** SSH tunnel configuration for remote Hermes agents. */
export interface SSHConfig {
  /** SSH server hostname or IP. */
  host: string;
  /** SSH server port (default 22). */
  port: number;
  /** SSH login username. */
  username: string;
  /** Path to the SSH private key file. */
  privateKeyPath?: string;
  /** Password authentication (fallback if no key is provided). */
  password?: string;
}

// -----------------------------------------------------------
// Runtime State Types
// -----------------------------------------------------------

/** Live connection state for a single Hermes bot. */
export interface HermesConnectionState {
  /** ID of the bot this connection belongs to. */
  botId: string;
  /** Whether the native WebSocket to Hermes is open. */
  wsReady: boolean;
  /** Whether the SSH tunnel is established. */
  sshReady: boolean;
  /** Unix-ms timestamp of the last heartbeat received. */
  lastHeartbeat: number;
  /** Current lifecycle status of the bot. */
  status: BotStatus;
}

// -----------------------------------------------------------
// Aggregate Configuration
// -----------------------------------------------------------

/** Top-level application configuration aggregating all sub-configs. */
export interface AppConfig {
  /** HTTP server settings. */
  server: ServerConfig;
  /** Database connection settings. */
  db: DBConfig;
  /** Default Hermes agent connection settings. */
  hermes: HermesConfig;
  /** SSH tunnel settings. */
  ssh: SSHConfig;
}
