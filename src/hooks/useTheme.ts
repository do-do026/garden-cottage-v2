// ============================================================
// Hermes Chat — useTheme Hook
// Dynamically creates a MUI Theme object from the UIStore state
// so that Bot UIMod instructions (SET_THEME, SET_PRIMARY_COLOR)
// and user settings take effect immediately.
// ============================================================

import { useMemo, useCallback } from 'react';
import { createTheme, type Theme } from '@mui/material/styles';
import { useUIStore } from '@/store/uiStore';

export interface UseThemeReturn {
  /** The live MUI Theme object that should be passed to ThemeProvider. */
  muiTheme: Theme;
  /** Toggle between light and dark mode. */
  toggleTheme: () => void;
  /** Set the primary accent colour (CSS hex). */
  setPrimaryColor: (color: string) => void;
}

export function useTheme(): UseThemeReturn {
  const themeMode = useUIStore((s) => s.theme);
  const primaryColor = useUIStore((s) => s.primaryColor);
  const backgroundColor = useUIStore((s) => s.backgroundColor);
  const setTheme = useUIStore((s) => s.setTheme);
  const setPrimaryColor = useUIStore((s) => s.setPrimaryColor);

  /** Toggle light ↔ dark. */
  const toggleTheme = useCallback(() => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setTheme(next);
  }, [themeMode, setTheme]);

  /** Build a fresh MUI Theme object whenever any theme-related state changes. */
  const muiTheme = useMemo<Theme>(() => {
    return createTheme({
      palette: {
        mode: themeMode,
        primary: { main: primaryColor },
        ...(backgroundColor
          ? { background: { default: backgroundColor } }
          : {}),
      },
      typography: {
        fontFamily: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ].join(','),
      },
      shape: {
        borderRadius: 12,
      },
    });
  }, [themeMode, primaryColor, backgroundColor]);

  return { muiTheme, toggleTheme, setPrimaryColor };
}
