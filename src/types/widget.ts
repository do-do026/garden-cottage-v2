// ============================================================
// Hermes Chat — Frontend WIDGET Type Extensions
// Defines the React component contract for rendering WIDGET
// messages. Each registered widget template maps to a dedicated
// React component via WidgetComponentRegistry.
// ============================================================

import type { WidgetTemplate, WidgetData, Message } from '@shared/types';

/**
 * Props contract for every widget component.
 *
 * Each registered widget component receives the parsed widget
 * data and the full parent message.  The `onResult` callback
 * allows the widget to report user interactions (e.g. poll
 * votes) back to the chat store, which will emit the appropriate
 * Socket.IO event to the server.
 */
export interface WidgetComponentProps {
  /** Typed widget data payload matching the registered template. */
  data: WidgetData;
  /** The parent message that carries this widget. */
  message: Message;
  /** Callback fired when the user interacts with the widget. */
  onResult: (result: Record<string, unknown>) => void;
}

/**
 * Registry mapping each WidgetTemplate to its React component.
 *
 * Populating this registry is the responsibility of the widget
 * loader / bootstrap module.  Components that are not yet
 * registered will be silently skipped at render time.
 */
export type WidgetComponentRegistry = Record<
  WidgetTemplate,
  React.ComponentType<WidgetComponentProps>
>;
