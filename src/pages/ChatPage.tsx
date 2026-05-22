// ============================================================
// Hermes Chat — ChatPage Component
// The main chat view. On desktop it shows both sidebar and
// chat area inside AppLayout. On mobile it renders either the
// chat list or the active conversation (based on activeChatId).
// ============================================================

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ChatArea from '@/components/chat/ChatArea';
import ChatList from '@/components/chat/ChatList';
import { useChatStore } from '@/store/chatStore';
import { useResponsive } from '@/hooks/useResponsive';

const ChatPage: React.FC = () => {
  const { isMobile } = useResponsive();
  const activeChatId = useChatStore((s) => s.activeChatId);

  // Desktop: AppLayout handles the sidebar; we just render ChatArea
  // (This is designed to be used as a child route under AppLayout)
  if (!isMobile && activeChatId) {
    return <ChatArea />;
  }

  if (!isMobile && !activeChatId) {
    return (
      <Box className="flex h-full flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Box className="flex flex-col items-center gap-3 text-center">
          <Typography variant="h6" color="text.secondary">
            Select a chat
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a conversation from the sidebar to start messaging.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Mobile: show chat list if no active chat, otherwise show chat area
  if (isMobile && activeChatId) {
    return <ChatArea />;
  }

  // Mobile: show chat list
  return (
    <Box className="flex h-full flex-col overflow-hidden">
      <Box className="flex-1 overflow-y-auto">
        <ChatList />
      </Box>
    </Box>
  );
};

export default ChatPage;
