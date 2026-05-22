// ============================================================
// Hermes Chat — Message Routes
// Send a new message (creates the chat implicitly if needed)
// and search across message content. Message delivery to bots
// is handled by WebSocketManager via Socket.IO events.
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as queries from '../db/queries.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Message } from '../../../shared/types.js';
import { MessageType, MessageStatus } from '../../../shared/types.js';
import { SOCKET_EVENTS } from '../../../shared/constants.js';

const router: Router = Router();

// -----------------------------------------------------------
// POST /api/messages — Send a new message
// -----------------------------------------------------------
router.post('/messages', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { chatId, content, type } = req.body;

    if (!chatId || !content) {
      throw new AppError(400, 'VALIDATION_ERROR', 'chatId and content are required.');
    }

    const messageType = (type as MessageType) ?? MessageType.TEXT;
    const now = Date.now();

    // Ensure chat exists (create if not)
    let chat = queries.getChatById(chatId);
    if (!chat) {
      chat = {
        id: chatId,
        title: content.slice(0, 40),
        botId: req.body.botId ?? 'unknown',
        unreadCount: 0,
        updatedAt: now,
        createdAt: now,
      };
      queries.saveChat(chat);
    }

    const message: Message = {
      id: uuidv4(),
      type: messageType,
      chatId,
      senderId: req.body.senderId ?? 'user',
      content: String(content),
      metadata: req.body.metadata ?? {},
      status: MessageStatus.SENT,
      timestamp: now,
    };

    queries.saveMessage(message);
    queries.updateChatLastMessage(chatId, content.slice(0, 100), now);

    // Notify the WebSocketManager to broadcast to chat room
    const wsManager = req.app.locals.wsManager;
    if (wsManager && typeof wsManager.broadcastToChat === 'function') {
      wsManager.broadcastToChat(chatId, SOCKET_EVENTS.MESSAGE_NEW, message);
    }

    res.status(201).json({ data: message });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// GET /api/messages/search — Full-text search across messages
// -----------------------------------------------------------
router.get('/messages/search', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Query parameter "q" is required.');
    }

    const chatId = req.query.chatId as string | undefined;
    const results: Message[] = queries.searchMessages(q.trim(), chatId);
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
