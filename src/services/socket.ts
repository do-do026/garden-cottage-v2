// ============================================================
// Hermes Chat — Socket.IO Client Service (Singleton)
// Encapsulates Socket.IO connection lifecycle, auto-reconnect
// with exponential backoff, room management, and typed event
// emission / subscription.
// ============================================================

import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/config';
import { SOCKET_EVENTS } from '@shared/constants';
import { SOCKET_RECONNECT_DELAY, SOCKET_RECONNECT_MAX_ATTEMPTS } from '@/config/constants';
import { useUIStore } from '@/store/uiStore';
import type { Message, UIModInstruction, BotStatus, WidgetVoteEvent, WidgetResultEvent } from '@shared/types';
import type { GameResult } from '@/types';

// -----------------------------------------------------------
// Typed event handler signatures
// -----------------------------------------------------------

export type MessageHandler = (message: Message) => void;
export type GameResultHandler = (result: GameResult) => void;
export type ProgressHandler = (data: { messageId: string; value: number; max: number; label: string }) => void;
export type UIModHandler = (mod: UIModInstruction) => void;
export type BotStatusHandler = (data: { botId: string; status: BotStatus }) => void;
export type WidgetResultHandler = (event: WidgetResultEvent) => void;
export type WidgetClosedHandler = (event: { widgetId: string }) => void;

// -----------------------------------------------------------
// Singleton
// -----------------------------------------------------------

let instance: SocketService | null = null;

/** Obtain (and lazily create) the singleton SocketService instance. */
export function getSocketService(): SocketService {
  if (!instance) {
    instance = new SocketService();
  }
  return instance;
}

