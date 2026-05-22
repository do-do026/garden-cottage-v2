// ============================================================
// Hermes Chat — Frontend CARD Type Extensions
// Defines the React component contract for rendering CARD
// messages. Each registered card template maps to a dedicated
// React component via CardComponentRegistry.
// ============================================================

import type { CardTemplate, CardData, Message } from '@shared/types';

/**
 * Props contract for every card component.
 *
 * Each registered card component receives the parsed card data
 * and the full parent message so it can access metadata (e.g.
 * senderId, timestamp) when needed for rendering.
 */
export interface CardComponentProps {
  /** Typed card data payload matching the registered template. */
  data: CardData;
  /** The parent message that carries this card. */
  message: Message;
}

/**
 * Registry mapping each CardTemplate to its React component.
 *
 * Populating this registry is the responsibility of the card
 * loader / bootstrap module.  Components that are not yet
 * registered will be silently skipped at render time.
 */
export type CardComponentRegistry = Record<
  CardTemplate,
  React.ComponentType<CardComponentProps>
>;
