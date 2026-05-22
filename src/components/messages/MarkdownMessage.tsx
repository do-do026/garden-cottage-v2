// ============================================================
// Hermes Chat — MarkdownMessage Component
// Renders Markdown content via react-markdown with:
//   - Custom component overrides for code, links, images
//   - rehype-highlight for syntax highlighting
//   - HTML disabled for security (plain text fallback via DOMPurify)
//
// Note: rehype-highlight CSS must be imported globally in
// the app entry point for syntax highlighting to appear.
// ============================================================

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { markdownComponents } from '@/utils/markdown';
import { sanitizeHtml } from '@/utils/sanitize';
import type { Message } from '@shared/types';

interface MarkdownMessageProps {
  /** The message whose Markdown content should be rendered. */
  message: Message;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ message }) => {
  const sanitizedContent = useMemo(
    () => sanitizeHtml(message.content),
    [message.content],
  );

  return (
    <div className="markdown-message break-words">
      <ReactMarkdown
        components={markdownComponents}
        rehypePlugins={[rehypeHighlight]}
        // Disallow raw HTML for security – react-markdown v9 uses
        // allowElement to control this by default; explicit safety:
        allowedElements={[
          'p', 'br', 'strong', 'em', 'i', 'b', 'a', 'ul', 'ol', 'li',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'blockquote',
          'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr',
        ]}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
