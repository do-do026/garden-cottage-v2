// ============================================================
// Hermes Chat — Sidebar Component
// Desktop left-side panel containing a search bar, the chat
// list, and a button to add a new bot. Width is fixed at 320px.
// ============================================================

import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import ChatList from '@/components/chat/ChatList';
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from '@/config/constants';

interface SidebarProps {
  /** Called when the user clicks "Add Bot". */
  onAddBot?: () => void;
  /** Called when a search query changes. */
  onSearch?: (query: string) => void;
  /** Optional class name. */
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onAddBot,
  onSearch,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      onSearch?.(value);
    },
    [onSearch],
  );

  return (
    <Box
      className={`flex flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${className}`}
      sx={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        height: '100vh',
        pt: `${TOPBAR_HEIGHT}px`,
      }}
    >
      {/* Search bar */}
      <Box className="px-3 pt-2 pb-1">
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: 'action.hover',
            },
          }}
        />
      </Box>

      {/* Chat list (scrollable) */}
      <Box className="flex-1 overflow-y-auto">
        <ChatList searchQuery={searchQuery} />
      </Box>

      {/* Add Bot button */}
      <Box className="border-t border-gray-200 p-3 dark:border-gray-700">
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={onAddBot}
          className="rounded-lg"
        >
          Add Bot
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
