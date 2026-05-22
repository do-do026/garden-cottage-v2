// ============================================================
// Hermes Chat — ProgressMessage Component
// Renders a task-progress card with Material UI LinearProgress
// bar, a percentage label, and a descriptive step label.
// ============================================================

import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Message } from '@shared/types';
import { formatProgress } from '@/utils/format';

interface ProgressMessageProps {
  /** The message with progress metadata. */
  message: Message;
}

const ProgressMessage: React.FC<ProgressMessageProps> = ({ message }) => {
  const progressValue: number = message.metadata?.progressValue ?? 0;
  const progressMax: number = message.metadata?.progressMax ?? 100;
  const progressLabel: string = message.metadata?.progressLabel ?? '';
  const messageContent: string = message.content;

  const percentage = useMemo(
    () => formatProgress(progressValue, progressMax),
    [progressValue, progressMax],
  );

  const isComplete = progressValue >= progressMax && progressMax > 0;

  const normalizedValue = useMemo(() => {
    if (progressMax <= 0) return 0;
    return Math.min(100, Math.max(0, (progressValue / progressMax) * 100));
  }, [progressValue, progressMax]);

  return (
    <Box className="flex flex-col gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
      {/* Header */}
      <Box className="flex items-center gap-2">
        {isComplete ? (
          <CheckCircleIcon color="success" fontSize="small" />
        ) : null}
        <Typography variant="body2" className="font-medium">
          {messageContent || 'Task Progress'}
        </Typography>
        <Typography
          variant="caption"
          color={isComplete ? 'success.main' : 'text.secondary'}
          className="ml-auto"
        >
          {percentage}
        </Typography>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={normalizedValue}
        color={isComplete ? 'success' : 'primary'}
        sx={{ height: 8, borderRadius: 4 }}
      />

      {/* Descriptive label */}
      {progressLabel && (
        <Typography variant="caption" color="text.secondary">
          {progressLabel}
        </Typography>
      )}

      {isComplete && (
        <Typography variant="caption" color="success.main">
          Complete
        </Typography>
      )}
    </Box>
  );
};

export default ProgressMessage;
