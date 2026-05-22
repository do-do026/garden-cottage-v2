// ============================================================
// Hermes Chat — REST API Client
// Thin wrapper around the Fetch API that provides typed methods
// for every backend endpoint. All errors are normalised to the
// ApiError shape defined in shared types.
// ============================================================

import { API_BASE_URL } from '@/config';
import type { Bot, Chat, Message, Task, UserSettings, PaginatedResponse } from '@shared/types';

// -----------------------------------------------------------
// Error type
// -----------------------------------------------------------

/** Structured API error thrown by this client. */
export class ApiError extends Error {
  /** HTTP status code. */
  public readonly status: number;
  /** Machine-readable error code. */
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// -----------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------

/** Build a full API URL from a relative path. */
function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/** Shared fetch wrapper that normalises errors. */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = apiUrl(path);

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': 'hermes-chat-dev-key',
  };

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    let code = 'UNKNOWN';
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
      }
    } catch {
      // Use default error message
    }
    throw new ApiError(res.status, code, message);
  }

  return res.json() as Promise<T>;
}

// -----------------------------------------------------------
// Bot endpoints
// -----------------------------------------------------------

export interface CreateBotPayload {
  name: string;
  hermesAddress: string;
  hermesPort: number;
  authToken?: string;
}

/** Fetch all registered bots. */
export async function getBots(): Promise<Bot[]> {
  const res = await request<{ data: Bot[] }>('/bots');
  return res.data;
}

/** Register a new bot. */
export async function createBot(config: CreateBotPayload): Promise<Bot> {
  const res = await request<{ data: Bot }>('/bots', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return res.data;
}

/** Delete a bot by id. */
export async function deleteBot(id: string): Promise<void> {
  await request(`/bots/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Request the backend to connect to a Hermes bot. */
export async function connectBot(id: string): Promise<Bot> {
  const res = await request<{ data: Bot }>(
    `/bots/${encodeURIComponent(id)}/connect`,
    { method: 'POST' },
  );
  return res.data;
}

/** Payload for updating a bot's context strategy. */
export interface UpdateBotContextPayload {
  contextStrategy: string;
  maxContextMessages: number;
}

/** Update a bot's context strategy and max context messages. */
export async function updateBotContext(botId: string, data: UpdateBotContextPayload): Promise<Bot> {
  const res = await request<{ data: Bot }>(`/bots/${encodeURIComponent(botId)}/context`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}

// -----------------------------------------------------------
// Chat endpoints
// -----------------------------------------------------------

/** Fetch all chat conversations. */
export async function getChats(): Promise<Chat[]> {
  const res = await request<{ data: Chat[] }>('/chats');
  return res.data;
}

/** Fetch paginated messages for a chat. */
export async function getMessages(
  chatId: string,
  page: number = 1,
): Promise<PaginatedResponse<Message>> {
  return request<PaginatedResponse<Message>>(
    `/chats/${encodeURIComponent(chatId)}/messages?page=${page}`,
  );
}

export interface SendMessagePayload {
  chatId: string;
  content: string;
  type?: string;
}

/** Send a message to a chat. */
export async function sendMessage(data: SendMessagePayload): Promise<Message> {
  const res = await request<{ data: Message }>('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

/** Search messages across all chats. */
export async function searchMessages(query: string): Promise<Message[]> {
  const res = await request<{ data: Message[] }>(
    `/messages/search?q=${encodeURIComponent(query)}`,
  );
  return res.data;
}

/** Add a bot participant to a chat. */
export async function addChatParticipant(chatId: string, botId: string): Promise<Chat> {
  const res = await request<{ data: Chat }>(
    `/chats/${encodeURIComponent(chatId)}/participants`,
    { method: 'POST', body: JSON.stringify({ botId }) },
  );
  return res.data;
}

/** Remove a bot participant from a chat. */
export async function removeChatParticipant(chatId: string, botId: string): Promise<void> {
  await request(`/chats/${encodeURIComponent(chatId)}/participants/${encodeURIComponent(botId)}`, {
    method: 'DELETE',
  });
}

// -----------------------------------------------------------
// Task endpoints
// -----------------------------------------------------------

export interface CreateTaskPayload {
  botId: string;
  name: string;
  cronExpression: string;
  action: string;
}

/** Fetch all tasks, optionally filtered by bot. */
export async function getTasks(botId?: string): Promise<Task[]> {
  const query = botId ? `?botId=${encodeURIComponent(botId)}` : '';
  const res = await request<{ data: Task[] }>(`/tasks${query}`);
  return res.data;
}

/** Create a new scheduled task. */
export async function createTask(config: CreateTaskPayload): Promise<Task> {
  const res = await request<{ data: Task }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return res.data;
}

/** Update an existing task. */
export async function updateTask(
  id: string,
  data: Partial<CreateTaskPayload>,
): Promise<Task> {
  const res = await request<{ data: Task }>(
    `/tasks/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

/** Delete a task by id. */
export async function deleteTask(id: string): Promise<void> {
  await request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// -----------------------------------------------------------
// Settings endpoints
// -----------------------------------------------------------

/** Fetch the current user settings. */
export async function getSettings(): Promise<UserSettings> {
  const res = await request<{ data: UserSettings }>('/config');
  return res.data;
}

/** Update user settings. */
export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const res = await request<{ data: UserSettings }>('/config', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
  return res.data;
}

/** Test connectivity to a Hermes agent address. */
export async function testHermesConnection(config: {
  address: string;
  port: number;
  token?: string;
}): Promise<{ success: boolean; latencyMs?: number }> {
  const res = await request<{ success: boolean; latencyMs?: number }>(
    '/config/test-hermes',
    {
      method: 'POST',
      body: JSON.stringify(config),
    },
  );
  return res;
}
