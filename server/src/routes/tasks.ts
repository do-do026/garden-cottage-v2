// ============================================================
// Hermes Chat — Task (Cron) Routes
// CRUD endpoints for scheduled tasks attached to bots.
// Creating/updating a task automatically registers it with the
// CronScheduler (if loaded) via app.locals.
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as queries from '../db/queries.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Task } from '../../../shared/types.js';
import { TaskStatus } from '../../../shared/types.js';

const router: Router = Router();

// -----------------------------------------------------------
// GET /api/tasks — List tasks, optionally filtered by botId
// -----------------------------------------------------------
router.get('/tasks', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const botId = req.query.botId as string | undefined;
    const tasks: Task[] = queries.getTasks(botId);
    res.json({ data: tasks });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// POST /api/tasks — Create a new scheduled task
// -----------------------------------------------------------
router.post('/tasks', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { botId, name, cronExpression, action } = req.body;

    if (!botId || !name || !cronExpression) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'botId, name, and cronExpression are required.',
      );
    }

    // Verify bot exists
    const bot = queries.getBotById(botId);
    if (!bot) {
      throw new AppError(404, 'NOT_FOUND', `Bot "${botId}" not found.`);
    }

    const task: Task = {
      id: uuidv4(),
      botId: String(botId),
      name: String(name),
      cronExpression: String(cronExpression),
      action: String(action || 'ping'),
      status: TaskStatus.ACTIVE,
    };

    queries.saveTask(task);

    // Register with scheduler
    const scheduler = req.app.locals.cronScheduler;
    if (scheduler && typeof scheduler.registerTask === 'function') {
      scheduler.registerTask(task);
    }

    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// PATCH /api/tasks/:id — Update a task
// -----------------------------------------------------------
router.patch('/tasks/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const existing = queries.getTaskById(id);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', `Task "${id}" not found.`);
    }

    const updated: Task = {
      ...existing,
      ...req.body,
      id, // Prevent id overwrite
    };

    queries.saveTask(updated);

    // Update scheduler
    const scheduler = req.app.locals.cronScheduler;
    if (scheduler && typeof scheduler.updateTask === 'function') {
      scheduler.updateTask(updated);
    }

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// DELETE /api/tasks/:id — Delete a task
// -----------------------------------------------------------
router.delete('/tasks/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const existing = queries.getTaskById(id);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', `Task "${id}" not found.`);
    }

    queries.deleteTask(id);

    // Unregister from scheduler
    const scheduler = req.app.locals.cronScheduler;
    if (scheduler && typeof scheduler.unregisterTask === 'function') {
      scheduler.unregisterTask(id);
    }

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
