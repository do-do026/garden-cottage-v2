// ============================================================
// Hermes Chat — SystemMessage Component
// Renders a centred, muted system notification such as
// "Bot connected", "Theme switched to dark", etc.
// ============================================================

import React from 'react';
import Typography from '@mui/material/Typography';
import type { Message } from '@shared/types';

interface SystemMessageProps {
  /** The system notification message. */
  message: Message;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ message }) => {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      className="text-center text-xs"
    >
      {message.content}
    </Typography>
  );
};

export default SystemMessage;
