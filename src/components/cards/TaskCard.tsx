// ============================================================
// Hermes Chat — TaskCard Component
// Renders a task with name, a colour-coded LinearProgress bar,
// and an optional due date. Colour coding:
//   green  (>80%),  blue (40–80%),  orange (<40%).
// ============================================================

import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

interface TaskCardProps {
  data: { name: string; progress: number; dueDate?: string };
}

/** Determine the progress bar colour based on the percentage value. */
function getProgressColor(value: number): 'success' | 'info' | 'warning' {
  if (value > 80) return 'success';
  if (value >= 40) return 'info';
  return 'warning';
}

/** Format an ISO date string to a human-readable short form. */
function formatDueDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const TaskCard: React.FC<TaskCardProps> = ({ data }) => {
  const { name, progress, dueDate } = data;
  const clamped = Math.max(0, Math.min(100, progress));
  const color = getProgressColor(clamped);

  return (
    <Card
      sx={{
        maxWidth: 400,
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      <CardContent>
        {/* Task name */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Typography variant="h6" component="span" fontSize="1.5rem">
            📋
          </Typography>
          <Typography variant="h6" component="h3" fontWeight={600}>
            {name}
          </Typography>
        </Box>

        {/* Progress bar + percentage */}
        <Box display="flex" alignItems="center" gap={1.5} mb={dueDate ? 1 : 0}>
          <Box flex={1}>
            <LinearProgress
              variant="determinate"
              value={clamped}
              color={color}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Typography variant="body2" fontWeight={600} color={`${color}.main`}>
            {clamped}%
          </Typography>
        </Box>

        {/* Due date */}
        {dueDate && (
          <Typography variant="caption" color="text.secondary">
            📅 Due: {formatDueDate(dueDate)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;
