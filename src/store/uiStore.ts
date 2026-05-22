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
import { DEFAULT_SETTINGS, UI_MOD_WHITELIST_V2 } from '@shared/constants';
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
  /** V2: Dynamic font family override from bot. */
  fontFamily?: string;
  /** V2: Layout preference from bot ('default' | 'compact' | 'wide'). */
  layout?: 'default' | 'compact' | 'wide';
  /** V2: Modal config from bot SHOW_MODAL. */
  modalConfig?: { title: string; content: string; actions?: { label: string; id: string }[] } | null;

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
  /** V2: Set dynamic font family override. */
  setFontFamily: (font?: string) => void;
  /** V2: Set layout preference. */
  setLayout: (layout?: 'default' | 'compact' | 'wide') => void;
  /** V2: Show a modal from bot config. */
  showModal: (config: UIState['modalConfig']) => void;
  /** V2: Close the current modal. */
  closeModal: () => void;
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
  /** V2: Dynamic font family override from bot. */
  fontFamily: undefined,
  /** V2: Layout preference from bot. */
  layout: undefined,
  /** V2: Modal config from bot. */
  modalConfig: null,
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
    // -- Whitelist check (V2 expanded) --
    if (!UI_MOD_WHITELIST_V2.has(mod.type)) {
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

      case 'ADD_BUTTON': {
        const btnConfig = parsed as Record<string, unknown>;
        const id = (btnConfig.id as string) ?? `btn-${Date.now()}`;
        get().addInjectedComponent({
          id,
          type: 'button',
          props: {
            label: btnConfig.label ?? 'Action',
            action: btnConfig.action ?? '',
            color: btnConfig.color ?? 'primary',
          },
        });
        return true;
      }

      case 'SHOW_MODAL': {
        const modalConfig = parsed as Record<string, unknown>;
        set({
          modalConfig: {
            title: (modalConfig.title as string) ?? '',
            content: (modalConfig.content as string) ?? '',
            actions: Array.isArray(modalConfig.actions)
              ? (modalConfig.actions as { label: string; id: string }[])
              : undefined,
          },
        });
        return true;
      }

      case 'SET_FONT': {
        const fontFamily = (parsed as Record<string, unknown>).fontFamily;
        if (typeof fontFamily === 'string') {
          set({ fontFamily });
          return true;
        }
        return false;
      }

      case 'SET_LAYOUT': {
        const layout = (parsed as Record<string, unknown>).layout;
        if (layout === 'default' || layout === 'compact' || layout === 'wide') {
          set({ layout });
          return true;
        }
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
      fontFamily: undefined,
      layout: undefined,
      modalConfig: null,
    });
  },

  setFontFamily: (font?: string): void => {
    set({ fontFamily: font });
  },

  setLayout: (layout?: 'default' | 'compact' | 'wide'): void => {
    set({ layout });
  },

  showModal: (config: UIState['modalConfig']): void => {
    set({ modalConfig: config });
  },

  closeModal: (): void => {
    set({ modalConfig: null });
  },

  setConnectionStatus: (status: Partial<ConnectionStatus>): void => {
    set((state) => ({
      connectionStatus: { ...state.connectionStatus, ...status },
    }));
  },
}));
