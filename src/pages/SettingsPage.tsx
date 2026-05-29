// ============================================================
// Hermes Chat — SettingsPage Component
// User settings: theme toggle, primary colour picker, Hermes
// connection defaults, notification toggle, and about info.
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore } from '@/store/uiStore';
import { PRESET_COLORS } from '@/config/constants';
import * as api from '@/services/api';
import type { UserSettings } from '@shared/types';

const SettingsPage: React.FC = () => {
  const { toggleTheme, setPrimaryColor } = useTheme();
  const theme = useUIStore((s) => s.theme);
  const primaryColor = useUIStore((s) => s.primaryColor);

  const [apiKey, setApiKey] = useState<string>(
    () => { try { return localStorage.getItem('hermes-api-key') ?? ''; } catch { return ''; } },
  );
  const [hermesAddress, setHermesAddress] = useState<string>('localhost');
  const [hermesPort, setHermesPort] = useState<string>('8080');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings: UserSettings = await api.getSettings();
        setNotifyEnabled(settings.notifications);
      } catch {
        // Use defaults
      }
    };
    loadSettings();
  }, []);

  const handleToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testHermesConnection({
        address: hermesAddress,
        port: parseInt(hermesPort, 10) || 8080,
      });
      if (res.success) {
        setTestResult(`Connection OK — ${res.latencyMs ?? '?'}ms`);
        setSnackbar({ open: true, message: 'Hermes connection successful!', severity: 'success' });
      } else {
        setTestResult('Connection failed.');
        setSnackbar({ open: true, message: 'Hermes connection failed.', severity: 'error' });
      }
    } catch {
      setTestResult('Connection failed.');
      setSnackbar({ open: true, message: 'Hermes connection failed.', severity: 'error' });
    } finally {
      setTesting(false);
    }
  }, [hermesAddress, hermesPort]);

  const handleSaveSettings = useCallback(async () => {
    try {
      await api.updateSettings({ notifications: notifyEnabled });
      setSnackbar({ open: true, message: 'Settings saved.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save settings.', severity: 'error' });
    }
  }, [notifyEnabled]);

  return (
    <Box className="overflow-y-auto h-full">
      <Box className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <Typography variant="h5" className="font-semibold">
          Settings
        </Typography>

        {/* Theme */}
        <Box>
          <Typography variant="subtitle1" className="mb-2 font-semibold">
            Theme
          </Typography>
          <Box className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <Typography variant="body2">
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </Typography>
            <Switch
              checked={theme === 'dark'}
              onChange={handleToggleTheme}
            />
          </Box>
        </Box>

        {/* Primary Colour */}
        <Box>
          <Typography variant="subtitle1" className="mb-2 font-semibold">
            Primary Colour
          </Typography>
          <Box className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            {PRESET_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setPrimaryColor(color)}
                className="h-8 w-8 cursor-pointer rounded-full border-2 transition-transform hover:scale-110"
                sx={{
                  bgcolor: color,
                  borderColor: primaryColor === color ? 'text.primary' : 'transparent',
                  transform: primaryColor === color ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Hermes Connection */}
        <Box>
          <Typography variant="subtitle1" className="mb-2 font-semibold">
            Hermes Connection
          </Typography>
          <Box className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <TextField
              label="Default Address"
              size="small"
              value={hermesAddress}
              onChange={(e) => setHermesAddress(e.target.value)}
            />
            <TextField
              label="Default Port"
              size="small"
              type="number"
              value={hermesPort}
              onChange={(e) => setHermesPort(e.target.value)}
            />
            <Box className="flex items-center gap-3">
              <Button variant="outlined" size="small" onClick={handleTestConnection} disabled={testing}>
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              {testResult && (
                <Typography
                  variant="caption"
                  color={testResult.startsWith('Connection OK') ? 'success.main' : 'error'}
                >
                  {testResult}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* API Key */}
        <Box>
          <Typography variant="subtitle1" className="mb-2 font-semibold">
            API Key
          </Typography>
          <Box className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <TextField
              label="API Key"
              size="small"
              type="password"
              value={apiKey}
              placeholder="garden-cottage-v2-secret-key-change-me"
              onChange={(e) => {
                const val = e.target.value;
                setApiKey(val);
                try { localStorage.setItem('hermes-api-key', val); } catch { /* noop */ }
              }}
              helperText="Must match the backend API_KEY. Changes take effect on next request."
            />
          </Box>
        </Box>

        {/* Notifications */}
        <Box>
          <Typography variant="subtitle1" className="mb-2 font-semibold">
            Notifications
          </Typography>
          <Box className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <Typography variant="body2">Enable desktop notifications</Typography>
            <Switch checked={notifyEnabled} onChange={(e) => setNotifyEnabled(e.target.checked)} />
          </Box>
        </Box>

        {/* Save */}
        <Button variant="contained" onClick={handleSaveSettings} className="rounded-lg">
          Save Settings
        </Button>

        <Divider />

        {/* About */}
        <Box>
          <Typography variant="subtitle1" className="mb-2 font-semibold">
            About
          </Typography>
          <Box className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <Typography variant="body2">Hermes Chat v1.0.0</Typography>
            <Typography variant="caption" color="text.secondary">
              Intelligent Agent Communication Platform
            </Typography>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
