// ============================================================
// Hermes Chat — Health Check Route
// Simple liveness probe for container orchestrators and
// monitoring dashboards.
// ============================================================

import { Router, type Request, type Response } from 'express';

const router: Router = Router();

/**
 * GET /api/health
 *
 * Returns a 200 status with basic server info. No auth required.
 */
router.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

export default router;
