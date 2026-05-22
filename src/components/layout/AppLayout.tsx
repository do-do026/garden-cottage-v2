// ============================================================
// Hermes Chat — AppLayout Component
// Top-level layout that renders different configurations
// based on the current viewport:
//
//   Desktop (≥1025px):  Sidebar + Content area (Outlet)
//   Tablet  (768-1024): Overlay sidebar + Content area
//   Mobile  (<768px):   Full-screen content + BottomNav
// ============================================================

import React, { useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import TopNavbar from '@/components/layout/TopNavbar';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import { useResponsive } from '@/hooks/useResponsive';
import { useUIStore } from '@/store/uiStore';
import { TOPBAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '@/config/constants';

interface AppLayoutProps {
  /** Called when user clicks "Add Bot" in the sidebar. */
  onAddBot?: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onAddBot }) => {
  const { isMobile, isDesktop } = useResponsive();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  // Desktop: Sidebar always visible + content area
  if (isDesktop) {
    return (
      <Box className="flex h-screen w-screen overflow-hidden">
        <Sidebar onAddBot={onAddBot} />
        <Box
          className="flex flex-col flex-1 overflow-hidden"
          sx={{ pt: `${TOPBAR_HEIGHT}px` }}
        >
          <TopNavbar />
          <Box className="flex-1 overflow-hidden">
            <Outlet />
          </Box>
        </Box>
      </Box>
    );
  }

  // Tablet: overlay drawer sidebar
  if (!isMobile) {
    return (
      <Box className="flex h-screen w-screen flex-col overflow-hidden">
        <TopNavbar onMenuToggle={toggleSidebar} />
        <Drawer
          open={sidebarOpen}
          onClose={handleCloseSidebar}
          sx={{
            '& .MuiDrawer-paper': {
              width: 320,
            },
          }}
        >
          <Sidebar onAddBot={onAddBot} />
        </Drawer>
        <Box
          className="flex-1 overflow-hidden"
          sx={{ pt: `${TOPBAR_HEIGHT}px` }}
        >
          <Outlet />
        </Box>
      </Box>
    );
  }

  // Mobile: full-screen content + BottomNav
  return (
    <Box className="flex h-screen w-screen flex-col overflow-hidden">
      <TopNavbar onMenuToggle={toggleSidebar} />
      <Drawer
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        sx={{
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: 320,
          },
        }}
      >
        <Sidebar onAddBot={onAddBot} />
      </Drawer>
      <Box
        className="flex-1 overflow-hidden"
        sx={{
          pt: `${TOPBAR_HEIGHT}px`,
          pb: `${BOTTOM_NAV_HEIGHT}px`,
        }}
      >
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  );
};

export default AppLayout;
