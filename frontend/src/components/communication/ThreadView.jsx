import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Archive as ArchiveIcon,
  AttachFile as AttachFileIcon,
  CallReceived as InboundIcon,
  CallMade as OutboundIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { emailSyncStore } from '../../stores/emailSync.store';

const ThreadView = observer(({ thread, onBack, onShowSnackbar }) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    if (thread?.id) {
      emailSyncStore.fetchThreadById(thread.id);
    }
  }, [thread?.id]);

  const currentThread = emailSyncStore.currentThread;

  const handleStar = async () => {
    if (!currentThread) return;
    await emailSyncStore.starThread(currentThread.id);
  };

  const handleArchive = async () => {
    if (!currentThread) return;
    await emailSyncStore.archiveThread(currentThread.id);
    onShowSnackbar?.('Thread archived', 'success');
    onBack();
  };

  const handleOpenLinkDialog = async () => {
    // Fetch projects and clients for linking
    try {
      const [projectRes, clientRes] = await Promise.all([
        fetch('/api/projects/', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/clients/clients/', { credentials: 'include' }).then(r => r.json()),
      ]);
      setProjects(projectRes.results || projectRes || []);
      setClients(clientRes.results || clientRes || []);
      setSelectedProject(
        currentThread?.project
          ? { id: currentThread.project, label: currentThread.project_name }
          : null
      );
      setSelectedClient(
        currentThread?.client
          ? { id: currentThread.client, label: currentThread.client_name }
          : null
      );
    } catch {
      setProjects([]);
      setClients([]);
    }
    setLinkDialogOpen(true);
  };

  const handleLink = async () => {
    if (!currentThread) return;
    try {
      await emailSyncStore.linkThread(currentThread.id, {
        project_id: selectedProject?.id || null,
        client_id: selectedClient?.id || null,
      });
      onShowSnackbar?.('Thread linked successfully', 'success');
      setLinkDialogOpen(false);
    } catch {
      onShowSnackbar?.('Failed to link thread', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (emailSyncStore.loading && !currentThread) {
    return (
      <div className="flex justify-center py-12">
        <CircularProgress />
      </div>
    );
  }

  if (!currentThread) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Thread not found</p>
        <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Inbox
        </Button>
      </div>
    );
  }

  const messages = currentThread.messages || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {currentThread.subject || '(No Subject)'}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentThread.message_count} message{currentThread.message_count !== 1 ? 's' : ''}
            </span>
            {currentThread.project_name && (
              <Chip
                label={currentThread.project_job_number || currentThread.project_name}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {currentThread.client_name && (
              <Chip
                label={currentThread.client_name}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Tooltip title="Link to Project/Client">
            <IconButton size="small" onClick={handleOpenLinkDialog}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={currentThread.is_starred ? 'Unstar' : 'Star'}>
            <IconButton size="small" onClick={handleStar}>
              {currentThread.is_starred ? (
                <StarIcon fontSize="small" sx={{ color: '#f59e0b' }} />
              ) : (
                <StarBorderIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Archive">
            <IconButton size="small" onClick={handleArchive}>
              <ArchiveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Participants */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium">Participants: </span>
        {currentThread.participants?.join(', ')}
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {messages.map((msg) => (
          <MessageCard key={msg.id} message={msg} formatDate={formatDate} />
        ))}
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Link Thread to Project / Client</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <Autocomplete
              options={projects.map(p => ({
                id: p.id,
                label: `${p.job_number} - ${p.project_name}`,
              }))}
              value={selectedProject}
              onChange={(_, v) => setSelectedProject(v)}
              renderInput={(params) => (
                <TextField {...params} label="Project" size="small" />
              )}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
            />
            <Autocomplete
              options={clients.map(c => ({
                id: c.id,
                label: c.name || c.company_name,
              }))}
              value={selectedClient}
              onChange={(_, v) => setSelectedClient(v)}
              renderInput={(params) => (
                <TextField {...params} label="Client" size="small" />
              )}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLink}>
            Save Link
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

// Individual message card
const MessageCard = ({ message, formatDate }) => {
  const [expanded, setExpanded] = useState(false);

  const isInbound = message.direction === 'inbound';

  return (
    <div className={`border rounded-xl overflow-hidden ${
      isInbound
        ? 'border-blue-200 dark:border-blue-900'
        : 'border-green-200 dark:border-green-900'
    }`}>
      {/* Message header */}
      <div
        className={`flex items-center gap-3 p-3 cursor-pointer ${
          isInbound
            ? 'bg-blue-50 dark:bg-blue-900/20'
            : 'bg-green-50 dark:bg-green-900/20'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <Tooltip title={isInbound ? 'Received' : 'Sent'}>
          {isInbound ? (
            <InboundIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
          ) : (
            <OutboundIcon sx={{ fontSize: 18, color: '#10b981' }} />
          )}
        </Tooltip>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {message.from_name || message.from_address}
            </span>
            <span className="text-xs text-gray-400">
              &lt;{message.from_address}&gt;
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            To: {message.to_addresses?.map(a =>
              typeof a === 'object' ? (a.name || a.address) : a
            ).join(', ')}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {message.has_attachments && (
            <AttachFileIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
          )}
          <span className="text-xs text-gray-400">
            {formatDate(message.date)}
          </span>
        </div>
      </div>

      {/* Message body (collapsed = snippet, expanded = full) */}
      <div className="p-4">
        {expanded ? (
          <div>
            {message.body_html ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: message.body_html }}
              />
            ) : (
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                {message.body_text}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {message.snippet || message.subject}
          </p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  );
};

export default ThreadView;
