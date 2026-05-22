// ============================================================
// Hermes Chat — WebSocket / Socket.IO Manager
// Manages Socket.IO server lifecycle, room-based chat message
// broadcasting, and Hermes agent WebSocket connections.
//
// Events (aligned with shared/constants.ts SOCKET_EVENTS):
//   message:send    — client sends a message to a chat
//   message:new     — server broadcasts new message to room
//   bot:connect     — client requests a bot connection
//   bot:status      — server broadcasts bot status changes
//   game:result     — Hermes sends game result (bidirectional)
//   progress:update — Hermes sends a progress update
//   ui:mod          — Hermes sends a UI modification
//   task:trigger    — client/scheduler triggers a task
// ============================================================

import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/constants.js';
import { HermesClient } from '../services/hermesClient.js';
import { OperitConnector } from '../services/operitConnector.js';
import * as queries from '../db/queries.js';
import type { Bot, Message, WidgetVoteEvent, WidgetResultEvent } from '../../../shared/types.js';
import { BotStatus, MessageStatus } from '../../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';
import type { HermesMessage } from '../../../shared/types.js';

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

interface ConnectedBot {
  bot: Bot;
  connector: HermesClient | OperitConnector;
}

// -----------------------------------------------------------
// WebSocketManager
// -----------------------------------------------------------

