// ============================================================
// Hermes Chat — TextMessage Component
// Renders plain-text message content with preserved newlines
// and auto-detected clickable links.
// ============================================================

import React, { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import type { Message } from '@shared/types';

interface TextMessageProps {
  /** The message to render. */
  message: Message;
}

/** Naive URL regex for auto-linking (covers http/https). */
const URL_REGEX = /(https?:\/\/[^\s<]+)/gi;

const TextMessage: React.FC<TextMessageProps> = ({ message }) => {
  const content = useMemo(() => {
    const text = message.content;
    const parts = text.split(URL_REGEX);
    const matches = text.match(URL_REGEX) ?? [];

    if (matches.length === 0) {
      return (
        <Typography variant="body2" className="whitespace-pre-wrap break-words">
          {text}
        </Typography>
      );
    }

    // Interleave text parts with link elements
    const elements: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        elements.push(
          <span key={`text-${i}`}>{parts[i]}</span>,
        );
      }
      if (i < matches.length) {
        const url = matches[i];
        elements.push(
          <a
            key={`link-${i}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-600"
          >
            {url}
          </a>,
        );
      }
    }

    return (
      <Typography variant="body2" className="whitespace-pre-wrap break-words">
        {elements}
      </Typography>
    );
  }, [message.content]);

  return <>{content}</>;
};

export default TextMessage;
