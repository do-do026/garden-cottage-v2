// ============================================================
// Hermes Chat — useSocket Hook
// Manages the Socket.IO connection lifecycle within a React
// component tree and dispatches incoming server events to the
// appropriate Zustand stores.
// ============================================================

import { useEffect, useCallback, useMemo } from 'react';
import { socketService } from '@/services/socket';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { useBotStore } from '@/store/botStore';
import type { Message, UIModInstruction, BotStatus } from '@shared/types';
import { MessageType as MT, MessageStatus } from '@shared/types';
import type { ConnectionStatus } from '@/types';

export interface UseSocketReturn {
  /** Whether the socket is currently connected. */
  connected: boolean;
  /** Whether the socket is attempting to reconnect. */
  reconnecting: boolean;
  /** The full connection status object from the UI store. */
  connectionStatus: ConnectionStatus;
  /** Manually connect (with optional auth token). */
  connect: (token?: string) => void;
  /** Manually disconnect. */
  disconnect: () => void;
}

export function useSocket(token?: string): UseSocketReturn {
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const updateBotStatus = useBotStore((s) => s.updateBotStatus);

  const connect = useCallback(
    (t?: string) => {
      socketService.connect(t);
    },
    [],
  );

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  // Auto-connect on mount, disconnect on unmount.
  //
  // IMPORTANT: This hook manages a top-level singleton Socket.IO connection.
  // It should only be called ONCE in the root component (e.g. <App>).
  // Do NOT use this hook in nested components — doing so will cause
  // premature disconnection when a child unmounts.
  //
  // The cleanup function directly disconnects the global singleton because
  // the expectation is that this effect runs once for the app lifecycle.
  // When the root component unmounts (e.g. hot-reload in dev), the socket
  // should be fully torn down so the next mount can start fresh.
  useEffect(() => {
    socketService.connect(token);

    // Subscribe to all server events and dispatch to stores
    const unsubMessage = socketService.onMessage((msg: Message) => {
      // UI_MOD messages are handled by the UIMod listener — don't
      // add them to the chat message list.
      if (msg.type === MT.UI_MOD) return;

      addMessage(msg);
    });

    const unsubProgress = socketService.onProgress(
      (data: { messageId: string; value: number; max: number; label: string }) => {
        // Find the message via a best-effort scan across chats
        const store = useChatStore.getState();
        for (const chatId of Object.keys(store.messages)) {
          const found = store.messages[chatId].find((m) => m.id === data.messageId);
          if (found) {
            updateMessage(data.messageId, chatId, {
              metadata: {
                ...found.metadata,
                progressValue: data.value,
                progressMax: data.max,
                progressLabel: data.label,
              },
            });
            break;
          }
        }
      },
    );

    const unsubUIMod = socketService.onUIMod((mod: UIModInstruction) => {
      const applied = useUIStore.getState().applyUIMod(mod);
      if (applied) {
        // Create a system message to notify the user
        addMessage({
          id: `system-${Date.now()}`,
          type: MT.SYSTEM,
          chatId: useChatStore.getState().activeChatId ?? '',
          senderId: 'system',
          content: `Bot triggered UI change: ${mod.type}`,
          metadata: { uiMod: mod },
          status: MessageStatus.SENT,
          timestamp: Date.now(),
        });
      }
    });

    const unsubBotStatus = socketService.onBotStatus(
      (data: { botId: string; status: BotStatus }) => {
        updateBotStatus(data.botId, data.status);
      },
    );

    return () => {
      unsubMessage();
      unsubProgress();
      unsubUIMod();
      unsubBotStatus();
      // Disconnect the global singleton — this effect is the sole owner.
      socketService.disconnect();
    };
    // Run only on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(
    () => ({
      connected: connectionStatus.connected,
      reconnecting: connectionStatus.reconnecting,
      connectionStatus,
      connect,
      disconnect,
    }),
    [connectionStatus, connect, disconnect],
  );
}
