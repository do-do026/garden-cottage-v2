// ============================================================
// Hermes Chat — MessageInput Component
// A multi-line text field with a send button. Enter sends,
// Shift+Enter inserts a newline. Empty messages are rejected.
// Supports @mention autocomplete for bot routing.
// ============================================================

import React, { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import MentionAutocomplete from '@/components/chat/MentionAutocomplete';
import { extractMentionAtCursor, replaceMentionAtCursor } from '@/utils/mention';
import { MAX_MESSAGE_LENGTH, MESSAGE_INPUT_MAX_ROWS } from '@/config/constants';

interface MessageInputProps {
  /** Called when the user sends a message. Receives the trimmed text. */
  onSend: (text: string) => void;
  /** Whether sending is currently disabled (e.g. no active chat). */
  disabled?: boolean;
  /** Optional class name. */
  className?: string;
}

interface MentionState {
  open: boolean;
  start: number;
  filter: string;
  cursorPos: number;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  className = '',
}) => {
  const [value, setValue] = useState<string>('');
  const [mention, setMention] = useState<MentionState>({
    open: false,
    start: 0,
    filter: '',
    cursorPos: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
    setMention((prev) => ({ ...prev, open: false }));
    // Re-focus after sending
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [canSend, onSend, trimmed]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // If mention autocomplete is open, let it handle arrows, Enter, Escape
      if (mention.open) {
        if (
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'Enter' ||
          e.key === 'Escape'
        ) {
          // Don't prevent default here — MentionAutocomplete handles it
          // But we do prevent Enter from sending when mention is open
          if (e.key === 'Enter') {
            e.preventDefault();
          }
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, mention.open],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setValue(newText);

      // Support selectionStart in textarea elements
      const target = e.target;
      const cursorPos = 'selectionStart' in target ? target.selectionStart : newText.length;

      const extracted = extractMentionAtCursor(newText, cursorPos ?? newText.length);
      if (extracted) {
        setMention({
          open: true,
          start: extracted.start,
          filter: extracted.filter,
          cursorPos: cursorPos ?? newText.length,
        });
      } else {
        setMention((prev) => ({ ...prev, open: false }));
      }
    },
    [],
  );

  const handleMentionSelect = useCallback(
    (mentionText: string, _botId: string) => {
      setValue((prev) => {
        const result = replaceMentionAtCursor(prev, mention.cursorPos, mentionText);
        // Set cursor position after the update
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.selectionStart = result.newCursor;
            inputRef.current.selectionEnd = result.newCursor;
          }
        }, 0);
        return result.newText;
      });
      setMention((prev) => ({ ...prev, open: false }));
    },
    [mention.cursorPos],
  );

  const handleMentionClose = useCallback(() => {
    setMention((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <Box
      className={`flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <Box className="relative flex-1">
        <MentionAutocomplete
          text={value}
          cursorPos={mention.cursorPos}
          onSelect={handleMentionSelect}
          onClose={handleMentionClose}
        />
        <TextField
          inputRef={inputRef}
          multiline
          maxRows={MESSAGE_INPUT_MAX_ROWS}
          fullWidth
          placeholder="Type a message..."
          value={value}
          onChange={handleChange}
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
      </Box>
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
