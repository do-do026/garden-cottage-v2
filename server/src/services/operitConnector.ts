// ============================================================
// Hermes Chat — Operit HTTP POST Connector
// HTTP-based connector that coexists with HermesClient (WebSocket).
// Uses HTTP POST to port 8094 instead of persistent WebSocket.
// Interface is designed to be drop-in compatible with HermesClient
// so the WebSocketManager can use either connector transparently.
// ============================================================

import type { HermesMessage } from '../../../shared/types.js';

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface OperitConnectorOptions {
  /** Operit agent hostname or IP. */
  host: string;
  /** Operit agent HTTP port (default 8094). */
  port: number;
  /** Optional authentication token sent as Bearer header. */
  authToken?: string;
  /** Called when an HTTP response is received from Operit (request-response pattern). */
  onResponse?: (msg: HermesMessage) => void;
  /** Called when the connector is marked ready. */
  onConnect?: () => void;
  /** Called when the connector is closed. */
  onDisconnect?: (reason: string) => void;
  /** Called when an HTTP request fails. */
  onError?: (err: Error) => void;
}

// -----------------------------------------------------------
// OperitConnector
// -----------------------------------------------------------

/**
 * HTTP-based connector for Operit agents.
 * Unlike HermesClient which maintains a persistent WebSocket connection,
 * OperitConnector uses individual HTTP POST requests for each message.
 *
 * The interface shape mirrors HermesClient so the WebSocketManager can
 * use either connector via the same pattern: connect(), send(msg), close().
 */
export class OperitConnector {
  private baseUrl: string;
  private authToken: string;
  private readonly options: OperitConnectorOptions;
  private _ready: boolean = false;
  private closed: boolean = false;
  /** Default timeout per HTTP request in milliseconds. */
  private readonly requestTimeoutMs: number;

  constructor(options: OperitConnectorOptions) {
    this.options = options;
    this.baseUrl = `http://${options.host}:${options.port}`;
    this.authToken = options.authToken ?? '';
    this.requestTimeoutMs = 30_000;
  }

  /** Whether the connector is ready to send messages. */
  get ready(): boolean {
    return this._ready;
  }

  // -----------------------------------------------------------
  // Connection lifecycle
  // -----------------------------------------------------------

  /**
   * Mark the connector as ready. No persistent connection is established —
   * Operit operates via per-request HTTP POST.
   */
  async connect(): Promise<void> {
    if (this.closed) {
      throw new Error('OperitConnector has been closed.');
    }
    this._ready = true;
    this.options.onConnect?.();
  }

  /**
   * Send a message to the Operit agent via HTTP POST and await the response.
   * The response is delivered through the onResponse callback.
   *
   * Uses AbortController to enforce a 30-second timeout per request.
   */
  async send(msg: HermesMessage): Promise<void> {
    if (!this._ready) {
      console.warn('[OperitConnector] Cannot send — connector not ready.');
      return;
    }
    if (this.closed) {
      console.warn('[OperitConnector] Cannot send — connector is closed.');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/api/external-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(msg),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Operit HTTP ${response.status}: ${response.statusText}`);
      }

      const responseMsg = await response.json() as HermesMessage;
      this.options.onResponse?.(responseMsg);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        const timeoutErr = new Error(`Operit request timed out after ${this.requestTimeoutMs}ms`);
        this.options.onError?.(timeoutErr);
      } else {
        this.options.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Close the connector, marking it as not ready.
   * No persistent connection to tear down.
   */
  close(): void {
    this.closed = true;
    this._ready = false;
    this.options.onDisconnect?.('closed');
  }
}
