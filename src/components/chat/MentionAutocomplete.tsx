// ============================================================
// Hermes Chat — MentionAutocomplete Component
// Dropdown popover that appears when the user types '@' in the
// message input. Filters bots by name/ID, supports keyboard
// navigation (↑↓ arrows, Enter, Escape), and click-to-select.
// ============================================================

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Avatar from '@/components/common/Avatar';
import { useBotStore } from '@/store/botStore';
import { BotStatus } from '@shared/types';
import type { Bot } from '@shared/types';

interface MentionAutocompleteProps {
  /** The full text currently in the input field. */
  text: string;
  /** Current cursor/selection position within the text. */
  cursorPos: number;
  /** Called when the user selects a mention. Passes the display text and bot ID. */
  onSelect: (mentionText: string, botId: string) => void;
  /** Called when the popover should close without selection. */
  onClose: () => void;
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  text,
  cursorPos,
  onSelect,
  onClose,
}) => {
  const bots = useBotStore((s) => s.bots);
  const [highlightIndex, setHighlightIndex] = useState<number>(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Extract the filter text for the current @mention
  const mentionState = useMemo<{ start: number; filter: string } | null>(() => {
    const idx = text.lastIndexOf('@', cursorPos);
    if (idx === -1) return null;

    // Check that there's no space between @ and cursor
    const afterAt = text.slice(idx + 1, cursorPos);
    if (afterAt.includes(' ')) return null;

    return { start: idx, filter: afterAt.toLowerCase() };
  }, [text, cursorPos]);

  // Filter bots by the mention filter text
  const filteredBots = useMemo<Bot[]>(() => {
    if (!mentionState) return [];
    const f = mentionState.filter;
    if (f === '') return bots;
    return bots.filter(
      (b) =>
        b.name.toLowerCase().includes(f) ||
        b.id.toLowerCase().includes(f),
    );
  }, [bots, mentionState]);

  const isOpen = mentionState !== null && filteredBots.length > 0;

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [mentionState?.filter]);

  // Scroll the highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-mention-item]');
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  const handleSelectBot = useCallback(
    (bot: Bot) => {
      onSelect(`@${bot.id} `, bot.id);
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev < filteredBots.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : filteredBots.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredBots[highlightIndex]) {
            handleSelectBot(filteredBots[highlightIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    },
    [isOpen, filteredBots, highlightIndex, handleSelectBot, onClose],
  );

  // Attach global keyboard listener when open
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: Event) => handleKeyDown(e as unknown as KeyboardEvent);
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <Popper
      open
      anchorEl={document.activeElement as HTMLElement | null}
      placement="top-start"
      style={{ zIndex: 1300 }}
      disablePortal={false}
    >
      <Paper
        elevation={8}
        sx={{
          maxHeight: 240,
          overflow: 'auto',
          minWidth: 200,
          mt: 0.5,
        }}
      >
        <List ref={listRef} dense disablePadding>
          {filteredBots.map((bot, index) => {
            const isOnline = bot.status === BotStatus.ONLINE;
            const isHighlighted = index === highlightIndex;

            return (
              <ListItemButton
                key={bot.id}
                data-mention-item
                selected={isHighlighted}
                onClick={() => handleSelectBot(bot)}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar
                    src={bot.avatarUrl}
                    alt={bot.name}
                    online={isOnline}
                    size={32}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={bot.name}
                  secondary={`@${bot.id}`}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    noWrap: true,
                  }}
                />
                {isOnline && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      flexShrink: 0,
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Paper>
    </Popper>
  );
};

export default MentionAutocomplete;
