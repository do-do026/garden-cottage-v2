// ============================================================
// Hermes Chat — BottomNav Component
// Mobile bottom tab navigation with 4 tabs: Chats, Bots,
// Tasks, and Settings. Integrates with React Router.
// ============================================================

import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import { BOTTOM_NAV_HEIGHT } from '@/config/constants';

interface BottomNavProps {
  /** Optional class name. */
  className?: string;
}

/** Map route pathnames to tab indices. */
const ROUTE_TO_TAB: Record<string, number> = {
  '/': 0,
  '/chat': 0,
  '/bots': 1,
  '/tasks': 2,
  '/settings': 3,
};

const BottomNav: React.FC<BottomNavProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = ROUTE_TO_TAB[location.pathname] ?? 0;

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      const routes = ['/chat', '/bots', '/tasks', '/settings'];
      navigate(routes[newValue] ?? '/chat');
    },
    [navigate],
  );

  return (
    <Paper
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 ${className}`}
      elevation={3}
      sx={{ height: BOTTOM_NAV_HEIGHT }}
    >
      <BottomNavigation
        value={currentTab}
        onChange={handleChange}
        showLabels
        sx={{ height: BOTTOM_NAV_HEIGHT }}
      >
        <BottomNavigationAction label="Chats" icon={<ChatIcon />} />
        <BottomNavigationAction label="Bots" icon={<SmartToyIcon />} />
        <BottomNavigationAction label="Tasks" icon={<TaskAltIcon />} />
        <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
