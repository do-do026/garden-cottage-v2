// ============================================================
// Hermes Chat — MessageInput Component
// A multi-line text field with a send button. Enter sends,
// Shift+Enter inserts a newline. Empty messages are rejected.
// ============================================================

import React, { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import { MAX_MESSAGE_LENGTH, MESSAGE_INPUT_MAX_ROWS } from '@/config/constants';

interface MessageInputProps {
  /** Called when the user sends a message. Receives the trimmed text. */
  onSend: (text: string) => void;
  /** Whether sending is currently disabled (e.g. no active chat). */
  disabled?: boolean;
  /** Optional class name. */
  className?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  className = '',
}) => {
  const [value, setValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
    // Re-focus after sending
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [canSend, onSend, trimmed]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Box
      className={`flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <TextField
        inputRef={inputRef}
        multiline
        maxRows={MESSAGE_INPUT_MAX_ROWS}
        fullWidth
        placeholder="Type a message..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '20px',
            bgcolor: 'action.hover',
          },
        }}
      />
      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={!canSend}
        className="flex-shrink-0"
        aria-label="Send message"
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
