import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
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
  { value: 'completion_notice', label: 'Completion Notice' },
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
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Email Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total: {communicationStore.templates.length} templates
          </Typography>
        </Box>

        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={communicationStore.loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            New Template
          </Button>
        </Box>
      </Box>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {communicationStore.templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {template.name}
                  </Typography>
                  <Box>
                    {template.is_default && (
                      <Chip label="Default" size="small" color="primary" sx={{ mr: 0.5 }} />
                    )}
                    <Chip
                      label={template.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={template.is_active ? 'success' : 'default'}
                    />
                  </Box>
                </Box>

                <Chip
                  label={template.template_type_display || template.template_type}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Subject:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {template.subject}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Created by: {template.created_by_name || 'Unknown'}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenForm(template)}
                    title="Edit"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => handleDuplicate(template)}
                    title="Duplicate"
                  >
                    <DuplicateIcon fontSize="small" />
                  </IconButton>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(template)}
                  title="Delete"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {communicationStore.templates.length === 0 && !communicationStore.loading && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create your first email template to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Create Template
          </Button>
        </Box>
      )}

      {/* Template Form Dialog */}
      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {editMode ? 'Edit Template' : 'Create New Template'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Template Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
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

            <Grid item xs={12} sm={6}>
              <Box display="flex" gap={2} height="100%" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    />
                  }
                  label="Active"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_default}
                      onChange={(e) => handleInputChange('is_default', e.target.checked)}
                    />
                  }
                  label="Default"
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                helperText="Use Django template variables like {{ project.project_name }}"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="HTML Body"
                value={formData.body_html}
                onChange={(e) => handleInputChange('body_html', e.target.value)}
                helperText="HTML template with Django template variables"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Text Body (optional)"
                value={formData.body_text}
                onChange={(e) => handleInputChange('body_text', e.target.value)}
                helperText="Plain text fallback for email clients that don't support HTML"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default EmailTemplates;
