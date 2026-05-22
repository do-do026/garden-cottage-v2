// ============================================================
// Hermes Chat — Route Aggregator
// Registers all sub-routers on the Express application under
// the /api prefix. Health check is the only route that skips
// auth & rate-limit middleware.
// ============================================================

import type { Express } from 'express';
import healthRouter from './health.js';
import botsRouter from './bots.js';
import chatsRouter from './chats.js';
import messagesRouter from './messages.js';
import tasksRouter from './tasks.js';
import configRouter from './config.js';
import { apiKeyAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';

/**
 * Mount all route modules on the Express app.
 *
 * All routes are prefixed with /api. Health check is registered
 * first so it is never blocked by auth or rate-limit middleware.
 * Resource routes are protected by API key authentication and
 * per-IP rate limiting.
 *
 * @param app - The Express application instance.
 */
export function registerRoutes(app: Express): void {
  // Health (no auth, no rate limit)
  app.use('/api', healthRouter);

  // Auth & rate limiting for all resource routes below
  app.use('/api', apiKeyAuth);
  app.use('/api', rateLimiter);

  // Resource routes
  app.use('/api', botsRouter);
  app.use('/api', chatsRouter);
  app.use('/api', messagesRouter);
  app.use('/api', tasksRouter);
  app.use('/api', configRouter);
}
