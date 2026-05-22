// ============================================================
// Hermes Chat — Root Application Component
// Sets up the React Router tree, MUI ThemeProvider with
// dynamic theming (useTheme hook), WebSocket connection
// (useSocket hook), and responsive layout detection
// (useResponsive hook).
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useTheme } from '@/hooks/useTheme';
import { useSocket } from '@/hooks/useSocket';
import { useResponsive } from '@/hooks/useResponsive';
import AppLayout from '@/components/layout/AppLayout';
import ChatPage from '@/pages/ChatPage';
import BotsPage from '@/pages/BotsPage';
import TasksPage from '@/pages/TasksPage';
import SettingsPage from '@/pages/SettingsPage';

/**
 * Inner component that initialises all context-dependent hooks
 * (theme, socket, responsive) before rendering the route tree.
 *
 * Must be a child of <BrowserRouter> so that useNavigate and
 * useLocation work inside the layout and page components.
 */
function AppInner(): React.JSX.Element {
  // -- Dynamic MUI theme from UIStore --
  const { muiTheme } = useTheme();

  // -- WebSocket connection lifecycle --
  useSocket();

  // -- Responsive breakpoint synchronisation --
  useResponsive();

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />

      <Routes>
        {/*
         * AppLayout renders different configurations based on
         * viewport width (desktop sidebar, tablet drawer, mobile
         * bottom-nav). It uses <Outlet /> for child routes.
         */}
        <Route element={<AppLayout />}>
          {/* Chat is both the index (/) and explicit /chat */}
          <Route index element={<ChatPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="bots" element={<BotsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

/**
 * Root application component.
 *
 * BrowserRouter wraps the entire application so that routing
 * context is available everywhere in the component tree.
 */
function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
