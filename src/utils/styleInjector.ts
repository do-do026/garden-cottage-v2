// ============================================================
// Hermes Chat — MessageStyle Safe Injection Utility
//
// Converts a MessageStyle object into a safe MUI `sx` prop by
// only forwarding properties that appear in the STYLE_WHITELIST.
// This prevents bots from injecting arbitrary CSS that could
// break the layout or create security issues.
// ============================================================

import type { MessageStyle } from '@shared/types';
import { STYLE_WHITELIST } from '@shared/constants';
import type { SxProps } from '@mui/material';

/**
 * Converts a MessageStyle to a safe MUI `sx` prop object.
 *
 * Only whitelisted style keys are forwarded.  Empty / undefined
 * / null values are silently skipped so the default MUI theme
 * values take effect.
 *
 * Key mapping:
 *  - `background`    → `backgroundColor` (MUI sx convention)
 *  - `border`        → `border`
 *  - `fontFamily`    → `fontFamily`
 *  - `fontSize`      → `fontSize`
 *  - `fontWeight`    → `fontWeight`
 *  - `color`         → `color`
 *  - `borderRadius`  → `borderRadius`
 *
 * @param style - The (possibly untrusted) MessageStyle from a bot.
 * @returns A safe MUI SxProps object that can be spread onto a Box / Typography.
 */
export function messageStyleToSx(style?: MessageStyle): SxProps {
  if (!style) return {};

  const sx: Record<string, unknown> = {};
  for (const key of STYLE_WHITELIST) {
    const value = (style as Record<string, unknown>)[key];
    if (value !== undefined && value !== null && value !== '') {
      // Map MessageStyle keys to CSS-in-JS camelCase for MUI sx
      const cssKey = key === 'background' ? 'backgroundColor' : key;
      sx[cssKey] = value;
    }
  }
  return sx as SxProps;
}

/**
 * Validates and sanitises a raw style object against the whitelist.
 *
 * Any key not present in STYLE_WHITELIST is silently dropped.
 * This is useful when receiving a style payload from an untrusted
 * source (e.g. a bot message) and you want a clean MessageStyle
 * before storing or forwarding it.
 *
 * @param style - A raw key-value object (could contain arbitrary keys).
 * @returns A MessageStyle containing only whitelisted keys.
 */
export function sanitizeStyle(style: Record<string, unknown>): MessageStyle {
  const sanitized: Record<string, unknown> = {};
  for (const key of STYLE_WHITELIST) {
    if (key in style) {
      sanitized[key] = style[key];
    }
  }
  return sanitized as MessageStyle;
}
