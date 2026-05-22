// ============================================================
// Hermes Chat — SQLite Connection Manager
// Provides a singleton better-sqlite3 connection with WAL mode
// enabled for improved concurrent read performance.
// ============================================================

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// -----------------------------------------------------------
// Singleton State
// -----------------------------------------------------------

/** The active database instance, or null before initialisation. */
let dbInstance: Database.Database | null = null;

// -----------------------------------------------------------
// Public API
// -----------------------------------------------------------

/**
 * Return the current database connection.
 * Throws if the database has not been initialised yet.
 */
export function getDb(): Database.Database {
  if (dbInstance === null) {
    throw new Error(
      'Database not initialised. Call initializeDatabase() first.',
    );
  }
  return dbInstance;
}

/**
 * Initialise (or re-initialise) the database connection.
 *
 * - Creates the parent directory for the database file if it does not exist.
 * - Opens the SQLite file with better-sqlite3.
 * - Enables WAL journal mode for better concurrent read performance.
 *
 * @param dbPath - Filesystem path to the SQLite file (default: './data/hermes-chat.db').
 * @returns The initialised Database instance.
 */
export function initializeDatabase(
  dbPath: string = './data/hermes-chat.db',
): Database.Database {
  // Ensure the parent directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Close any previously open instance before re-initialising
  if (dbInstance !== null) {
    dbInstance.close();
    dbInstance = null;
  }

  dbInstance = new Database(dbPath);

  // Enable WAL mode for better read concurrency
  dbInstance.pragma('journal_mode = WAL');

  // Enable foreign key enforcement
  dbInstance.pragma('foreign_keys = ON');

  return dbInstance;
}
