// ============================================================
// Hermes Chat — TopNavbar Component
// Fixed top app bar displaying the app title and quick-access
// icon buttons for notifications, settings, and user profile.
// ============================================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { TOPBAR_HEIGHT } from '@/config/constants';

interface TopNavbarProps {
  /** Called when the hamburger / menu toggle button is clicked. */
  onMenuToggle?: () => void;
  /** Optional class name. */
  className?: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
          <Typography
            variant="h6"
            noWrap
            className="font-semibold cursor-pointer"
            onClick={() => navigate('/')}
            sx={{ userSelect: 'none' }}
          >
            🏡 Garden Cottage
          </Typography>
        </Box>

        {/* Right: action icons with navigation */}
        <Box className="flex items-center gap-1">
          <Tooltip title="通知">
            <IconButton
              color="inherit"
              aria-label="notifications"
              onClick={() => navigate('/')}
            >
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="设置">
            <IconButton
              color="inherit"
              aria-label="settings"
              onClick={() => navigate('/settings')}
              sx={{ color: location.pathname === '/settings' ? 'primary.main' : undefined }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="关于">
            <IconButton
              color="inherit"
              aria-label="account"
              onClick={() => navigate('/settings')}
            >
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavbar;
