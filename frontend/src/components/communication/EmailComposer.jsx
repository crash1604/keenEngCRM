import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { communicationStore } from '../../stores/communication.store';
import { useProjectStore } from '../../stores/project.store';

const EmailComposer = observer(({ onEmailSent, onShowSnackbar }) => {
  const projectStore = useProjectStore();
  const [formData, setFormData] = useState({
    project_id: '',
    template_id: '',
    recipient_email: '',
    cc_emails: '',
    bcc_emails: '',
    custom_subject: '',
    custom_body: '',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Load projects and templates on mount
    const loadData = async () => {
      try {
        await Promise.all([
          projectStore.fetchProjects({ page_size: 100 }),
          communicationStore.fetchTemplates({ is_active: true }),
        ]);
      } catch (error) {
        onShowSnackbar('Failed to load data', 'error');
      }
    };
    loadData();
  }, [onShowSnackbar]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePreview = async () => {
    if (!formData.project_id || !formData.template_id) {
      onShowSnackbar('Please select a project and template', 'warning');
      return;
    }

    setLoading(true);
    try {
      const previewData = await communicationStore.previewEmail({
        project_id: formData.project_id,
        template_id: formData.template_id,
      });
      setPreview(previewData);
      setShowPreview(true);
    } catch (error) {
      onShowSnackbar('Failed to preview email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.project_id || !formData.template_id) {
      onShowSnackbar('Please select a project and template', 'warning');
      return;
    }

    setSending(true);
    try {
      const emailData = {
        project_id: formData.project_id,
        template_id: formData.template_id,
      };

      // Add optional fields if provided
      if (formData.recipient_email.trim()) {
        emailData.recipient_email = formData.recipient_email.trim();
      }
      if (formData.cc_emails.trim()) {
        emailData.cc_emails = formData.cc_emails
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email);
      }
      if (formData.bcc_emails.trim()) {
        emailData.bcc_emails = formData.bcc_emails
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email);
      }
      if (formData.custom_subject.trim()) {
        emailData.custom_subject = formData.custom_subject.trim();
      }
      if (formData.custom_body.trim()) {
        emailData.custom_body = formData.custom_body.trim();
      }

      await communicationStore.sendEmail(emailData);

      // Reset form
      setFormData({
        project_id: '',
        template_id: '',
        recipient_email: '',
        cc_emails: '',
        bcc_emails: '',
        custom_subject: '',
        custom_body: '',
      });

      onEmailSent();
    } catch (error) {
      onShowSnackbar(
        error.message || error.detail || 'Failed to send email',
        'error'
      );
    } finally {
      setSending(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreview(null);
  };

  const selectedProject = projectStore.projects.find(
    (p) => p.id === formData.project_id
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Compose Email
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a project and template to send an email
          </p>
        </div>
      </div>

      {/* Section 1: Project & Template Selection */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-4 bg-white dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Select Project & Template
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              PROJECT *
            </label>
            <FormControl fullWidth required size="small">
              <Select
                value={formData.project_id}
                onChange={(e) => handleInputChange('project_id', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Select Project</em>
                </MenuItem>
                {projectStore.projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.project_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              TEMPLATE *
            </label>
            <FormControl fullWidth required size="small">
              <Select
                value={formData.template_id}
                onChange={(e) => handleInputChange('template_id', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Select Template</em>
                </MenuItem>
                {communicationStore.templates
                  .filter((t) => t.is_active)
                  .map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                      {template.is_default && (
                        <Chip label="Default" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                      )}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>

          {/* Project Info */}
          <div>
            {selectedProject ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Client:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white ml-1">{selectedProject.client_name}</span>
                <div className="mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white ml-1">{selectedProject.client_email || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Select a project to view client details
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Email Details */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-4 bg-white dark:bg-gray-800">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Email Details
        </h4>

        {/* Row 1: Recipient Email */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            RECIPIENT EMAIL
          </label>
          <TextField
            fullWidth
            size="small"
            placeholder="Leave empty to use client email from project"
            value={formData.recipient_email}
            onChange={(e) => handleInputChange('recipient_email', e.target.value)}
            InputProps={{
              sx: { fontSize: '0.875rem' }
            }}
          />
        </div>

        {/* Row 2: CC and BCC */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              CC
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="email1@example.com, email2@example.com"
              value={formData.cc_emails}
              onChange={(e) => handleInputChange('cc_emails', e.target.value)}
              InputProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              BCC
            </label>
            <TextField
              fullWidth
              size="small"
              placeholder="email1@example.com, email2@example.com"
              value={formData.bcc_emails}
              onChange={(e) => handleInputChange('bcc_emails', e.target.value)}
              InputProps={{
                sx: { fontSize: '0.875rem' }
              }}
            />
          </div>
        </div>

        {/* Row 3: Subject */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            SUBJECT <span className="text-gray-400 dark:text-gray-500 font-normal">(optional - leave empty to use template subject)</span>
          </label>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter custom subject line"
            value={formData.custom_subject}
            onChange={(e) => handleInputChange('custom_subject', e.target.value)}
            InputProps={{
              sx: { fontSize: '0.875rem' }
            }}
          />
        </div>

        {/* Row 4: Additional Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            ADDITIONAL NOTES <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
          </label>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add any additional message to include in the email"
            value={formData.custom_body}
            onChange={(e) => handleInputChange('custom_body', e.target.value)}
            InputProps={{
              sx: { fontSize: '0.875rem' }
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end items-center">
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={handlePreview}
          disabled={!formData.project_id || !formData.template_id || loading}
          sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
        >
          {loading ? <CircularProgress size={20} /> : 'Preview Email'}
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSendEmail}
          disabled={!formData.project_id || !formData.template_id || sending}
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          {sending ? <CircularProgress size={20} /> : 'Send Email'}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Email Preview
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {preview && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Subject:
              </Typography>
              <Typography variant="body1" fontWeight="bold" mb={2}>
                {preview.subject}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Body:
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, maxHeight: 500, overflow: 'auto', bgcolor: '#f9fafb' }}
              >
                {preview.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: preview.body_html }} />
                ) : (
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {preview.body_text}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => {
              handleClosePreview();
              handleSendEmail();
            }}
            disabled={sending}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default EmailComposer;
