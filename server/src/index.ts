// ============================================================
// Hermes Chat — Server Entry Point
// Initialisation order:
//   1. Load configuration
//   2. Initialise database + create tables
//   3. Express app + middleware
//   4. HTTP server
//   5. Register API routes
//   6. WebSocket / Socket.IO manager
//   7. Error handling middleware
//   8. Cron scheduler (load from DB)
//   9. Start listening
//  10. Graceful shutdown handlers
// ============================================================

import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { loadConfig } from './config.js';
import { initializeDatabase } from './db/connection.js';
import { createTables } from './db/schema.js';
import { registerRoutes } from './routes/index.js';
import { WebSocketManager } from './socket/manager.js';
import { CronScheduler } from './services/cron.js';
import { errorHandler } from './middleware/errorHandler.js';

// -----------------------------------------------------------
// Logger
// -----------------------------------------------------------

const logger = pino({
  name: 'hermes-chat',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

// -----------------------------------------------------------
// Main
// -----------------------------------------------------------

async function main(): Promise<void> {
  // ---- 1. Load configuration ----
  const config = loadConfig();
  logger.info('Configuration loaded.');

  // ---- 2. Initialise database ----
  logger.info('Initialising database...');
  const db = initializeDatabase(config.db.dbPath);
  createTables(db);
  logger.info(`Database ready at ${config.db.dbPath}`);

  // ---- 3. Express app + middleware ----
  const app = express();

  app.use(cors({ origin: config.server.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // ---- 4. HTTP server ----
  const httpServer = createServer(app);

  // ---- 5. Register API routes ----
  registerRoutes(app);
  logger.info('API routes registered.');

  // ---- 6. WebSocket / Socket.IO manager ----
  const wsManager = new WebSocketManager(httpServer);
  logger.info('WebSocket manager initialised.');

  // Expose wsManager to route handlers via app.locals
  app.locals.wsManager = wsManager;

  // ---- 7. Error handling middleware (registered last) ----
  app.use(errorHandler);

  // ---- 8. Cron scheduler ----
  const cronScheduler = new CronScheduler(wsManager);
  app.locals.cronScheduler = cronScheduler;

  // ---- 9. Start listening ----
  httpServer.listen(config.server.port, () => {
    logger.info(
      `Hermes Chat server listening on http://localhost:${config.server.port}`,
    );

    // Load cron tasks only after server is ready
    cronScheduler.loadFromDB().catch((err: Error) => {
      logger.error(err, 'Failed to load cron tasks from DB.');
    });
  });

  // ---- 10. Graceful shutdown ----
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    // Step 1: Stop all cron jobs
    cronScheduler.stopAll();
    logger.info('Cron scheduler stopped.');

    // Step 2: Close Socket.IO and all Hermes connections
    await wsManager.close();
    logger.info('WebSocket connections closed.');

    // Step 3: Close the HTTP server
    httpServer.close(() => {
      logger.info('HTTP server closed.');
    });

    // Step 4: Close the database connection
    db.close();
    logger.info('Database connection closed.');

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Prevent unhandled rejections from crashing the process silently
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error(reason, 'Unhandled rejection.');
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error(err, 'Uncaught exception.');
    process.exit(1);
  });
}

main().catch((err: Error) => {
  logger.error(err, 'Failed to start server.');
  process.exit(1);
});
