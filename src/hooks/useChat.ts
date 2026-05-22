// ============================================================
// Hermes Chat — useChat Hook
// Core chat logic: sending messages (with optimistic updates),
// loading history, switching active chats, and read receipts.
// Composes chatStore, socket service, and the API layer.
// ============================================================

import { useCallback, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { socketService } from '@/services/socket';
import * as api from '@/services/api';
import type { Message, Chat, MessageType } from '@shared/types';
import { MessageStatus, MessageType as MT } from '@shared/types';


export interface UseChatReturn {
  /** All chat conversations. */
  chats: Chat[];
  /** Messages for the currently active chat. */
  messages: Message[];
  /** The currently active chat object, or null. */
  activeChat: Chat | null;
  /** Whether a fetch operation is in progress. */
  isLoading: boolean;
  /** Last error message, if any. */
  error: string | null;
  /** Send a text (or other type) message to the active chat. */
  sendMessage: (text: string, type?: MessageType) => Promise<void>;
  /** Load paginated message history for a chat. */
  loadHistory: (chatId: string, page?: number) => Promise<void>;
  /** Switch to a different chat conversation. */
  selectChat: (chatId: string) => void;
  /** Mark a chat as read (reset unread count). */
  markAsRead: (chatId: string) => void;
}

export function useChat(): UseChatReturn {
  const chats = useChatStore((s) => s.chats);
  const messages = useChatStore((s) => s.messages);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const isLoading = useChatStore((s) => s.isLoading);
  const error = useChatStore((s) => s.error);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const setMessages = useChatStore((s) => s.setMessages);
  const appendMessages = useChatStore((s) => s.appendMessages);
  const setLoading = useChatStore((s) => s.setLoading);
  const setError = useChatStore((s) => s.setError);
  const markAsReadStore = useChatStore((s) => s.markAsRead);

  const activeChat = useMemo<Chat | null>(() => {
    if (!activeChatId) return null;
    return chats.find((c) => c.id === activeChatId) ?? null;
  }, [activeChatId, chats]);

  const activeMessages = useMemo<Message[]>(() => {
    if (!activeChatId) return [];
    return messages[activeChatId] ?? [];
  }, [activeChatId, messages]);

  /** Send a message with optimistic UI update. */
  const sendMessage = useCallback(
    async (text: string, type?: MessageType): Promise<void> => {
      if (!activeChatId || !text.trim()) return;

      const messageType = type ?? MT.TEXT;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Build an optimistic message — shows up immediately in the UI
      const optimistic: Message = {
        id: tempId,
        type: messageType,
        chatId: activeChatId,
        senderId: 'user',
        content: text.trim(),
        metadata: {},
        status: MessageStatus.SENDING,
        timestamp: Date.now(),
      };

      addMessage(optimistic);

      try {
        // REST API: server saves to DB and broadcasts via Socket.IO.
        const sent = await api.sendMessage({
          chatId: activeChatId,
          content: text.trim(),
          type: messageType,
        });

        // Merge the optimistic temp into the real message.
        // Three cases are handled transparently:
        //  A) Socket broadcast already arrived → smart addMessage() already
        //     cleaned the temp and inserted the real message → updateMessage
        //     is a no-op (temp-xxx no longer exists in the array).
        //  B) Socket broadcast hasn't arrived yet → updateMessage replaces
        //     temp-xxx with the real UUID. When broadcast later arrives,
        //     addMessage() dedup by ID catches it.
        //  C) Socket is disconnected → updateMessage still works; the real
        //     message persists from the REST response alone.
        updateMessage(tempId, activeChatId, {
          id: sent.id,
          status: MessageStatus.SENT,
          timestamp: sent.timestamp,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to send message';
        updateMessage(tempId, activeChatId, {
          status: MessageStatus.FAILED,
        });
        setError(msg);
      }
    },
    [activeChatId, addMessage, updateMessage, setError],
  );

  /** Load paginated message history for a chat. */
  const loadHistory = useCallback(
    async (chatId: string, page: number = 1): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getMessages(chatId, page);
        if (page === 1) {
          setMessages(chatId, response.data);
        } else {
          appendMessages(chatId, response.data);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to load messages';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setMessages, appendMessages],
  );

  /** Switch active chat and join the Socket.IO room. */
  const selectChat = useCallback(
    (chatId: string): void => {
      if (activeChatId) {
        socketService.leaveChat(activeChatId);
      }
      setActiveChat(chatId);
      socketService.joinChat(chatId);
      // Auto-load first page of history on selection
      markAsReadStore(chatId);
    },
    [activeChatId, setActiveChat, markAsReadStore],
  );

  /** Reset unread count for a chat. */
  const markAsRead = useCallback(
    (chatId: string): void => {
      markAsReadStore(chatId);
    },
    [markAsReadStore],
  );

  return {
    chats,
    messages: activeMessages,
    activeChat,
    isLoading,
    error,
    sendMessage,
    loadHistory,
    selectChat,
    markAsRead,
  };
}
