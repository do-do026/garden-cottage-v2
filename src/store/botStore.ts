// ============================================================
// Hermes Chat — Bot Zustand Store
// Manages the collection of Hermes bot agents and their
// connection statuses.
// ============================================================

import { create } from 'zustand';
import type { Bot, BotStatus } from '@shared/types';
import type { ContextStrategy } from '@shared/types';
import { useChatStore } from './chatStore';

// -----------------------------------------------------------
// State Shape
// -----------------------------------------------------------

export interface BotState {
  /** All registered bots. */
  bots: Bot[];
  /** Whether a bot list fetch is in progress. */
  isLoading: boolean;
  /** Last error message, or null when no error. */
  error: string | null;

  // -- Actions -------------------------------------------------

  /** Replace the entire bot list. */
  setBots: (bots: Bot[]) => void;
  /** Append a new bot to the list. */
  addBot: (bot: Bot) => void;
  /** Remove a bot by id. */
  removeBot: (id: string) => void;
  /** Partially update an existing bot's fields. */
  updateBot: (id: string, partial: Partial<Bot>) => void;
  /** Update only the connection status of a bot. */
  updateBotStatus: (id: string, status: BotStatus) => void;
  /** Look up a bot by id. */
  getBotById: (id: string) => Bot | undefined;
  /** Set the loading flag. */
  setLoading: (loading: boolean) => void;
  /** Set or clear the error message. */
  setError: (error: string | null) => void;
  /** Update a bot's context strategy and max context messages. */
  updateBotContext: (id: string, contextStrategy: ContextStrategy, maxContextMessages: number) => void;
  /** Get all bots that are participants in a specific chat. */
  getBotsForChat: (chatId: string) => Bot[];
}

// -----------------------------------------------------------
// Store
// -----------------------------------------------------------

export const useBotStore = create<BotState>((set, get) => ({
  // -- Initial state --
  bots: [],
  isLoading: false,
  error: null,

  // -- Actions --

  setBots: (bots: Bot[]): void => {
    set({ bots });
  },

  addBot: (bot: Bot): void => {
    set((state) => {
      if (state.bots.some((b) => b.id === bot.id)) {
        return state;
      }
      return { bots: [...state.bots, bot] };
    });
  },

  removeBot: (id: string): void => {
    set((state) => ({
      bots: state.bots.filter((b) => b.id !== id),
    }));
  },

  updateBot: (id: string, partial: Partial<Bot>): void => {
    set((state) => ({
      bots: state.bots.map((b) => (b.id === id ? { ...b, ...partial } : b)),
    }));
  },

  updateBotStatus: (id: string, status: BotStatus): void => {
    set((state) => ({
      bots: state.bots.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
  },

  getBotById: (id: string): Bot | undefined => {
    return get().bots.find((b) => b.id === id);
  },

  setLoading: (loading: boolean): void => {
    set({ isLoading: loading });
  },

  setError: (error: string | null): void => {
    set({ error });
  },

  updateBotContext: (id: string, contextStrategy: ContextStrategy, maxContextMessages: number): void => {
    set((state) => ({
      bots: state.bots.map((b) =>
        b.id === id ? { ...b, contextStrategy, maxContextMessages } : b,
      ),
    }));
  },

  getBotsForChat: (chatId: string): Bot[] => {
    const chat = useChatStore.getState().chats.find((c) => c.id === chatId);
    if (!chat?.participants) return [];
    const bots = get().bots;
    const participantSet = new Set(chat.participants);
    return bots.filter((b) => participantSet.has(b.id));
  },
}));
