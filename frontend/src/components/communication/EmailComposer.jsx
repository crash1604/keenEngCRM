import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
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
    <Box>
      <Typography variant="h6" fontWeight="bold" color="text.primary" mb={3}>
        Compose Email
      </Typography>

      <Grid container spacing={3}>
        {/* Project Selection */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={formData.project_id}
              onChange={(e) => handleInputChange('project_id', e.target.value)}
              label="Select Project"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {projectStore.projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.project_name} - {project.location}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Template Selection */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Select Template</InputLabel>
            <Select
              value={formData.template_id}
              onChange={(e) => handleInputChange('template_id', e.target.value)}
              label="Select Template"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {communicationStore.templates
                .filter((t) => t.is_active)
                .map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                    {template.is_default && (
                      <Chip label="Default" size="small" sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Project Info Display */}
        {selectedProject && (
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="subtitle2" fontWeight="bold">
                Selected Project Details
              </Typography>
              <Typography variant="body2">
                <strong>Project:</strong> {selectedProject.project_name}
              </Typography>
              <Typography variant="body2">
                <strong>Client:</strong> {selectedProject.client_name}
              </Typography>
              <Typography variant="body2">
                <strong>Client Email:</strong> {selectedProject.client_email || 'Not available'}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {selectedProject.status}
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Recipient Email Override */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Recipient Email (optional)"
            placeholder="Leave empty to use client email from project"
            value={formData.recipient_email}
            onChange={(e) => handleInputChange('recipient_email', e.target.value)}
            helperText="Override the default client email if needed"
          />
        </Grid>

        {/* CC Emails */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="CC Emails (optional)"
            placeholder="email1@example.com, email2@example.com"
            value={formData.cc_emails}
            onChange={(e) => handleInputChange('cc_emails', e.target.value)}
            helperText="Separate multiple emails with commas"
          />
        </Grid>

        {/* BCC Emails */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="BCC Emails (optional)"
            placeholder="email1@example.com, email2@example.com"
            value={formData.bcc_emails}
            onChange={(e) => handleInputChange('bcc_emails', e.target.value)}
            helperText="Separate multiple emails with commas"
          />
        </Grid>

        {/* Custom Subject */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Custom Subject (optional)"
            placeholder="Leave empty to use template subject"
            value={formData.custom_subject}
            onChange={(e) => handleInputChange('custom_subject', e.target.value)}
            helperText="Override the template subject if needed"
          />
        </Grid>

        {/* Custom Body */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Custom Body (optional)"
            placeholder="Leave empty to use template body"
            value={formData.custom_body}
            onChange={(e) => handleInputChange('custom_body', e.target.value)}
            helperText="Override or add to the template body if needed"
          />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={!formData.project_id || !formData.template_id || loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Preview'}
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSendEmail}
              disabled={!formData.project_id || !formData.template_id || sending}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              {sending ? <CircularProgress size={20} /> : 'Send Email'}
            </Button>
          </Box>
        </Grid>
      </Grid>

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
    </Box>
  );
});

export default EmailComposer;
