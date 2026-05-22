// ============================================================
// Hermes Chat — GameSandbox Component
// Safely renders an HTML5 game inside a sandboxed iframe.
// Handles loading, error states, and lifecycle via GameBridge.
// ============================================================

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { GameBridge } from '@/services/gameBridge';
import type { GameResult } from '@/types';

interface GameSandboxProps {
  /** The URL of the HTML5 game to load. */
  srcUrl: string;
  /** Called when the game reports a result. */
  onGameResult?: (result: GameResult) => void;
  /** Called when the game sends an arbitrary event. */
  onGameEvent?: (event: unknown) => void;
  /** Optional height in pixels (default 400). */
  height?: number;
  /** Optional class name on the container. */
  className?: string;
}

const GameSandbox: React.FC<GameSandboxProps> = ({
  srcUrl,
  onGameResult,
  onGameEvent,
  height = 400,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<GameBridge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const startGame = useCallback(() => {
    if (!containerRef.current) return;

    setLoading(true);
    setError(null);
    setGameResult(null);

    const bridge = new GameBridge();
    bridgeRef.current = bridge;

    try {
      bridge.mount(containerRef.current, srcUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load game';
      setError(msg);
      setLoading(false);
      return;
    }

    const unsubEvent = bridge.onGameEvent((event) => {
      onGameEvent?.(event);
      if (event.type === 'game:ready') {
        setLoading(false);
      }
    });

    const unsubResult = bridge.onGameResult((result) => {
      setGameResult(result);
      onGameResult?.(result);
      bridge.destroy();
      bridgeRef.current = null;
    });

    // Fallback: hide loading after 5 seconds even without game:ready
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Store cleanup
    (bridge as unknown as Record<string, unknown>)._cleanupEvent = unsubEvent;
    (bridge as unknown as Record<string, unknown>)._cleanupResult = unsubResult;
    (bridge as unknown as Record<string, unknown>)._timeout = timeout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcUrl]);

  // Start the game automatically on mount / when srcUrl changes
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const bridge = bridgeRef.current;
      if (bridge) {
        const cleanups = bridge as unknown as Record<string, unknown>;
        if (typeof cleanups._cleanupEvent === 'function') (cleanups._cleanupEvent as () => void)();
        if (typeof cleanups._cleanupResult === 'function') (cleanups._cleanupResult as () => void)();
        if (cleanups._timeout) clearTimeout(cleanups._timeout as ReturnType<typeof setTimeout>);
        bridge.destroy();
        bridgeRef.current = null;
      }
    };
  }, []);

  return (
    <Box className={`flex flex-col gap-2 ${className}`}>
      <Box
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
        sx={{ height, minHeight: height }}
      />

      {loading && !error && !gameResult && (
        <Box className="absolute inset-0 flex items-center justify-center bg-black/5">
          <CircularProgress size={32} />
        </Box>
      )}

      {error && (
        <Box className="flex flex-col items-center gap-2 p-4">
          <Typography variant="body2" color="error">
            {error}
          </Typography>
          <Button variant="outlined" size="small" onClick={startGame}>
            Retry
          </Button>
        </Box>
      )}

      {gameResult && (
        <Box className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <Typography variant="body2" color="text.secondary">
            Game complete — Score: {gameResult.score}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GameSandbox;
