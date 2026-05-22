// ============================================================
// Hermes Chat — Spinner Component
// Centered loading indicator with an optional label.
// ============================================================

import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface SpinnerProps {
  /** Optional descriptive text shown below the spinner. */
  text?: string;
  /** Size in pixels. Default 40. */
  size?: number;
  /** Additional class name on the container. */
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  text,
  size = 40,
  className = '',
}) => {
  return (
    <Box
      className={`flex flex-col items-center justify-center gap-2 py-8 ${className}`}
    >
      <CircularProgress size={size} />
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
    </Box>
  );
};

export default Spinner;
