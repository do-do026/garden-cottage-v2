// ============================================================
// Hermes Chat — BotsPage Component
// Bot management page: lists all registered bots with their
// status, provides an "Add Bot" dialog with connection fields,
// and actions to connect / disconnect / delete bots.
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Avatar from '@/components/common/Avatar';
import Spinner from '@/components/common/Spinner';
import { useBotStore } from '@/store/botStore';
import * as api from '@/services/api';
import type { Bot } from '@shared/types';
import { BotStatus } from '@shared/types';
import { TOPBAR_HEIGHT } from '@/config/constants';

interface NewBotForm {
  name: string;
  hermesAddress: string;
  hermesPort: string;
  authToken: string;
  connectorType: 'hermes' | 'operit';
}

const EMPTY_FORM: NewBotForm = {
  name: '',
  hermesAddress: '',
  hermesPort: '',
  authToken: '',
  connectorType: 'hermes',
};

const STATUS_CHIP_COLOR: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  [BotStatus.ONLINE]: 'success',
  [BotStatus.OFFLINE]: 'default',
  [BotStatus.CONNECTING]: 'warning',
  [BotStatus.ERROR]: 'error',
};

const BotsPage: React.FC = () => {
  const bots = useBotStore((s) => s.bots);
  const isLoading = useBotStore((s) => s.isLoading);
  const setBots = useBotStore((s) => s.setBots);
  const setLoading = useBotStore((s) => s.setLoading);
  const setError = useBotStore((s) => s.setError);
  const addBot = useBotStore((s) => s.addBot);
  const removeBot = useBotStore((s) => s.removeBot);
  const updateBotStatus = useBotStore((s) => s.updateBotStatus);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [form, setForm] = useState<NewBotForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Load bots on mount
  useEffect(() => {
    const fetchBots = async () => {
      setLoading(true);
      try {
        const data = await api.getBots();
        setBots(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bots');
      } finally {
        setLoading(false);
      }
    };
    fetchBots();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenDialog = useCallback(() => {
    setForm(EMPTY_FORM);
    setDialogError(null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setDialogError(null);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof NewBotForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  const handleCreateBot = useCallback(async () => {
    if (!form.name.trim() || !form.hermesAddress.trim()) return;
    setSubmitting(true);
    setDialogError(null);
    try {
      const bot = await api.createBot({
        name: form.name.trim(),
        hermesAddress: form.hermesAddress.trim(),
        hermesPort: parseInt(form.hermesPort, 10) || 8080,
        authToken: form.authToken || undefined,
        connectorType: form.connectorType ?? 'hermes',
      });
      addBot(bot);
      setDialogOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create bot';
      setDialogError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [form, addBot]);

  const handleConnect = useCallback(
    async (botId: string) => {
      try {
        updateBotStatus(botId, BotStatus.CONNECTING);
        await api.connectBot(botId);
      } catch (err) {
        updateBotStatus(botId, BotStatus.ERROR);
        setError(err instanceof Error ? err.message : 'Failed to connect bot');
      }
    },
    [updateBotStatus, setError],
  );

  const handleDelete = useCallback(
    async (botId: string) => {
      try {
        await api.deleteBot(botId);
        removeBot(botId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete bot');
      }
    },
    [removeBot, setError],
  );

  return (
    <Box
      className="flex flex-col overflow-hidden"
      sx={{ pt: `${TOPBAR_HEIGHT}px`, height: '100vh' }}
    >
      {/* Header */}
      <Box className="flex items-center justify-between px-4 py-3">
        <Typography variant="h5" className="font-semibold">
          Bots
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          size="small"
        >
          Add Bot
        </Button>
      </Box>

      {/* Bot list */}
      <Box className="flex-1 overflow-y-auto px-4">
        {isLoading && <Spinner text="Loading bots..." />}

        {!isLoading && bots.length === 0 && (
          <Typography variant="body2" color="text.secondary" className="py-8 text-center">
            No bots yet. Add your first Hermes bot to start chatting.
          </Typography>
        )}

        {bots.map((bot: Bot) => (
          <Box
            key={bot.id}
            className="mb-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <Box className="flex items-center gap-3">
              <Avatar
                src={bot.avatarUrl}
                alt={bot.name}
                online={bot.status === BotStatus.ONLINE}
                size={48}
              />
              <Box className="flex-1">
                <Typography variant="body1" className="font-medium">
                  {bot.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {bot.hermesAddress}:{bot.hermesPort}
                </Typography>
                <Box className="mt-1">
                  <Chip
                    label={bot.status}
                    size="small"
                    color={STATUS_CHIP_COLOR[bot.status] ?? 'default'}
                  />
                </Box>
              </Box>
              <Box className="flex gap-1">
                <IconButton
                  size="small"
                  onClick={() => handleConnect(bot.id)}
                  disabled={bot.status === BotStatus.CONNECTING}
                  aria-label="Connect bot"
                >
                  <PowerSettingsNewIcon
                    color={bot.status === BotStatus.ONLINE ? 'success' : 'inherit'}
                  />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(bot.id)}
                  aria-label="Delete bot"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Add Bot Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Bot</DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-2">
          <ToggleButtonGroup
            value={form.connectorType}
            exclusive
            onChange={(_e, val) => val && setForm(prev => ({ ...prev, connectorType: val }))}
            size="small"
            fullWidth
          >
            <ToggleButton value="hermes">Hermes (WebSocket)</ToggleButton>
            <ToggleButton value="operit">Operit (HTTP)</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label="Bot Name"
            fullWidth
            value={form.name}
            onChange={handleFormChange('name')}
            required
          />
          <TextField
            label="Address"
            fullWidth
            placeholder={form.connectorType === 'operit' ? '127.0.0.1' : '192.168.1.100'}
            value={form.hermesAddress}
            onChange={handleFormChange('hermesAddress')}
            required
          />
          <TextField
            label="Port"
            fullWidth
            type="number"
            placeholder={form.connectorType === 'operit' ? '8094' : '8080'}
            value={form.hermesPort}
            onChange={handleFormChange('hermesPort')}
          />
          <TextField
            label="Auth Token (optional)"
            fullWidth
            type="password"
            value={form.authToken}
            onChange={handleFormChange('authToken')}
          />
        </DialogContent>
        {dialogError && (
          <Typography color="error" variant="body2" sx={{ px: 3, pt: 1 }}>
            {dialogError}
          </Typography>
        )}
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBot} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
        {submitting && <LinearProgress />}
      </Dialog>
    </Box>
  );
};

export default BotsPage;
