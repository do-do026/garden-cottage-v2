// ============================================================
// Hermes Chat — useBotContext Hook
// Manages bot context strategy configuration and computes
// the effective context window for a given bot+chat pair.
// ============================================================

import { useCallback, useMemo } from 'react';
import { useBotStore } from '@/store/botStore';
import { useChatStore } from '@/store/chatStore';
import * as api from '@/services/api';
import type { ContextStrategy } from '@shared/types';
import type { Message } from '@shared/types';
import { estimateRemainingTokens } from '@/utils/tiktoken';
import { DEFAULT_CONTEXT_STRATEGY, DEFAULT_MAX_CONTEXT_MESSAGES, MAX_CONTEXT_MESSAGES_LIMIT } from '@shared/constants';

export interface UseBotContextReturn {
  /** Current context strategy for the bot. */
  strategy: ContextStrategy;
  /** Max context messages for the bot. */
  maxMessages: number;
  /** Update the bot's context strategy. */
  updateStrategy: (strategy: ContextStrategy, maxMessages: number) => Promise<void>;
  /** Compute context messages for a bot in a chat based on its strategy. */
  getContextMessages: (botId: string, chatId: string) => Message[];
  /** Estimate remaining token budget for a bot in a chat. */
  getRemainingTokens: (botId: string, chatId: string, modelMaxTokens?: number) => number;
  /** Whether an update is in progress. */
  isUpdating: boolean;
}

export function useBotContext(botId: string): UseBotContextReturn {
  const bot = useBotStore((s) => s.getBotById(botId));
  const updateBotContext = useBotStore((s) => s.updateBotContext);
  const messages = useChatStore((s) => s.messages);

  const strategy = (bot?.contextStrategy ?? DEFAULT_CONTEXT_STRATEGY) as ContextStrategy;
  const maxMessages = bot?.maxContextMessages ?? DEFAULT_MAX_CONTEXT_MESSAGES;

  const updateStrategy = useCallback(
    async (newStrategy: ContextStrategy, newMaxMessages: number): Promise<void> => {
      const clamped = Math.min(Math.max(1, newMaxMessages), MAX_CONTEXT_MESSAGES_LIMIT);
      await api.updateBotContext(botId, {
        contextStrategy: newStrategy,
        maxContextMessages: clamped,
      });
      updateBotContext(botId, newStrategy, clamped);
    },
    [botId, updateBotContext],
  );

  const getContextMessages = useCallback(
    (_bid: string, chatId: string): Message[] => {
      const chatMessages = messages[chatId] ?? [];
      const strategyVal = bot?.contextStrategy ?? DEFAULT_CONTEXT_STRATEGY;

      switch (strategyVal) {
        case 'recent':
          return chatMessages.slice(-maxMessages);
        case 'model-managed':
          // Return all messages; the model decides what to keep
          return chatMessages;
        case 'full':
        default:
          return chatMessages;
      }
    },
    [messages, bot, maxMessages],
  );

  const getRemainingTokens = useCallback(
    (bid: string, chatId: string, modelMaxTokens: number = 128000): number => {
      const contextMessages = getContextMessages(bid, chatId);
      return estimateRemainingTokens(contextMessages, modelMaxTokens);
    },
    [getContextMessages],
  );

  return useMemo(() => ({
    strategy,
    maxMessages,
    updateStrategy,
    getContextMessages,
    getRemainingTokens,
    isUpdating: false,
  }), [strategy, maxMessages, updateStrategy, getContextMessages, getRemainingTokens]);
}
