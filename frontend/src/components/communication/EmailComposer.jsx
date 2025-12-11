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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Compose Email
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a project and template to send an email
          </Typography>
        </Box>
      </Box>

      {/* Section 1: Project & Template Selection */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={2}>
          Select Project & Template
        </Typography>
        <Grid container spacing={2.5} alignItems="flex-end">
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              PROJECT *
            </Typography>
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
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              TEMPLATE *
            </Typography>
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
          </Grid>

          {/* Project Info */}
          <Grid item xs={12} sm={4}>
            {selectedProject ? (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: '#f0f9ff',
                  borderRadius: 1.5,
                  border: '1px solid #bae6fd',
                }}
              >
                <Typography variant="caption" color="text.secondary">Client:</Typography>
                <Typography variant="caption" fontWeight={600} ml={0.5}>{selectedProject.client_name}</Typography>
                <Box mt={0.5}>
                  <Typography variant="caption" color="text.secondary">Email:</Typography>
                  <Typography variant="caption" fontWeight={600} ml={0.5}>{selectedProject.client_email || 'N/A'}</Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: '#f8fafc',
                  borderRadius: 1.5,
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Select a project to view client details
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Section 2: Email Details */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} color="text.primary" mb={2}>
          Email Details
        </Typography>

        {/* Row 1: Recipient Email */}
        <Box mb={2}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
            RECIPIENT EMAIL
          </Typography>
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
        </Box>

        {/* Row 2: CC and BCC */}
        <Box display="flex" gap={2} mb={2}>
          <Box flex={1}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              CC
            </Typography>
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
          </Box>
          <Box flex={1}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
              BCC
            </Typography>
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
          </Box>
        </Box>

        {/* Row 3: Subject */}
        <Box mb={2}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
            SUBJECT <Typography component="span" variant="caption" color="text.disabled">(optional - leave empty to use template subject)</Typography>
          </Typography>
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
        </Box>

        {/* Row 4: Additional Notes */}
        <Box>
          <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={0.75}>
            ADDITIONAL NOTES <Typography component="span" variant="caption" color="text.disabled">(optional)</Typography>
          </Typography>
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
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Box
        display="flex"
        gap={2}
        justifyContent="flex-end"
        alignItems="center"
      >
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
      </Box>

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
