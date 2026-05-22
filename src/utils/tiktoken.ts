// ============================================================
// Hermes Chat — Token Estimation Utility
//
// Provides lightweight token counting for the model-managed
// context strategy.  Uses the tiktoken library with the
// cl100k_base encoding (GPT-4 / GPT-3.5-turbo).
// Falls back to a rough character-based heuristic when the
// library is unavailable.
// ============================================================

import { encoding_for_model } from 'tiktoken';

/** Lazily-initialised tiktoken encoder (cl100k_base via 'gpt-4' model name). */
let encoder: ReturnType<typeof encoding_for_model> | null = null;

/**
 * Returns (and caches) the tiktoken encoder for cl100k_base.
 */
function getEncoder(): ReturnType<typeof encoding_for_model> {
  if (!encoder) {
    encoder = encoding_for_model('gpt-4'); // cl100k_base
  }
  return encoder;
}

/**
 * Estimates the total number of tokens consumed by an array of
 * message-like objects.
 *
 * The estimation concatenates all `content` strings with a
 * newline separator before encoding, which provides a close
 * approximation of the actual token count (off by at most a few
 * tokens for the separator overhead, which is negligible for
 * context-window calculations).
 */
export function estimateTokens(messages: { content: string }[]): number {
  try {
    const enc = getEncoder();
    const fullText = messages.map((m) => m.content).join('\n');
    return enc.encode(fullText).length;
  } catch {
    // Fallback: rough estimation (~4 characters per token for English).
    // This is intentionally conservative — it will slightly over-estimate
    // for CJK text but is safe for context-window gating.
    const fullText = messages.map((m) => m.content).join('\n');
    return Math.ceil(fullText.length / 4);
  }
}

/**
 * Estimates how many tokens remain in the model's context window
 * after accounting for the provided messages and a fixed system-
 * prompt overhead.
 *
 * @param messages        - The conversation messages to measure.
 * @param modelMaxTokens  - The model's maximum context length (default 8192 for GPT-4).
 * @param systemPromptTokens - Estimated tokens consumed by the system prompt (default 200).
 * @returns The remaining token budget (never negative).
 */
export function estimateRemainingTokens(
  messages: { content: string }[],
  modelMaxTokens: number = 8192,
  systemPromptTokens: number = 200,
): number {
  const used = estimateTokens(messages);
  return Math.max(0, modelMaxTokens - used - systemPromptTokens);
}
