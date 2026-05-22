// ============================================================
// Hermes Chat — Config / Settings Routes
// Read and update user settings, plus test Hermes agent
// connectivity via a raw WebSocket ping.
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import * as queries from '../db/queries.js';
import { AppError } from '../middleware/errorHandler.js';
import type { UserSettings } from '../../../shared/types.js';
import { loadConfig } from '../config.js';

const router: Router = Router();

// -----------------------------------------------------------
// GET /api/config — Get current user settings
// -----------------------------------------------------------
router.get('/config', (_req: Request, res: Response, next: NextFunction): void => {
  try {
    const settings: UserSettings = queries.getUserSettings();
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// PATCH /api/config — Update user settings
// -----------------------------------------------------------
router.patch('/config', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const current = queries.getUserSettings();
    const updated: UserSettings = {
      ...current,
      ...req.body,
    };
    queries.saveUserSettings(updated);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// POST /api/config/test-hermes — Test connectivity to a Hermes agent
// -----------------------------------------------------------
router.post('/config/test-hermes', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address, port, token } = req.body;

    if (!address) {
      throw new AppError(400, 'VALIDATION_ERROR', 'address is required.');
    }

    const targetPort = typeof port === 'number' ? port : 8080;
    const appConfig = loadConfig();
    const authToken = token ?? appConfig.hermes.authToken;

    // Attempt a quick TCP / WebSocket connectivity check
    const start = Date.now();
    let success = false;

    try {
      // Use the Hermes client to attempt a connection with a short timeout
      const { HermesClient } = await import('../services/hermesClient.js');
      const client = new HermesClient({
        host: String(address),
        port: targetPort,
        authToken,
      });
      success = await client.ping(3000);
      client.close();
    } catch {
      success = false;
    }

    const latencyMs = success ? Date.now() - start : undefined;

    res.json({
      success,
      ...(latencyMs !== undefined ? { latencyMs } : {}),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
