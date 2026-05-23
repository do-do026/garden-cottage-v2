// ============================================================
// Hermes Chat — Bot Routes
// CRUD endpoints for Hermes bot agents plus connect/disconnect
// actions that use the WebSocketManager to establish live
// connections to Hermes agents.
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as queries from '../db/queries.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Bot } from '../../../shared/types.js';
import { BotStatus } from '../../../shared/types.js';
import { DEFAULT_CONTEXT_STRATEGY, DEFAULT_MAX_CONTEXT_MESSAGES } from '../../../shared/constants.js';

const router: Router = Router();

// -----------------------------------------------------------
// GET /api/bots — List all registered bots
// -----------------------------------------------------------
router.get('/bots', (_req: Request, res: Response, next: NextFunction): void => {
  try {
    const bots: Bot[] = queries.getBots();
    res.json({ data: bots });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// POST /api/bots — Register a new bot
// -----------------------------------------------------------
router.post('/bots', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, hermesAddress, hermesPort, authToken, connectorType } = req.body;

    if (!name || !hermesAddress) {
      throw new AppError(400, 'VALIDATION_ERROR', 'name and hermesAddress are required.');
    }

    // Validate connectorType if provided
    const resolvedConnectorType = (connectorType === 'operit' || connectorType === 'hermes')
      ? connectorType
      : 'hermes';

    const now = Date.now();
    const bot: Bot = {
      id: uuidv4(),
      name: String(name),
      avatarUrl: req.body.avatarUrl ?? undefined,
      hermesAddress: String(hermesAddress),
      hermesPort: typeof hermesPort === 'number' ? hermesPort : 8080,
      authToken: authToken ?? undefined,
      connectorType: resolvedConnectorType,
      status: BotStatus.OFFLINE,
      lastSeen: now,
      contextStrategy: DEFAULT_CONTEXT_STRATEGY,
      maxContextMessages: DEFAULT_MAX_CONTEXT_MESSAGES,
    };

    queries.saveBot(bot);
    res.status(201).json({ data: bot });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// DELETE /api/bots/:id — Delete a bot and related data
// -----------------------------------------------------------
router.delete('/bots/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const existing = queries.getBotById(id);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', `Bot "${id}" not found.`);
    }
    queries.deleteBot(id);
    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// POST /api/bots/:id/connect — Request connection to a Hermes agent
// -----------------------------------------------------------
router.post('/bots/:id/connect', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const bot = queries.getBotById(id);
    if (!bot) {
      throw new AppError(404, 'NOT_FOUND', `Bot "${id}" not found.`);
    }

    // Mark as connecting; actual connection is handled by WebSocketManager
    queries.updateBotStatus(id, BotStatus.CONNECTING);

    // The WebSocketManager is stored on app.locals by server/index.ts
    const wsManager = req.app.locals.wsManager;
    if (wsManager && typeof wsManager.connectBot === 'function') {
      wsManager.connectBot(bot).catch((err: Error) => {
        console.error(`[BotsRoute] Failed to connect bot ${id}:`, err.message);
        queries.updateBotStatus(id, BotStatus.ERROR);
      });
    }

    const updated = queries.getBotById(id)!;
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// PATCH /api/bots/:id/context — Update bot context strategy
// -----------------------------------------------------------
router.patch('/bots/:id/context', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const bot = queries.getBotById(id);
    if (!bot) {
      throw new AppError(404, 'NOT_FOUND', `Bot "${id}" not found.`);
    }

    const { contextStrategy, maxContextMessages } = req.body;
    if (contextStrategy && !['full', 'recent', 'model-managed'].includes(contextStrategy)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'contextStrategy must be full, recent, or model-managed.');
    }

    const updated = queries.updateBotContext(id, {
      contextStrategy: contextStrategy ?? bot.contextStrategy,
      maxContextMessages: maxContextMessages ?? bot.maxContextMessages,
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
