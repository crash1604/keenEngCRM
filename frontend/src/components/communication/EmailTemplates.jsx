import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Grid,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { communicationStore } from '../../stores/communication.store';
import LoadingSpinner from '../common/LoadingSpinner';

const TEMPLATE_TYPES = [
  { value: 'status_update', label: 'Status Update' },
  { value: 'inspection_reminder', label: 'Inspection Reminder' },
  { value: 'project_completion', label: 'Project Completion' },
  { value: 'general_update', label: 'General Update' },
  { value: 'invoice_notification', label: 'Invoice Notification' },
  { value: 'delay_notification', label: 'Delay Notification' },
  { value: 'permit_update', label: 'Permit Update' },
  { value: 'custom', label: 'Custom' },
];

const EmailTemplates = observer(({ onShowSnackbar }) => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    template_type: '',
    subject: '',
    body_html: '',
    body_text: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      await communicationStore.fetchTemplates();
    } catch (error) {
      onShowSnackbar('Failed to load templates', 'error');
    }
  };

  const handleRefresh = async () => {
    try {
      await communicationStore.fetchTemplates();
      onShowSnackbar('Templates refreshed', 'success');
    } catch (error) {
      onShowSnackbar('Failed to refresh templates', 'error');
    }
  };

  const handleOpenForm = (template = null) => {
    if (template) {
      setFormData({
        id: template.id,
        name: template.name,
        template_type: template.template_type,
        subject: template.subject,
        body_html: template.body_html,
        body_text: template.body_text || '',
        is_active: template.is_active,
        is_default: template.is_default,
      });
      setEditMode(true);
    } else {
      setFormData({
        name: '',
        template_type: '',
        subject: '',
        body_html: '',
        body_text: '',
        is_active: true,
        is_default: false,
      });
      setEditMode(false);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({
      name: '',
      template_type: '',
      subject: '',
      body_html: '',
      body_text: '',
      is_active: true,
      is_default: false,
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.template_type || !formData.subject) {
      onShowSnackbar('Please fill in all required fields', 'warning');
      return;
    }

    try {
      if (editMode) {
        await communicationStore.updateTemplate(formData.id, formData);
        onShowSnackbar('Template updated successfully', 'success');
      } else {
        await communicationStore.createTemplate(formData);
        onShowSnackbar('Template created successfully', 'success');
      }
      handleCloseForm();
      await loadTemplates();
    } catch (error) {
      onShowSnackbar(
        error.detail || `Failed to ${editMode ? 'update' : 'create'} template`,
        'error'
      );
    }
  };

  const handleDelete = async (template) => {
    if (
      window.confirm(
        `Are you sure you want to delete the template "${template.name}"?`
      )
    ) {
      try {
        await communicationStore.deleteTemplate(template.id);
        onShowSnackbar('Template deleted successfully', 'success');
        await loadTemplates();
      } catch (error) {
        onShowSnackbar('Failed to delete template', 'error');
      }
    }
  };

  const handleDuplicate = async (template) => {
    try {
      await communicationStore.duplicateTemplate(template.id);
      onShowSnackbar('Template duplicated successfully', 'success');
      await loadTemplates();
    } catch (error) {
      onShowSnackbar('Failed to duplicate template', 'error');
    }
  };

  if (communicationStore.loading && communicationStore.templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading templates..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Email Templates
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {communicationStore.templates.length} template{communicationStore.templates.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={communicationStore.loading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            New Template
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {communicationStore.templates.map((template) => (
          <Card
            key={template.id}
            variant="outlined"
            sx={{
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: '#2563eb',
              },
            }}
          >
              <CardContent sx={{ flex: 1, p: 2, pb: 1.5, overflow: 'hidden' }}>
                {/* Header Row - Name and Status */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '60%',
                    }}
                    title={template.name}
                  >
                    {template.name}
                  </Typography>
                  <Box display="flex" gap={0.5} flexShrink={0}>
                    {template.is_default && (
                      <Chip
                        label="Default"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: '#dbeafe',
                          color: '#1d4ed8',
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Chip
                      label={template.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: template.is_active ? '#dcfce7' : '#f1f5f9',
                        color: template.is_active ? '#166534' : '#64748b',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </Box>

                {/* Type Badge */}
                <Chip
                  label={template.template_type_display || template.template_type}
                  size="small"
                  variant="outlined"
                  sx={{
                    mb: 1.5,
                    height: 22,
                    fontSize: '0.7rem',
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                  }}
                />

                {/* Subject */}
                <Box mb={1.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.25}>
                    SUBJECT
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      color: 'text.primary',
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                    }}
                    title={template.subject}
                  >
                    {template.subject}
                  </Typography>
                </Box>

                {/* Created By */}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  By {template.created_by_name || 'Unknown'}
                </Typography>
              </CardContent>

              <CardActions
                sx={{
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#f8fafc',
                  minHeight: 44,
                }}
              >
                <Box display="flex" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenForm(template)}
                    title="Edit"
                    sx={{
                      color: '#2563eb',
                      '&:hover': { bgcolor: '#dbeafe' },
                    }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDuplicate(template)}
                    title="Duplicate"
                    sx={{
                      color: '#7c3aed',
                      '&:hover': { bgcolor: '#ede9fe' },
                    }}
                  >
                    <DuplicateIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(template)}
                  title="Delete"
                  sx={{
                    color: '#dc2626',
                    '&:hover': { bgcolor: '#fee2e2' },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </CardActions>
          </Card>
        ))}
      </div>

      {communicationStore.templates.length === 0 && !communicationStore.loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
            No templates found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create your first email template to get started
          </p>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Create Template
          </Button>
        </div>
      )}

      {/* Template Form Dialog */}
      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            {editMode ? 'Edit Template' : 'Create New Template'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {editMode ? 'Update the template details below' : 'Fill in the details to create a new email template'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {/* Top Section - Basic Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={2}>
              BASIC INFORMATION
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Template Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Template Type</InputLabel>
                  <Select
                    value={formData.template_type}
                    onChange={(e) => handleInputChange('template_type', e.target.value)}
                    label="Template Type"
                  >
                    {TEMPLATE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box display="flex" gap={2} height="100%" alignItems="center" justifyContent="flex-start">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Active</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_default}
                        onChange={(e) => handleInputChange('is_default', e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Default</Typography>}
                  />
                </Box>
              </Grid>

            </Grid>
          </Box>

          {/* Email Subject - Full Width Row */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1.5}>
              EMAIL SUBJECT <Typography component="span" variant="caption" color="error">*</Typography>
            </Typography>
            <TextField
              fullWidth
              required
              placeholder="Enter email subject line..."
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              helperText="Use template variables like {{ project.project_name }}"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '0.9rem',
                },
              }}
            />
          </Box>

          {/* Main Content Section - HTML Body */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1.5}>
              HTML BODY <Typography component="span" variant="caption" color="error">*</Typography>
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={12}
              maxRows={20}
              placeholder="Enter HTML email content here..."
              value={formData.body_html}
              onChange={(e) => handleInputChange('body_html', e.target.value)}
              helperText="HTML template with template variables. Use {{ project.field_name }} for dynamic content."
              sx={{
                width: '100%',
                '& .MuiInputBase-root': {
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  bgcolor: '#f8fafc',
                },
                '& .MuiOutlinedInput-root': {
                  '& textarea': {
                    resize: 'vertical',
                  },
                },
              }}
            />
          </Box>

          {/* Plain Text Section */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1.5}>
              PLAIN TEXT BODY <Typography component="span" variant="caption" color="text.secondary">(Optional)</Typography>
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={6}
              maxRows={12}
              placeholder="Enter plain text fallback content here..."
              value={formData.body_text}
              onChange={(e) => handleInputChange('body_text', e.target.value)}
              helperText="Plain text fallback for email clients that don't support HTML"
              sx={{
                width: '100%',
                '& .MuiInputBase-root': {
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  bgcolor: '#f8fafc',
                },
                '& .MuiOutlinedInput-root': {
                  '& textarea': {
                    resize: 'vertical',
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseForm} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {editMode ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default EmailTemplates;
