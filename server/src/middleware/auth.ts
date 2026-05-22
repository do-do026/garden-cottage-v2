// ============================================================
// Hermes Chat — API Key Authentication Middleware
// Validates the x-api-key header against the configured API_KEY.
// In development mode the default key is 'hermes-chat-dev-key'.
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { loadConfig } from '../config.js';

/**
 * Express middleware that enforces API key authentication.
 *
 * Reads the `x-api-key` header and compares it to the API_KEY
 * configured in the environment. If the key is missing or does
 * not match, the middleware short-circuits the request with a
 * 401 Unauthorized response in the standard error shape.
 *
 * Health-check routes should be registered before this middleware
 * so they remain publicly accessible.
 *
 * @param req  - Express Request object.
 * @param res  - Express Response object.
 * @param next - Next middleware / route handler.
 */
export function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const config = loadConfig();
  const expectedKey = config.server.apiKey;

  // No key configured — skip auth entirely (open mode)
  if (!expectedKey) {
    next();
    return;
  }

  const providedKey = req.headers['x-api-key'] as string | undefined;

  if (!providedKey || providedKey !== expectedKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
      },
    });
    return;
  }

  next();
}
