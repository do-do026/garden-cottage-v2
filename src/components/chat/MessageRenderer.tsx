// ============================================================
// Hermes Chat — MessageRenderer Component
// Type-dispatching renderer that delegates each message.type
// to the appropriate specialised component:
//
//   TEXT      → TextMessage
//   MARKDOWN  → MarkdownMessage
//   GAME      → GameMessage
//   PROGRESS  → ProgressMessage
//   SYSTEM    → SystemMessage
//   CARD      → CardRenderer
//   WIDGET    → WidgetRenderer
//   UI_MOD    → no rendered content (handled by socket listener)
// ============================================================

import React from 'react';
import Typography from '@mui/material/Typography';
import TextMessage from '@/components/messages/TextMessage';
import MarkdownMessage from '@/components/messages/MarkdownMessage';
import GameMessage from '@/components/messages/GameMessage';
import ProgressMessage from '@/components/messages/ProgressMessage';
import SystemMessage from '@/components/messages/SystemMessage';
import CardRenderer from '@/components/cards/CardRenderer';
import WidgetRenderer from '@/components/widgets/WidgetRenderer';
import type { Message } from '@shared/types';
import { MessageType } from '@shared/types';

interface MessageRendererProps {
  /** The message whose content should be rendered. */
  message: Message;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ message }) => {
  switch (message.type) {
    case MessageType.TEXT:
      return <TextMessage message={message} />;

    case MessageType.MARKDOWN:
      return <MarkdownMessage message={message} />;

    case MessageType.GAME:
      return <GameMessage message={message} />;

    case MessageType.PROGRESS:
      return <ProgressMessage message={message} />;

    case MessageType.SYSTEM:
      return <SystemMessage message={message} />;

    case MessageType.CARD:
      return <CardRenderer message={message} />;

    case MessageType.WIDGET:
      return <WidgetRenderer message={message} />;

    case MessageType.UI_MOD:
      // UI_MOD messages are consumed by the socket listener
      // and applied to UIStore — nothing to render in the chat.
      return null;

    default:
      // Fallback: render raw content as plain text
      return (
        <Typography variant="body2" className="whitespace-pre-wrap break-words">
          {message.content}
        </Typography>
      );
  }
};

export default MessageRenderer;
