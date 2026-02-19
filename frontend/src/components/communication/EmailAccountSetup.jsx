import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { emailSyncStore } from '../../stores/emailSync.store';

const PROVIDER_OPTIONS = [
  { value: 'gmail', label: 'Gmail' },
  { value: 'outlook', label: 'Outlook / Office 365' },
  { value: 'imap', label: 'Custom IMAP' },
];

const defaultFormData = {
  email_address: '',
  display_name: '',
  provider: 'gmail',
  auth_method: 'password',
  password: '',
  imap_host: '',
  imap_port: 993,
  imap_use_ssl: true,
  smtp_host: '',
  smtp_port: 587,
  smtp_use_tls: true,
  sync_enabled: true,
  sync_interval_minutes: 5,
  sync_folders: ['INBOX'],
  max_sync_age_days: 30,
};

const EmailAccountSetup = observer(({ onShowSnackbar }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [testResult, setTestResult] = useState(null);
  const [folderInput, setFolderInput] = useState('');

  useEffect(() => {
    emailSyncStore.fetchAccounts();
  }, []);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({ ...defaultFormData });
    setTestResult(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      email_address: account.email_address,
      display_name: account.display_name || '',
      provider: account.provider,
      auth_method: account.auth_method || 'password',
      password: '',
      imap_host: account.imap_host || '',
      imap_port: account.imap_port || 993,
      imap_use_ssl: account.imap_use_ssl !== false,
      smtp_host: account.smtp_host || '',
      smtp_port: account.smtp_port || 587,
      smtp_use_tls: account.smtp_use_tls !== false,
      sync_enabled: account.sync_enabled !== false,
      sync_interval_minutes: account.sync_interval_minutes || 5,
      sync_folders: account.sync_folders || ['INBOX'],
      max_sync_age_days: account.max_sync_age_days || 30,
    });
    setTestResult(null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setTestResult(null);
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.checked }));
  };

  const handleAddFolder = () => {
    const folder = folderInput.trim();
    if (folder && !formData.sync_folders.includes(folder)) {
      setFormData(prev => ({
        ...prev,
        sync_folders: [...prev.sync_folders, folder],
      }));
    }
    setFolderInput('');
  };

  const handleRemoveFolder = (folder) => {
    setFormData(prev => ({
      ...prev,
      sync_folders: prev.sync_folders.filter(f => f !== folder),
    }));
  };

  const handleTestConnection = async () => {
    if (!editingAccount) return;
    try {
      const result = await emailSyncStore.testConnection(editingAccount.id);
      setTestResult(result);
      onShowSnackbar?.(
        result.success ? 'Connection successful' : `Connection failed: ${result.message}`,
        result.success ? 'success' : 'error'
      );
    } catch {
      setTestResult({ success: false, message: 'Connection test failed' });
    }
  };

  const handleSync = async (accountId) => {
    try {
      await emailSyncStore.syncAccount(accountId);
      onShowSnackbar?.('Sync queued successfully', 'success');
      emailSyncStore.fetchAccounts();
    } catch {
      onShowSnackbar?.('Failed to trigger sync', 'error');
    }
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      // Don't send empty password on edit
      if (editingAccount && !payload.password) {
        delete payload.password;
      }

      if (editingAccount) {
        await emailSyncStore.updateAccount(editingAccount.id, payload);
        onShowSnackbar?.('Account updated', 'success');
      } else {
        await emailSyncStore.createAccount(payload);
        onShowSnackbar?.('Account created', 'success');
      }
      handleClose();
    } catch {
      onShowSnackbar?.('Failed to save account', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this email account and all synced data?')) return;
    try {
      await emailSyncStore.deleteAccount(id);
      onShowSnackbar?.('Account deleted', 'success');
    } catch {
      onShowSnackbar?.('Failed to delete account', 'error');
    }
  };

  const showCustomFields = formData.provider === 'imap';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Email Accounts
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect email accounts to sync messages into the CRM
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          size="small"
        >
          Add Account
        </Button>
      </div>

      {emailSyncStore.error && (
        <Alert severity="error" onClose={() => emailSyncStore.clearError()}>
          {emailSyncStore.error}
        </Alert>
      )}

      {emailSyncStore.loading && !emailSyncStore.accounts.length ? (
        <div className="flex justify-center py-8">
          <CircularProgress />
        </div>
      ) : emailSyncStore.accounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <SettingsIcon sx={{ fontSize: 48, color: 'gray' }} />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            No email accounts connected yet
          </p>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ mt: 2 }}
          >
            Connect Your First Account
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {emailSyncStore.accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  account.last_sync_status === 'success' ? 'bg-green-500' :
                  account.last_sync_status === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {account.email_address}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Chip
                      label={account.provider_display}
                      size="small"
                      variant="outlined"
                    />
                    {account.sync_enabled ? (
                      <Chip label="Sync On" size="small" color="success" variant="outlined" />
                    ) : (
                      <Chip label="Sync Off" size="small" color="default" variant="outlined" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {account.total_synced} emails synced
                    </span>
                    {account.last_sync_at && (
                      <span className="text-xs text-gray-400">
                        Last sync: {new Date(account.last_sync_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Tooltip title="Sync Now">
                  <IconButton
                    size="small"
                    onClick={() => handleSync(account.id)}
                    disabled={emailSyncStore.syncLoading}
                  >
                    <SyncIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleOpenEdit(account)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDelete(account.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? 'Edit Email Account' : 'Add Email Account'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Email Address"
              value={formData.email_address}
              onChange={handleChange('email_address')}
              type="email"
              required
              disabled={!!editingAccount}
              size="small"
            />

            <TextField
              fullWidth
              label="Display Name"
              value={formData.display_name}
              onChange={handleChange('display_name')}
              placeholder="e.g. Work Email"
              size="small"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Provider</InputLabel>
              <Select
                value={formData.provider}
                onChange={handleChange('provider')}
                label="Provider"
              >
                {PROVIDER_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={editingAccount ? 'App Password (leave blank to keep current)' : 'App Password'}
              value={formData.password}
              onChange={handleChange('password')}
              type="password"
              size="small"
              helperText={
                formData.provider === 'gmail'
                  ? 'Use a Google App Password (not your regular password)'
                  : formData.provider === 'outlook'
                  ? 'Use an Outlook App Password'
                  : 'Enter your email password'
              }
            />

            {showCustomFields && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="IMAP Host"
                    value={formData.imap_host}
                    onChange={handleChange('imap_host')}
                    size="small"
                    placeholder="imap.example.com"
                  />
                  <TextField
                    label="IMAP Port"
                    value={formData.imap_port}
                    onChange={handleChange('imap_port')}
                    type="number"
                    size="small"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="SMTP Host"
                    value={formData.smtp_host}
                    onChange={handleChange('smtp_host')}
                    size="small"
                    placeholder="smtp.example.com"
                  />
                  <TextField
                    label="SMTP Port"
                    value={formData.smtp_port}
                    onChange={handleChange('smtp_port')}
                    type="number"
                    size="small"
                  />
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sync Settings
              </p>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sync_enabled}
                    onChange={handleSwitchChange('sync_enabled')}
                  />
                }
                label="Enable automatic sync"
              />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <TextField
                  label="Sync Interval (minutes)"
                  value={formData.sync_interval_minutes}
                  onChange={handleChange('sync_interval_minutes')}
                  type="number"
                  size="small"
                  inputProps={{ min: 1, max: 60 }}
                />
                <TextField
                  label="Max Age (days)"
                  value={formData.max_sync_age_days}
                  onChange={handleChange('max_sync_age_days')}
                  type="number"
                  size="small"
                  inputProps={{ min: 1, max: 365 }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folders to Sync
              </p>
              <div className="flex flex-wrap gap-1 mb-2">
                {formData.sync_folders.map(folder => (
                  <Chip
                    key={folder}
                    label={folder}
                    size="small"
                    onDelete={() => handleRemoveFolder(folder)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <TextField
                  size="small"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  placeholder="e.g. INBOX, Sent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFolder();
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button size="small" onClick={handleAddFolder} variant="outlined">
                  Add
                </Button>
              </div>
            </div>

            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'}>
                {testResult.message}
              </Alert>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          {editingAccount && (
            <Button
              onClick={handleTestConnection}
              disabled={emailSyncStore.syncLoading}
              startIcon={emailSyncStore.syncLoading ? <CircularProgress size={16} /> : <LinkIcon />}
            >
              Test Connection
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.email_address || emailSyncStore.loading}
          >
            {editingAccount ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default EmailAccountSetup;
