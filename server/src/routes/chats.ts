// ============================================================
// Hermes Chat — Chat Routes
// List chats and fetch paginated message history for a chat.
// Chat creation happens implicitly when the first message is
// sent via the messages route.
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import * as queries from '../db/queries.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Chat, Message, PaginatedResponse } from '../../../shared/types.js';
import { PAGINATION_SIZE } from '../../../shared/constants.js';

const router: Router = Router();

// -----------------------------------------------------------
// GET /api/chats — List all chats
// -----------------------------------------------------------
router.get('/chats', (_req: Request, res: Response, next: NextFunction): void => {
  try {
    const chats: Chat[] = queries.getChats();
    res.json({ data: chats });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// GET /api/chats/:id/messages — Fetch paginated messages for a chat
// -----------------------------------------------------------
router.get('/chats/:id/messages', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const chat = queries.getChatById(id);
    if (!chat) {
      throw new AppError(404, 'NOT_FOUND', `Chat "${id}" not found.`);
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = PAGINATION_SIZE;
    const offset = (page - 1) * pageSize;

    const allMessages: Message[] = queries.getMessages(id, pageSize + 1, offset);
    const hasMore = allMessages.length > pageSize;
    const data = hasMore ? allMessages.slice(0, pageSize) : allMessages;

    // Execute a COUNT query to get the actual total across all pages
    const total: number = queries.getMessageCount(id);

    const response: PaginatedResponse<Message> = {
      data,
      total,
      page,
      pageSize,
      hasMore,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// POST /api/chats/:id/participants — Add a bot to a chat
// -----------------------------------------------------------
router.post('/chats/:id/participants', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const { botId } = req.body;
    if (!botId) throw new AppError(400, 'VALIDATION_ERROR', 'botId is required.');

    const chat = queries.getChatById(id);
    if (!chat) throw new AppError(404, 'NOT_FOUND', `Chat "${id}" not found.`);

    const participants = chat.participants ?? [];
    if (!participants.includes(botId)) {
      participants.push(botId);
    }
    queries.updateChatParticipants(id, participants);

    res.json({ data: { ...chat, participants } });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------
// DELETE /api/chats/:id/participants/:botId — Remove a bot from a chat
// -----------------------------------------------------------
router.delete('/chats/:id/participants/:botId', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id, botId } = req.params;
    const chat = queries.getChatById(id);
    if (!chat) throw new AppError(404, 'NOT_FOUND', `Chat "${id}" not found.`);

    const participants = (chat.participants ?? []).filter((p: string) => p !== botId);
    queries.updateChatParticipants(id, participants);

    res.json({ data: { ...chat, participants } });
  } catch (err) {
    next(err);
  }
});

export default router;
