// ============================================================
// Hermes Chat — Bot Zustand Store
// Manages the collection of Hermes bot agents and their
// connection statuses.
// ============================================================

import { create } from 'zustand';
import type { Bot, BotStatus } from '@shared/types';

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
}));
