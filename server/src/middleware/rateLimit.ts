// ============================================================
// Hermes Chat — In-Memory Rate Limiting Middleware
// Simple per-IP sliding-window rate limiter. Keeps request
// count in an in-memory Map — suitable for single-process
// deployments. For multi-process or production use, replace
// with a Redis-backed implementation.
// ============================================================

import type { Request, Response, NextFunction } from 'express';

// -----------------------------------------------------------
// Configuration
// -----------------------------------------------------------

/** Maximum number of requests allowed per IP within the window. */
const MAX_REQUESTS = 100;

/** Sliding window duration in milliseconds (1 minute). */
const WINDOW_MS = 60_000;

// -----------------------------------------------------------
// State
// -----------------------------------------------------------

interface WindowEntry {
  /** Timestamps (ms) of requests within the current window. */
  timestamps: number[];
}

/** In-memory store keyed by IP address. */
const store = new Map<string, WindowEntry>();

// -----------------------------------------------------------
// Periodic cleanup — purge stale entries every 5 minutes
// -----------------------------------------------------------

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, entry] of store) {
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(ip);
    }
  }
}, 5 * 60_000).unref();

// -----------------------------------------------------------
// Middleware
// -----------------------------------------------------------

/**
 * Express middleware that enforces a per-IP rate limit.
 *
 * Each IP is allowed at most {@link MAX_REQUESTS} requests
 * within a sliding {@link WINDOW_MS} window. Exceeding the
 * limit results in a 429 Too Many Requests response.
 *
 * @param req  - Express Request object.
 * @param res  - Express Response object.
 * @param next - Next middleware / route handler.
 */
export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let entry = store.get(ip);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Prune expired timestamps for this IP
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
      },
    });
    return;
  }

  entry.timestamps.push(now);
  next();
}
