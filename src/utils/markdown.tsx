// ============================================================
// Hermes Chat — Markdown Rendering Configuration
// Custom component overrides for react-markdown to match the
// Hermes Chat visual style (Telegram-inspired, dark-code).
// ============================================================

import type { Components } from 'react-markdown';

/**
 * Custom react-markdown `Components` map that overrides default
 * rendering for code blocks, links, images, and other elements.
 */
export const markdownComponents: Components = {
  // Code blocks — dark background, monospace font
  code({ className, children, ...props }) {
    const isInline = !className;
    const extraClass = isInline
      ? 'rounded bg-gray-200 px-1 py-0.5 font-mono text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      : 'block overflow-x-auto rounded-lg bg-gray-900 p-3 font-mono text-sm text-gray-100 dark:bg-gray-800';
    return (
      <code className={extraClass} {...props}>
        {children}
      </code>
    );
  },

  // Pre blocks — wrapper for fenced code blocks
  pre({ children, ...props }) {
    return (
      <pre
        className="my-2 overflow-x-auto rounded-lg bg-gray-900 p-3 dark:bg-gray-800"
        {...props}
      >
        {children}
      </pre>
    );
  },

  // Links — open in new tab with rel="noopener noreferrer"
  a({ href, children, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        {...props}
      >
        {children}
      </a>
    );
  },

  // Images — constrained width, rounded corners
  img({ src, alt, ...props }) {
    return (
      <img
        src={src}
        alt={alt ?? 'image'}
        className="my-2 max-w-full rounded-lg"
        loading="lazy"
        {...props}
      />
    );
  },

  // Blockquote — left border accent
  blockquote({ children, ...props }) {
    return (
      <blockquote
        className="my-2 border-l-4 border-gray-400 pl-4 italic text-gray-600 dark:border-gray-500 dark:text-gray-400"
        {...props}
      >
        {children}
      </blockquote>
    );
  },

  // Headings — scaled font sizes
  h1({ children, ...props }) {
    return <h1 className="my-2 text-xl font-bold" {...props}>{children}</h1>;
  },
  h2({ children, ...props }) {
    return <h2 className="my-2 text-lg font-bold" {...props}>{children}</h2>;
  },
  h3({ children, ...props }) {
    return <h3 className="my-2 text-base font-semibold" {...props}>{children}</h3>;
  },

  // Paragraphs
  p({ children, ...props }) {
    return <p className="my-1" {...props}>{children}</p>;
  },

  // Lists
  ul({ children, ...props }) {
    return <ul className="my-1 list-disc pl-6" {...props}>{children}</ul>;
  },
  ol({ children, ...props }) {
    return <ol className="my-1 list-decimal pl-6" {...props}>{children}</ol>;
  },
};
