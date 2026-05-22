// ============================================================
// Hermes Chat — GameMessage Component
// Displays an HTML5 game invitation card with a "Start Game"
// button. On click, expands to embed the game inside a
// GameSandbox iframe via the GameBridge.
// ============================================================

import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GameSandbox from '@/components/common/GameSandbox';
import { socketService } from '@/services/socket';
import type { Message } from '@shared/types';
import type { GameResult } from '@/types';

interface GameMessageProps {
  /** The message containing game metadata (URL, title). */
  message: Message;
}

const GameMessage: React.FC<GameMessageProps> = ({ message }) => {
  const [started, setStarted] = useState<boolean>(false);
  const [result, setResult] = useState<GameResult | null>(null);

  const gameUrl = message.metadata?.gameUrl ?? '';
  const gameTitle = (message.content) || 'HTML5 Game';

  const hasValidUrl = gameUrl.length > 0;

  const handleStart = useCallback(() => {
    setStarted(true);
  }, []);

  const handleGameResult = useCallback(
    (res: GameResult) => {
      setResult(res);
      // Relay the result back through the socket
      socketService.emitGameResult(res);
    },
    [],
  );

  if (started && hasValidUrl) {
    return (
      <Box className="my-2">
        <GameSandbox
          srcUrl={gameUrl}
          onGameResult={handleGameResult}
        />
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-2">
      <Typography variant="body2" className="font-medium">
        🎮 {gameTitle}
      </Typography>

      {!hasValidUrl && (
        <Typography variant="caption" color="text.secondary">
          Game URL not available.
        </Typography>
      )}

      {result ? (
        <Box className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
          <Typography variant="caption" color="text.secondary">
            Score: {result.score}
          </Typography>
        </Box>
      ) : (
        hasValidUrl && (
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            className="self-start rounded-lg"
          >
            Start Game
          </Button>
        )
      )}
    </Box>
  );
};

export default GameMessage;
