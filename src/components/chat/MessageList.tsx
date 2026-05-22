// ============================================================
// Hermes Chat — MessageList Component
// Renders the list of messages for the active chat. Features:
//   - Auto-scroll to bottom when new messages arrive
//   - Load-more trigger when scrolling to the top
// ============================================================

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import MessageBubble from '@/components/chat/MessageBubble';
import type { Message } from '@shared/types';

interface MessageListProps {
  /** Array of messages to render (sorted by timestamp asc). */
  messages: Message[];
  /** Called when the user scrolls to the top to load older messages. */
  onLoadMore?: () => void;
  /** Whether more history is being loaded. */
  isLoadingMore?: boolean;
  /** Whether there is more history to load. */
  hasMore?: boolean;
  /** Optional class name. */
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onLoadMore,
  isLoadingMore = false,
  hasMore = false,
  className = '',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true);
  const prevMessageCount = useRef<number>(0);

  /** Detect whether the user is near the bottom (within 100px). */
  const isNearBottom = useCallback((): boolean => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  /** Scroll to the very bottom. */
  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Auto-scroll when new messages arrive (and user is near bottom)
  useEffect(() => {
    const prevCount = prevMessageCount.current;
    prevMessageCount.current = messages.length;

    if (messages.length > prevCount && shouldAutoScroll) {
      scrollToBottom(prevCount === 0); // smooth only for initial load
    }
  }, [messages, shouldAutoScroll, scrollToBottom]);

  // Initial scroll
  useEffect(() => {
    scrollToBottom(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track whether to auto-scroll based on user scroll position
  const handleScroll = useCallback(() => {
    setShouldAutoScroll(isNearBottom());

    // Load-more: if scrolled to top and we have more
    if (containerRef.current && containerRef.current.scrollTop < 50) {
      if (hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    }
  }, [isNearBottom, hasMore, isLoadingMore, onLoadMore]);

  if (messages.length === 0) {
    return (
      <Box className="flex h-full items-center justify-center">
        <Typography variant="body2" color="text.secondary">
          No messages yet. Say hello!
        </Typography>
      </Box>
    );
  }

  // Sort by timestamp ascending for display
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex flex-col gap-1 overflow-y-auto px-4 py-2 ${className}`}
    >
      {isLoadingMore && (
        <Box className="flex justify-center py-2">
          <CircularProgress size={20} />
        </Box>
      )}

      {sorted.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      <div ref={bottomRef} />
    </Box>
  );
};

export default MessageList;
