// ============================================================
// Hermes Chat — BotSwitcher Component
// Compact button in the chat header showing the active bot.
// Click opens a menu to switch between bots in the current chat
// or clear the selection ("All Bots"). Fits in a 48px header.
// ============================================================

import React, { useState, useCallback } from 'react';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@/components/common/Avatar';
import { useBotStore } from '@/store/botStore';
import { useChatStore } from '@/store/chatStore';
import { BotStatus } from '@shared/types';

interface BotSwitcherProps {
  /** The chat ID for which we're switching bots. */
  chatId: string;
  /** The currently active bot ID in this chat, or null (= all bots). */
  activeBotId: string | null;
  /** Called when the user selects a bot to route replies to. */
  onSelectBot: (botId: string | null) => void;
}

const BotSwitcher: React.FC<BotSwitcherProps> = ({
  chatId,
  activeBotId,
  onSelectBot,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const bots = useBotStore((s) => s.bots);
  const getBotById = useBotStore((s) => s.getBotById);
  const chat = useChatStore((s) => s.chats.find((c) => c.id === chatId));

  // Only show bots that are participants of this chat
  const participantBots = React.useMemo(() => {
    if (!chat?.participants) return [];
    const participantSet = new Set(chat.participants);
    return bots.filter((b) => participantSet.has(b.id));
  }, [bots, chat?.participants]);

  const activeBot = activeBotId ? getBotById(activeBotId) : null;

  const isOpen = Boolean(anchorEl);

  const handleOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(e.currentTarget);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelect = useCallback(
    (botId: string | null) => {
      onSelectBot(botId);
      handleClose();
    },
    [onSelectBot, handleClose],
  );

  return (
    <>
      <Chip
        size="small"
        variant="outlined"
        onClick={handleOpen}
        avatar={
          activeBot ? (
            <Avatar
              src={activeBot.avatarUrl}
              alt={activeBot.name}
              size={20}
            />
          ) : undefined
        }
        label={activeBot ? activeBot.name : 'All Bots'}
        sx={{
          height: 28,
          maxWidth: 120,
          '& .MuiChip-label': {
            fontSize: '0.75rem',
            px: 1,
          },
          '& .MuiChip-avatar': {
            width: 20,
            height: 20,
          },
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        {/* "All Bots" option */}
        <MenuItem
          selected={activeBotId === null}
          onClick={() => handleSelect(null)}
          dense
        >
          <ListItemIcon>
            <Avatar alt="All" size={24} />
          </ListItemIcon>
          <ListItemText
            primary="All Bots"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>

        {participantBots.length > 0 && <Divider />}

        {participantBots.map((bot) => {
          const isOnline = bot.status === BotStatus.ONLINE;
          return (
            <MenuItem
              key={bot.id}
              selected={activeBotId === bot.id}
              onClick={() => handleSelect(bot.id)}
              dense
            >
              <ListItemIcon>
                <Avatar
                  src={bot.avatarUrl}
                  alt={bot.name}
                  online={isOnline}
                  size={24}
                />
              </ListItemIcon>
              <ListItemText
                primary={bot.name}
                secondary={isOnline ? 'Online' : 'Offline'}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: isOnline ? 'success.main' : 'text.secondary',
                }}
              />
            </MenuItem>
          );
        })}

        {participantBots.length === 0 && (
          <MenuItem disabled dense>
            <ListItemText
              primary="No bots in this chat"
              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default BotSwitcher;
