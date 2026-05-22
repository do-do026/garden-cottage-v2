// ============================================================
// Hermes Chat — TopNavbar Component
// Fixed top app bar displaying the app title and quick-access
// icon buttons for notifications, settings, and user profile.
// ============================================================

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Box from '@mui/material/Box';
import { TOPBAR_HEIGHT } from '@/config/constants';

interface TopNavbarProps {
  /** Called when the hamburger / menu toggle button is clicked. */
  onMenuToggle?: () => void;
  /** Optional class name. */
  className?: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle, className = '' }) => {
  return (
    <AppBar
      position="fixed"
      elevation={1}
      className={className}
      sx={{
        height: TOPBAR_HEIGHT,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar className="flex items-center justify-between px-4" sx={{ minHeight: TOPBAR_HEIGHT }}>
        {/* Left: hamburger (mobile) + title */}
        <Box className="flex items-center gap-2">
          {onMenuToggle && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMenuToggle}
              className="desktop:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </IconButton>
          )}
          <Typography variant="h6" noWrap className="font-semibold">
            Hermes Chat
          </Typography>
        </Box>

        {/* Right: action icons */}
        <Box className="flex items-center gap-1">
          <IconButton color="inherit" aria-label="notifications">
            <NotificationsIcon />
          </IconButton>
          <IconButton color="inherit" aria-label="settings">
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" aria-label="account">
            <AccountCircleIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavbar;
