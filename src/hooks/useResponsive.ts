// ============================================================
// Hermes Chat — useResponsive Hook
// Reports the current viewport classification based on MUI
// useMediaQuery. Keeps the UIStore's isMobile flag in sync so
// layout components can render the correct variant.
// ============================================================

import { useEffect, useMemo } from 'react';
import { useMediaQuery } from '@mui/material';
import { useUIStore } from '@/store/uiStore';

export interface UseResponsiveReturn {
  /** True when viewport width < 768px. */
  isMobile: boolean;
  /** True when viewport width is between 768px and 1024px inclusive. */
  isTablet: boolean;
  /** True when viewport width >= 1025px. */
  isDesktop: boolean;
  /** The current screen width in pixels (from window.innerWidth). */
  screenWidth: number;
}

export function useResponsive(): UseResponsiveReturn {
  const isMobile = useMediaQuery('(max-width:767px)');
  const isTablet = useMediaQuery('(min-width:768px) and (max-width:1024px)');
  const isDesktop = useMediaQuery('(min-width:1025px)');
  const setIsMobile = useUIStore((s) => s.setIsMobile);

  // Keep UIStore in sync
  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile, setIsMobile]);

  const screenWidth = useMemo(() => {
    if (typeof window === 'undefined') return 1024;
    return window.innerWidth;
    // Re-render on resize is handled by useMediaQuery
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isTablet, isDesktop]);

  return { isMobile, isTablet, isDesktop, screenWidth };
}
