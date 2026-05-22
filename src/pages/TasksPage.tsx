// ============================================================
// Hermes Chat — TasksPage Component
// Lists scheduled (cron) tasks grouped by bot. Provides a
// dialog to create new tasks with cron expression, name, and
// action. Supports pause / resume / delete for each task.
// ============================================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Spinner from '@/components/common/Spinner';
import { useBotStore } from '@/store/botStore';
import * as api from '@/services/api';
import type { Task } from '@shared/types';
import { TaskStatus } from '@shared/types';
import { formatTime } from '@/utils/format';
import { TOPBAR_HEIGHT } from '@/config/constants';

interface NewTaskForm {
  botId: string;
  name: string;
  cronExpression: string;
  action: string;
}

const EMPTY_FORM: NewTaskForm = {
  botId: '',
  name: '',
  cronExpression: '',
  action: '',
};

const STATUS_CHIP_COLOR: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  [TaskStatus.ACTIVE]: 'success',
  [TaskStatus.PAUSED]: 'warning',
  [TaskStatus.COMPLETED]: 'default',
  [TaskStatus.ERROR]: 'error',
};

const TasksPage: React.FC = () => {
  const bots = useBotStore((s) => s.bots);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [form, setForm] = useState<NewTaskForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleOpenDialog = useCallback(() => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof NewTaskForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  const handleCreate = useCallback(async () => {
    if (!form.name.trim() || !form.botId || !form.cronExpression.trim()) return;
    setSubmitting(true);
    try {
      const task = await api.createTask({
        botId: form.botId,
        name: form.name.trim(),
        cronExpression: form.cronExpression.trim(),
        action: form.action.trim() || 'ping',
      });
      setTasks((prev) => [...prev, task]);
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }, [form, setError]);

  const handleTogglePause = useCallback(
    async (task: Task) => {
      const newStatus =
        task.status === TaskStatus.ACTIVE ? TaskStatus.PAUSED : TaskStatus.ACTIVE;
      try {
        const updated = await api.updateTask(task.id, { status: newStatus } as Partial<api.CreateTaskPayload>);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update task');
      }
    },
    [setError],
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      try {
        await api.deleteTask(taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete task');
      }
    },
    [setError],
  );

  /** Group tasks by botId. */
  const tasksByBot = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      const arr = map[task.botId] ?? [];
      arr.push(task);
      map[task.botId] = arr;
    }
    return map;
  }, [tasks]);

  return (
    <Box
      className="flex flex-col overflow-hidden"
      sx={{ pt: `${TOPBAR_HEIGHT}px`, height: '100vh' }}
    >
      {/* Header */}
      <Box className="flex items-center justify-between px-4 py-3">
        <Typography variant="h5" className="font-semibold">
          Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          size="small"
          disabled={bots.length === 0}
        >
          Create Task
        </Button>
      </Box>

      {/* Task list */}
      <Box className="flex-1 overflow-y-auto px-4">
        {loading && <Spinner text="Loading tasks..." />}

        {error && (
          <Typography variant="body2" color="error" className="py-2 text-center">
            {error}
          </Typography>
        )}

        {!loading && tasks.length === 0 && (
          <Typography variant="body2" color="text.secondary" className="py-8 text-center">
            No scheduled tasks. Create a cron task for your bots.
          </Typography>
        )}

        {Object.entries(tasksByBot).map(([botId, botTasks]) => {
          const bot = bots.find((b) => b.id === botId);
          const botName = bot?.name ?? botId;
          return (
            <Box key={botId} className="mb-4">
              <Typography variant="subtitle2" className="mb-2 font-semibold text-gray-500">
                {botName}
              </Typography>
              {botTasks.map((task) => (
                <Box
                  key={task.id}
                  className="mb-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <Box className="flex items-center gap-3">
                    <Box className="flex-1">
                      <Typography variant="body2" className="font-medium">
                        {task.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {task.cronExpression}
                      </Typography>
                      <Box className="mt-1 flex items-center gap-2">
                        <Chip
                          label={task.status}
                          size="small"
                          color={STATUS_CHIP_COLOR[task.status] ?? 'default'}
                        />
                        {task.lastRun && (
                          <Typography variant="caption" color="text.secondary">
                            Last: {formatTime(task.lastRun)}
                          </Typography>
                        )}
                        {task.nextRun && (
                          <Typography variant="caption" color="text.secondary">
                            Next: {formatTime(task.nextRun)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box className="flex gap-1">
                      <IconButton
                        size="small"
                        onClick={() => handleTogglePause(task)}
                        aria-label={
                          task.status === TaskStatus.ACTIVE ? 'Pause' : 'Resume'
                        }
                      >
                        {task.status === TaskStatus.ACTIVE ? (
                          <PauseIcon fontSize="small" />
                        ) : (
                          <PlayArrowIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(task.id)}
                        aria-label="Delete task"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>

      {/* Create Task Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent className="flex flex-col gap-3 pt-2">
          <TextField
            label="Bot"
            select
            fullWidth
            value={form.botId}
            onChange={handleFormChange('botId')}
            required
          >
            {bots.map((bot) => (
              <MenuItem key={bot.id} value={bot.id}>
                {bot.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Task Name"
            fullWidth
            value={form.name}
            onChange={handleFormChange('name')}
            required
          />
          <TextField
            label="Cron Expression"
            fullWidth
            placeholder="*/5 * * * *"
            value={form.cronExpression}
            onChange={handleFormChange('cronExpression')}
            helperText="Five-field cron: minute hour day month weekday"
            required
          />
          <TextField
            label="Action"
            fullWidth
            value={form.action}
            onChange={handleFormChange('action')}
            placeholder="ping"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
        {submitting && <LinearProgress />}
      </Dialog>
    </Box>
  );
};

export default TasksPage;
