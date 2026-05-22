// ============================================================
// Hermes Chat — Cron Scheduler
// Schedules task executions using node-cron. Tasks are loaded
// from the database on startup and can be dynamically
// registered, updated, or removed at runtime.
// ============================================================

import cron from 'node-cron';
import * as queries from '../db/queries.js';
import type { Task } from '../../../shared/types.js';
import { TaskStatus } from '../../../shared/types.js';
import type { WebSocketManager } from '../socket/manager.js';

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

interface ScheduledTask {
  task: Task;
  job: cron.ScheduledTask;
}

// -----------------------------------------------------------
// CronScheduler
// -----------------------------------------------------------

export class CronScheduler {
  private readonly scheduled: Map<string, ScheduledTask> = new Map();
  private readonly wsManager: WebSocketManager | null;

  constructor(wsManager?: WebSocketManager) {
    this.wsManager = wsManager ?? null;
  }

  // -----------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------

  /**
   * Load all ACTIVE tasks from the database and schedule them.
   * Called once after the server starts listening.
   */
  async loadFromDB(): Promise<void> {
    const tasks: Task[] = queries.getTasks();
    const activeTasks = tasks.filter((t) => t.status === TaskStatus.ACTIVE);

    for (const task of activeTasks) {
      this.registerTask(task);
    }

    console.log(`[CronScheduler] Loaded ${activeTasks.length} active tasks from DB.`);
  }

  // -----------------------------------------------------------
  // Task management
  // -----------------------------------------------------------

  /** Register and schedule a new (or updated) task. */
  registerTask(task: Task): void {
    // Remove existing if present
    this.unregisterTask(task.id);

    if (task.status !== TaskStatus.ACTIVE) return;

    if (!cron.validate(task.cronExpression)) {
      console.warn(
        `[CronScheduler] Invalid cron expression for task "${task.id}": ${task.cronExpression}`,
      );
      return;
    }

    const job = cron.schedule(task.cronExpression, () => {
      this.executeTask(task);
    });

    this.scheduled.set(task.id, { task, job });
    console.log(`[CronScheduler] Scheduled task "${task.name}" (${task.id}): ${task.cronExpression}`);
  }

  /** Update an existing task (re-schedule if cron expression or status changed). */
  updateTask(task: Task): void {
    this.registerTask(task);
  }

  /** Stop and remove a scheduled task. */
  unregisterTask(taskId: string): void {
    const entry = this.scheduled.get(taskId);
    if (entry) {
      entry.job.stop();
      this.scheduled.delete(taskId);
    }
  }

  /** Stop all scheduled tasks. */
  stopAll(): void {
    for (const [taskId] of this.scheduled) {
      this.unregisterTask(taskId);
    }
    console.log('[CronScheduler] All tasks stopped.');
  }

  // -----------------------------------------------------------
  // Execution
  // -----------------------------------------------------------

  /**
   * Estimate the next execution time for a cron expression.
   *
   * Falls back to `now + 60_000` (1 minute) when the expression
   * cannot be parsed. For common patterns the estimate is
   * reasonably accurate; for exact scheduling the cron daemon
   * itself is the source of truth.
   */
  private estimateNextRun(cronExpression: string, now: number): number {
    // Parse the minute and hour fields for a rough estimate.
    // The 5-field cron: minute hour day-of-month month day-of-week
    const fields = cronExpression.trim().split(/\s+/);
    if (fields.length !== 5) return now + 60_000;

    const [minute, hour] = fields;
    const currentDate = new Date(now);
    const currentMinute = currentDate.getMinutes();
    const currentHour = currentDate.getHours();

    // Helper: value could be '*', a number, or '*/N'
    const nextValue = (field: string, current: number, max: number): number => {
      if (field === '*') {
        return current + 1 > max ? 0 : current + 1;
      }
      // Handle step values like '*/5', '*/15'
      const stepMatch = field.match(/^\*\/(\d+)$/);
      if (stepMatch) {
        const step = parseInt(stepMatch[1], 10);
        return Math.ceil((current + 1) / step) * step;
      }
      // Handle comma-separated lists: pick the smallest value > current
      if (field.includes(',')) {
        const values = field.split(',').map(Number).filter((n) => !isNaN(n));
        values.sort((a, b) => a - b);
        const next = values.find((v) => v > current);
        return next !== undefined ? next : values[0];
      }
      // Handle ranges like '0-30'
      const rangeMatch = field.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (current >= end) return start;
        return Math.max(start, current + 1);
      }
      // Single value
      const num = parseInt(field, 10);
      return isNaN(num) ? current + 1 : num;
    };

    try {
      const nextMin = nextValue(minute, currentMinute, 59);
      const nextHr =
        nextMin <= currentMinute
          ? nextValue(hour, currentHour, 23)
          : currentHour;

      const nextDate = new Date(now);
      nextDate.setMinutes(nextMin, 0, 0);
      nextDate.setHours(nextHr);

      // If the computed time is in the past, push to next hour
      if (nextDate.getTime() <= now) {
        nextDate.setHours(nextDate.getHours() + 1);
      }

      return nextDate.getTime();
    } catch {
      return now + 60_000;
    }
  }

  private executeTask(task: Task): void {
    console.log(`[CronScheduler] Executing task "${task.name}" (${task.id})`);

    const now = Date.now();
    const nextRun = this.estimateNextRun(task.cronExpression, now);
    queries.updateTaskRunTime(task.id, now, nextRun);

    // If we have a WebSocketManager, emit the task trigger event
    if (this.wsManager) {
      // Emit to all clients so they know a task is being executed
      this.wsManager.broadcastToChat('__system__', 'task:trigger', {
        taskId: task.id,
        botId: task.botId,
        action: task.action,
        timestamp: now,
      });

      // Also trigger the task:trigger event via the WebSocket manager
      this.wsManager.broadcastToChat('__system__', 'task:execute', {
        taskId: task.id,
        botId: task.botId,
        action: task.action,
        timestamp: now,
      });
    }
  }
}
