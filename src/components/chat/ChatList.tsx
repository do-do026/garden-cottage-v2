// ============================================================
// Hermes Chat — ChatList Component
// Renders a scrollable list of ChatListItem entries, filtered
// by an optional search query and sorted by updatedAt desc.
// ============================================================

import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ChatListItem from '@/components/chat/ChatListItem';
import Spinner from '@/components/common/Spinner';
import { useChatStore } from '@/store/chatStore';
import { useChat } from '@/hooks/useChat';

interface ChatListProps {
  /** Filter chats whose title matches this query (case-insensitive). */
  searchQuery?: string;
  /** Optional class name. */
  className?: string;
}

const ChatList: React.FC<ChatListProps> = ({
  searchQuery = '',
  className = '',
}) => {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const isLoading = useChatStore((s) => s.isLoading);
  const { selectChat } = useChat();

  /** Filter chats by search query. */
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  return (
    <Box className={`flex flex-col ${className}`}>
      {isLoading && chats.length === 0 && (
        <Spinner text="Loading chats..." />
      )}

      {!isLoading && filteredChats.length === 0 && (
        <Box className="flex flex-col items-center justify-center gap-2 px-4 py-12">
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? 'No chats match your search.' : 'No chats yet. Add a bot to start chatting.'}
          </Typography>
        </Box>
      )}

      {filteredChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onClick={() => selectChat(chat.id)}
        />
      ))}
    </Box>
  );
};

export default ChatList;
