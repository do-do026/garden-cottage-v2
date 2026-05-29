// ============================================================
// Hermes Chat — Backend Configuration Loader
// Loads environment variables via dotenv and validates them
// with zod. Exports a typed AppConfig object for use across
// the server codebase.
// ============================================================

import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';
import type { AppConfig } from './types/index.js';

// -----------------------------------------------------------
// Load .env file (no-op in production when vars are injected)
// -----------------------------------------------------------
loadDotenv();

// -----------------------------------------------------------
// Zod Schema — one-to-one with the .env.example shape
// -----------------------------------------------------------

const envSchema = z.object({
  /** Express server port. */
  PORT: z
    .string()
    .default('3001')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive()),

  /** Allowed CORS origin for the frontend dev server. */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  /** Filesystem path to the SQLite database file. */
  DB_PATH: z.string().default('./data/hermes-chat.db'),

  /** Default Hermes agent hostname or IP. */
  HERMES_DEFAULT_HOST: z.string().default('localhost'),

  /** Default Hermes agent WebSocket port. */
  HERMES_DEFAULT_PORT: z
    .string()
    .default('8080')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive()),

  /** Optional global auth token for Hermes connections. */
  HERMES_AUTH_TOKEN: z.string().optional(),

  /** SSH tunnel host (for remote agents). */
  SSH_HOST: z.string().default(''),

  /** SSH tunnel port. */
  SSH_PORT: z
    .string()
    .default('22')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive()),

  /** SSH login username. */
  SSH_USERNAME: z.string().default(''),

  /** Path to the SSH private key file. */
  SSH_KEY_PATH: z.string().default('./keys/id_rsa'),

  /** SSH password (fallback when no key is provided). */
  SSH_PASSWORD: z.string().optional(),

  /** API key for authenticating client requests. Dev default: garden-cottage-v2-secret-key-change-me */
  API_KEY: z.string().default('garden-cottage-v2-secret-key-change-me'),
});

// -----------------------------------------------------------
// Cached config to avoid re-parsing on every import
// -----------------------------------------------------------

let cachedConfig: AppConfig | null = null;

// -----------------------------------------------------------
// Public API
// -----------------------------------------------------------

/**
 * Load and validate the application configuration from environment variables.
 *
 * The result is cached after the first call; subsequent calls return the
 * same frozen object.  Use {@link reloadConfig} to force a re-read.
 *
 * @returns A validated, fully-typed AppConfig object.
 * @throws {z.ZodError} If any required variable is missing or invalid.
 */
export function loadConfig(): AppConfig {
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  const parsed = envSchema.parse(process.env);

  cachedConfig = {
    server: {
      port: parsed.PORT,
      corsOrigin: parsed.CORS_ORIGIN,
      apiKey: parsed.API_KEY,
    },
    db: {
      dbPath: parsed.DB_PATH,
    },
    hermes: {
      host: parsed.HERMES_DEFAULT_HOST,
      port: parsed.HERMES_DEFAULT_PORT,
      authToken: parsed.HERMES_AUTH_TOKEN,
    },
    ssh: {
      host: parsed.SSH_HOST,
      port: parsed.SSH_PORT,
      username: parsed.SSH_USERNAME,
      privateKeyPath: parsed.SSH_KEY_PATH,
      password: parsed.SSH_PASSWORD,
    },
  };

  return cachedConfig;
}

/**
 * Discard the cached configuration so the next call to {@link loadConfig}
 * re-reads environment variables. Useful in tests.
 */
export function reloadConfig(): AppConfig {
  cachedConfig = null;
  return loadConfig();
}
