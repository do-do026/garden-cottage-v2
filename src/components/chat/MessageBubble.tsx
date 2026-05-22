// ============================================================
// Hermes Chat — MessageBubble Component
// The outer shell of a single message. Determines alignment:
//   - User messages  → right-aligned, blue bubble
//   - Bot messages   → left-aligned, grey bubble
//   - System messages → centre-aligned, no bubble
// Delegates content rendering to MessageRenderer.
// ============================================================

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MessageRenderer from '@/components/chat/MessageRenderer';
import type { Message } from '@shared/types';
import { MessageType, MessageStatus } from '@shared/types';
import { formatTime } from '@/utils/format';

interface MessageBubbleProps {
  /** The message to render. */
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.senderId === 'user';
  const isSystem = message.type === MessageType.SYSTEM;

  // System messages are rendered centred without a bubble
  if (isSystem) {
    return (
      <Box className="my-1 flex justify-center">
        <Box className="max-w-[80%] rounded-full bg-gray-200/60 px-3 py-1 dark:bg-gray-700/40">
          <MessageRenderer message={message} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className={`my-1 flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <Box className="flex max-w-[75%] flex-col gap-0.5">
        {/* Bubble */}
        <Box
          className={`message-bubble ${
            isUser ? 'message-bubble-self' : 'message-bubble-other'
          }`}
        >
          <MessageRenderer message={message} />
        </Box>

        {/* Timestamp + status */}
        <Box
          className={`flex items-center gap-1 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            className="text-xs"
          >
            {formatTime(message.timestamp)}
          </Typography>
          {isUser && message.status === MessageStatus.READ && (
            <Typography
              variant="caption"
              color="primary"
              className="text-xs"
            >
              ✓✓
            </Typography>
          )}
          {isUser && message.status === MessageStatus.SENT && (
            <Typography
              variant="caption"
              color="text.secondary"
              className="text-xs"
            >
              ✓
            </Typography>
          )}
          {isUser && message.status === MessageStatus.FAILED && (
            <Typography
              variant="caption"
              color="error"
              className="text-xs"
            >
              ✗
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;
