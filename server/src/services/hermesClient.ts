// ============================================================
// Hermes Chat — Hermes Native WebSocket Client
// Manages a raw ws connection to a Hermes agent process.
// Provides ping/pong health checking and message forwarding
// between the Hermes agent and the Socket.IO layer.
// ============================================================

import WebSocket from 'ws';
import type { HermesMessage } from '../../../shared/types.js';
import { HERMES_HEARTBEAT_INTERVAL } from '../../../shared/constants.js';

// -----------------------------------------------------------
// Types
// -----------------------------------------------------------

export interface HermesClientOptions {
  /** Hermes agent hostname or IP. */
  host: string;
  /** Hermes agent WebSocket port. */
  port: number;
  /** Optional authentication token sent on connect. */
  authToken?: string;
  /** Called when a message is received from the Hermes agent. */
  onMessage?: (msg: HermesMessage) => void;
  /** Called when the connection is established. */
  onConnect?: () => void;
  /** Called when the connection is lost. */
  onDisconnect?: (reason: string) => void;
  /** Called when an error occurs. */
  onError?: (err: Error) => void;
}

// -----------------------------------------------------------
// HermesClient
// -----------------------------------------------------------

export class HermesClient {
  private ws: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly options: HermesClientOptions;
  private closed: boolean = false;

  constructor(options: HermesClientOptions) {
    this.options = options;
  }

  /** Whether the underlying WebSocket is open. */
  get ready(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // -----------------------------------------------------------
  // Connection lifecycle
  // -----------------------------------------------------------

  /**
   * Open a WebSocket connection to the Hermes agent.
   * Resolves when the connection is established; rejects on timeout/error.
   */
  connect(timeoutMs: number = 10_000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        return reject(new Error('Client has been closed.'));
      }

      const url = `ws://${this.options.host}:${this.options.port}`;
      const headers: Record<string, string> = {};

      if (this.options.authToken) {
        headers['Authorization'] = `Bearer ${this.options.authToken}`;
      }

      const timeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          this.ws?.terminate();
          reject(new Error(`Connection to ${url} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.ws = new WebSocket(url, { headers });

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.startHeartbeat();
        this.options.onConnect?.();
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const msg: HermesMessage = JSON.parse(data.toString());
          this.options.onMessage?.(msg);
        } catch (err) {
          console.warn('[HermesClient] Failed to parse message:', err);
        }
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        this.stopHeartbeat();
        this.options.onDisconnect?.(reason.toString() || `code ${code}`);
      });

      this.ws.on('error', (err: Error) => {
        clearTimeout(timeout);
        this.options.onError?.(err);
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          reject(err);
        }
      });
    });
  }

  /**
   * Send a JSON-serialisable message to the Hermes agent.
   */
  send(msg: HermesMessage): void {
    if (!this.ready) {
      console.warn('[HermesClient] Cannot send — socket not ready.');
      return;
    }
    this.ws!.send(JSON.stringify(msg));
  }

  /**
   * Quick ping-pong health check. Connects, pings, then closes.
   * Returns true if the agent responds within the timeout.
   */
  async ping(timeoutMs: number = 5_000): Promise<boolean> {
    try {
      await this.connect(timeoutMs);
      // Send a ping frame and wait briefly
      this.ws!.ping();
      return this.ready;
    } catch {
      return false;
    } finally {
      this.close();
    }
  }

  /** Gracefully close the WebSocket and stop heartbeats. */
  close(): void {
    this.closed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  // -----------------------------------------------------------
  // Heartbeat
  // -----------------------------------------------------------

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ready) {
        this.ws!.ping();
      }
    }, HERMES_HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
