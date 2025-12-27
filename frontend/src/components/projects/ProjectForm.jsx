import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  OutlinedInput,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useProjectStore } from '../../stores/project.store';
import { clientStore } from '../../stores/client.store';
import { STATUS_OPTIONS } from './StatusRenderer';

const PROJECT_TYPE_OPTIONS = [
  { value: 'M', label: 'Mechanical' },
  { value: 'E', label: 'Electrical' },
  { value: 'P', label: 'Plumbing' },
  { value: 'EM', label: 'Energy Modelling' },
  { value: 'FP', label: 'Fire Protection' },
  { value: 'TI', label: 'Tenant Improvement' },
  { value: 'VI', label: 'Verification Pending' },
];

const ProjectForm = ({ open, onClose, project, editMode, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const { createProject, updateProject } = useProjectStore();

  // Fetch clients when modal opens
  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      await clientStore.fetchClients(1);
      setClients(clientStore.clients || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const validationSchema = Yup.object({
    project_name: Yup.string().required('Project name is required').max(255, 'Name is too long'),
    project_type: Yup.array().min(1, 'Select at least one project type').required('Project type is required'),
    client: Yup.number().required('Client is required'),
    address: Yup.string().required('Address is required'),
    status: Yup.string().required('Status is required'),
    due_date: Yup.date().required('Due date is required'),
  });

  const formik = useFormik({
    initialValues: {
      project_name: '',
      project_type: [],
      client: '',
      architect_designer: '',
      status: 'not_started',
      address: '',
      legal_address: '',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
      rough_in_date: '',
      final_inspection_date: '',
      current_sub_status: '',
      current_open_items: '',
      current_action_items: '',
      due_date_note: '',
      billing_info: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Convert project_type array to comma-separated string
        const submitData = {
          ...values,
          project_type: values.project_type.join(','),
          // Convert empty strings to null for optional fields
          architect_designer: values.architect_designer || null,
          legal_address: values.legal_address || null,
          rough_in_date: values.rough_in_date || null,
          final_inspection_date: values.final_inspection_date || null,
          current_sub_status: values.current_sub_status || null,
          current_open_items: values.current_open_items || null,
          current_action_items: values.current_action_items || null,
          due_date_note: values.due_date_note || null,
          billing_info: values.billing_info || null,
        };

        let result;
        if (editMode && project) {
          result = await updateProject(project.id, submitData);
        } else {
          result = await createProject(submitData);
        }

        if (result.success) {
          onSuccess();
          handleClose();
        } else {
          onError(result.error || 'Failed to save project');
        }
      } catch (error) {
        console.error('Project form error:', error);
        onError(error.message || 'Failed to save project');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (open && project && editMode) {
      // Parse project_type from comma-separated string to array
      const projectTypes = project.project_type ? project.project_type.split(',').map(t => t.trim()) : [];

      formik.setValues({
        project_name: project.project_name || '',
        project_type: projectTypes,
        client: project.client || '',
        architect_designer: project.architect_designer || '',
        status: project.status || 'not_started',
        address: project.address || '',
        legal_address: project.legal_address || '',
        due_date: project.due_date || '',
        rough_in_date: project.rough_in_date || '',
        final_inspection_date: project.final_inspection_date || '',
        current_sub_status: project.current_sub_status || '',
        current_open_items: project.current_open_items || '',
        current_action_items: project.current_action_items || '',
        due_date_note: project.due_date_note || '',
        billing_info: project.billing_info || '',
      });
    } else if (open && !editMode) {
      formik.resetForm();
    }
  }, [open, project, editMode]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {editMode ? 'Edit Project' : 'Create New Project'}
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {formik.errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formik.errors.submit}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Project Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name *"
                name="project_name"
                value={formik.values.project_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.project_name && Boolean(formik.errors.project_name)}
                helperText={formik.touched.project_name && formik.errors.project_name}
                disabled={loading}
                size="small"
              />
            </Grid>

            {/* Project Types - Multi-select */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={formik.touched.project_type && Boolean(formik.errors.project_type)}>
                <InputLabel>Project Types *</InputLabel>
                <Select
                  multiple
                  name="project_type"
                  value={formik.values.project_type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  input={<OutlinedInput label="Project Types *" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const option = PROJECT_TYPE_OPTIONS.find(o => o.value === value);
                        return <Chip key={value} label={option?.label || value} size="small" />;
                      })}
                    </Box>
                  )}
                  disabled={loading}
                >
                  {PROJECT_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.project_type && formik.errors.project_type && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.5 }}>
                    {formik.errors.project_type}
                  </Box>
                )}
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status *"
                name="status"
                value={formik.values.status}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.status && Boolean(formik.errors.status)}
                helperText={formik.touched.status && formik.errors.status}
                disabled={loading}
                size="small"
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Client */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Client *"
                name="client"
                value={formik.values.client}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.client && Boolean(formik.errors.client)}
                helperText={formik.touched.client && formik.errors.client}
                disabled={loading || loadingClients}
                size="small"
              >
                {loadingClients ? (
                  <MenuItem value="">Loading clients...</MenuItem>
                ) : clients.length === 0 ? (
                  <MenuItem value="">No clients available</MenuItem>
                ) : (
                  clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name} {client.company_name ? `(${client.company_name})` : ''}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {/* Due Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date *"
                name="due_date"
                type="date"
                value={formik.values.due_date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.due_date && Boolean(formik.errors.due_date)}
                helperText={formik.touched.due_date && formik.errors.due_date}
                disabled={loading}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address *"
                name="address"
                multiline
                rows={2}
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                disabled={loading}
                size="small"
              />
            </Grid>

            {/* Legal Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Legal Address (Parcel no, Block no, Lot no)"
                name="legal_address"
                value={formik.values.legal_address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                size="small"
              />
            </Grid>

            {/* Rough-in Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rough-in Date"
                name="rough_in_date"
                type="date"
                value={formik.values.rough_in_date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Final Inspection Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Final Inspection Date"
                name="final_inspection_date"
                type="date"
                value={formik.values.final_inspection_date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Sub Status */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Sub-Status"
                name="current_sub_status"
                value={formik.values.current_sub_status}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                size="small"
              />
            </Grid>

            {/* Open Items */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Open Items"
                name="current_open_items"
                multiline
                rows={2}
                value={formik.values.current_open_items}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                size="small"
              />
            </Grid>

            {/* Action Items */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Action Items"
                name="current_action_items"
                multiline
                rows={2}
                value={formik.values.current_action_items}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                size="small"
              />
            </Grid>

            {/* Due Date Note */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Due Date Notes"
                name="due_date_note"
                multiline
                rows={2}
                value={formik.values.due_date_note}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                size="small"
              />
            </Grid>

            {/* Billing Info */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Billing Information"
                name="billing_info"
                multiline
                rows={2}
                value={formik.values.billing_info}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={loading}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formik.isValid}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }
            }}
          >
            {loading ? 'Saving...' : editMode ? 'Update Project' : 'Create Project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProjectForm;
