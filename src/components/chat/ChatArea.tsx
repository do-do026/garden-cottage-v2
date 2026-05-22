// ============================================================
// Hermes Chat — ChatArea Component
// The main conversation view: a header with the bot's name and
// online status, a scrollable message list, and a message
// input bar at the bottom.
// ============================================================

import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import Avatar from '@/components/common/Avatar';
import Spinner from '@/components/common/Spinner';
import { useChat } from '@/hooks/useChat';
import { useBotStore } from '@/store/botStore';
import { BotStatus } from '@shared/types';
import { TOPBAR_HEIGHT } from '@/config/constants';

const ChatArea: React.FC = () => {
  const { activeChat, messages, isLoading, sendMessage, loadHistory, error } = useChat();
  const getBotById = useBotStore((s) => s.getBotById);

  const bot = activeChat ? getBotById(activeChat.botId) : null;
  const isOnline = bot?.status === BotStatus.ONLINE;

  // Load history when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadHistory(activeChat.id);
    }
  }, [activeChat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeChat) {
    return (
      <Box className="flex h-full flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Box className="flex flex-col items-center gap-3 text-center">
          <Typography variant="h6" color="text.secondary">
            Select a chat to start messaging
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a conversation from the sidebar or add a new bot.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="flex h-full flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <Box
        className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900"
        sx={{ height: TOPBAR_HEIGHT, flexShrink: 0 }}
      >
        <Avatar
          src={bot?.avatarUrl}
          alt={activeChat.title}
          online={isOnline}
          size={40}
        />
        <Box className="flex min-w-0 flex-1 flex-col">
          <Typography variant="body1" noWrap className="font-medium">
            {activeChat.title}
          </Typography>
          <Typography variant="caption" color={isOnline ? 'success.main' : 'text.secondary'}>
            {isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Box>
        <IconButton size="small">
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box className="flex-1 overflow-y-auto">
        {isLoading && messages.length === 0 ? (
          <Spinner text="Loading messages..." />
        ) : (
          <MessageList messages={messages} />
        )}
        {error && (
          <Typography
            variant="body2"
            color="error"
            className="px-4 py-2 text-center"
          >
            {error}
          </Typography>
        )}
      </Box>

      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </Box>
  );
};

export default ChatArea;
