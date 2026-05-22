// ============================================================
// Hermes Chat — Frontend Configuration Aggregator
// Centralises all environment-dependent configuration so the
// rest of the codebase references a single source of truth.
// ============================================================

/** Base URL for REST API requests. Reads from Vite env or falls back to '/api'. */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? '/api';

/** WebSocket / Socket.IO server URL. Reads from Vite env or falls back to origin. */
export const WS_URL: string =
  import.meta.env.VITE_WS_URL ?? window.location.origin;

/** Whitelisted domains from which HTML5 games may be loaded in a sandboxed iframe. */
export const GAME_WHITELIST: readonly string[] = [
  'hermes-games.local',
  'localhost',
  '127.0.0.1',
];

/**
 * Validate whether a given URL's hostname is within the game whitelist.
 * Returns true if the URL is safe to load in the game sandbox.
 */
export function isGameUrlWhitelisted(url: string): boolean {
  try {
    const parsed = new URL(url);
    return GAME_WHITELIST.some(
      (domain) =>
        parsed.hostname === domain ||
        parsed.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}
