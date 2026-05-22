// ============================================================
// Hermes Chat — ChatListItem Component
// A single row in the chat list: avatar, bot name, last-message
// preview, timestamp, and unread count badge.
// ============================================================

import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import type { Chat } from '@shared/types';
import { formatTime, truncateText } from '@/utils/format';

interface ChatListItemProps {
  /** The chat to display. */
  chat: Chat;
  /** Whether this chat is the currently active one. */
  isActive?: boolean;
  /** Click handler. */
  onClick?: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isActive = false,
  onClick,
}) => {
  const formattedTime = useMemo(
    () => formatTime(chat.updatedAt),
    [chat.updatedAt],
  );

  const preview = useMemo(
    () => truncateText(chat.lastMessage ?? ''),
    [chat.lastMessage],
  );

  return (
    <Box
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : ''
      }`}
    >
      <Badge count={chat.unreadCount}>
        <Avatar alt={chat.title} size={48} />
      </Badge>

      <Box className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Box className="flex items-center justify-between">
          <Typography
            variant="body1"
            noWrap
            className="font-medium"
          >
            {chat.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            className="flex-shrink-0"
          >
            {formattedTime}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          className="text-sm"
        >
          {preview || 'No messages yet'}
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatListItem;
