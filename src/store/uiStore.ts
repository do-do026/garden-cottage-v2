// ============================================================
// Hermes Chat — UI Zustand Store
// Controls theme, sidebar, responsive breakpoints, bot-
// injected UI components, and connection status.
//
// applyUIMod enforces a whitelist so bots can only trigger
// safe, pre-approved UI modifications.
// ============================================================

import { create } from 'zustand';
import type { UIModInstruction } from '@shared/types';
import { WHITELISTED_UI_MODS, DEFAULT_SETTINGS } from '@shared/constants';
import type { UIComponentConfig, ConnectionStatus } from '@/types';

// -----------------------------------------------------------
// State Shape
// -----------------------------------------------------------

export interface UIState {
  /** Current colour scheme mode. */
  theme: 'light' | 'dark';
  /** Primary accent colour (CSS hex). */
  primaryColor: string;
  /** Optional background colour override. */
  backgroundColor?: string;
  /** Whether the viewport is currently in the mobile range. */
  isMobile: boolean;
  /** Whether the sidebar is visible. */
  sidebarOpen: boolean;
  /** Components injected by bots (metadata only, no code). */
  injectedComponents: UIComponentConfig[];
  /** Socket.IO connection health. */
  connectionStatus: ConnectionStatus;

  // -- Actions -------------------------------------------------

  /** Set the theme mode. */
  setTheme: (theme: 'light' | 'dark') => void;
  /** Set the primary accent colour. */
  setPrimaryColor: (color: string) => void;
  /** Set or clear the background colour override. */
  setBackgroundColor: (color?: string) => void;
  /** Update the mobile / desktop flag. */
  setIsMobile: (isMobile: boolean) => void;
  /** Toggle sidebar open/closed. */
  toggleSidebar: () => void;
  /** Explicitly set sidebar visibility. */
  setSidebarOpen: (open: boolean) => void;
  /**
   * Apply a UI modification instruction from a bot.
   * Only whitelisted mod types are honoured.
   * @returns true if the mod was applied, false if rejected.
   */
  applyUIMod: (mod: UIModInstruction) => boolean;
  /** Register a bot-injected component for rendering. */
  addInjectedComponent: (config: UIComponentConfig) => void;
  /** Remove a previously injected component by id. */
  removeInjectedComponent: (id: string) => void;
  /** Remove all injected components at once. */
  clearInjectedComponents: () => void;
  /** Reset all UI values back to factory defaults. */
  resetUI: () => void;
  /** Merge partial connection status updates. */
  setConnectionStatus: (status: Partial<ConnectionStatus>) => void;
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

/** Parse a stringified JSON payload safely, returning null on failure. */
function safeParsePayload(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    console.warn('[UIStore] Failed to parse UIMod payload:', payload);
    return null;
  }
}

// -----------------------------------------------------------
// Store
// -----------------------------------------------------------

export const useUIStore = create<UIState>((set, get) => ({
  // -- Initial state (from shared defaults) --
  theme: DEFAULT_SETTINGS.theme as 'light' | 'dark',
  primaryColor: DEFAULT_SETTINGS.primaryColor,
  backgroundColor: undefined,
  isMobile: false,
  sidebarOpen: true,
  injectedComponents: [],
  connectionStatus: {
    connected: false,
    reconnecting: false,
    lastConnected: undefined,
  },

  // -- Actions --

  setTheme: (theme: 'light' | 'dark'): void => {
    set({ theme });
  },

  setPrimaryColor: (color: string): void => {
    set({ primaryColor: color });
  },

  setBackgroundColor: (color?: string): void => {
    set({ backgroundColor: color });
  },

  setIsMobile: (isMobile: boolean): void => {
    set({ isMobile, sidebarOpen: isMobile ? false : get().sidebarOpen });
  },

  toggleSidebar: (): void => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open: boolean): void => {
    set({ sidebarOpen: open });
  },

  applyUIMod: (mod: UIModInstruction): boolean => {
    // -- Whitelist check --
    if (!WHITELISTED_UI_MODS.has(mod.type)) {
      console.warn(
        `[UIStore] Rejected UIMod — type "${mod.type}" is not whitelisted.`,
      );
      return false;
    }

    const parsed = safeParsePayload(mod.payload);
    if (parsed === null) return false;

    // -- Dispatch based on type --
    switch (mod.type) {
      case 'SET_THEME': {
        const themeValue = (parsed as Record<string, unknown>).theme;
        if (themeValue === 'light' || themeValue === 'dark') {
          set({ theme: themeValue });
          return true;
        }
        console.warn('[UIStore] SET_THEME payload missing valid "theme" field.');
        return false;
      }

      case 'SET_PRIMARY_COLOR': {
        const color = (parsed as Record<string, unknown>).color;
        if (typeof color === 'string' && color.length > 0) {
          set({ primaryColor: color });
          return true;
        }
        console.warn(
          '[UIStore] SET_PRIMARY_COLOR payload missing valid "color" field.',
        );
        return false;
      }

      case 'SET_BACKGROUND': {
        const bgColor = (parsed as Record<string, unknown>).color;
        if (typeof bgColor === 'string') {
          set({ backgroundColor: bgColor || undefined });
          return true;
        }
        console.warn(
          '[UIStore] SET_BACKGROUND payload missing valid "color" field.',
        );
        return false;
      }

      default:
        // Should never reach here due to whitelist, but be defensive
        console.warn(`[UIStore] Unhandled UIMod type: "${mod.type}".`);
        return false;
    }
  },

  addInjectedComponent: (config: UIComponentConfig): void => {
    set((state) => {
      // Replace if an existing component has the same id
      const filtered = state.injectedComponents.filter(
        (c) => c.id !== config.id,
      );
      return { injectedComponents: [...filtered, config] };
    });
  },

  removeInjectedComponent: (id: string): void => {
    set((state) => ({
      injectedComponents: state.injectedComponents.filter((c) => c.id !== id),
    }));
  },

  clearInjectedComponents: (): void => {
    set({ injectedComponents: [] });
  },

  resetUI: (): void => {
    set({
      theme: DEFAULT_SETTINGS.theme as 'light' | 'dark',
      primaryColor: DEFAULT_SETTINGS.primaryColor,
      backgroundColor: undefined,
      sidebarOpen: true,
      injectedComponents: [],
    });
  },

  setConnectionStatus: (status: Partial<ConnectionStatus>): void => {
    set((state) => ({
      connectionStatus: { ...state.connectionStatus, ...status },
    }));
  },
}));