export class WebSocketManager {
  private io: SocketIOServer;
  /** Map of botId → active Hermes connection. */
  private readonly connectedBots: Map<string, ConnectedBot> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    console.log('[WSManager] Socket.IO server initialised.');
  }

  // -----------------------------------------------------------
  // Public API — called by routes
  // -----------------------------------------------------------

  /** Broadcast a message to all sockets in a chat room. */
  broadcastToChat(chatId: string, event: string, data: unknown): void {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  /** Broadcast a bot status change to all connected clients. */
  broadcastBotStatus(botId: string, status: string): void {
    this.io.emit(SOCKET_EVENTS.BOT_STATUS, { botId, status });
  }

  /**
   * Connect to a Hermes agent and establish the WebSocket bridge.
   * Called by the bots route POST /api/bots/:id/connect.
   */
  async connectBot(bot: Bot): Promise<void> {
    // Clean up any existing connection for this bot
    await this.disconnectBot(bot.id);

    const useOperit = bot.connectorType === 'operit';

    if (useOperit) {
      const operitConnector = new OperitConnector({
        host: bot.hermesAddress,
        port: bot.hermesPort,
        authToken: bot.authToken,
        onResponse: (msg: HermesMessage) => {
          this.handleHermesMessage(bot.id, msg);
        },
        onConnect: () => {
          queries.updateBotStatus(bot.id, BotStatus.ONLINE);
          this.broadcastBotStatus(bot.id, BotStatus.ONLINE);
          console.log(`[WSManager] Bot "${bot.name}" (${bot.id}) connected via Operit.`);
        },
        onDisconnect: (reason: string) => {
          queries.updateBotStatus(bot.id, BotStatus.OFFLINE);
          this.broadcastBotStatus(bot.id, BotStatus.OFFLINE);
          this.connectedBots.delete(bot.id);
          console.log(`[WSManager] Bot "${bot.name}" (${bot.id}) Operit disconnected: ${reason}`);
        },
        onError: (err: Error) => {
          console.error(`[WSManager] Bot "${bot.name}" Operit error:`, err.message);
          queries.updateBotStatus(bot.id, BotStatus.ERROR);
          this.broadcastBotStatus(bot.id, BotStatus.ERROR);
        },
      });

      try {
        await operitConnector.connect();
        this.connectedBots.set(bot.id, { bot, connector: operitConnector });
      } catch (err) {
        queries.updateBotStatus(bot.id, BotStatus.ERROR);
        this.broadcastBotStatus(bot.id, BotStatus.ERROR);
        throw err;
      }
    } else {
      // Default: Hermes WebSocket
      const hermesClient = new HermesClient({
        host: bot.hermesAddress,
        port: bot.hermesPort,
        authToken: bot.authToken,
        onMessage: (msg: HermesMessage) => {
          this.handleHermesMessage(bot.id, msg);
        },
        onConnect: () => {
          queries.updateBotStatus(bot.id, BotStatus.ONLINE);
          this.broadcastBotStatus(bot.id, BotStatus.ONLINE);
          console.log(`[WSManager] Bot "${bot.name}" (${bot.id}) connected via Hermes.`);
        },
        onDisconnect: (reason: string) => {
          queries.updateBotStatus(bot.id, BotStatus.OFFLINE);
          this.broadcastBotStatus(bot.id, BotStatus.OFFLINE);
          this.connectedBots.delete(bot.id);
          console.log(`[WSManager] Bot "${bot.name}" (${bot.id}) disconnected: ${reason}`);
        },
        onError: (err: Error) => {
          console.error(`[WSManager] Bot "${bot.name}" error:`, err.message);
          queries.updateBotStatus(bot.id, BotStatus.ERROR);
          this.broadcastBotStatus(bot.id, BotStatus.ERROR);
        },
      });

      try {
        await hermesClient.connect();
        this.connectedBots.set(bot.id, { bot, connector: hermesClient });
      } catch (err) {
        queries.updateBotStatus(bot.id, BotStatus.ERROR);
        this.broadcastBotStatus(bot.id, BotStatus.ERROR);
        throw err;
      }
    }
  }

  /** Disconnect a bot's connector (Hermes or Operit). */
  async disconnectBot(botId: string): Promise<void> {
    const entry = this.connectedBots.get(botId);
    if (entry) {
      entry.connector.close();
      this.connectedBots.delete(botId);
    }
  }

  /** Send a message to a specific bot via its active connector. */
  sendToBot(botId: string, msg: HermesMessage): boolean {
    const entry = this.connectedBots.get(botId);
    if (!entry || !entry.connector.ready) return false;
    entry.connector.send(msg);
    return true;
  }

  /** Gracefully close all connections and the Socket.IO server. */
  async close(): Promise<void> {
    for (const [botId] of this.connectedBots) {
      await this.disconnectBot(botId);
    }
    return new Promise((resolve) => {
      this.io.close(() => {
        console.log('[WSManager] Socket.IO server closed.');
        resolve();
      });
    });
  }

  // -----------------------------------------------------------
  // Socket lifecycle
  // -----------------------------------------------------------

  private handleConnection(socket: Socket): void {
    console.log(`[WSManager] Client connected: ${socket.id}`);

    // -- message:send — forward to Hermes and broadcast to room
    socket.on(SOCKET_EVENTS.MESSAGE_SEND, (msg: Message) => {
      // Persist if not already saved
      if (!msg.id.startsWith('temp-')) {
        queries.saveMessage(msg);
      }

      // Broadcast to everyone in the chat room (including sender for sync)
      this.io.to(`chat:${msg.chatId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, {
        ...msg,
        status: MessageStatus.DELIVERED,
      });

      // Forward to the Hermes agent if connected
      const chat = queries.getChatById(msg.chatId);
      if (chat) {
        const botEntry = this.connectedBots.get(chat.botId);
        if (botEntry?.connector.ready) {
          const hermesMsg: HermesMessage = {
            type: 'chat:message',
            payload: msg,
            timestamp: Date.now(),
            traceId: uuidv4(),
          };
          botEntry.connector.send(hermesMsg);
        }
      }

      // Acknowledge
      socket.emit(SOCKET_EVENTS.MESSAGE_ACK, { messageId: msg.id, status: 'DELIVERED' });
    });

    // -- chat:join — subscribe to a chat room
    socket.on('chat:join', ({ chatId }: { chatId: string }) => {
      if (chatId) {
        socket.join(`chat:${chatId}`);
        // Reset unread count
        queries.resetUnreadCount(chatId);
      }
    });

    // -- chat:leave — unsubscribe from a chat room
    socket.on('chat:leave', ({ chatId }: { chatId: string }) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
      }
    });

    // -- bot:connect — request a bot connection from a client
    socket.on(SOCKET_EVENTS.BOT_CONNECT, async ({ botId }: { botId: string }) => {
      const bot = queries.getBotById(botId);
      if (!bot) {
        socket.emit(SOCKET_EVENTS.BOT_STATUS, {
          botId,
          status: BotStatus.ERROR,
          error: 'Bot not found.',
        });
        return;
      }

      try {
        queries.updateBotStatus(botId, BotStatus.CONNECTING);
        socket.emit(SOCKET_EVENTS.BOT_STATUS, { botId, status: BotStatus.CONNECTING });
        await this.connectBot(bot);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        socket.emit(SOCKET_EVENTS.BOT_STATUS, {
          botId,
          status: BotStatus.ERROR,
          error: message,
        });
      }
    });

    // -- widget:vote — user votes on a widget, forward to bot
    socket.on(SOCKET_EVENTS.WIDGET_VOTE, (event: WidgetVoteEvent) => {
      const chat = queries.getChatById(event.chatId);
      if (!chat) return;

      const botEntry = this.connectedBots.get(chat.botId);
      if (botEntry?.connector.ready) {
        const hermesMsg: HermesMessage = {
          type: 'widget:vote',
          payload: event,
          timestamp: Date.now(),
          traceId: uuidv4(),
        };
        botEntry.connector.send(hermesMsg);
      }
    });

    // -- task:trigger — manually trigger a task
    socket.on(SOCKET_EVENTS.TASK_TRIGGER, ({ taskId }: { taskId: string }) => {
      const task = queries.getTaskById(taskId);
      if (!task) return;

      const botEntry = this.connectedBots.get(task.botId);
      if (botEntry?.connector.ready) {
        const hermesMsg: HermesMessage = {
          type: 'task:execute',
          payload: { taskId: task.id, action: task.action },
          timestamp: Date.now(),
          traceId: uuidv4(),
        };
        botEntry.connector.send(hermesMsg);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WSManager] Client disconnected: ${socket.id}`);
    });
  }

  // -----------------------------------------------------------
  // Hermes → Client message forwarding
  // -----------------------------------------------------------

  private handleHermesMessage(botId: string, msg: HermesMessage): void {
    switch (msg.type) {
      case 'chat:message': {
        // Hermes agent is replying — broadcast to the relevant chat room
        const payload = msg.payload as Record<string, unknown>;
        const chatId = payload?.chatId as string | undefined;
        if (chatId) {
          const message: Message = {
            id: (payload.id as string) ?? uuidv4(),
            type: (payload.type as Message['type']) ?? 'TEXT',
            chatId,
            senderId: botId,
            content: (payload.content as string) ?? '',
            metadata: (payload.metadata as Message['metadata']) ?? {},
            status: MessageStatus.SENT,
            timestamp: msg.timestamp,
          };

          queries.saveMessage(message);
          queries.updateChatLastMessage(chatId, message.content.slice(0, 100), msg.timestamp);
          queries.incrementUnreadCount(chatId);

          this.io.to(`chat:${chatId}`).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
        }
        break;
      }

      case 'game:result': {
        this.io.emit(SOCKET_EVENTS.GAME_RESULT, msg.payload);
        break;
      }

      case 'progress:update': {
        this.io.emit(SOCKET_EVENTS.PROGRESS_UPDATE, msg.payload);
        break;
      }

      case 'ui:mod': {
        this.io.emit(SOCKET_EVENTS.UI_MOD, msg.payload);
        break;
      }

      case 'widget:result': {
        const payload = msg.payload as WidgetResultEvent;
        this.io.to(`chat:${payload.chatId}`).emit(SOCKET_EVENTS.WIDGET_RESULT, payload);
        break;
      }

      case 'widget:closed': {
        const payload = msg.payload as { widgetId: string; chatId: string };
        this.io.to(`chat:${payload.chatId}`).emit(SOCKET_EVENTS.WIDGET_CLOSED, payload);
        break;
      }

      default:
        console.log(`[WSManager] Unhandled Hermes message type: ${msg.type}`);
        break;
    }
  }
}
