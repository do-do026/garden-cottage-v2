// ============================================================
// Hermes Chat — Game Bridge (iframe postMessage Communication)
// Manages the lifecycle of a sandboxed HTML5 game iframe and
// provides a typed abstraction over postMessage communication
// between the main page and the embedded game.
// ============================================================

import { GAME_SANDBOX_FLAGS } from '@shared/constants';
import { GAME_WHITELIST } from '@/config';
import type { GameResult } from '@/types';

// -----------------------------------------------------------
// Game message types (wire protocol)
// -----------------------------------------------------------

export interface GameEvent {
  type: 'game:event' | 'game:result' | 'game:ready';
  payload?: unknown;
}

export type GameEventHandler = (event: GameEvent) => void;
export type GameResultHandler = (result: GameResult) => void;

// -----------------------------------------------------------
// GameBridge
// -----------------------------------------------------------

export class GameBridge {
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;
  private readonly eventHandlers: Set<GameEventHandler> = new Set();
  private readonly resultHandlers: Set<GameResultHandler> = new Set();
  private messageListener: ((e: MessageEvent) => void) | null = null;

  // -----------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------

  /**
   * Create a sandboxed iframe and mount it inside the given container.
   *
   * @param container - The DOM element that will host the iframe.
   * @param url        - The URL of the HTML5 game to load.
   * @throws           - If the URL fails the whitelist check.
   */
  mount(container: HTMLElement, url: string): void {
    // -- Security: whitelist check --
    if (!this.validateUrl(url)) {
      throw new Error(`Game URL is not whitelisted: ${url}`);
    }

    // Clean up any previous instance
    this.destroy();

    this.container = container;

    // Build the sandboxed iframe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.setAttribute('sandbox', GAME_SANDBOX_FLAGS);
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.allow = '';

    // Prevent allow-top-navigation and allow-popups (security)
    container.appendChild(iframe);
    this.iframe = iframe;

    // Listen for postMessage events from the game
    this.messageListener = (event: MessageEvent) => {
      // Verify origin is from the same URL (or whitelisted)
      if (!this.validateMessageOrigin(event)) return;

      const data = event.data as GameEvent | undefined;
      if (!data || typeof data.type !== 'string') return;

      // Dispatch to handlers
      for (const handler of this.eventHandlers) {
        handler(data);
      }

      if (data.type === 'game:result') {
        const result: GameResult = {
          gameId: String((data.payload as Record<string, unknown>)?.gameId ?? ''),
          score: Number((data.payload as Record<string, unknown>)?.score ?? 0),
          data: ((data.payload as Record<string, unknown>)?.data ?? {}) as Record<string, unknown>,
          completedAt: Date.now(),
        };
        for (const handler of this.resultHandlers) {
          handler(result);
        }
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  // -----------------------------------------------------------
  // Communication
  // -----------------------------------------------------------

  /**
   * Send an action to the embedded game via postMessage.
   */
  sendToGame(action: string, payload?: unknown): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[GameBridge] Cannot send — iframe not mounted.');
      return;
    }
    const targetOrigin = new URL(this.iframe.src).origin;
    this.iframe.contentWindow.postMessage({ type: action, payload }, targetOrigin);
  }

  /** Subscribe to all game events. Returns an unsubscribe function. */
  onGameEvent(handler: GameEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => { this.eventHandlers.delete(handler); };
  }

  /** Subscribe to game-completion results. Returns an unsubscribe function. */
  onGameResult(handler: GameResultHandler): () => void {
    this.resultHandlers.add(handler);
    return () => { this.resultHandlers.delete(handler); };
  }

  // -----------------------------------------------------------
  // Security
  // -----------------------------------------------------------

  /**
   * Validate a game URL against the configured whitelist.
   * Returns true if the URL's hostname is in the whitelist.
   */
  validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return GAME_WHITELIST.some(
        (domain) =>
          parsed.hostname === domain ||
          parsed.hostname.endsWith(`.${domain}`),
      );
    } catch {
      return false;
    }
  }

  /**
   * Validate the origin of a postMessage event.
   * Accepts messages from the same origin or any whitelisted domain.
   */
  private validateMessageOrigin(event: MessageEvent): boolean {
    if (event.origin === window.location.origin) return true;
    try {
      const parsed = new URL(event.origin);
      return GAME_WHITELIST.some(
        (domain) =>
          parsed.hostname === domain ||
          parsed.hostname.endsWith(`.${domain}`),
      );
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------

  /** Destroy the iframe, remove listeners, and clean up all references. */
  destroy(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    if (this.iframe && this.container) {
      this.container.removeChild(this.iframe);
    }
    this.iframe = null;
    this.container = null;
    this.eventHandlers.clear();
    this.resultHandlers.clear();
  }
}