// -----------------------------------------------------------
// SocketService
// -----------------------------------------------------------

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts: number = 0;
  private readonly messageHandlers: Set<MessageHandler> = new Set();
  private readonly gameResultHandlers: Set<GameResultHandler> = new Set();
  private readonly progressHandlers: Set<ProgressHandler> = new Set();
  private readonly uiModHandlers: Set<UIModHandler> = new Set();
  private readonly botStatusHandlers: Set<BotStatusHandler> = new Set();
  private readonly widgetResultHandlers: Set<WidgetResultHandler> = new Set();
  private readonly widgetClosedHandlers: Set<WidgetClosedHandler> = new Set();

  /** Whether the socket is currently connected. */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  // -----------------------------------------------------------
  // Connection lifecycle
  // -----------------------------------------------------------

  /**
   * Establish a Socket.IO connection with an optional auth token.
   * Safe to call multiple times — reuses the existing socket if already connected.
   */
  connect(token?: string): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionDelay: SOCKET_RECONNECT_DELAY,
      reconnectionAttempts: SOCKET_RECONNECT_MAX_ATTEMPTS,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      useUIStore.getState().setConnectionStatus({
        connected: true,
        reconnecting: false,
        lastConnected: Date.now(),
      });
    });

    this.socket.on('disconnect', () => {
      useUIStore.getState().setConnectionStatus({
        connected: false,
        reconnecting: false,
      });
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts += 1;
      useUIStore.getState().setConnectionStatus({
        connected: false,
        reconnecting: true,
      });
    });

    this.socket.on('reconnect_failed', () => {
      useUIStore.getState().setConnectionStatus({
        connected: false,
        reconnecting: false,
      });
    });

    // Wire inbuilt server events
    this.socket.on(SOCKET_EVENTS.MESSAGE_NEW, (msg: Message) => {
      this.messageHandlers.forEach((h) => h(msg));
    });

    this.socket.on(SOCKET_EVENTS.GAME_RESULT, (result: GameResult) => {
      this.gameResultHandlers.forEach((h) => h(result));
    });

    this.socket.on(SOCKET_EVENTS.PROGRESS_UPDATE, (data: { messageId: string; value: number; max: number; label: string }) => {
      this.progressHandlers.forEach((h) => h(data));
    });

    this.socket.on(SOCKET_EVENTS.UI_MOD, (mod: UIModInstruction) => {
      this.uiModHandlers.forEach((h) => h(mod));
    });

    this.socket.on(SOCKET_EVENTS.BOT_STATUS, (data: { botId: string; status: BotStatus }) => {
      this.botStatusHandlers.forEach((h) => h(data));
    });

    this.socket.on(SOCKET_EVENTS.WIDGET_RESULT, (event: WidgetResultEvent) => {
      this.widgetResultHandlers.forEach((h) => h(event));
    });

    this.socket.on(SOCKET_EVENTS.WIDGET_CLOSED, (event: { widgetId: string }) => {
      this.widgetClosedHandlers.forEach((h) => h(event));
    });
  }

  /** Gracefully disconnect and clean up. */
  disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.reconnectAttempts = 0;
    useUIStore.getState().setConnectionStatus({
      connected: false,
      reconnecting: false,
    });
  }

  // -----------------------------------------------------------
  // Room management
  // -----------------------------------------------------------

  /** Join a chat room to receive its messages. */
  joinChat(chatId: string): void {
    this.socket?.emit('chat:join', { chatId });
  }

  /** Leave a chat room. */
  leaveChat(chatId: string): void {
    this.socket?.emit('chat:leave', { chatId });
  }

  // -----------------------------------------------------------
  // Outgoing events
  // -----------------------------------------------------------

  /** Send a message to the server for routing. */
  emitMessage(msg: Message): void {
    this.socket?.emit(SOCKET_EVENTS.MESSAGE_SEND, msg);
  }

  /** Send a completed game result to the server. */
  emitGameResult(result: GameResult): void {
    this.socket?.emit(SOCKET_EVENTS.GAME_RESULT, result);
  }

  /** Send a bot connection request. */
  emitBotConnect(botId: string): void {
    this.socket?.emit(SOCKET_EVENTS.BOT_CONNECT, { botId });
  }

  /** Send a widget vote to the server. */
  emitWidgetVote(data: WidgetVoteEvent): void {
    this.socket?.emit(SOCKET_EVENTS.WIDGET_VOTE, data);
  }

  // -----------------------------------------------------------
  // Event subscriptions
  // -----------------------------------------------------------

  /** Subscribe to new messages. Returns an unsubscribe function. */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => { this.messageHandlers.delete(handler); };
  }

  /** Subscribe to game results. Returns an unsubscribe function. */
  onGameResult(handler: GameResultHandler): () => void {
    this.gameResultHandlers.add(handler);
    return () => { this.gameResultHandlers.delete(handler); };
  }

  /** Subscribe to progress updates. Returns an unsubscribe function. */
  onProgress(handler: ProgressHandler): () => void {
    this.progressHandlers.add(handler);
    return () => { this.progressHandlers.delete(handler); };
  }

  /** Subscribe to UI modification instructions. Returns an unsubscribe function. */
  onUIMod(handler: UIModHandler): () => void {
    this.uiModHandlers.add(handler);
    return () => { this.uiModHandlers.delete(handler); };
  }

  /** Subscribe to bot status changes. Returns an unsubscribe function. */
  onBotStatus(handler: BotStatusHandler): () => void {
    this.botStatusHandlers.add(handler);
    return () => { this.botStatusHandlers.delete(handler); };
  }

  /** Subscribe to widget result updates. Returns an unsubscribe function. */
  onWidgetResult(handler: WidgetResultHandler): () => void {
    this.widgetResultHandlers.add(handler);
    return () => { this.widgetResultHandlers.delete(handler); };
  }

  /** Subscribe to widget closed events. Returns an unsubscribe function. */
  onWidgetClosed(handler: WidgetClosedHandler): () => void {
    this.widgetClosedHandlers.add(handler);
    return () => { this.widgetClosedHandlers.delete(handler); };
  }
}

/** Direct reference for use in non-React code. */
export const socketService = getSocketService();
