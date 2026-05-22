// ============================================================
// Hermes Chat — Data Access Layer
// Typed CRUD wrappers around the SQLite database. Every
// function maps between camelCase TypeScript types and
// snake_case SQLite column names.
//
// JSON metadata columns are serialised/deserialised
// automatically so callers never touch raw JSON strings.
// ============================================================

import { getDb } from './connection.js';
import type {
  Message,
  MessageStatus,
  Chat,
  Bot,
  BotStatus,
  Task,
  TaskStatus,
  UserSettings,
  MessageMetadata,
} from '../../../shared/types.js';
import { PAGINATION_SIZE } from '../../../shared/constants.js';

// -----------------------------------------------------------
// Internal Helpers
// -----------------------------------------------------------

/** Convert a snake_case DB row to a camelCase Message. */
function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    type: row.type as Message['type'],
    chatId: row.chat_id as string,
    senderId: row.sender_id as string,
    content: row.content as string,
    metadata: JSON.parse(row.metadata as string) as MessageMetadata,
    status: row.status as MessageStatus,
    timestamp: row.timestamp as number,
    editedAt: row.edited_at as number | undefined,
  };
}

/** Convert a snake_case DB row to a camelCase Chat. */
function rowToChat(row: Record<string, unknown>): Chat {
  return {
    id: row.id as string,
    title: row.title as string,
    botId: row.bot_id as string,
    lastMessage: row.last_message as string | undefined,
    unreadCount: row.unread_count as number,
    updatedAt: row.updated_at as number,
    createdAt: row.created_at as number,
  };
}

/** Convert a snake_case DB row to a camelCase Bot. */
function rowToBot(row: Record<string, unknown>): Bot {
  return {
    id: row.id as string,
    name: row.name as string,
    avatarUrl: row.avatar_url as string | undefined,
    hermesAddress: row.hermes_address as string,
    hermesPort: row.hermes_port as number,
    authToken: row.auth_token as string | undefined,
    status: row.status as BotStatus,
    lastSeen: row.last_seen as number,
  };
}

/** Convert a snake_case DB row to a camelCase Task. */
function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    botId: row.bot_id as string,
    name: row.name as string,
    cronExpression: row.cron_expression as string,
    action: row.action as string,
    status: row.status as TaskStatus,
    lastRun: row.last_run as number | undefined,
    nextRun: row.next_run as number | undefined,
  };
}

/** Convert a snake_case DB row to a UserSettings object. */
function rowToUserSettings(row: Record<string, unknown>): UserSettings {
  return {
    theme: row.theme as string,
    primaryColor: row.primary_color as string,
    notifications: Boolean(row.notifications),
    language: row.language as string,
  };
}

// -----------------------------------------------------------
// Message Queries
// -----------------------------------------------------------

/** Get the total number of messages for a chat. */
export function getMessageCount(chatId: string): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE chat_id = ?')
    .get(chatId) as { count: number };
  return row.count;
}

/** Fetch messages for a chat, newest first, with optional pagination. */
export function getMessages(
  chatId: string,
  limit: number = PAGINATION_SIZE,
  offset: number = 0,
): Message[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE chat_id = ?
       ORDER BY timestamp DESC
       LIMIT ? OFFSET ?`,
    )
    .all(chatId, limit, offset) as Record<string, unknown>[];
  return rows.map(rowToMessage);
}

/** Insert or replace a message in the database. */
export function saveMessage(msg: Message): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO messages
       (id, type, chat_id, sender_id, content, metadata, status, timestamp, edited_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    msg.id,
    msg.type,
    msg.chatId,
    msg.senderId,
    msg.content,
    JSON.stringify(msg.metadata),
    msg.status,
    msg.timestamp,
    msg.editedAt ?? null,
  );
}

/** Update the delivery status of a message. */
export function updateMessageStatus(id: string, status: MessageStatus): void {
  const db = getDb();
  db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, id);
}

/** Full-text–style search across message content, optionally scoped to a chat. */
export function searchMessages(
  query: string,
  chatId?: string,
): Message[] {
  const db = getDb();
  const like = `%${query}%`;
  let sql = 'SELECT * FROM messages WHERE content LIKE ?';
  const params: unknown[] = [like];

  if (chatId !== undefined) {
    sql += ' AND chat_id = ?';
    params.push(chatId);
  }

  sql += ' ORDER BY timestamp DESC LIMIT 100';
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToMessage);
}

// -----------------------------------------------------------
// Chat Queries
// -----------------------------------------------------------

/** Fetch all chats, ordered by most recently updated first. */
export function getChats(): Chat[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM chats ORDER BY updated_at DESC')
    .all() as Record<string, unknown>[];
  return rows.map(rowToChat);
}

/** Fetch a single chat by its id. */
export function getChatById(id: string): Chat | undefined {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM chats WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToChat(row) : undefined;
}

/** Insert or replace a chat record. */
export function saveChat(chat: Chat): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO chats
       (id, title, bot_id, last_message, unread_count, updated_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    chat.id,
    chat.title,
    chat.botId,
    chat.lastMessage ?? null,
    chat.unreadCount,
    chat.updatedAt,
    chat.createdAt,
  );
}

/** Update the preview (last message) and timestamp for a chat. */
export function updateChatLastMessage(
  id: string,
  lastMessage: string,
  timestamp: number,
): void {
  const db = getDb();
  db.prepare(
    'UPDATE chats SET last_message = ?, updated_at = ? WHERE id = ?',
  ).run(lastMessage, timestamp, id);
}

/** Atomically increment the unread count for a chat. */
export function incrementUnreadCount(id: string): void {
  const db = getDb();
  db.prepare(
    'UPDATE chats SET unread_count = unread_count + 1 WHERE id = ?',
  ).run(id);
}

/** Reset the unread count to zero for a chat. */
export function resetUnreadCount(id: string): void {
  const db = getDb();
  db.prepare('UPDATE chats SET unread_count = 0 WHERE id = ?').run(id);
}

// -----------------------------------------------------------
// Bot Queries
// -----------------------------------------------------------

/** Fetch all registered bots. */
export function getBots(): Bot[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM bots ORDER BY name ASC')
    .all() as Record<string, unknown>[];
  return rows.map(rowToBot);
}

/** Fetch a single bot by id. */
export function getBotById(id: string): Bot | undefined {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM bots WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToBot(row) : undefined;
}

/** Insert or replace a bot record. Timestamps are auto-set on insert. */
export function saveBot(bot: Bot): void {
  const db = getDb();
  const now = Date.now();

  // Preserve existing created_at if the bot already exists
  const existing = db
    .prepare('SELECT created_at FROM bots WHERE id = ?')
    .get(bot.id) as { created_at: number } | undefined;

  const createdAt = existing?.created_at ?? now;

  db.prepare(
    `INSERT OR REPLACE INTO bots
       (id, name, avatar_url, hermes_address, hermes_port, auth_token, status, last_seen, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    bot.id,
    bot.name,
    bot.avatarUrl ?? null,
    bot.hermesAddress,
    bot.hermesPort,
    bot.authToken ?? null,
    bot.status,
    bot.lastSeen,
    createdAt,
    now,
  );
}

