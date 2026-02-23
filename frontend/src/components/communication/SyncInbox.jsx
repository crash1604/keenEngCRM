import React, { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Archive as ArchiveIcon,
  AttachFile as AttachFileIcon,
  ArrowForward as ArrowForwardIcon,
  CallReceived as InboundIcon,
  CallMade as OutboundIcon,
  Link as LinkIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import { emailSyncStore } from '../../stores/emailSync.store';

const SyncInbox = observer(({ onSelectThread, onShowSnackbar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterFolder, setFilterFolder] = useState('');
  const [viewMode, setViewMode] = useState('threads'); // 'threads' | 'emails'

  useEffect(() => {
    emailSyncStore.fetchAccounts();
    loadData();
  }, [viewMode]);

  const loadData = useCallback(() => {
    const params = {};
    if (filterAccount) params.account = filterAccount;
    if (searchQuery) params.search = searchQuery;

    if (viewMode === 'threads') {
      emailSyncStore.fetchThreads(params);
    } else {
      if (filterFolder) params.folder = filterFolder;
      emailSyncStore.fetchEmails(params);
    }
  }, [viewMode, filterAccount, filterFolder, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleStarThread = async (e, threadId) => {
    e.stopPropagation();
    await emailSyncStore.starThread(threadId);
  };

  const handleArchiveThread = async (e, threadId) => {
    e.stopPropagation();
    await emailSyncStore.archiveThread(threadId);
    onShowSnackbar?.('Thread archived', 'success');
    loadData();
  };

  const handleSelectThread = (thread) => {
    emailSyncStore.markThreadRead(thread.id);
    onSelectThread?.(thread);
  };

  const handleSelectEmail = (email) => {
    emailSyncStore.markEmailRead(email.id);
    if (email.thread) {
      emailSyncStore.fetchThreadById(email.thread).then(thread => {
        onSelectThread?.(thread);
      });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <TextField
            fullWidth
            size="small"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </form>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Account</InputLabel>
          <Select
            value={filterAccount}
            onChange={(e) => {
              setFilterAccount(e.target.value);
              setTimeout(loadData, 0);
            }}
            label="Account"
          >
            <MenuItem value="">All Accounts</MenuItem>
            {emailSyncStore.accounts.map(acc => (
              <MenuItem key={acc.id} value={acc.id}>
                {acc.email_address}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>View</InputLabel>
          <Select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            label="View"
          >
            <MenuItem value="threads">Threads</MenuItem>
            <MenuItem value="emails">All Emails</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </div>

      {emailSyncStore.error && (
        <Alert severity="error" onClose={() => emailSyncStore.clearError()}>
          {emailSyncStore.error}
        </Alert>
      )}

      {/* Content */}
      {emailSyncStore.loading ? (
        <div className="flex justify-center py-12">
          <CircularProgress />
        </div>
      ) : viewMode === 'threads' ? (
        <ThreadList
          threads={emailSyncStore.threads}
          onSelect={handleSelectThread}
          onStar={handleStarThread}
          onArchive={handleArchiveThread}
          formatDate={formatDate}
        />
      ) : (
        <EmailList
          emails={emailSyncStore.emails}
          onSelect={handleSelectEmail}
          formatDate={formatDate}
        />
      )}
    </div>
  );
});

// Thread list sub-component
const ThreadList = ({ threads, onSelect, onStar, onArchive, formatDate }) => {
  if (!threads.length) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <InboxIcon sx={{ fontSize: 48, opacity: 0.5 }} />
        <p className="mt-2">No email threads found</p>
        <p className="text-sm">Sync an account to see emails here</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
      {threads.map((thread) => (
        <div
          key={thread.id}
          onClick={() => onSelect(thread)}
          className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-gray-800 ${
            thread.unread_count > 0
              ? 'bg-white dark:bg-gray-900 font-medium'
              : 'bg-gray-50 dark:bg-gray-900/50'
          }`}
        >
          {/* Star */}
          <IconButton
            size="small"
            onClick={(e) => onStar(e, thread.id)}
            sx={{ mt: -0.5 }}
          >
            {thread.is_starred ? (
              <StarIcon fontSize="small" sx={{ color: '#f59e0b' }} />
            ) : (
              <StarBorderIcon fontSize="small" sx={{ color: '#9ca3af' }} />
            )}
          </IconButton>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-sm truncate ${
                thread.unread_count > 0
                  ? 'text-gray-900 dark:text-white font-semibold'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {thread.subject || '(No Subject)'}
              </span>
              {thread.message_count > 1 && (
                <span className="text-xs text-gray-400 shrink-0">
                  ({thread.message_count})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {thread.participants?.slice(0, 3).join(', ')}
                {thread.participants?.length > 3 && ` +${thread.participants.length - 3}`}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400 truncate">
                {thread.latest_snippet}
              </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1 mt-1.5">
              {thread.project_name && (
                <Chip
                  label={thread.project_job_number || thread.project_name}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
              {thread.client_name && (
                <Chip
                  label={thread.client_name}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-gray-400">
              {formatDate(thread.last_message_at)}
            </span>
            {thread.unread_count > 0 && (
              <Badge
                badgeContent={thread.unread_count}
                color="primary"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }}
              />
            )}
            <Tooltip title="Archive">
              <IconButton
                size="small"
                onClick={(e) => onArchive(e, thread.id)}
              >
                <ArchiveIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
};

// Email list sub-component
const EmailList = ({ emails, onSelect, formatDate }) => {
  if (!emails.length) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <InboxIcon sx={{ fontSize: 48, opacity: 0.5 }} />
        <p className="mt-2">No emails found</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => onSelect(email)}
          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-gray-800 ${
            !email.is_read
              ? 'bg-white dark:bg-gray-900 font-medium'
              : 'bg-gray-50 dark:bg-gray-900/50'
          }`}
        >
          {/* Direction icon */}
          <Tooltip title={email.direction === 'inbound' ? 'Received' : 'Sent'}>
            {email.direction === 'inbound' ? (
              <InboundIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
            ) : (
              <OutboundIcon sx={{ fontSize: 18, color: '#10b981' }} />
            )}
          </Tooltip>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm truncate ${
                !email.is_read
                  ? 'text-gray-900 dark:text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {email.from_name || email.from_address}
              </span>
              {email.has_attachments && (
                <AttachFileIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
              )}
            </div>
            <p className={`text-sm truncate ${
              !email.is_read
                ? 'text-gray-800 dark:text-gray-200'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {email.subject || '(No Subject)'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {email.snippet}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {email.project_name && (
                <Chip
                  label={email.project_name}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
              {email.client_name && (
                <Chip
                  label={email.client_name}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </div>
          </div>

          {/* Date */}
          <span className="text-xs text-gray-400 shrink-0">
            {formatDate(email.date)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SyncInbox;
