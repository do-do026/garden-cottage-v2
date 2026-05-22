// ============================================================
// Hermes Chat — PollWidget Component
// Full-featured poll widget with voting, live results from
// the server, countdown timer, and support for multiple-choice
// polls. Communicates via typed socketService methods.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';
import { socketService } from '@/services/socket';
import type { Message, PollWidgetData, WidgetResultEvent, PollResultOption } from '@shared/types';

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

interface PollWidgetProps {
  message: Message;
}

/** Format remaining seconds to mm:ss string. */
function formatTimeLeft(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Derive the initial deadline timestamp from the message creation time + duration. */
function getInitialDeadline(message: Message, data: PollWidgetData): number {
  if (data.durationMinutes && data.durationMinutes > 0) {
    return message.timestamp + data.durationMinutes * 60 * 1000;
  }
  return 0;
}

// -----------------------------------------------------------
// Component
// -----------------------------------------------------------

const PollWidget: React.FC<PollWidgetProps> = ({ message }) => {
  const widgetMeta = message.metadata.widget;
  const widgetId = message.id;
  const chatId = message.chatId;

  // Parse poll data from metadata
  const pollData: PollWidgetData | null = useMemo(() => {
    if (!widgetMeta) return null;
    return widgetMeta.data as unknown as PollWidgetData;
  }, [widgetMeta]);

  // -----------------------------------------------------------
  // State
  // -----------------------------------------------------------
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [results, setResults] = useState<PollResultOption[] | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [deadline, setDeadline] = useState<number>(() =>
    pollData ? getInitialDeadline(message, pollData) : 0,
  );
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------
  // Countdown timer
  // -----------------------------------------------------------
  useEffect(() => {
    if (!isActive || deadline === 0) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsActive(false);
      }
    };

    tick();
    const interval = setInterval(tick, 1_000);
    return () => clearInterval(interval);
  }, [isActive, deadline]);

  // -----------------------------------------------------------
  // Listen for widget:result events from the server
  // -----------------------------------------------------------
  const handleResult = useCallback(
    (event: WidgetResultEvent) => {
      if (event.widgetId !== widgetId || event.chatId !== chatId) return;
      setResults(event.options);
      setIsActive(event.isActive);
    },
    [widgetId, chatId],
  );

  useEffect(() => {
    const unsubscribe = socketService.onWidgetResult(handleResult);
    return unsubscribe;
  }, [handleResult]);

  // -----------------------------------------------------------
  // Listen for widget:closed events
  // -----------------------------------------------------------
  useEffect(() => {
    const handleClosed = (event: { widgetId: string }) => {
      if (event.widgetId === widgetId) {
        setIsActive(false);
      }
    };
    const unsubscribe = socketService.onWidgetClosed(handleClosed);
    return unsubscribe;
  }, [widgetId]);

  // -----------------------------------------------------------
  // Selection handlers
  // -----------------------------------------------------------
  const allowMultiple = pollData?.allowMultiple ?? false;

  const toggleOption = (optionId: string) => {
    if (!isActive || hasVoted) return;
    setError(null);

    if (allowMultiple) {
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      );
    } else {
      setSelectedIds([optionId]);
    }
  };

  // -----------------------------------------------------------
  // Vote submission
  // -----------------------------------------------------------
  const handleVote = () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one option.');
      return;
    }
    if (!isActive) {
      setError('This poll has ended.');
      return;
    }

    socketService.emitWidgetVote({
      widgetId,
      chatId,
      userId: 'user',
      selectedOptionIds: selectedIds,
    });

    setHasVoted(true);
    setError(null);
  };

  // -----------------------------------------------------------
  // Derived: total votes for percentage calculation
  // -----------------------------------------------------------
  const totalVotes = useMemo(() => {
    if (!results) return 0;
    return results.reduce((sum, opt) => sum + opt.voteCount, 0);
  }, [results]);

  // -----------------------------------------------------------
  // Guard: missing data
  // -----------------------------------------------------------
  if (!pollData) {
    return (
      <Typography variant="body2" color="error">
        ⚠️ Missing poll widget data
      </Typography>
    );
  }

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------
  const expired = !isActive;

  return (
    <Card sx={{ maxWidth: 420, borderRadius: 3, boxShadow: 3 }}>
      <CardContent>
        {/* Header: question + countdown */}
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} mb={2} flexWrap="wrap">
          <Typography variant="h6" component="h3" fontWeight={600}>
            📊 {pollData.question}
          </Typography>
          {pollData.durationMinutes && isActive && (
            <Typography
              variant="caption"
              color={timeLeft <= 30 ? 'error' : 'text.secondary'}
              fontWeight={600}
              sx={{ whiteSpace: 'nowrap' }}
            >
              ⏱️ {formatTimeLeft(timeLeft)}
            </Typography>
          )}
          {expired && (
            <Chip label="Closed" color="default" size="small" />
          )}
        </Box>

        {/* Options */}
        <Box display="flex" flexDirection="column" gap={0.5} mb={2}>
          {pollData.options.map((option) => {
            const isSelected = selectedIds.includes(option.id);
            const result = results?.find((r) => r.id === option.id);
            const voteCount = result?.voteCount ?? 0;
            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

            return (
              <Box key={option.id}>
                {/* Option row */}
                <Box
                  onClick={() => toggleOption(option.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 2,
                    cursor: expired || hasVoted ? 'default' : 'pointer',
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: expired || hasVoted ? undefined : 'action.hover',
                    },
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Background progress bar (shown after voting or if results exist) */}
                  {(hasVoted || results) && totalVotes > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${pct}%`,
                        bgcolor: isSelected ? 'primary.light' : 'grey.200',
                        opacity: 0.35,
                        borderRadius: 2,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  )}

                  {/* Selection control */}
                  {allowMultiple ? (
                    <Checkbox
                      checked={isSelected}
                      disabled={expired || hasVoted}
                      size="small"
                      sx={{ zIndex: 1 }}
                    />
                  ) : (
                    <Radio
                      checked={isSelected}
                      disabled={expired || hasVoted}
                      size="small"
                      sx={{ zIndex: 1 }}
                    />
                  )}

                  {/* Label + optional vote count */}
                  <Box flex={1} zIndex={1} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{option.label}</Typography>
                    {(hasVoted || results) && (
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {voteCount} vote{voteCount !== 1 ? 's' : ''} ({pct}%)
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Results bar below option */}
                {(hasVoted || results) && totalVotes > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      mx: 1,
                      mb: 0.25,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, py: 0 }}>
            {error}
          </Alert>
        )}

        {/* Vote button */}
        {!expired && !hasVoted && (
          <Button
            variant="contained"
            fullWidth
            onClick={handleVote}
            disabled={selectedIds.length === 0}
            sx={{ borderRadius: 2 }}
          >
            Vote
          </Button>
        )}

        {/* Voted confirmation */}
        {hasVoted && (
          <Typography variant="body2" color="success.main" textAlign="center" fontWeight={500}>
            ✅ Your vote has been recorded
          </Typography>
        )}

        {/* Expired notice without voting */}
        {expired && !hasVoted && (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            ⏰ This poll has ended
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PollWidget;
