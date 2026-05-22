// ============================================================
// Hermes Chat — Error Handling Middleware
// Catches errors thrown in route handlers and returns a
// standardised JSON error response in the ApiError shape.
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '../../../shared/types.js';

/** Custom application error with HTTP status and machine-readable code. */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Express error-handling middleware (4-argument signature).
 * Normalises all errors to the shared ApiError shape and sets
 * the response status code accordingly.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred.';

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
  } else if (err instanceof SyntaxError && 'body' in err) {
    // JSON parse error from express.json()
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON.';
  } else {
    // Log unexpected errors for debugging
    console.error('[ErrorHandler]', err);
  }

  const body: ApiError = {
    status,
    code,
    message,
  };

  res.status(status).json({ error: body });
}