/** Update only the status field of a bot. */
export function updateBotStatus(id: string, status: BotStatus): void {
  const db = getDb();
  db.prepare('UPDATE bots SET status = ?, updated_at = ? WHERE id = ?').run(
    status,
    Date.now(),
    id,
  );
}

/** Delete a bot and all related data (CASCADE handles chats, messages, tasks). */
export function deleteBot(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM bots WHERE id = ?').run(id);
}

// -----------------------------------------------------------
// Task Queries
// -----------------------------------------------------------

/** Fetch tasks, optionally filtered by bot. */
export function getTasks(botId?: string): Task[] {
  const db = getDb();
  let sql = 'SELECT * FROM tasks';
  const params: unknown[] = [];

  if (botId !== undefined) {
    sql += ' WHERE bot_id = ?';
    params.push(botId);
  }

  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToTask);
}

/** Fetch a single task by id. */
export function getTaskById(id: string): Task | undefined {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToTask(row) : undefined;
}

/** Insert or replace a task. Timestamps are auto-set on insert. */
export function saveTask(task: Task): void {
  const db = getDb();
  const now = Date.now();

  const existing = db
    .prepare('SELECT created_at FROM tasks WHERE id = ?')
    .get(task.id) as { created_at: number } | undefined;

  const createdAt = existing?.created_at ?? now;

  db.prepare(
    `INSERT OR REPLACE INTO tasks
       (id, bot_id, name, cron_expression, action, status, last_run, next_run, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    task.id,
    task.botId,
    task.name,
    task.cronExpression,
    task.action,
    task.status,
    task.lastRun ?? null,
    task.nextRun ?? null,
    createdAt,
    now,
  );
}

/** Update only the status of a task. */
export function updateTaskStatus(id: string, status: TaskStatus): void {
  const db = getDb();
  db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?').run(
    status,
    Date.now(),
    id,
  );
}

/** Record the last and next run timestamps for a task. */
export function updateTaskRunTime(
  id: string,
  lastRun: number,
  nextRun: number,
): void {
  const db = getDb();
  db.prepare(
    'UPDATE tasks SET last_run = ?, next_run = ?, updated_at = ? WHERE id = ?',
  ).run(lastRun, nextRun, Date.now(), id);
}

/** Delete a task by id. */
export function deleteTask(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

// -----------------------------------------------------------
// User Settings Queries
// -----------------------------------------------------------

/** Fetch the current user settings (single-row table). */
export function getUserSettings(): UserSettings {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM user_settings WHERE id = ?')
    .get('default') as Record<string, unknown> | undefined;

  if (row === undefined) {
    // Return defaults if no row exists yet
    return {
      theme: 'light',
      primaryColor: '#2196f3',
      notifications: true,
      language: 'en',
    };
  }

  return rowToUserSettings(row);
}

/** Upsert the user settings row. */
export function saveUserSettings(settings: UserSettings): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO user_settings
       (id, theme, primary_color, notifications, language)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    'default',
    settings.theme,
    settings.primaryColor,
    settings.notifications ? 1 : 0,
    settings.language,
  );
}
