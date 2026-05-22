// ============================================================
// Hermes Chat — Database Schema
// Idempotent table creation using IF NOT EXISTS. Creates the
// core tables (bots, chats, messages, tasks, user_settings)
// and relevant indexes for query performance.
// ============================================================

import type Database from 'better-sqlite3';

/**
 * Create all application tables and indexes if they do not already exist.
 * Safe to call multiple times — every DDL statement uses IF NOT EXISTS.
 *
 * @param db - An initialised better-sqlite3 Database instance.
 */
export function createTables(db: Database.Database): void {
  // ---------------------------------------------------------
  // bots — Hermes agent registrations
  // ---------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS bots (
      id              TEXT PRIMARY KEY,
      name            TEXT    NOT NULL,
      avatar_url      TEXT,
      hermes_address  TEXT    NOT NULL,
      hermes_port     INTEGER NOT NULL,
      auth_token      TEXT,
      status          TEXT    NOT NULL DEFAULT 'OFFLINE',
      last_seen       INTEGER,
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER NOT NULL
    );
  `);

  // ---------------------------------------------------------
  // chats — Conversations between user and bot
  // ---------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id              TEXT PRIMARY KEY,
      title           TEXT    NOT NULL,
      bot_id          TEXT    NOT NULL,
      last_message    TEXT,
      unread_count    INTEGER NOT NULL DEFAULT 0,
      updated_at      INTEGER NOT NULL,
      created_at      INTEGER NOT NULL,
      FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
    );
  `);

  // ---------------------------------------------------------
  // messages — Individual messages within a chat
  // ---------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY,
      type            TEXT    NOT NULL,
      chat_id         TEXT    NOT NULL,
      sender_id       TEXT    NOT NULL,
      content         TEXT    NOT NULL,
      metadata        TEXT    NOT NULL DEFAULT '{}',
      status          TEXT    NOT NULL DEFAULT 'SENT',
      timestamp       INTEGER NOT NULL,
      edited_at       INTEGER,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    );
  `);

  // ---------------------------------------------------------
  // tasks — Scheduled cron tasks attached to bots
  // ---------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id              TEXT PRIMARY KEY,
      bot_id          TEXT    NOT NULL,
      name            TEXT    NOT NULL,
      cron_expression TEXT    NOT NULL,
      action          TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'ACTIVE',
      last_run        INTEGER,
      next_run        INTEGER,
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER NOT NULL,
      FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE
    );
  `);

  // ---------------------------------------------------------
  // user_settings — Per-user UI and notification preferences
  // ---------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id              TEXT PRIMARY KEY DEFAULT 'default',
      theme           TEXT    NOT NULL DEFAULT 'light',
      primary_color   TEXT    NOT NULL DEFAULT '#2196f3',
      notifications   INTEGER NOT NULL DEFAULT 1,
      language        TEXT    NOT NULL DEFAULT 'en'
    );
  `);

  // ---------------------------------------------------------
  // Indexes — optimise common query patterns
  // ---------------------------------------------------------

  // Fast message history lookups: by chat + time
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_chat_timestamp
      ON messages(chat_id, timestamp DESC);
  `);

  // Fast chat sidebar ordering: by updated_at descending
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chats_updated_at
      ON chats(updated_at DESC);
  `);

  // Fast bot status filtering
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bots_status
      ON bots(status);
  `);

  // Fast task lookup by bot
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_bot_id
      ON tasks(bot_id);
  `);
}
