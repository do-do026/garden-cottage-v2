// ============================================================
// Hermes Chat — Chat Zustand Store
// Single source of truth for chat conversations and their
// messages. Messages are keyed by chatId for O(1) lookup.
// ============================================================

import { create } from 'zustand';
import type { Chat, Message } from '@shared/types';

// -----------------------------------------------------------
// State Shape
// -----------------------------------------------------------

export interface ChatState {
  /** All chat conversations, sorted by updatedAt descending. */
  chats: Chat[];
  /** Messages keyed by chatId for efficient per-chat access. */
  messages: Record<string, Message[]>;
  /** ID of the currently active (visible) chat, or null. */
  activeChatId: string | null;
  /** Whether a chat/message fetch is in progress. */
  isLoading: boolean;
  /** Last error message, or null when no error. */
  error: string | null;
  /** Map of chatId → currently active bot ID for routing replies. */
  activeBotId: Record<string, string>;

  // -- Actions -------------------------------------------------

  /** Switch the active chat conversation. */
  setActiveChat: (chatId: string) => void;
  /** Set which bot the next message should be routed to in a chat. */
  setActiveBotId: (chatId: string, botId: string | null) => void;
  /** Add a bot participant to a chat. */
  addChatParticipant: (chatId: string, botId: string) => void;
  /** Remove a bot participant from a chat. */
  removeChatParticipant: (chatId: string, botId: string) => void;
  /** Append a single message to its chat's message list. */
  addMessage: (message: Message) => void;
  /** Partially update an existing message (e.g. status change). */
  updateMessage: (id: string, chatId: string, partial: Partial<Message>) => void;
  /** Insert a new chat into the list (keeps updatedAt sort). */
  addChat: (chat: Chat) => void;
  /** Remove a chat and its messages from state. */
  removeChat: (id: string) => void;
  /** Partially update an existing chat's fields. */
  updateChat: (id: string, partial: Partial<Chat>) => void;
  /** Reset unread count to zero for a given chat. */
  markAsRead: (chatId: string) => void;
  /** Replace the entire chats array (e.g. after initial fetch). */
  setChats: (chats: Chat[]) => void;
  /** Replace the message list for a specific chat. */
  setMessages: (chatId: string, messages: Message[]) => void;
  /** Append a batch of messages (e.g. pagination load-more). */
  appendMessages: (chatId: string, messages: Message[]) => void;
  /** Set the loading flag. */
  setLoading: (loading: boolean) => void;
  /** Set or clear the error message. */
  setError: (error: string | null) => void;
  /** Remove a single message by id from a specific chat. */
  removeMessage: (id: string, chatId: string) => void;
  /** Look up a chat by its id. Returns undefined if not found. */
  getChatById: (id: string) => Chat | undefined;
}

// -----------------------------------------------------------
// Store
// -----------------------------------------------------------

export const useChatStore = create<ChatState>((set, get) => ({
  // -- Initial state --
  chats: [],
  messages: {},
  activeChatId: null,
  isLoading: false,
  error: null,
  activeBotId: {},

  // -- Actions --

  setActiveChat: (chatId: string): void => {
    set({ activeChatId: chatId });
  },

  addMessage: (message: Message): void => {
    set((state) => {
      let chatMessages = state.messages[message.chatId] ?? [];

      // Avoid inserting duplicate messages by ID
      if (chatMessages.some((m) => m.id === message.id)) {
        return state;
      }

      // Smart cleanup: when a real (non-temp) message arrives, remove any
      // optimistic temp messages that match the same sender + content + chat.
      // This prevents the "duplicate key" race condition where both the
      // optimistic temp and the Socket.IO broadcast coexist briefly.
      if (!message.id.startsWith('temp-')) {
        chatMessages = chatMessages.filter(
          (m) =>
            !(
              m.id.startsWith('temp-') &&
              m.senderId === message.senderId &&
              m.content === message.content
            ),
        );
      }

      return {
        messages: {
          ...state.messages,
          [message.chatId]: [...chatMessages, message],
        },
      };
    });
  },

  updateMessage: (id: string, chatId: string, partial: Partial<Message>): void => {
    set((state) => {
      const chatMessages = state.messages[chatId];
      if (!chatMessages) return state;
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.map((m) =>
            m.id === id ? { ...m, ...partial } : m,
          ),
        },
      };
    });
  },

  addChat: (chat: Chat): void => {
    set((state) => {
      // Avoid duplicates and keep sorted by updatedAt desc
      if (state.chats.some((c) => c.id === chat.id)) {
        return state;
      }
      const updated = [chat, ...state.chats];
      updated.sort((a, b) => b.updatedAt - a.updatedAt);
      return { chats: updated };
    });
  },

  removeChat: (id: string): void => {
    set((state) => {
      const { [id]: _removed, ...restMessages } = state.messages;
      return {
        chats: state.chats.filter((c) => c.id !== id),
        messages: restMessages,
        activeChatId: state.activeChatId === id ? null : state.activeChatId,
      };
    });
  },

  updateChat: (id: string, partial: Partial<Chat>): void => {
    set((state) => ({
      chats: state.chats.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    }));
  },

  markAsRead: (chatId: string): void => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },

  setChats: (chats: Chat[]): void => {
    const sorted = [...chats];
    sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ chats: sorted });
  },

  setMessages: (chatId: string, messages: Message[]): void => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    }));
  },

  appendMessages: (chatId: string, messages: Message[]): void => {
    set((state) => {
      const existing = state.messages[chatId] ?? [];
      const existingIds = new Set(existing.map((m) => m.id));
      const unique = messages.filter((m) => !existingIds.has(m.id));
      if (unique.length === 0) return state;
      return {
        messages: {
          ...state.messages,
          [chatId]: [...existing, ...unique],
        },
      };
    });
  },

  setLoading: (loading: boolean): void => {
    set({ isLoading: loading });
  },

  setError: (error: string | null): void => {
    set({ error });
  },

  removeMessage: (id: string, chatId: string): void => {
    set((state) => {
      const chatMessages = state.messages[chatId];
      if (!chatMessages) return state;
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.filter((m) => m.id !== id),
        },
      };
    });
  },

  getChatById: (id: string): Chat | undefined => {
    return get().chats.find((c) => c.id === id);
  },

  setActiveBotId: (chatId: string, botId: string | null): void => {
    set((state) => {
      if (botId === null) {
        const { [chatId]: _removed, ...rest } = state.activeBotId;
        return { activeBotId: rest };
      }
      return { activeBotId: { ...state.activeBotId, [chatId]: botId } };
    });
  },

  addChatParticipant: (chatId: string, botId: string): void => {
    set((state) => ({
      chats: state.chats.map((c) => {
        if (c.id !== chatId) return c;
        const participants = c.participants ?? [];
        if (participants.includes(botId)) return c;
        return { ...c, participants: [...participants, botId] };
      }),
    }));
  },

  removeChatParticipant: (chatId: string, botId: string): void => {
    set((state) => ({
      chats: state.chats.map((c) => {
        if (c.id !== chatId) return c;
        const participants = (c.participants ?? []).filter((p) => p !== botId);
        return { ...c, participants };
      }),
    }));
  },
}));
